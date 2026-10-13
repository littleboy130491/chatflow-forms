# Phase 2 visitor lane: implementation and integration

This branch supplies real visitor services and renderers while preserving the MVP publishing/replay gates. It is **not** the centrally integrated Phase 2 release. `PLAN.md` is unchanged. No dependencies, manifests, shared schema, central REST composition, admin screens or security gates were changed here.

## Already connected

- `FrontendModule` renders eligible published site-wide launcher/popup forms (bounded query of 100 forms). `display.launcher.enabled`, `includePageIds`, `excludePageIds`, `position`, `autoOpenSeconds` and `scrollPercent` use the existing settings names. Exclusions win; an existing shortcode embed prevents an automatic duplicate. Fullpage routes do not render site-wide launchers.
- Native modal `<dialog>` inside the ShadowRoot provides the top layer/inert boundary, explicit close, Escape, Tab wrapping and focus restoration. Opening is lazy: neither session nor start token is fetched before first open. Timed/scroll opening occurs at most once per mount. Reduced-motion users do not get opening animations. Unsupported modal browsers fail closed rather than emulating an insecure modal.
- `window.ChatFlow.open(id)` and same-page `data-cff-open="id"` controls open a popup/launcher. Existing inline/fullpage modes, safe links, offline persistence and resume behavior remain.
- `Spam\Protection` invokes server-side CAPTCHA and Akismet when configured. Failure is recorded as `captcha_failed`, `akismet_spam` or `akismet_unavailable` and uses the existing quarantined `spam` submission flow (not a successful clean submission). No provider request occurs when disabled. CAPTCHA tokens stay only in the in-memory submission operation and request body, never URLs or persistence.
- `FrontendModule` invokes unattached upload cleanup from the existing `cff_retention` cron hook. Failed private storage access retains records for retry.
- `Renderer` applies `cff_public_display` to the safe public projection for admin-lane optional translation hooks. Secrets remain absent from cached embeds.

## Central integration required before enabling features

1. **Canonical parity/publishing:** `Registry::engagementFields()` returns rating/scale/NPS/slider/address/media/file-upload implementations, but the default registry still registers only the 13 MVP types. Add the implementations only after updating shared PHP/TS schema diagnostics/replay fixtures and validating the contract below. `SchemaValidator`, `PublicProjection` and canonical TS logic are deliberately not changed in this lane. Treat `media` as display-only, like statement/summary; never store display answers or count them in input progress. Enable numeric comparisons/calculations for scale types only with mirrored diagnostics.
2. **Protected uploads:** construct `UploadController` inside `rest_api_init` and call `register()`. It registers `POST /cff/v1/sessions/{id}/uploads`, `GET /cff/v1/admin/uploads/{id}` and its binary streaming filter. Set public `features.uploads=true` only when these routes and the following submission checks exist. No install/schema changes are necessary.
3. **Session ownership:** under the existing session row lock, after canonical replay and before writing answers, call `Uploads::validateAnswers($pinnedForm, $numericSessionId, $replayedAnswers)` on **both PATCH and submit**. Roll back on `WP_Error`. After saving the partial/final submission and updating `session.submission_id`, call `Uploads::bindSubmission($numericSessionId, $submissionId)` under the same lock. This binds only file UUIDs selected in saved answers to their configured field; removed/unselected files remain unattached and expire. Ownership is a database check, not a pure shared replay rule.
4. **Safe engagement config:** add `GET /cff/v1/forms/{id}/engagement?version=<pinnedVersion>` returning `Engagement::config($publishedPinnedForm)` through the existing boundary/no-store/error handling. Missing/unpublished form/version must be 404; never project the raw global settings. The exact result is `{captcha:{provider,siteKey},analytics:{enabled,consentRequired,respectDnt}}`.
5. **Events:** add `POST /cff/v1/sessions/{id}/events`, protected by `UploadSession::guard()` plus the central rate/error/no-store policy, delegating to `EventCollector::collect($id, $headerRequestToken, $jsonBody, $_SERVER)`. Authentication and session/pinned-form checks are in the collector. Add public `features.engagement=true` only after config and events routes exist. Without that flag, the runtime makes no config, event or external CAPTCHA calls. Configuration is refreshed when a resumed session uses another pinned version.
6. **Admin settings (agreed with admin lane):** global `spam.captcha` enum `none|turnstile|hcaptcha|recaptcha`, `siteKey`/`secretKey` strings max500, `minScore` 0..1 default0.5, `akismetEnabled` boolean defaultfalse, `akismetKey` string max500. Per-form provider must match the selected global provider; per-form `none` disables it. Per-form Akismet boolean overrides global default. Only the site key/provider can leave privileged settings. Never export CAPTCHA/Akismet keys. Configured missing/incompatible provider keys fail closed.

## Canonical field contract

| Type | Sanitized answer / validation |
| --- | --- |
| rating | NumberField sanitization; default1..5, integer; validation.min/max overrides. |
| scale | NumberField sanitization; default1..10, integer; validation.min/max overrides. |
| nps | NumberField sanitization; fixed0..10 integer (min/max ignored). |
| slider | NumberField sanitization; default0..100; validation.min/max and positive step(default1); increments anchored at minimum, tolerance1e-8. |
| address | JSON object, keys only from settings.addressFields(default street/city/postcode/country); plain-text string values max500 each; unknown keys/non-string values/list rejected. Required means every configured member is nonempty. |
| file_upload | Opaque UUID string only, or null when optional. Never metadata/path/URL. UUID structure is not sufficient: the locked service validates session+field ownership, expiration, private path, MIME and bytes. |
| media | Display-only; answer null and no persistence. Safe HTTPS/HTTP URL or projected attachment URL; image/video with accessible alt/label. |
| summary | Existing canonical display-only field; renders readable address and generic uploaded-file labels without revealing UUID/storage paths. |

Optional upload fields can continue without a file; resumed required fields can reuse their owned UUID without uploading again. Client accept/size hints never substitute for server validation. UI-level tests are separate from canonical parity tests, which remain unchanged and passing.

## Storage and spam security

- Requires existing `CFF_PRIVATE_DIR` outside `ABSPATH` **and** `DOCUMENT_ROOT`, real/writable/non-symlink. No public uploads directory or `.htaccess` fallback. Random `upload-<64hex>.bin` files are exclusively created and chmod0600 inside the existing protected root. No storage keys are accepted from the browser.
- `finfo` content MIME plus WordPress extension/content verification; configured allowed types are intersected with JPEG/PNG/GIF/WebP/PDF/plain-text only. SVG/HTML/Office/ZIP are not supported. Default10MiB, hard50MiB per file, 10 files/100MiB per session; authenticated/idempotent uploads, bounded rate20/10minutes. Runtime uploads use multipart, request-token/idempotency headers and no-store; tokens never go into query strings.
- Admin streaming requires login, `cff_view_submissions` and REST nonce, excludes trashed submissions, uses attachment/octet-stream/nosniff/private-no-store and exposes no internal path in its JSON response. No guest download ticket exists.
- CAPTCHA uses fixed HTTPS verification endpoints, TLS verification, no redirects, 8s timeout and capped response size. Hostname, timestamp, provider configuration and success are checked. Turnstile requires `cff_submit` action; reCAPTCHA v3 also requires this action and minScore. hCaptcha sends the configured site key. No spoofable browser verification result is trusted.
- Akismet uses fixed HTTPS `rest.akismet.com/1.1/comment-check`, bounded text content/email and trusted proxy-resolved IP, not cookies/headers/hidden answers. These optional external anti-spam processors need real keys and site privacy disclosure; this is not an unsolicited analytics/telemetry integration.

## Anonymous analytics

The only stored event names are `view`, `answer`, `back`, `abandon`. Body keys: `events`, optional booleans `optOut` and `consentGranted`; each event has only `event` and optional `stepId`. Maximum4096-byte JSON, 10 events/request, 200 events/session, rate50requests/minute. A locked authenticated session and published pinned snapshot are required. Nonempty step IDs must belong to the server-replayed path; answer events also require a saved answer. Form view has empty `step_id`. No raw URLs, answers, visitor IPs, tokens, arbitrary variants or payload are accepted. `cff_events.session_id` is the **numeric database ID**; `payload=NULL`, `variant_id=''`, `ts` server-generated. Attribution comes from existing consent-controlled stored submission metadata.

Runtime consent, opt-out, DNT and GPC suppress emission; the collector independently enforces configured consent/DNT, always respects GPC, and honors explicit opt-out. Embedders can use `analyticsOptOut:true` or call `window.ChatFlow.optOutAnalytics(true)`; the latter persists only a boolean preference in localStorage, with an in-memory fallback if storage is disabled. No cross-site identity is created. Call `optOutAnalytics(false)` to clear that explicit preference; this never grants consent or overrides DNT/GPC.

Browser events are best effort and never gate completion. They are not server completion authority. With partial saving disabled, only the authenticated form-level view is recorded; the runtime does not fabricate server step state. Abandonment is an explicit close signal, not an unload-delivery guarantee. Analytics views/counts can still be influenced by an authenticated visitor and are not billing/security audit evidence.

## Evidence and limitations

Passing checks: PHP unit221tests/406assertions, Vitest318tests, native backend33tests/310assertions; PHPStan, PHPCS, ESLint, both TypeScript configurations, Composer scope, full admin/runtime build and `git diff --check`. Shell checks cover the existing MVP plus adversarial new fields, privacy/caps, CAPTCHA response handling, Akismet response handling, real MIME/extension/size/symlink checks, session ownership, admin download permissions, idempotency, and genuine accepted/rejected multipart uploads. The HTTP fixture binds only to loopback and refuses non-test databases. Its uploaded-field snapshot is an explicit service fixture, **not** evidence that Phase2 publishing is centrally enabled.

Native backend tests run with WordPress6.4.5, PHP8.1.2 and MariaDB10.6.23, plugin activated and outside-webroot private test storage:

```sh
CFF_BACKEND_WP_ROOT=/path/to/isolated-test-wordpress \
CFF_BACKEND_PRIVATE_DIR=/path/outside-webroot/private \
vendor/bin/phpunit -c tests/php/Backend/phpunit.xml
```

The plugin must be activated in this isolated native fixture so retention/abandonment hooks are real. Dependency commands verified in this lane: `composer install --no-interaction`, `npm ci --no-audit --no-fund` (npm11.16.0), `composer scope`. Package/build commands use the repository's existing scripts; only runtime generated assets belong in this lane's commit, and final combined assets must be regenerated by the integrator.

No GUI/mobile focus/third-party widget acceptance, live CAPTCHA/Akismet verification, SMTP delivery, hosting/cache compatibility matrix or multisite acceptance is claimed. Those remain separate checks requiring appropriate environments/approval. No PR was created.
