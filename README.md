# ChatFlow Forms

Private conversational-form plugin for WordPress 6.4+, PHP 8.1+ with OpenSSL.
The Phase 1 implementation includes a React WordPress builder, Preact/TypeScript
Shadow DOM chat, deterministic PHP/TS logic, versioned publishing, durable
sessions, custom-table submissions, CSV/purge/privacy tools, notifications and
signed generic webhooks. English and Indonesian UI are included.

The **shell integration gate passes**, not the complete product acceptance gate:
the under-15-minute builder exercise, mobile/browser journey, live SMTP/webhook
receipt and hosting/cache compatibility matrix remain untested. See
[phase coverage and actual checks](docs/mvp-checks.md). PLAN.md is unchanged.
There is no licence system, telemetry, native CRM connector, payment or AI chat.

## Phase 2 aggregate form views

Analytics includes anonymous **view impressions** (not unique visitors) and a
view-to-start percentage. The runtime sends one non-blocking view event when an
inline form initializes, or when the visitor first opens a launcher/popup.
Builder previews do not count. The endpoint stores only daily counters keyed
by form and published version; no per-view IP, answers, session IDs or URLs
are persisted. Do Not Track and Global Privacy Control requests are excluded
when the global privacy setting respects DNT. A per-form/IP short-lived rate
limit prevents unbounded counter manipulation.

View counts start from deployment, with no historical backfill. If old starts
outnumber tracked impressions, the dashboard intentionally omits the
view-to-start rate rather than showing a misleading percentage.

## Install and use

1. Build the release ZIP below, or use a packaged release when available.
   Install `build/chatflow-forms.zip` in WordPress and activate it. A GitHub
   source archive is **not** installable: it lacks scoped PHP dependencies.
2. Use HTTPS. For private CSV files, create a writable directory **outside every
   public/document root** and set `CFF_PRIVATE_DIR` in server configuration:
   `define( 'CFF_PRIVATE_DIR', '/srv/chatflow-private' );`
   The plugin does not create or expose an insecure uploads fallback.
3. In **ChatFlow → Forms**, create a blank form, import a ChatFlow form JSON export as a new unpublished draft, or use the Imajiner survey
   template. Edit steps, options, rules, endings, appearance and notification
   settings. Draft autosaves use revision conflict checks; **Publish** makes a
   new immutable visitor version. Draft preview does not save visitor answers.
4. Embed the published form using the **ChatFlow Form** Gutenberg block,
   `[chatflow id="123" mode="inline" theme="auto" height="600"]`, or trusted PHP
   `cff_render_form(123)`. The shortcode also fits Elementor's Shortcode widget.
   Full-page URLs default to `/f/{form-slug}`; the base is configurable in Settings.
   Phase 2 also supports an opt-in floating button with
   `[chatflow id="123" mode="launcher" position="right"]`. It opens on click;
   automatic opening and site-wide targeting are not implemented yet.
5. **Submissions** provides status/filter/search, details, notes, read/star, bulk
   actions, protected CSV exports, activity and delivery retries. **Tools** has
   preview-token-bound purge: preview the exact criteria, then type `DELETE`.
   Automatic retention is **off by default**. Configure privacy/IP/DNT and
   retention intentionally before collecting production data.

The template can also be created from the shell:

```sh
wp cff template imajiner
wp cff template imajiner --publish
```

The survey includes the no-website branch, optional URL, canonical Other text,
+62 phone normalization, editable summary and a safely encoded WhatsApp CTA.
Review the template's agency destination, consent/privacy copy and notification
settings before reuse. Configure WordPress mail/SMTP separately; test delivery
queues real mail work rather than promising an inbox receipt.

## Sessions and extension points

Public schema/embedded HTML contains no session credential or private settings.
An uncached POST start-token handshake precedes session creation. Credentials
and idempotency keys belong in request headers, never query strings; admin APIs
require both the appropriate capability and a REST nonce.

Visitors can resume a pinned published version, edit/backtrack, restart or retry
an uncertain submission. Server replay rejects unvisited/unknown/hidden overrides.
The resume cookie contains a signed token only; disclosed device storage holds
answers until completion, restart or expiry. Offline submit retries are in-memory,
**not** a persistent background queue across reloads. Private settings control
partial saving, resume and abandonment.

Action Scheduler's shared loader runs the transactional outbox; WP-Cron is the
fallback. A working cron/queue runner is required for emails, webhooks,
abandonment, exports and cleanup. Delivery retries are bounded to three attempts.
Configure webhook HTTPS URLs and secrets privately; private/loopback targets and
unsafe headers are rejected. Test-notification sample payloads expire after one
day through the recovery worker.

See [hooks](docs/hooks.md), [canonical payload](docs/payload.md),
[runtime API](assets/src/runtime/README.md) and [architecture](docs/architecture.md).
Uploads, scoring widgets, popup/drawer modes, advanced analytics and later-phase
features are not claimed as implemented.

## Development

Use Composer 2, Node 24.18+, npm 11.16+, Docker with Compose. Both dependency
locks are committed; use install/ci, never ignore peer-dependency errors.

```sh
composer install --no-interaction
composer scope
npm ci --no-audit --no-fund
npm run build
composer test
composer analyse
composer lint
npm run typecheck
npm run lint
npm test
npm run env:start
npm run test:wp
npm run test:wp:multisite
npm run env:stop
npm run package
```

wp-env pins WordPress 6.4.5/PHP 8.1 and separate disposable development/test
databases. Tests are shell-driven, not browser tests. Do not point the integration
suite at a production database. PHPUnit 9.6 is required by the WordPress 6.4 test
bootstrap. The plugin must not be installed directly from a source archive:
compiled admin/runtime assets are committed, while scoped vendor files are
generated during packaging. Install the packaged ZIP; see docs/release.md.

If wp-env cannot launch, native WP-CLI/MariaDB is an equivalent shell harness.
Use an isolated test database, matching wp-phpunit library, and a test config
outside version control. The native backend suite accepts
`CFF_BACKEND_WP_ROOT` and `CFF_BACKEND_PRIVATE_DIR`. The full suite accepts
`WP_TESTS_DIR` and `WP_PHPUNIT__TESTS_CONFIG`; run it again with
`WP_MULTISITE=1`. Tests recreate their dedicated database tables.

## Repository API example (trusted PHP)

```php
$forms = new \ChatFlow\Forms\FormRepository();
$form = $forms->create('Survey', $validated_schema, $private_settings);
if (!is_wp_error($form)) {
    $live = $forms->publish($form->id(), $form->draftRevision());
}
```

Controllers must check capabilities/nonces; repositories are internal services.
Do not directly write schema meta or expose private `Form::toArray()` publicly.
See docs/architecture.md for binding DTO/REST/token/replay/jobs/build contracts,
and docs/lanes.json for disjoint lane ownership. Canonical JSON schemas generate
the shared TypeScript types via `npm run schema:types`. PHP and TS structural
schema tests consume the same fixtures. Both replay implementations run 112
identical shared replay fixtures plus shared operator/interpolation checks.

Multisite network activation upgrades each site and initializes new sites.
Deactivation cancels plugin work but keeps data. Uninstall keeps data unless each
site explicitly opts in using `cff_settings.delete_data_on_uninstall=true`; it
then deletes that site's plugin tables/forms and only plugin-added capabilities.

Private updates are disabled without the `CFF_GITHUB_TOKEN` PHP constant, set in
server configuration with read-only access to this repository. No environment,
option or query-string token fallback. Never commit the token. Updates only accept
the packaged GitHub release asset, not source zips or branch/tag fallbacks.
