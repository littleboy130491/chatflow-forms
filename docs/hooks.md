# Hooks, notifications and delivery jobs

These modules are implemented in the jobs lane, but the foundation bootstrap
does not yet compose them. The integrator must construct
`IntegrationsModule(FormRepository $forms)` and
`NotificationsModule(FormRepository $forms)` in the documented module order.
Both `register()` methods install hooks only; neither migrates tables or owns
visitor/admin GUI wiring. Action Scheduler must be loaded by bootstrap before
`plugins_loaded`, using its shared-version arbitration; never Composer's
development autoloader in production.

## Guarded synchronous dispatch

Use `ChatFlow\Integrations\HookDispatcher::action(string $hook, array $args,
int $submissionId=0): bool` and `::filter(string $hook, mixed $value,
array $args=[], int $submissionId=0): mixed` for CFF lifecycle hooks/filters.
Callbacks run in ascending priority/insertion order, respecting accepted args.
Each `Throwable` is caught separately, subsequent callbacks still run, and a
failed filter preserves the previous value. Action returns false if any callback
failed; async jobs use that result to retry. The hook stack is restored even on
failure; activity stores a generic hook_exception/filter_exception code, never
an exception message/trace. The dispatcher snapshots registrations at entry;
register listeners during normal WordPress initialization, not during dispatch.
It dispatches the named callbacks, not WordPress's global `all` observers.
Raw third-party `do_action`/`apply_filters` calls are outside this guarantee.

The backend/logic/frontend owners install the following guarded call sites.
This lane supplies dispatch and job consumption, not those durable-write paths.

| Hook | Arguments (in order) | Timing / rule |
|---|---|---|
| `cff_submission_completed` | `Submission, Form` | After committed completion; no network work here |
| `cff_submission_completed_async` | `Submission, Form` | Separate outbox job, frozen event DTO and version settings |
| `cff_submission_partial_saved` | `Submission, Form` | After committed partial revision |
| `cff_submission_abandoned` | `Submission, Form` | After committed abandonment |
| `cff_session_started` | `array $session, Form` | After start commit; session must not contain credentials |
| `cff_submission_deleted` | `Submission, Form` | Before removal; cancellation listener marks jobs cancelled |
| `cff_submissions_purged` | `array $ids, array $criteria` | After batch purge; jobs cancellation is best effort |
| `cff_form_published` | `Form` | After publishing immutable snapshot |

All `Submission` actions use `ChatFlow\Submissions\Submission`, all forms use
`ChatFlow\Forms\Form`. The stable payload is documented in [payload.md](payload.md).
Never hand DTO `storage()` to an external system: that is an internal data row.

| Filter | Callback signature / expected result | Owning boundary |
|---|---|---|
| `cff_submission_payload` | `(array $payload, Submission, Form): array` | This lane re-projects the result before serialization |
| `cff_validate_answer` | `(array $issues, array $step, mixed $value, Form): array` | Server/logic validation |
| `cff_submission_meta` | `(array $meta, Form): array` | Server collection; sanitize after filter |
| `cff_redirect_url` | `(string $url, Submission, Form): string` | Server must recheck redirect host after filter |
| `cff_email_args` | `(array $wpMailArgs, Submission, Form): array` | Admin email; to/subject/message/headers/attachments |
| `cff_autoresponder_args` | same | Respondent email; validated after filter |
| `cff_public_schema` | `(array $publicEnvelope, Form): array` | Server must explicitly whitelist afterward |
| `cff_field_types` | `(array $instances): array` | Registry; custom field types need matching JS + schema extension |

Example asynchronous integration (no native CRM connector is bundled):

```php
add_action('cff_submission_completed_async', function ($submission, $form) {
    $payload = $submission->toArray();
    // Your own idempotent service; throw on failure for the job's retry policy.
    my_company_sync_once($payload['submission']['uuid'], $payload);
}, 10, 2);

add_filter('cff_email_args', function ($args, $submission, $form) {
    $args['subject'] = '[Survey] ' . $args['subject'];
    return $args;
}, 10, 3);
```

## Transaction/outbox composition (required server wiring)

Within the same transaction that persists submission/answers/session/idempotency:

```php
$outbox = new \ChatFlow\Integrations\Outbox();
$deliveryIds = $outbox->enqueue($submission, $frozenForm, 'submission.completed');
// Commit the transaction before doing either of the following:
\ChatFlow\Integrations\HookDispatcher::action('cff_outbox_ready', [$deliveryIds]);
\ChatFlow\Integrations\HookDispatcher::action(
    'cff_submission_completed', [$submission, $frozenForm], $submission->id()
);
```

`enqueue(Submission,Form,string $event,int $revision=0): list<int>` inserts
deduplicated rows and throws on SQL/encoding failure so the caller rolls back.
No HTTP, mail or scheduler operation occurs inside enqueue. Partial events MUST
pass the positive session revision; completed/abandoned use 0. Unique hashes bind
site, submission, form version, event, channel, destination and revision. Channels
are `async`, `admin_mail`, `autoresponder`, `webhook`; async destination is
`completed`, other destinations are the configured notification/webhook IDs.
Each row freezes canonical event bytes, never credentials. Conditional mail
planning delegates to the shared PHP Operators implementation, reading stored
variables and optional internal meta.context (server-provided frozen hidden/url/
now). Missing autoresponder email logs `autoresponder_missing_email` and skips.
Abandoned admin mail requires notifyAbandoned and a usable email or phone; no
abandoned autoresponder is sent. Partial events only deliver configured webhooks.

`cff_outbox_ready(list<int> $deliveryIds)` is internal, after commit. It schedules
`cff_dispatch_delivery(int $deliveryId)` in Action Scheduler group `cff`; arguments
contain only that row ID. The worker atomically claims pending rows, increments
attempts, uses a 15-minute processing lease and loads settings through
`FormRepository::getVersion`, not current draft/publication. Deleted/missing,
trashed or spam submissions cancel instead of sending. A worker already past its
final existence check may finish an in-flight request; deletion cannot unsend
accepted remote work.

Three total attempts; failures retry after 60 seconds, then 300 seconds. Pending
retry scheduling excludes the still-executing action from dedupe. Database claims
prevent parallel dispatch of one pending attempt. A five-minute recovery task
`cff_recover_deliveries` schedules pending rows missed after commit/crash and
reclaims expired leases in batches of 100. Delivery guarantees are at least once,
not exactly once: listeners must dedupe their own side effects. Hooks that partly
succeed then throw can rerun successful listeners. Recovery/remote status updates
use guarded status+attempt comparisons. No visitor response waits for delivery.

Only when Action Scheduler is unavailable/uninitialized, jobs use WordPress
single cron events and the `cff_five_minutes` interval. Site cron/AS runners must
actually run; without traffic configure a system cron invoking WordPress cron.
Manual retry resets attempts for a sent or failed row owned by that submission,
records manual_retry and reschedules the same immutable payload.

Activity contains generic outcome codes, delivery IDs and attempts only. HTTP
codes are allowed; headers, full responses, URLs, credentials and exception text
are never stored. Activity writes are best effort and cannot alter visitor
outcomes. The server privacy lane must delete dependent delivery rows/notes and
cancel scheduled jobs during trash/purge/erasure, including test rows on expiry.

## Email settings and rendering

Follow the foundation `notifications.admin[]` / `autoresponders[]` settings:
id, enabled, to/cc/bcc (admin only), emailField (respondent destination or admin
Reply-To), fromName/fromEmail/replyTo overrides, subject, body, conditions,
delaySeconds, attachmentIds. Invalid/missing respondent email is not guessed.
All matching responders run unless firstMatchOnly=true; delay is snapshotted in
the delivery's next_attempt_at. Global `cff_settings.email` supports fromName,
fromEmail, replyTo, logoUrl (HTTPS), brandColor, footerText.

Mail is sent through `wp_mail` and the site's normal SMTP plugin. Success means
WordPress accepted the send, not verified inbox delivery. The two args filters
run before final header/recipient/attachment validation. Subject/header CR/LF
injection is rejected; attachment realpaths must be readable files inside the
WordPress uploads root. Media attachment IDs are supported; no arbitrary server
file paths from an admin REST body are accepted. HTML has a limited sanitized
rich-text subset, with answer placeholders escaped after plain-text shared
interpolation. PHPMailer receives a generated plain-text AltBody. Global/theme
HTML layout is used for both admin and respondent mail. Override
`templates/emails/{layout,admin,autoresponder}.php` in
`theme/chatflow/emails/`; templates are trusted developer PHP, not editable code.

Tags: `{{key}}`, `{{answer:key}}`, `{{meta:key}}`, `{{all_answers}}`,
`{{meta_table}}`, `{{admin_link}}` (admin-only), `{{form_title}}`,
`{{submission_id}}` (public UUID), `{{site_name}}`, `{{date}}`. Unknown tags become
empty. Arrays/objects use the shared stable readable text formatter. Tables
escape labels/values; URLs in buttons encode answer placeholders:

```text
[cff_button url="https://example.org/demo?name={{nama}}"]Book a demo[/cff_button]
```

Button targets require a valid public HTTPS URL. No arbitrary shortcodes execute.
Saved/reusable email templates are not implemented by this lane (non-MVP).
The admin lane owns editable controls/rich-text editor/tag picker/SMTP warnings.

## Protected admin endpoints

All below require authenticated WordPress user, `X-WP-Nonce: <wp_rest nonce>`
and the exact capability. Responses are `Cache-Control: private, no-store`.
They are not visitor/public-token endpoints.

| Method/path under `/cff/v1` | Capability | Input/result |
|---|---|---|
| POST `/admin/notifications/preview` | cff_manage_forms | `{formId,notificationId,answers?,submissionId?}` → `{subject,html,plain}` from saved draft; no jobs/network |
| POST `/admin/notifications/test` | cff_manage_forms | `{formId,notificationId,to,answers?,submissionId?}` → `{queued:true,deliveryId}`; publish required for immutable private settings |
| POST `/admin/submissions/{id}/retry` | cff_edit_submissions | `{deliveryId}` → `{queued:true}`; only sent/failed belonging to that submission |
| GET `/admin/submissions/{id}/activity` | cff_view_submissions | page/perPage≤100 → `{items,deliveries,page,perPage}`; redacted note/delivery columns only |

Preview/test sample answers default to realistic type-specific examples, allow a
bounded supplied AnswerMap, or can use a past submission belonging to that form.
Past-submission samples additionally require cff_view_submissions. Test sends
force the supplied validated recipient after filters and remove Cc/Bcc, so
production respondents/admin recipients are never accidentally contacted. Draft
preview reflects saved settings; unsaved edits must be saved before previewing.
Activity includes no payload, credentials, URLs, action args or raw errors.

## Theme frontend

- `cff_theme_frontend_directories` (`array<string path, string url>`): where to look
  for `chatflow/frontend.{js,css}`; child theme first, then parent theme.
- `cff_theme_frontend_asset` (`?string $url, string $type, ?Form $form`): the
  script (`js`) or stylesheet (`css`) URL for a form; return `null` to use the
  built-in chat. See [custom frontend](custom-frontend.md).

## Verification and current integration limits

The focused suite lives in `tests/php/Integrations/DeliveryTest.php`. It is a real
WordPress test suite using installed custom InnoDB tables/Action Scheduler;
external network/mail sends are intercepted explicitly in tests. Run after
composition with backend Submission/Repository and shared PHP Logic classes:

```sh
WP_TESTS_DIR=/path/to/wordpress-develop/tests/phpunit \
vendor/bin/phpunit -c phpunit.wp.xml.dist tests/php/Integrations
vendor/bin/phpcs src/Integrations src/Notifications templates/emails
vendor/bin/phpstan analyse src/Integrations src/Notifications --memory-limit=1G
```

On the isolated foundation branch, tests requiring absent backend/logic classes
are honestly skipped. Lane validation used actual pushed checkpoint sources in
an external autoload fixture (not fake production DTOs/engines); central module
wiring and full visitor submission transaction validation still belong to the
integrator. No live SMTP inbox/webhook destination, GUI, or browser test is claimed.
