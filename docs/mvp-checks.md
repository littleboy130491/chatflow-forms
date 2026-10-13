# Phase 1 integration gate

**Verdict: shell MVP integration gate passed. Product/UI and hosting acceptance
remain open.** This is not a claim that every PLAN.md exit criterion has passed.

Integration branch: `devin/1791876671-mvp-integration`. It starts at
`origin/devin/1791871184-phase-zero-foundations`, with each contribution's
commits cherry-picked relative to that base, not entire histories. All five
lanes are included. PLAN.md remains byte-for-byte unchanged. No PR, merge,
main update, force push, release tag or external service credential was created.

## Phase coverage

| PLAN scope | Delivered implementation | Validation boundary |
| --- | --- | --- |
| Phase 0 | Bootstrap/version checks, OpenSSL requirement, scoped dependencies, custom InnoDB tables, capabilities, private updater, package tooling | Activation, idempotent migration/upgrade, uninstall preservation/opt-in deletion; updater mocks, not live private update download |
| Phase 1 logic/fields | PHP/TS deterministic replay, show/hide/jump/end/required, variables/interpolation/diagnostics, 12 v1 inputs plus summary and canonical Other | 112 identical replay fixtures and shared operator/validation/interpolation cases |
| Phase 1 visitor | Preact Shadow DOM inline/fullpage, field inputs, back/edit/progress/summary, endings/WhatsApp, accessibility/reduced-motion code, offline/conflict/session handling | Vitest/jsdom and real HTTP protocol tests; no browser, phone or assistive-technology acceptance |
| Phase 1 backend | Published-only public projection, fresh uncached HMAC handshake, header credentials, encrypted idempotency receipts, frozen replay context, custom-table partial/completed/abandoned submissions | Native WordPress/MariaDB REST/storage/security tests and installed-package HTTP smoke |
| Phase 1 admin | React WordPress builder, autosave/conflicts/version publish, real runtime draft preview, submissions/settings/tools, Gutenberg block | 32 admin tests, typecheck/build/dependency manifests and PHP registration; no timed builder exercise |
| Phase 1 integrations | Isolated sync/async hooks, transactional outbox, Action Scheduler/shared loader plus WP-Cron fallback, retries/recovery, canonical signed HTTPS webhooks | Full visitor submit to production hook/outbox/worker wiring; network and mail transports intercepted |
| Phase 1 notifications | Conditional admin/autoresponder HTML/plain mail, safe merge tags/buttons, preview/test/resend/activity | Rendering, actual queued worker invocation, signature/recipient/auth tests; no live inbox receipt |
| Phase 1 privacy | IP/DNT handling, private files, WordPress exporter/eraser, filtered CSV, owner-bound download, preview-bound purge, optional retention | Real database rows/dependencies/files, BOM/formula protection, exact selected-row purge; retention off by default |
| Phase 1 template/i18n | Indonesian Imajiner survey, branch/resume/summary/Other/phone/WhatsApp, PHP MO/admin JSON translations, runtime Indonesian phrase pack | Template schema/replay/REST/ending checks and actual MO loading; not visual translation review |
| Phase 1 compatibility | Optimizer exclusions/module tags, trusted proxy modes and Cloudflare CIDR handling | Only local single-site/multisite plus proxy/header unit tests; hosting/plugin matrix not executed |
| Phase 2/3 | Not claimed | Analytics, popup/drawer, uploads, native connectors and other later-phase features remain outside this MVP |

## Actual checks (2026-10-13)

Environment: PHP **8.1.2**, WordPress **6.4.5**, MariaDB **10.6.23**,
Node **24.19.0**, npm **11.16.0**. Native tests used isolated local test databases
and private storage outside the WordPress web root.

| Check | Result |
| --- | --- |
| `composer validate --strict` | Pass |
| `composer lint` (PHPCS) | Pass |
| `composer analyse` (PHPStan level 6) | Pass; no baseline/suppression added |
| `composer test` | 217 tests / 360 assertions pass |
| `npm run schema:types` + generated schema diff | Pass; generated files unchanged |
| `npm run typecheck` and `npm run lint` | Pass |
| `npm test` | 296 tests / 9 files pass; includes 210 shared logic cases |
| `npm run build` | React admin/blocks/manifests/CSS and separate self-contained Preact runtime/tracking outputs pass |
| `composer scope` | Pass; scoped autoload/parser checks without unscoped production classes |
| `php tools/package.php` + `php tools/verify-package.php` | Pass; templates, translations, both runtime assets and all admin manifests included, dev/credential exclusions enforced |
| Native backend suite | 27 tests / 195 assertions pass |
| Full native WP single-site suite | 260 tests / 745 assertions pass; one multisite-only test skipped |
| Full native WP multisite suite | 260 tests / 747 assertions pass; no skip |
| Packaged ZIP install/activation and replacement update via WP-CLI | Pass |
| Packaged-plugin real HTTP smoke | Draft 404; published schema/ETag; admin anonymous rejection; start-token tamper rejection; no-store handshake/sessions; partial/resume/branch; submit/idempotent retry; phone/WhatsApp ending; assets and full-page HTML pass |
| Indonesian MO loaded with WordPress gettext | Pass (`Forms → Formulir`) |
| `git diff --check` and PLAN.md invariant | Pass |

Counts overlap: the native WP suite also executes the shared PHP logic cases.
They must not be summed as independent unique tests.

### Security and workflow evidence

The native suites verify nonce/capability boundaries, private-setting stripping
(including filter attempts to reintroduce secrets), unvisited/hidden override
rejection, frozen context, revision conflicts, pinned published versions and
republish/unpublish behavior, tampered/expired credentials, expired sessions
preserving partials, abandonment, durable deduplication, transactional rollback,
completed hook and three queued production deliveries (async/mail/webhook).
Webhook checks sign exact stored bytes, configure the pinned cURL transport,
reject SSRF/private targets/unsafe headers and avoid redirects or response-secret
logging. Email and HTTP are intercepted: no live recipient or endpoint was used.

CSV tests verify UTF-8 BOM and apostrophe protection for `= + - @` prefixes.
Purge binds preview criteria to user/token, requires literal DELETE and preserves
nonmatching/newer rows. Exporter/eraser tests remove real dependent data and owned
files, reject traversal/symlinks and check owner-bound progress/download. Fresh
DDL and an older db-version marker upgrade preserve existing forms; there is no
released legacy-version fixture to claim as tested. Automatic retention stays
disabled unless explicitly configured. Test-notification sample PII is removed
after one day by bounded recovery, independently of submission retention.

The wp-env v4 simple-git callable-export incompatibility was repaired in a
dev-only launcher without downgrading the security-patched pin. Launcher/version
and start were executed; Docker startup then failed on **Docker Hub HTTP 429**.
Native WP-CLI/MariaDB substituted, as authorized. Docker tests did not run.

## Outstanding acceptance and compatibility work

- Under-15-minute builder reconstruction: **untested**.
- Real phone close-tab/reopen/resume/start-over journey and browser UX: **untested**.
- Screen-reader/keyboard, reduced-motion and visual responsive/i18n acceptance:
  **untested** beyond jsdom/source checks.
- Excel/Google Sheets CSV opening: **untested**; encoding/formula bytes tested.
- Real SMTP/autoresponder inbox, external webhook receipt, production cron and
  private GitHub updater/download: **untested**.
- PHP versions beyond 8.1.2, WP versions beyond 6.4.5, Apache/nginx/host variants,
  classic/block/Elementor themes, WordPress cache/optimizer/security plugins,
  Cloudflare/Rocket Loader/WAF and network/multisite hosting matrix: **not executed**.
- Optional CAPTCHA/Akismet providers and live Cloudflare refresh: **not exercised**
  with provider credentials; proxy and refresh failure-boundary tests passed.

No GUI setup, browser test or testing-agent handoff was performed. UI acceptance
requires user approval. These gaps do not invalidate the executed shell gate,
but they prevent declaring the complete MVP product acceptance/compatibility
gate closed.
