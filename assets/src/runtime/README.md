# Visitor runtime

`mountRuntime(host, {formId, restUrl, mode: 'inline' | 'fullpage' | 'launcher'})` mounts a
Preact chat in an open ShadowRoot. The handle exposes `unmount()`,
`prefill(answers)` and `getState()` (path, active step, variables, progress and
diagnostics; no answer/token export). Auto-mount:

```html
<cff-chat data-form-id="42" data-rest-url="/wp-json/cff/v1/"></cff-chat>
```

An optional child `script[type="application/json"][data-cff-schema]` supplies
the safe public envelope; never put tokens, visitor data or WP nonces in cached
markup. `data-mode="fullpage"` selects fullpage layout. `data-mode="launcher"` makes an
opt-in fixed-position floating launcher (`data-position="left"` or `"right"`).
The chat is collapsed by default and network/session initialization is deferred
until the visitor opens it. Backend embedding/enqueue belongs to the integration lane.

`mountRuntime(host, {form: publicDraftEnvelope, preview: true})` makes no
API/storage mutations, events or redirects, including restart. Optional preview
`context` injects hidden values/a date for diagnostics.

`window.ChatFlow.open(id)` scrolls/focuses an existing inline form or opens an
existing floating launcher (false when absent). `ChatFlow.prefill({key:value}, id?)` provides editable
defaults, not authoritative answers. `ChatFlow.registerField(type, Component)`
registers a renderer and returns a disposer; matching PHP validation and explicit
schema/publish support remain required.

`ChatFlow.registerFrontend(fn)` lets a theme replace the chat UI with a headless
API (state, actions, safe Markdown/link helpers); forms rendered with
`data-frontend="theme"` wait up to 4 s for it, then fall back to the built-in chat.
See [custom frontend](../../../docs/custom-frontend.md).

English/Indonesian UI and per-form phrases are supported. Rendering escapes all
interpolation and uses restricted Markdown. `form.media` maps attachment IDs to
safe public `{url,alt?}`. No Google Fonts request is made: fonts must be available
locally. Custom CSS accepts static color/spacing/typography rules in the shadow
tree; imports/resources/escapes/at-rules/answer-attribute selectors/CSS variables
and image-bearing declarations are rejected. Single-choice Other uses the shared
`{value:configuredValue,other:plainText}` contract; ordinary choices are strings
and multi-choice string[]. Deploy only with the matching real shared/PHP logic.

## Sessions and privacy

Credentials travel only in `X-CFF-*` headers. Immutable operation bodies/UUID
idempotency keys survive retries while the mounted tab remains open. Submit
requests are not queued across reloads. A possibly accepted submit cannot be edited or
restarted until an identical retry confirms the result. Lost-response retries
first reuse the old request token so the server can return its committed dedupe
response after expiry. Requests are same-origin and disallow redirects.

Resume exchanges the durable token for a fresh request token and fetches the pinned
schema. Edits replay from zero, prune unreachable answers and use frozen server
hidden/date context. Revision conflicts require choosing server/local answers.
Missing snapshots retain partials; restart closes the old session then obtains a
fresh start token for the current form. `savePartial:false` prevents PATCH requests.

With resume enabled, `cff:session:{formId}:{version}` localStorage holds answers,
durable credential, public schema/context and local dirty state/timings. This can
include personal information on shared devices. The readable `cff_s_{formId}`
SameSite=Lax cookie holds only the durable credential (Secure on HTTPS). Request
tokens stay in memory. Completion/restart/expiry clear local resume data. Storage
failures and insecure production HTTP are warned. Offline cached answers can be
edited, but reconnect must authenticate before saving; submit is never auto-queued.

Attribution is OFF by default. The tracking entry reads
`window.cffTracking={enabled,consentRequired,consentGranted,days}`; runtime
`tracking` overrides it. Consent is required when configured; Do Not Track is
respected by default (`respectDnt:false` explicitly disables that preference). First-touch
`cff_ft` localStorage lasts 30 days by default (max90), preserving the first
landing/referrer/UTM/click IDs. URLs lose query/fragment/credentials and individual
campaign/click values are capped. Disable/revoke clears this entry. No telemetry.
Events `cff:start`, `cff:step`, `cff:complete` contain public identifiers only,
never answers or credentials.

## Checks

`npm test -- tests/js/runtime` runs shell/API/replay/jsdom component tests, not a
WordPress or browser E2E test. Before integration, run in an isolated workspace
with the real logic lane's shared files: `npx tsc -p tsconfig.runtime.json`,
scoped ESLint and Vite with isolated output. This branch never commits shared
source or packaged builds. Integrator: pin jsdom as a direct dev dependency and
regenerate packaged assets after composing lanes.

Popup mode uses `[chatflow id="42" mode="popup"]`, and supports programmatic
`ChatFlow.open(42)`, Escape, a scrim close action, and an opt-in timed or scroll
trigger. `auto_open="10"` (seconds) and `scroll_percent="60"` are also
supported by floating launcher mode. Triggers run once per page load, while
session creation is still deferred until the panel actually opens. They are not
enabled during builder previews.
