# Implementation and release gate

The integrated branch contains Phases 0–3. `PLAN.md` is preserved unchanged.
This is a shell-verified implementation, **not** complete visual, real-mobile,
live-provider or hosting-matrix acceptance.

## Actual feature coverage

| Plan area | Implemented behavior |
| --- | --- |
| Foundation/security | PHP 8.1+, WP 6.4+, custom tables, locked/scoped production vendors, JSON Schema and shared PHP/TS replay, published/draft revisions, capability + cookie + REST-nonce admin routes, signed public sessions, private projections and no-store owner responses. |
| Runtime/fields | Preact Shadow DOM, validation/branch replay, editing/back/summary, offline/resume/restart, private uploads, popup/launcher engagement, media/scales/address, reduced-motion support and preview step jump. Preview never starts sessions or sends notifications. |
| Builder/forms (§7) | Native WordPress `WP_List_Table` forms screen with bounded search/status/sort/pagination, retained aggregate count/rate/latest timestamp, shortcode copy, Edit/Duplicate/Preview/Export JSON/Trash; REST-nonce/capability protected mutations and a separate React builder page with New-form template picker. Builder has keyboard-aware sortable fields/options, grouping, search, key-rename warning, undo/redo, conflicts, autosave, publish diff, WordPress edit-lock heartbeat, design/custom CSS and opt-in font selection, contrast feedback, share QR and editable prefill URL builder. |
| Starter gallery | Blank, lead capture, health intake, product recommender with conditional endings, Feedback/NPS and appointment request, plus contact, feedback and the exact Indonesian Imajiner survey. Intake is not medical advice; appointment requests are not bookings. Optional survey option hiding is disabled. |
| Submissions/privacy | Status filters, configurable first-three answer columns, capability-scoped unread badge, read/star/spam/trash/bulk/permanent deletion, selected/filtered per-form CSV/XLSX, required export form and UTC date presets, authenticated export re-entry, detail previous/next within the loaded page, safe stored-IP copy and authenticated file-upload download, print stylesheet, notes, delivery retry/resend, private download tickets, privacy export/erasure, retention and audited background purge. **Exact purge-preview CSV export is not implemented**; see the open design decision below. |
| Notifications/integrations (§8) | Admin/autoresponder conditional recipients, merge tags, preview/test, delays, first-match behavior, reusable subject/body templates, durable outbox, scheduled retries/idempotency, signed webhooks, theme layouts, PHP/browser hooks and consent-aware tracking. Resend uses the frozen submission form version and only matched emails, not webhooks/completion hooks. |
| Power | Bounded calculations/scoring, outcomes, React Flow branches, server-frozen copy/order experiments and analytics, consent-aware expiring single-use magic fragments, queued email and user-initiated WhatsApp sharing. |

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
- Google Fonts use the documented CSS2 API (`family=...:wght@400;600` and
  `display=swap`) only for explicit selection of Inter, Roboto or Open Sans.
  System/local is default, and inheriting theme fonts disables external loads.
  The bounded public appearance enum is mirrored in both JSON schemas and
  validated server-side (including public projection filters); the same Preact
  Shadow DOM runtime loads the font for visitors and preview. The CSS request
  omits credentials/referrer and follows no redirects; only bounded CSS2
  `@font-face` rules with matching family and HTTPS font files on
  `fonts.gstatic.com` are installed in a document-level shared stylesheet.
  No admin-supplied URL, `@import`, or arbitrary stylesheet is accepted.
  Multiple mounts share styles, and the last unmount removes them; CSP/network
  failures keep local fallbacks. The builder warns that visitors' and preview
  administrators' IP and browser/network information can reach Google; site
  owners must assess consent/privacy policy. Fonts are not live-browser
  accepted by the shell checks.
  Loading/weight/swap behavior follows the official
  [CSS2 API documentation](https://developers.google.com/fonts/docs/css2);
  see the [Google Fonts privacy FAQ](https://developers.google.com/fonts/faq/privacy)
  for provider disclosures. Restrictive CSPs need to allow the CSS fetch,
  generated font-face styles and the HTTPS font origin; this plugin does not
  change or bypass a site's CSP.
- A fixed PHP-owned cookie-source allowlist permits only `utm_source`,
  `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `campaign`,
  `tracking`, `cff_locale` and `cff_theme` for hidden cookie fields. Even those
  names are denied when they equal WordPress authentication-cookie constants.
  Unknown cookie names fail closed; mirrored PHP/TS validation reports
  `restricted_cookie`. The server never reads denied cookie values, even for
  published schemas predating validation. Session replay, resume, patch,
  cached responses, notification resend and integration delivery block or
  sanitize historical denied values. The visitor cannot alter the allowlist.
  This unreleased v0.1 implementation does **not** mass-erase preexisting
  stored submissions/outbox/session records; sites used before this guard
  must remove any old sensitive records before live use. Tests use synthetic
  markers rather than credential values.
- Submission answer-column choices use up to three bounded keys and store
  column names only in per-browser storage; storage denial shows a warning.
  The unread badge excludes spam/trash and checks viewing capability before
  counting. Copy stored IP uses only the saved IP field. File-upload UUIDs
  are fetched only same-origin using the current admin nonce in a header,
  no-store/redirect-error, then downloaded from a temporary Blob URL; the
  interface requires submission-view capability.
- Export creation requires a form. A paginated, capability-protected selector
  can look up the form from active filters; the selected form must match any
  active form filter. Selected row IDs and other filters are intersected with
  that form. UTC presets support last 7/30/90 days and this month. Workers
  email an admin landing link containing only `exportId`, never a ticket or
  nonce. The original owner reopens authenticated progress and then gets a
  fresh private download URL. Multi-choice scalar lists are comma-joined,
  objects/Other values remain structured JSON, creation dates use site-timezone
  ISO-8601 and CSV formula protection is retained. Mail delivery itself was
  intercepted in tests, not verified with a real SMTP provider. Settings
  explicitly warns if the system reports no SMTP plugin.
- Purge defaults to all statuses with a 360-day age threshold. Preview and a
  typed `DELETE` confirmation remain mandatory. **Not implemented:** the
  planned “Export these to CSV first” action for the exact preview membership.
  The existing signed token binds user, criteria hash, cutoff and max ID but
  does not freeze matching row IDs or contents; a normal per-form export can
  diverge after concurrent row edits. The UI warns that this is not an exact
  backup. A durable materialized snapshot or an explicitly approved
  cutoff/max-ID live-row contract is required before adding that action.
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
| PHP | `composer test`: 285 tests / 648 assertions; `composer analyse` and `composer lint`: clean. |
| JS / contracts | `npm test`: 446 tests / 20 files; TypeScript and ESLint clean; shared replay/calculation/identifier, cookie policy, admin controls and font boundary fixtures and generated schema types. |
| Source WP single-site | Docker wp-env WP6.4.5 / PHP8.1: 352 tests / 1435 assertions. Two expected skips: multisite-only setup and uninstalled Elementor. |
| Source WP multisite | Same matrix: 352 tests / 1437 assertions. One expected skip: uninstalled Elementor. |
| Font CSS2 shell sample | Official Google CSS2 Inter, Roboto and Open Sans responses were fetched without credentials/referrer and accepted by the strict CSS/origin parser (14, 18 and 20 bounded faces). This is not in-browser loading/privacy/CSP acceptance. |
| Build / package | `npm run build`, actual `npm run package` workflow, `php tools/verify-package.php`; scoped autoload/classes, Action Scheduler, runtime/admin assets, docs and dev-file exclusions verified. |
| Extracted ZIP | Isolated fresh-prefix core, original source plugin inactive during isolated release activation; all custom tables/admin capabilities, draft vs published REST, private projection, font projection/native list classes, nonce-protected gallery, shortcode/runtime registration, owner-bound private CSV file and migration from DB version 0 while preserving publication passed. Uses no dev autoloader. |
| Preservation | SHA256 of `PLAN.md` matches the integration base: `1eed3de0b6af25266219aac91a223705a5c79d1df8356eddc2affa6620d4822c`. Built outputs/manifests are committed; ZIP and vendor trees are not committed. |

WordPress fixtures exercise ownership/nonce/capabilities, private storage,
CSV injection/XLSX, lifecycle/retention/privacy erasure, queue retries and
idempotency with intercepted deliveries, not live external delivery.
`src/Admin/languages/generate.py` regenerates and verifies all 671 reviewed
Indonesian strings in PHP/MO and three WordPress JS catalogs.

The isolated package fixture is reproducible with Docker wp-env: run
`tests/php/Backend/prepare-release-site.php` using `wp eval-file`; then run
`install-release-site.php` with `wp --path=wp-content/cff-release-test eval-file
... --skip-wordpress`, activate `chatflow-forms` on that isolated path and run
`release-smoke.php`. Helpers refuse an existing fixture or a non-isolated prefix.
The installer generates a disposable password only in memory and suppresses
mail. An earlier CLI setup echoed a disposable fixture password; it was
immediately invalidated. No real account credential was used.
An idempotency-regression failure also printed disposable local session tokens
in an assertion diff. That raw diagnostic file was removed, absence of its
stored session was verified, and subsequent WordPress runs redact token-bearing
response lines before writing or displaying diagnostics.

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
- Optional AI assistance and native CRM are deferred. No licensing, telemetry,
  payments or AI chat. Google fonts are opt-in with local/system defaults;
  custom CSS cannot import remote fonts. Network/privacy/CSP behavior on
  actual visitor browsers remains untested.
- WhatsApp is user-initiated sharing, not provider delivery.
- Without resume, already-expired owner tokens surface expiry; they cannot be
  renewed and must not silently return an unsent magic-email acceptance.
- No tag, PR, merge or production deployment is performed by this gate.
