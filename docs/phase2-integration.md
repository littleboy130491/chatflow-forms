# Integrated Phase 2 checks

This document supersedes the contribution-lane wiring/dependency gaps in
`phase2-visitor.md` and `phase2-admin.md`. Those files retain their lane-specific
evidence. `PLAN.md` is unchanged.

## Enabled implementation

- Central composition registers visitor uploads/events, analytics, template tools,
  optional Elementor, and display-only WPML/Polylang translations. Original MVP
  routes and tests are preserved.
- All 20 registered field types are publishable and advertised. Rating (1–5),
  scale (1–10) and NPS (0–10) use fixed ranges; slider accepts positive increments
  and fractional bounds;
  address accepts configured text members; uploads accept opaque UUIDs only;
  media is display-only. PHP and TS replay the same committed fixture corpus,
  including malformed/empty objects, incorrect increments, nonnumeric settings,
  required members and forged display answers.
- Configure global `spam.captcha/siteKey/secretKey/minScore/akismetEnabled/akismetKey`
  in Settings. Forms may disable the global provider or select the configured
  provider; selecting a different provider has no matching key and fails closed.
  `appearance.confetti` and `display.mode/launcher` remain optional and editable.
- Safe `GET /cff/v1/forms/{id}/engagement?version={pinnedVersion}` is private/no-store;
  no credentials or private provider settings enter cached public schemas/HTML.
  Public event requests use `X-CFF-Request-Token`, never query credentials.
- CAPTCHA failure and unavailable enabled Akismet reject before successful
  completion. The transaction rolls back; the same idempotency key may retry.
  Honeypot/time traps still quarantine spam; they cannot bypass CAPTCHA.
- Locked PATCH/submit replay first, validate upload field/session ownership,
  store answers, then bind only selected uploads to that submission. Unselected
  files remain expiring. Downloads require capability, nonce and a bound,
  nontrashed submission. Network MIME policies still apply on multisite.
- Analytics accepts only view/answer/back/abandon, at most 10 events/request and
  200/session, with numeric session IDs, empty variants, null payload and server
  timestamps. Consent, opt-out, DNT/GPC and server rate limits are honored.
- XLSX uses real scoped OpenSpout **4.25.0** under `ChatFlow\Vendor\OpenSpout`.
  XML/ZIP PHP extensions and outside-web-root private storage are prerequisites.
  Private deletion/expiry cleans the exact owner workspace and CSV companion
  before clearing the storage key. JSON template export/import/duplicate strips
  secrets and disables delivery destinations.
- Built admin/runtime assets and manifests are committed. Release packaging
  includes scoped runtime libraries and Action Scheduler, not dev dependencies.

## Executed checks

Shell-only on 2026-10-13; no GUI or testing-agent handoff:

- Composer install/lock validation, scope verification, PHPStan level 6, PHPCS,
  PHP unit/shared parity, ESLint, TS, Vitest, schema generation, admin/runtime
  builds, release packaging and `git diff --check`.
- `composer validate --strict` passes. The manifest uses the patch-only
  `~4.25.0` constraint while the committed lock and release contain exactly
  OpenSpout **4.25.0**; no CI validation gate is relaxed.
- PHP unit: **278 tests / 527 assertions**, no skips. Vitest: **368 tests**.
- Docker wp-env runs actual **WordPress 6.4.5 / PHP 8.1.34**, not a native fallback.
  The full suites include fresh activation/idempotent tables/capabilities, upgrade
  preserving forms, immutable snapshots, draft/published gating, REST capability,
  nonce/header/origin boundaries, cache-safe sessions/projections, genuine HTTP
  multipart upload idempotency and binding through production PATCH, analytics
  privacy/bounds, CAPTCHA rollback/retry, XLSX and private retention cleanup.
  Single-site: **327 tests / 1073 assertions**, two expected skips (multisite-only
  and Elementor-present-only). Multisite: **327 / 1075**, one expected
  Elementor-present-only skip. Address answers also traverse the real JSON REST,
  private resume and completed storage paths without losing object members.
  Video attachment URLs and filtered registry feature advertisements are covered.
- The extracted ZIP (without dev Composer autoload) was activated in an owned
  isolated plugin directory using WP-CLI. Actual scoped OpenSpout availability,
  built assets, draft/published engagement REST and upgrade preservation passed;
  the source plugin was restored afterward. Reproduce using
  `wp eval-file tests/php/Backend/release-smoke.php` with an extracted release active.
- Runtime launcher/popup focus, Escape, tab trapping/restoration, validation,
  provider loading and reduced-motion/confetti behavior are shell DOM/unit tests,
  not a browser/mobile acceptance claim.

## Remaining acceptance gaps

- No GUI/mobile acceptance, under-15-minute builder exercise, real CAPTCHA or
  Akismet credentials/network responses, real SMTP delivery, or cache/hosting
  compatibility matrix. Provider HTTP is mocked in security tests.
- Elementor-present integration is skipped in the baseline environment where
  Elementor is absent. The admin lane's separate actual-Elementor evidence is
  documented in `phase2-admin.md`; no full third-party compatibility is claimed.
- Native WPML/Polylang GUI compatibility is untested; display hooks are tested.
- The baseline single-site suite skips the multisite-only lifecycle test; the
  dedicated multisite run executes it. Expected skips do not disable gates.
- No PR is created. Push CI remains unclaimed unless separately confirmed.
  Parent MVP remote single/multisite wp-env CI was already green; this integration
  has its own executed local Docker evidence. No merge, force push or main changes.
