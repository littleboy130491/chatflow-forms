# Implementation and release gate

The integrated branch contains Phases 0–3. `PLAN.md` is preserved unchanged.
This is a shell-verified implementation, **not** complete visual, real-mobile,
live-provider or hosting-matrix acceptance.

## Actual feature coverage

| Plan area | Implemented behavior |
| --- | --- |
| Foundation/security | PHP 8.1+, WP 6.4+, custom tables, locked/scoped production vendors, JSON Schema and shared PHP/TS replay, published/draft revisions, capability + cookie + REST-nonce admin routes, signed public sessions, private projections and no-store owner responses. |
| Runtime/fields | Preact Shadow DOM, validation/branch replay, editing/back/summary, offline/resume/restart, private uploads, popup/launcher engagement, media/scales/address, reduced-motion support and preview step jump. Preview never starts sessions or sends notifications. |
| Builder/forms (§7) | React forms list with aggregate count/rate/latest timestamp, shortcode copy and CRUD/JSON duplicate/import/export; keyboard-aware sortable fields/options, grouping, search, key-rename warning, undo/redo, conflicts, autosave, publish diff, WordPress edit-lock heartbeat, design/custom CSS, contrast feedback, share QR and editable prefill URL builder. |
| Starter gallery | Blank, lead capture, health intake, product recommender with conditional endings, Feedback/NPS and appointment request, plus contact, feedback and the exact Indonesian Imajiner survey. Intake is not medical advice; appointment requests are not bookings. Optional survey option hiding is disabled. |
| Submissions/privacy | Status filters, read/star/spam/trash/bulk/permanent deletion, selected/filtered CSV/XLSX, detail previous/next within the loaded page, print stylesheet, notes, delivery retry/resend, private download tickets, privacy export/erasure, retention and audited background purge. |
| Notifications/integrations (§8) | Admin/autoresponder conditional recipients, merge tags, preview/test, delays, first-match behavior, reusable subject/body templates, durable outbox, scheduled retries/idempotency, signed webhooks, theme layouts, PHP/browser hooks and consent-aware tracking. Resend uses the frozen submission form version and only matched emails, not webhooks/completion hooks. |
| Power | Bounded calculations/scoring, outcomes, React Flow branches, server-frozen copy/order experiments and analytics, consent-aware expiring single-use magic fragments, queued email and user-initiated WhatsApp sharing. |

The forms list is a React table, not the plan's literal `WP_List_Table`.
Completion rate uses retained completed submissions / retained sessions (at
least the completed count); it is not an all-time funnel after privacy erasure.
Detail previous/next is within the filtered page, not a cross-page cursor.
Printing is implemented but browser/printer rendering is not visually accepted.
Contrast feedback computes AA normal-text ratios for hex colors in bot/user
bubbles and buttons. Custom CSS, named/transparent colors, focus indicators and
physical devices require manual checks; feedback is not an accessibility audit.

## Cross-module release corrections

- Calculation accepts printable ASCII plus TAB/LF/VT/FF/CR/space only, maximum
  512 ASCII characters, 128 tokens, depth 16, magnitude 1e12. Shared PHP/TS
  fixtures reject NBSP, Unicode line/paragraph separators, BOM, NUL and DEL and
  cover the 512/513 boundary.
- `experimentId:variantId` must fit 64 ASCII characters. Mirrored diagnostics
  and server schema validation reject 32+32 IDs; session regressions check valid
  32+31 and 31+32 IDs without truncation.
- Start/resume translate projected frozen **presentation only** through the
  guarded WPML/Polylang adapter; IDs, option values and logic remain unchanged.
- Upload, magic issuance and ordinary mutations share request-token renewal,
  concurrent-renewal deduplication and one 401 retry. Generic email issuance
  never runs after failed renewal. Magic consent/button/status copy is EN/ID.
- Email templates store bounded sanitized subject/body per site with nonce and
  `cff_manage_forms`; loading changes no recipients, routing or webhook secrets.
  Opt-in data removal uninstalls the library too.
- Locked `qrcode` 1.5.4 generates QR locally, without a third-party service.
  URL prefill only suggests editable allowed answers, never hidden/calculated/
  uploads/consent, and still needs server validation. **Never put personal data
  or secrets in share URLs**: history, referrers and logs may retain them.
- The parent's unique 0700 outside-web-root WordPress private-test fixture is
  retained, with shutdown cleanup and support for externally supplied
  `CFF_PRIVATE_DIR`. No production gate was relaxed; its redundant cherry-pick
  was skipped because the base already contained the fixture.

## Verification evidence

Pre-audit baseline: Composer unit281/550, PHPStan/PHPCS, TypeScript/ESLint,
JS375, Docker wp-env WP6.4.5/PHP8.1 single-site335/1157 (multisite and Elementor
skips) and multisite335/1159 (Elementor skip).

Post-audit checks passed on this VM:

| Gate | Actual evidence |
| --- | --- |
| Locked dependencies | `composer install --no-interaction --prefer-dist`, `npm ci --no-audit --no-fund`, `composer validate --strict`. |
| PHP | `composer test`: 283 tests / 573 assertions; `composer analyse` and `composer lint`: clean. |
| JS / contracts | `npm test`: 394 tests / 16 files; TypeScript and ESLint clean; shared replay/calculation/identifier fixtures and generated schema types. |
| Source WP single-site | Docker wp-env WP6.4.5 / PHP8.1: 345 tests / 1286 assertions. Two expected skips: multisite-only setup and uninstalled Elementor. |
| Source WP multisite | Same matrix: 345 tests / 1288 assertions. One expected skip: uninstalled Elementor. |
| Build / package | `npm run build`, actual `npm run package` workflow, `php tools/verify-package.php`; scoped autoload/classes, Action Scheduler, runtime/admin assets, docs and dev-file exclusions verified. |
| Extracted ZIP | Isolated fresh-prefix core, original source plugin inactive during isolated release activation; all custom tables/admin capabilities, draft vs published REST, private projection, nonce-protected gallery, shortcode/runtime registration and migration from DB version 0 while preserving publication passed. Uses no dev autoloader. |
| Preservation | SHA256 of `PLAN.md` matches the integration base: `1eed3de0b6af25266219aac91a223705a5c79d1df8356eddc2affa6620d4822c`. Built outputs/manifests are committed; ZIP and vendor trees are not committed. |

WordPress fixtures exercise ownership/nonce/capabilities, private storage,
CSV injection/XLSX, lifecycle/retention/privacy erasure, queue retries and
idempotency with intercepted deliveries, not live external delivery.
`src/Admin/languages/generate.py` regenerates and verifies all 634 reviewed
Indonesian strings in PHP/MO and three WordPress JS catalogs.

The isolated package fixture is reproducible with Docker wp-env: run
`tests/php/Backend/prepare-release-site.php` using `wp eval-file`; then run
`install-release-site.php` with `wp --path=wp-content/cff-release-test eval-file
... --skip-wordpress`, activate `chatflow-forms` on that isolated path and run
`release-smoke.php`. Helpers refuse an existing fixture or a non-isolated prefix.
The installer generates a disposable password only in memory and suppresses
mail. An earlier CLI setup echoed a disposable fixture password; it was
immediately invalidated. No real account credential was used.

Parent delivery previously obtained green remote `static-build` and both wp-env
CI jobs after the private-storage fixture fix. That is upstream evidence, not
remote CI on this branch. This VM uses Docker wp-env directly, not the parent's
native WP/MariaDB fallback.

## Explicit exclusions and optional deferrals

- No GUI/testing-agent run, real-mobile authoring or under-15-minute usability
  measurement, screen-reader/assistive-tech or visual acceptance.
- No live SMTP inbox/webhook delivery, credentialed CAPTCHA/Akismet, installed
  Elementor, live WPML/Polylang GUI, cache/CDN/optimizer/theme/hosting matrix.
  Shell fixtures do not prove external-provider compatibility.
- Optional Google Fonts fetching, AI assistance and native CRM are deferred.
  Defaults use local/system font stacks; custom CSS cannot import remote fonts.
  No licensing, telemetry, payments or AI chat.
- WhatsApp is user-initiated sharing, not provider delivery.
- Without resume, already-expired owner tokens surface expiry; they cannot be
  renewed and must not silently return an unsent magic-email acceptance.
- No tag, PR, merge or production deployment is performed by this gate.
