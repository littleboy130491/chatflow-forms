# Phase 2 admin implementation

This lane adds real admin features to the integrated MVP. It intentionally does
not change the central Plugin composition, dependency manifests, public visitor
routes, runtime, upload handling, or `PLAN.md`.

## Usage and security

- **Analytics:** choose a form and inclusive date range (maximum 367 days in the
  WordPress timezone). Starts use `cff_sessions.started_at`; completions and
  average duration use completed submissions. These are independent period
  totals, not a cohort rate: resumed sessions can make the ratio exceed 100%.
  Form views use stored `view` events with an empty step ID; per-step events count
  distinct numeric sessions. Drop-off is `max(views - answers, 0)`, not evidence
  of abandonment. Labels/choice options use the current draft; removed options
  count as unknown, and deleted steps are not reconstructed. Distributions only
  use completed submissions and never return raw Other text. Source/device
  counts exclude spam/trash. Source labels reject URLs, email addresses and
  query strings, falling back to the referrer hostname. Event opt-out, consent,
  DNT/GPC and retention affect recorded views.
- **Templates:** gallery drafts include contact, feedback and the existing
  Imajiner survey definition. Import validates an actual ChatFlow JSON file
  (maximum 1 MiB), export strips webhook secrets/headers, and duplicate creates
  an independent draft. Webhooks are disabled on imported/exported/duplicated
  forms; review destinations and explicitly publish. Server endpoints require
  `cff_manage_forms` plus the REST nonce, and return private/no-store responses.
- **Exports:** CSV remains compatible. XLSX is offered only when the real scoped
  OpenSpout SDK and XML/ZIP are available. XLSX always queues through the existing
  Action Scheduler/WP-Cron workflow, pages submissions in batches of 1000, and
  uses a bounded ID snapshot. Files remain in `CFF_PRIVATE_DIR`, outside the web
  root; downloads remain owner/capability/nonce/ticket bound and expire after
  24 hours. Formula-safe values are written as strings. Workers can recover an
  interrupted CSV batch, and cannot revive a revoked export. Private temporary
  workspaces and staging files are removed after conversion/expiry. Background
  readiness uses existing `wp_mail`; successful SMTP delivery was not tested.
- **Builder:** existing reactions/themes plus opt-in confetti, captcha/Akismet,
  published launcher rules and new field settings are editable. New fields are
  visible only if the server registry advertises them; this lane never enables
  unsupported field types. NPS remains fixed at 0–10. Media edit controls fill
  the coordinated image type, and address/numeric fields use coordinated
  defaults. Global `spam` keys are `captcha`, `siteKey`, `secretKey`, `minScore`,
  `akismetEnabled`, `akismetKey`; provider secrets stay in admin-only settings.
- **Optional hosts:** Elementor registers a native widget only when Elementor
  exists. It renders only published forms through the existing shortcode.
  WPML/Polylang registration/lookup hooks translate presentation strings, never
  IDs, keys, values, logic or credentials. Merge tags must be preserved. Public
  projection translation is language-context dependent; translated REST data
  receives its own ETag and no-store policy. `wpml-config.xml` leaves structural
  form identity untranslated. The licensed WPML UI and native Polylang UI were
  not tested; registered WPML callbacks were tested directly.

## Integration requirements

1. Inside `RestModule`'s `rest_api_init` wiring call
   `(new AnalyticsController($forms))->register()` and
   `(new TemplatesController($forms))->register()`.
2. Add `Integrations\Elementor\ElementorModule` and `Admin\Translations` to the
   central module composition. Both implement the existing `Module` contract.
3. Add a PHP 8.1-compatible locked `openspout/openspout` dependency and real
   Strauss-scoped output under `ChatFlow\Vendor\OpenSpout`. Version **4.25.0**
   was tested against its actual writer API. Preserve required XML/ZIP extensions.
   For PHPStan, discover the real scoped SDK and the optional Elementor API from
   its official source or accurately maintained stubs. No error suppression or
   baseline was introduced in this lane.
4. Extend shared `AdminConfig.screen` with `analytics` and `features` with
   `xlsx: boolean`; current clients use narrow local additive casts meanwhile.
   Regenerate contracts/assets after integration. The generated confetti settings
   type and current admin build outputs are committed for reproducibility.
5. Visitor embedded public projections must pass through `cff_public_display`
   **after** safe projection. The visitor lane reports that hook implemented.
   Preserve the optional translation module's REST ETag behavior.
6. Privacy/site cleanup must remove each XLSX `.csv` companion and call
   `Submissions\Xlsx::cleanupWorkspace($storage_key)` **before** clearing the
   export key. That helper only removes the exact validated export's private
   `<export-64hex.bin>.work` directory and never follows symlinks. Do not broaden
   upload storage keys. `Export::expire()` already handles both artifacts;
   `expire($owned_id)` allows isolated cleanup without sweeping unrelated jobs.
7. Preserve parent test-bootstrap fix `47619f9` when integrating this lane.
   This lane does not edit that fixture or delete externally configured storage.

## Actual shell verification

- JS: **300 tests**; TypeScript, ESLint and full admin/runtime build passed.
- Standard PHP unit suite: **228 tests / 381 assertions**, one explicit optional
  XLSX dependency skip. With the actual externally scoped OpenSpout 4.25.0:
  **228 / 389**, none skipped (Unicode, formula safety, atomic ZIP, private mode
  and temporary workspace cleanup).
- `composer lint`: passed across **82 files**. `git diff --check`: passed.
- PHPStan: **zero errors** when scanning real external scoped OpenSpout and the
  official Elementor 3.35 source, using a separate scratch config. Plain
  `composer analyse` reports **17 missing external SDK/API symbol errors** on
  this lane until the integration stage supplies dependencies/discovery. This
  is not a clean standalone static-analysis result.
- Docker wp-env backend on **WordPress 6.4.5 / PHP 8.1**:
  **35 tests / 240 assertions**, one Elementor-present-only skip. This includes
  stored analytics/REST authorization, private queued XLSX/expiry, template
  gallery creation, strict global settings, and no-Elementor behavior.
- Actual **Elementor 3.35 / WordPress 7.1.3** registration and published widget
  rendering plus WPML callback/display/ETag checks passed. The then-current full
  backend suite passed **34 / 243** (one absence-only skip). The test site was
  restored to WordPress 6.4.5 afterwards; current Elementor requires WP 6.6+.
  This does not claim broad third-party hosting/plugin compatibility.
- No GUI-driven testing, mobile builder timing, real captcha provider requests,
  SMTP delivery, caching/hosting compatibility matrix, or multisite re-run in
  this lane. Parent's MVP remote single/multisite wp-env CI is separately green;
  integration must rerun final full CI with merged wiring/dependencies.

The separate scoped SDK/Elementor source and scratch private test directory are
test-only, outside this repository and not release dependencies. Maintained
manifest/lock integration is still required before a final installable release.
