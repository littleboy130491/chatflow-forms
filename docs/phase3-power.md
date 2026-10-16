# Phase 3: logic, experiments and cross-device resume

In the form builder, define **scoring variables** with a unique key, type and
default; add a `set_variable` rule to a step or option to set/add/subtract the
value when its condition matches. A **calculated number** step takes an
expression using `answer.key` and `variable.key` and the operators `+ - * /`
with parentheses. Only numeric earlier answers and numeric variables are
allowed. Expressions are limited to 512 bytes, 128 tokens, 16 levels of
nesting and absolute results of 1e12. There is no JavaScript/PHP evaluation.
Server and browser both recompute calculated values when the visitor edits an
earlier answer; the server rejects supplied calculated answers. Calculations
are read-only and never appear as an input prompt. An **outcome ending** uses
the first matching condition after replay; otherwise the configured default
ending applies.

The **branching flow map** visualizes the form's actual steps, endings and
jump/end rules. Select a node to open its existing inspector. Connect a step
to a later step/ending to create a rule, select its edge to edit its condition
in the rule editor, or remove the edge to remove its rule. Dragging nodes only
changes their visual positions. Publishing still checks destinations and
cycles against the schema; the graph is not a separate execution model.

Create one **A/B copy and order experiment** per form. Set variant IDs and
weights; override selected step messages, or reorder only independent steps.
Branching, hidden, jump-target, summary and calculated steps must retain their
dependency boundaries; publishing reports an invalid order rather than
running a divergent path. When enabled, the server draws one weighted variant
on the visitor's first session start and stores the variant ID and applied
schema in that session. Resume, partial saves, submit and tracked events use
the same frozen schema even after later publishing. Visitors cannot provide
their own variant ID. The admin analytics report groups starts and completions
by variant ID. The report's completion column counts the assigned sessions
which completed within the selected dates, **not** an A/B conversion rate;
privacy opt-out, retention and date boundaries affect the totals.

To allow **cross-device resume**, enable partial saving and resume, add an
email field, then choose it in form settings and enable one-time email links.
Set a 5–1440-minute lifetime and optionally enable the WhatsApp share button.
The visitor must have entered an email to request an email link and explicitly
confirm each request. Invalid or unavailable requests receive the same generic
response. The request needs the current session's signed request credential;
it is limited per session, trusted client IP and recipient hash. WordPress
queues the actual `wp_mail()` delivery with bounded retries: a configured mail
transport and running Action Scheduler or WP-Cron are required. The WhatsApp
button is **user-initiated sharing** via the device share sheet or clipboard;
the plugin does not message WhatsApp or assert delivery by a provider.

Links carry one opaque, short-lived credential in the URL **fragment**, not
an email address, answer, or query parameter. The browser removes it from the
address bar before posting it in a same-origin REST header. The database stores
only its SHA-256 digest; the temporary queued email payload is authenticated
encrypted with a WordPress salt-derived key. Redemption locks and consumes the
row atomically, rotates the session's resume credential, and checks the
published form/session/expiry. Responses are private and `no-store`. External
page scripts, browser extensions, inboxes and shared-device history remain
outside the plugin's protection; keep HTTPS and third-party scripts trusted.

Shared PHP/TypeScript fixtures cover scoring, calculated answers, outcome
selection, copy/order variants and rejection of forged computed answers or
invalid expressions. Native connectors are documented in
[connectors.md](connectors.md). AI builder assistance remains optional and
**not implemented**. Licence checks, telemetry, payments and AI
chat remain out of scope. A shell test/build pass does not establish mobile
usability, under-15-minute authoring, real SMTP delivery, or hosting/cache
compatibility; verify those separately before production rollout.

## Verified integration checks

- Composer unit/parity/security suite: 281 tests, 550 assertions; PHPStan and
  PHPCS pass. Composer validate, dependency scoping verification and release ZIP
  packaging pass with actual scoped dependencies and built assets.
- TypeScript, ESLint and production builds pass; Vitest: 375 tests. This includes
  the shared score/outcome fixture after editing and completion, assigned schema
  adoption, and schema-backed graph connections/option-branch deletion.
- Docker `wp-env` WordPress 6.4.5/PHP 8.1 integration suite: single-site 335 tests,
  1157 assertions (multisite lifecycle and installed-Elementor cases skipped);
  multisite 335 tests, 1159 assertions (installed-Elementor case skipped).
  The graph bundles React's JSX helper while sharing WordPress's React; integration
  tests verify every generated builder dependency exists on this supported core.
- The committed `PLAN.md` is unchanged. No GUI/device, live SMTP, installed
  Elementor, or external hosting/cache acceptance is claimed by these checks.
