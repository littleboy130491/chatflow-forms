# ChatFlow Forms

Private conversational-form plugin for WordPress 6.4+, PHP 8.1+ with OpenSSL.
The implementation includes a React WordPress builder, Preact/TypeScript
Shadow DOM chat, deterministic PHP/TS logic, versioned publishing, durable
sessions, custom-table submissions, CSV/purge/privacy tools, notifications and
signed generic webhooks. English and Indonesian UI are included.

The **shell integration gate passes**, not the complete product acceptance gate:
the under-15-minute builder exercise, mobile/browser journey, live SMTP/webhook
receipt and hosting/cache compatibility matrix remain untested. See
[MVP checks](docs/mvp-checks.md) and [integrated Phase 2 coverage](docs/phase2-integration.md). PLAN.md is unchanged.
There is no licence system, telemetry, payment or AI chat.

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

## Phase 2 numeric feedback fields

The builder and visitor runtime support four numeric inputs: **Rating** (1–5
stars), **Scale** (1–10), **NPS** (0–10), and a **Slider** (default 0–100,
configurable minimum, maximum and increment). Values are saved as numbers and
validated by both the PHP server and TypeScript replay engine, including
server-side bounds/step checks. Slider answers are not stored until the
visitor confirms the chosen position. Existing v1 forms retain their schema
and behavior; no database migration is required.

## Starter templates (Phase 2)

**ChatFlow → Forms** now displays a template gallery. The Imajiner survey remains
available alongside vendor-neutral **Contact request** and **Customer feedback**
starter forms. Selecting a template creates a new *unpublished draft* with
editable steps and settings, and does not enable external delivery, autoresponder,
or webhook endpoints. Review messaging, consent copy, privacy policy requirements,
and notification recipients before publishing. Templates are not submissions
and do not include existing respondent data.

## Getting started

This section is for site owners who want to put a ChatFlow form on their
WordPress site. Developers building the plugin should see [Development](#development).

### 1. Check the requirements

- WordPress 6.4 or newer, PHP 8.1 or newer with the OpenSSL extension.
- HTTPS on the site.
- A working WP-Cron or a real cron/queue runner. Emails, webhooks, connectors,
  abandonment follow-ups, exports and cleanup all run in the background and
  never send without it.
- Mail delivery (an SMTP plugin or your host's mailer) if you want email
  notifications. The plugin doesn't configure SMTP for you.

### 2. Get the plugin ZIP

You need the **packaged** `chatflow-forms.zip`, not GitHub's "Download ZIP" or
source archive. The source archive lacks the scoped PHP dependencies, and
WordPress shows *"ChatFlow Forms dependencies are missing"* if you install it.

- **From a release:** download the `chatflow-forms.zip` asset from this
  repository's GitHub Releases page.
- **Build it yourself:** follow [Development](#development) and run
  `npm run package`. The file appears at `build/chatflow-forms.zip`.

### 3. Install and activate

In WordPress go to **Plugins → Add New → Upload Plugin**, choose
`chatflow-forms.zip`, then **Install Now** and **Activate**. Or use WP-CLI:

```sh
wp plugin install chatflow-forms.zip --activate
```

A **ChatFlow** menu appears in the admin sidebar with **Forms**,
**Submissions**, **Analytics**, **Settings**, **Tools** and **New form**.

### 4. Add the optional `wp-config.php` constants

Add these to `wp-config.php` (above *"That's all, stop editing!"*) when you
need the features they enable:

```php
// Required for file-upload fields and CSV/XLSX exports.
// The directory must be writable by PHP and OUTSIDE the public web root.
define( 'CFF_PRIVATE_DIR', '/srv/chatflow-private' );

// Optional: enables automatic plugin updates from the private GitHub releases.
// Use a read-only token for this repository. Never commit it.
define( 'CFF_GITHUB_TOKEN', 'github_pat_...' );
```

Without `CFF_PRIVATE_DIR`, forms still work, but uploads and exports stay
unavailable. The plugin never falls back to the public uploads folder.

### 5. Review the global settings

Open **ChatFlow → Settings** before you collect real data:

- **Privacy:** whether IP addresses are stored in full, anonymized or not at
  all, whether the user agent and metadata are stored, and whether Do Not
  Track is respected.
- **Retention:** automatic deletion of old submissions. It's **off by
  default**.
- **Full-page URL base:** forms get their own page at `/chat/{form-slug}/`.
  You can change `chat` here.
- **Optional extras:** CAPTCHA/Akismet spam protection, proxy/Cloudflare IP
  detection, connector credentials (Slack, Mailchimp, HubSpot, GA4, Meta) and
  AI assist (Claude, OpenRouter or an OpenAI-compatible provider). Each stays
  off until you enter its credentials.

### 6. Create a form

Go to **ChatFlow → Forms** and pick one of these:

- a **blank form** (**New form**),
- a starter **template** (Contact request, Customer feedback or the Imajiner
  survey),
- **Import** a ChatFlow form JSON export, or
- **Generate draft** from a written description (only shown when AI assist is
  configured).

Each of these creates an unpublished draft. The builder has these tabs:

| Tab | What you do there |
| --- | --- |
| **Build** | Add and order the questions: text, email, phone, number, date, choices, yes/no, rating, scale, NPS, slider, address, file upload, consent, statements, summary, calculated values and hidden fields. |
| **Logic** | Branching rules, variables and scoring, outcome endings, and the branching flow map. |
| **Design** | Theme and colours with a live preview, and AI rephrasing of the bot copy when AI assist is set up. |
| **Settings** | Notifications (admin email and autoresponder), webhooks, native connectors, display mode (inline, full page, floating launcher or popup), consent and resume options. |
| **Share** | The form ID and ready-to-copy embed codes. |

The draft autosaves. Use **Preview** to try the conversation. Preview answers
are never saved.

### 7. Publish

Click **Publish**. Visitors only ever see a published version, and each
publish creates a new version. Visitors who are halfway through keep the
version they started on. Edits you make afterwards stay in the draft until you
publish again.

### 8. Put the form on your site

Use any one of these:

| Where | How |
| --- | --- |
| Block editor | Add the **ChatFlow Form** block and pick the form. |
| Elementor | Use the **ChatFlow Form** widget, or a Shortcode widget with the shortcode below. |
| Shortcode (anywhere) | `[chatflow id="123"]` |
| Its own page | Visit `https://your-site/chat/{form-slug}/`. |
| Theme/PHP code | `<?php echo cff_render_form( 123 ); ?>` |
| Every page, automatically | In the form's **Settings → Display and engagement**, choose **Floating launcher** or **Popup** and tick **Show automatically on matching pages**. You can limit it to some page IDs or exclude some. |

Shortcode options (all optional except `id`):

```text
[chatflow id="123" mode="inline" theme="auto" height="600"]
[chatflow id="123" mode="launcher" position="right" auto_open="10"]
[chatflow id="123" mode="popup" scroll_percent="50"]
```

| Attribute | Values | Default |
| --- | --- | --- |
| `id` | The form ID (shown on the **Share** tab). | (required) |
| `mode` | `inline`, `fullpage`, `launcher`, `popup` | `inline` |
| `theme` | `auto`, `light`, `dark` | `auto` |
| `height` | Pixels, 200–2000 (inline only) | `600` |
| `position` | `left`, `right` (launcher/popup) | `right` |
| `auto_open` | Seconds before a launcher/popup opens by itself | off |
| `scroll_percent` | Opens a launcher/popup when the visitor scrolls this far | off |

To open a popup or launcher from your own button, give the button
`data-cff-open="123"`, or call `window.ChatFlow.open(123)` in JavaScript.

If you use a caching or optimisation plugin, clear its cache after publishing.
The plugin already excludes its script from WP Rocket, LiteSpeed and
Autoptimize JavaScript delay/defer.

### 9. Manage the responses

- **ChatFlow → Submissions:** filter and search responses, read the details,
  add notes, star entries, run bulk actions, export to CSV/XLSX (needs
  `CFF_PRIVATE_DIR`) and retry failed email/webhook deliveries.
- **ChatFlow → Analytics:** views, starts, completion rate and drop-off per step,
  plus experiment variants.
- **ChatFlow → Tools:** delete data in bulk. You preview exactly what will be
  removed, then type `DELETE` to confirm.

Use the **Send test** button on the form's notification settings to check that
your mail and webhooks really deliver before you go live.

### Troubleshooting

| Symptom | Fix |
| --- | --- |
| *"dependencies are missing"* notice after activation | You installed a source archive. Install the packaged `chatflow-forms.zip` instead. |
| *"requires PHP 8.1 with OpenSSL and WordPress 6.4"* notice | Upgrade PHP/WordPress or enable the OpenSSL extension. |
| Shortcode or block shows nothing | The form hasn't been published, or the ID is wrong. |
| `/chat/{slug}/` returns 404 | Go to **Settings → Permalinks** and click **Save** to refresh rewrite rules. |
| No emails or webhooks arrive | Check that WP-Cron/Action Scheduler runs (**Tools → Scheduled Actions**) and that SMTP is configured. |
| Uploads or exports are unavailable | Set `CFF_PRIVATE_DIR` to a writable folder outside the web root. |

### Uninstalling

Deactivating stops the plugin's background jobs but keeps all data. Deleting
the plugin also keeps forms and submissions, unless the site has opted in with
`cff_settings.delete_data_on_uninstall=true`. In that case the plugin's tables,
forms and capabilities are removed.

## Imajiner survey template from WP-CLI

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
Phase 2 adds private uploads, rating/scale/NPS/slider/address/media fields,
accessible popup/drawer/launcher modes, optional CAPTCHA/Akismet, stored analytics,
safe JSON template tools and private XLSX exports. Configure an outside-web-root
private directory before uploads/exports, and provider credentials before enabling
CAPTCHA or Akismet. See [the integration checks and acceptance gaps](docs/phase2-integration.md).

Phase 3 provides bounded calculations, variables/scoring, outcome endings,
an editable branching map, server-assigned copy/order experiments with variant
analytics, and consent-aware single-use resume links. See [Phase 3 usage and
security](docs/phase3-power.md). Native connectors send submissions to Slack,
Mailchimp, HubSpot, Google Analytics 4 and the Meta Conversions API through the
delivery outbox; marketing and ad connectors require a consent answer. See
[connectors](docs/connectors.md). Optional AI assist uses the Claude API to
generate a draft form from a description and rephrase bot copy in a chosen tone;
see [AI assist](docs/ai-assist.md). There is no AI chat for visitors and no
telemetry.

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
