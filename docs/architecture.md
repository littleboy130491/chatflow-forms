# ChatFlow composition contracts (v1)

The integration now registers all nine production modules below. React admin,
Preact Shadow DOM runtime, visitor/admin REST, durable sessions/submissions,
privacy tools and delivery jobs are implemented. See docs/mvp-checks.md for
executed shell checks and untested acceptance criteria. PLAN.md is preserved
verbatim. The ownership descriptions record the contribution architecture.

## Ownership and composition

`docs/lanes.json` contains the five disjoint ownership scopes. In addition to
Plugin.php and Install/Installer.php, the integrator owns bootstrap, uninstall,
autoload, src/Contracts, src/Security, src/Updates, schema/, tools/, build configs,
CI/release workflows, dependency manifests/locks, docs/architecture.md and all
tests/php/Foundation and tests/js/foundation. Lane owners request changes to these
files; they do not edit them. Compiled build/ is regenerated only by the integrator.

PHP modules implement `ChatFlow\Contracts\Module::register(): void`. register()
only installs hooks; it does not dispatch REST requests or perform migrations.
The integrator constructs these exact modules, in this order:

1. `ChatFlow\Forms\FormsModule(FormRepository $forms, Registry $fields)`
2. `ChatFlow\Rest\RestModule(FormRepository $forms, Engine $engine, Registry $fields)`
3. `ChatFlow\Frontend\FrontendModule(FormRepository $forms)`
4. `ChatFlow\Privacy\PrivacyModule(FormRepository $forms)`
5. `ChatFlow\Admin\AdminModule(FormRepository $forms)`
6. `ChatFlow\Integrations\IntegrationsModule(FormRepository $forms)`
7. `ChatFlow\Notifications\NotificationsModule(FormRepository $forms)`
8. `ChatFlow\Admin\Translations()` (optional WPML/Polylang display hooks)
9. `ChatFlow\Integrations\Elementor\ElementorModule()` (only registers a widget when Elementor is loaded)

`Registry` is `ChatFlow\Fields\Registry`, `Engine` is `ChatFlow\Logic\Engine`.
Both have no-argument defaults (`new Engine(new Registry())` is also supported).
Each module owns its internal collaborators. No module edits Plugin.php, creates
its own autoloader, redefines cff constants or depends on another module's GUI.
Until integration, `cff_modules` filters a list of already constructed Module
instances; all modules register once per request. Action Scheduler is loaded in
the bootstrap **before plugins_loaded**, following its official shared-version
arbitration. It alone is intentionally unprefixed. Other runtime dependencies
live under `ChatFlow\Vendor\`, `CFF_Vendor_` and `CFF_VENDOR_` (Strauss). Never
include Composer vendor/autoload.php in production. Composer's autoloader is
only used by developer tools and tests.

## Schema and form repository

Canonical definitions: schema/form.schema.json and schema/settings.schema.json
(Draft 2020-12, schemaVersion=1). No arbitrary unknown field types or properties.
All plan types are recognised; original v1 publish types are short_text, long_text,
email, phone, number, date, single_choice, multi_choice, yes_no, consent, hidden,
statement, **summary**. rating/scale/nps/slider/file_upload/address/media are
enabled by the Phase 2 integration with matching PHP/TS sanitization, validation
and shared replay fixtures. Publishing uses the active registry (20 types),
filterable via `cff_publishable_field_types`. Summary remains supported for the
original survey. Optional provider credentials never enter cached public schemas;
the pinned, no-store engagement endpoint exposes only the provider/site key and
analytics flags. See docs/phase2-integration.md for checks and acceptance gaps.

Steps have immutable `id` and unique `key`; option IDs are immutable and values
unique within a step. IDs for steps/options/groups/endings/buttons are globally
unique within a schema. Generate IDs once, not when reordering/rendering.
Never reassign a removed ID to another entity. The repository remembers every
previous field key → ID and option value → ID, rejecting reassigned IDs even if
the field was temporarily deleted. Renaming a key keeps its ID, and the admin
must warn that exports/integrations use keys. Publishing freezes schema **and
private settings** (including notifications/integrations) in a version snapshot.
Current drafts are never used to validate an existing submission or deliver a job.

`ChatFlow\Forms\SchemaValidator`:
- `validate(array $schema): array` issues; structural and cross-reference checks.
- `validateSettings(array $settings, ?array $schema=null): array` issues.
- `validatePublishable(array $schema, array $enabledTypes=ENABLED_TYPES): array` issues.
Issues are `{path: JSON-pointer, code: string, message: string}`; empty means valid.
Schema definitions are loaded locally, no network resolution. Schemas are <=1MiB,
<=500 steps, <=200 options per field, <=100 rules per field. JSON objects must be
objects, not empty arrays (PHP callers use `(object) []` for optional empty objects).

`ChatFlow\Forms\FormRepository` (actual Phase 0 implementation):
- `__construct(SchemaValidator $validator=new SchemaValidator())`
- `create(string $title, array $schema, array $settings=[]): Form|WP_Error`
- `getDraft(int $id): ?Form`
- `getPublished(int $id, ?int $version=null): ?Form` — published posts only.
- `getVersion(int $id, int $version): ?Form` — trusted admin/jobs historical read,
  even if now unpublished/trashed; never expose publicly without publication check.
- `saveDraft(int $id, array $schema, array $settings, int $expectedRevision,
  ?string $title=null): Form|WP_Error`
- `publish(int $id, int $expectedRevision): Form|WP_Error`

Draft and publish writes lock the post row in a transaction. Revisions start at 1
on create; each save/publish increments draftRevision; version starts at 0 and
only publish increments it. Conflicts are 409 cff_revision_conflict. Published
schema/settings meta are convenience pointers; cff_form_versions is authoritative.
Use create/save/publish, not direct post-meta writes. Repositories are trusted
internal services, **not authorization boundaries**; controllers check capabilities.
No generic WP REST endpoint for CPT/meta. The native CPT publish capability is
disabled so publishing goes through the schema repository.

Immutable `ChatFlow\Forms\Form` exposes id(), title(), slug(), schema(), settings(),
version(), draftRevision(), status(), toArray(). Admin FormDTO is exactly
`{id,title,slug,schema,settings,version,draftRevision,status}`. status is draft or
publish. Historical title/slug come from the frozen version snapshot.

Settings keys are camelCase: appearance, phrases, completion.defaultEndingId,
completion.allowedRedirectHosts, sessions(savePartial,resumeEnabled,resumePrompt,
resumeDays=30,abandonDays=30,deletePartialOnRestart=false), limits, privacy,
spam, notifications(admin[],autoresponders[],firstMatchOnly,notifyAbandoned),
integrations.webhooks[], display. Validate against settings schema. Absent values
use defaults; private credentials/config never enter public DTOs. Global option
`cff_settings` is an array with `delete_data_on_uninstall=false`, retention off,
default retention 360 days, and global defaults chosen by Admin/Privacy modules.
The updater reads **only** the wp-config.php constant CFF_GITHUB_TOKEN, never this
option, environment variables, admin inputs or exported JSON.

## Fields, deterministic replay and shared fixtures

PHP `ChatFlow\Fields\FieldType` has `type(): string`,
`sanitize(mixed $value, array $step, array $context=[]): mixed`,
`validate(mixed $value, array $step, array $context=[]): array` (ValidationIssue[]).
`Registry::register(FieldType $type): void`, `get(string $type): FieldType`
(throws for unknown/unsupported), `types(): array` of enabled type names.
`cff_field_types` filters the registry's list of FieldType instances. Custom JS
types require matching PHP types and an explicit schema extension by integrator;
never silently pass unknown types through the enum or server validation.

TS exports from `assets/src/shared/logic/index.ts`: `replay`, `validateAnswer`,
`interpolate`, `evaluateCondition`, `diagnoseSchema`. PHP equivalents:
`ChatFlow\Logic\Engine::replay(array $schema, array $answers,
array $context=[], string $mode='partial'): array`,
`ChatFlow\Logic\Interpolator::interpolate(string $text, array $answers,
array $meta=[]): string`. Registry performs PHP answer normalization/validation.
TS `replay(schema, answers, context={}, mode='partial'): ReplayResult`.
TS types import from `assets/src/shared/contracts.ts`; generated FormSchema and
FormSettings originate from schema JSON via `npm run schema:types`.

AnswerMap is `Record<field_key, JSON value>`. Choice values (not labels/option IDs)
are stored; multi-choice string[], yes_no/consent boolean, number numeric, date
YYYY-MM-DD, phone normalized E.164, address object, uploads opaque upload UUIDs.
Display steps do not store answers. consent stores text/version separately.
Context `{hidden:{},url:{},meta:{},now:string ISO-UTC}` is frozen/validated by server
at start; only hidden/url operands use those explicit maps. No global clock in
pure replay; tests inject `now`. Variables reset to schema defaults on every replay.

ReplayResult is `{visited:string[], answers:AnswerMap, variables:AnswerMap,
currentStepId:string|null, endingId:string|null, progress:number,
errors:ValidationIssue[], discardedKeys:string[]}`. ValidationIssue extends schema
issues with optional fieldKey. Rules evaluate in stored order; first matching jump
or end wins, non-navigation actions run in order before navigation. Start at step
0, apply hiddenByDefault/show/hide/require/unrequire, normalize each visited answer,
apply rules and continue. Conditions use strict JSON equality, never PHP loose
comparison; numeric/date/regex semantics must match fixtures. Hidden values are
server-derived, not user overrides. Partial stops at first unanswered input;
explicit null records an optional skip. Complete requires visited required inputs.
Statement/media/summary are visited but do not block server replay or need values.
Unknown keys/unvisited answers are returned in discardedKeys with errors, never
stored. Runtime rewinds by replaying from zero and removing discarded answers.
Loop detection returns cff_logic_loop (no repeated navigation step, <=1000 visits),
not an infinite loop. End defaults to configured ending or first schema ending.
Progress estimates path completion, not raw schema length; authoritative path and
ending are recomputed server-side, never trusted from runtime.

Merge tags `{{key}}` / `{{answer:key}}` and `{{meta:key}}` substitute string values;
unknown tags resolve empty. Arrays use ', '; objects have stable readable values.
Interpolation returns **plain text**, not trusted HTML. UI/HTML email/renderers
escape after interpolation and allow only a sanitized limited markdown subset.
URL placeholders are URL-encoded and redirect hosts are allowlisted server-side.

Shared logic fixtures: tests/fixtures/logic/*.json, each
`{name,schema,answers,context,mode,expected:ReplayResult}`. PHP runner in
tests/php/Logic, TS runner tests/js/logic runs the exact same files, including
operator edges, hidden-answer tampering, jumps, conditional required, edit pruning,
loops and summary. Phase 0 has shared **schema** fixtures, not fake engine fixtures.

## REST and cache/session protocol (future server/runtime implementation)

Namespace `cff/v1`. All responses JSON. Public schema envelope
`{form:{id,title,slug,version,schema,appearance,phrases,session:{resumeEnabled,
resumePrompt,resumeDays}},features:{fieldTypes:string[],uploads:boolean,engagement:boolean}}`.
Never spread Form::toArray into this; explicitly whitelist public fields. GET
`/forms/{id}` published only, cacheable with version/hash ETag, no nonce/tokens.
Public inline `<cff-chat data-form-id="42" data-rest-url=".../cff/v1/">` can include
this same public JSON; **never** visitor data, expiring tokens or WP nonces.

Errors follow WordPress `{code,message,data:{status,errors?,retryAfter?,
draftRevision?,revision?}}`; 404 unknown/unpublished, 401 bad/expired credentials,
409 version/revision/idempotency conflict, 422 validation, 429 rate limit.
Every session/start-token/admin response sends Cache-Control: private,no-store
and nocache_headers. These endpoints are never included in page-cache fragments.

Exact handshake and routes (credential **never in a URL/path/query**):
- `POST /forms/{id}/start-token`, body `{version:number}`, response
  `{startToken:string,expiresAt:string,version:number}`. fresh 15-minute signed
  start protection; rate-limit form+trusted IP, validate Origin when supplied.
- `POST /sessions`, header X-CFF-Start-Token, Idempotency-Key (UUID), body
  `{formId,version,meta:ClientMeta,prefill?:AnswerMap}` → 201 SessionEnvelope.
- `POST /sessions/resume`, header X-CFF-Resume-Token, body `{formId}` → envelope
  with new request token after authenticating durable credential and stored expiry.
- `GET /sessions/{sessionId}` X-CFF-Request-Token → SessionEnvelope.
- `PATCH /sessions/{sessionId}` X-CFF-Request-Token and Idempotency-Key, body
  `{version,revision,answers:AnswerMap,stepTimings?:Record<string,number>}` → envelope.
- `DELETE /sessions/{sessionId}` same headers, body `{version,revision}` →
  `{closed:true}`; clear cookie and mark partial abandoned (or delete if opted in).
  Starting another session uses a **fresh** start-token; no destructive reuse.
- `POST /sessions/{sessionId}/submit` same headers, body
  `{version,revision,answers,honeypot:string,captchaToken?:string}` →
  `{submission:{uuid,status:'completed'},ending:{id,type,messages:string[],
  buttons:Button[]},redirectUrl?:string}`; identical response on same idempotent retry.
- `POST /sessions/{id}/uploads` request-token and idempotency headers, multipart `{fieldId,file}`
  → `{uploadId,mime,bytes,name}`; validates pinned field/MIME/extension/size and private storage.
- `GET /forms/{id}/engagement?version={pinnedVersion}` safe, no-store CAPTCHA/analytics config.
- `POST /sessions/{id}/events` request-token header, capped `view/answer/back/abandon` only;
  no raw payload/answers/URLs/secrets are stored.
- `GET /admin/uploads/{uploadUuid}` capability and nonce protected private streaming.

SessionEnvelope `{sessionId,formId,version,revision,status:'active'|'completed'|
'closed'|'expired',answers,visited,currentStepId,progress,requestToken,
requestExpiresAt,resumeToken?,resumeExpiresAt}`. UUID sessionId is a public locator,
not a credential. Request/start tokens use TokenSigner with wp_salt('auth') and
get_current_blog_id(); start context `{formId,version}`, request context
`{sessionId,formId,version}`; default TTL 900s, hard max 86400s (24h). Resume token
is `r1.<256-bit opaque randomness>.<expiry>.<HMAC>`, normally 30 days, hard max 90.
It contains no answers/form identifiers. DB stores SHA-256 of full resume token,
not plaintext, and checks status/expiry/constant-time signature/site binding.
Do not grant submit authority from a sessionId or stale 30-day request token.
The durable credential only exchanges for a fresh short-lived request token.
This explicitly resolves the plan's 24h request vs 30d resume inconsistency.

Cookie cff_s_{formId} holds only the durable credential, Path=/, SameSite=Lax,
Secure on HTTPS, readable by JS for the resume handshake (not HttpOnly). Mirror
to localStorage under `cff:session:{formId}:{version}` with answers; document PII
storage and clear on complete/start-over/expiry. Warn on HTTP in production.
Never log credentials, response tokens, signed URLs or full request bodies.
Server does not read resume cookies while rendering cached HTML.

Pinned sessions continue on their immutable published version after republish;
current publication still must be enabled. No automatic reinterpretation of old
answers under a new schema. Runtime offers continue-old or start-over-new.
If snapshots are unavailable, return 409 cff_version_conflict, keep partial intact.
This chooses reliable replay over silently migrating incompatible answers.

Each mutation uses optimistic session revision, row lock and transactions.
Idempotency uniqueness `(scope_hash,key_hash)` in cff_requests; scope includes
site, session/start identity and operation. Canonical request hash includes body;
same key+same body returns stored response, different body is 409
cff_idempotency_conflict. Pending requests return 409/retry, not duplicate writes.
Keep completed-submit dedupe at least as long as its session/submission; other
request entries >=24h. Submit commits values+submission+session closure+delivery
outbox atomically; HTTP/email executes after commit, not inside the transaction.
Closed session submit retries first check dedupe before rejecting the credential.

ClientMeta `{pageUrl,referrer,landingPage,landingReferrer,utm:{source,medium,
campaign,term,content},clickIds:{gclid,fbclid,msclkid,ttclid},locale,timezone,screen,
stepTimings}` with all keys optional; length/URL caps validated. Server derives
IP/userId/UA/country/start/completion/duration; cannot be overridden by client.
IP from REMOTE_ADDR unless proxy verified. Don't trust arbitrary CF/XFF headers.
Use database atomic rate buckets (not race-prone transient read-modify-write).
Protected uploads/exports fail closed without webserver/private storage protection;
.htaccess alone cannot secure nginx. Admin-only downloads, MIME/size allowlists.

## Admin REST and global configuration

Every admin route uses logged-in WP cookie auth **and** X-WP-Nonce wp_rest plus
the exact cff capability (no public admin token). Listing uses page/perPage (<=100).
- GET `/admin/forms` manage_forms → `{items:FormDTO[],total,page,perPage}`.
- POST `/admin/forms` manage_forms `{title,schema,settings}` → FormDTO (201).
- GET `/admin/forms/{id}` manage_forms → FormDTO.
- PUT `/admin/forms/{id}` manage_forms `{title,schema,settings,draftRevision}` → DTO.
- POST `/admin/forms/{id}/publish` manage_forms `{draftRevision}` → DTO.
- DELETE `/admin/forms/{id}` manage_forms → `{deleted:true}` (trash by default).
- GET `/admin/submissions` view_submissions query formId,status,from,to,search,
  isRead,isStarred,utmSource,utmCampaign,device,fieldKey,operator,value,page,perPage
  → `{items:SubmissionDTO[],total,page,perPage,forms}`, where `forms` maps each
  `formId:version` on the page to its frozen `{title,labels:{key:label}}`.
  Whitelist sort/filter operators.
- GET `/admin/submissions/{id}` view_submissions → SubmissionDTO + form snapshot.
- PATCH `/admin/submissions/{id}` edit_submissions `{isRead?,isStarred?,status?,
  note?}` → SubmissionDTO; notes escaped plain text.
- DELETE `/admin/submissions/{id}` delete_submissions → `{deleted:true}`;
  trash first; permanent=true requires explicit confirmation.
- POST `/admin/submissions/export` export_submissions `{formId,filters,ids?,
  columns,headerStyle:'labels'|'keys',delimiter:','|';',format:'csv'}` →
  `{exportId,status:'queued'|'ready',downloadUrl?:string,expiresAt?:string}`;
  same options for streaming <=5000; authenticated, expiring export downloads.
- POST `/admin/purge/preview` purge_submissions `{criteria}` → `{count,fileCount,
  confirmationToken}`; POST `/admin/purge` `{criteria,confirmationToken,
  confirmation:'DELETE'}` → `{jobId,status:'queued'}`. Preview token binds criteria.
- GET/PUT `/admin/settings` manage_settings → `{settings:GlobalSettings}`;
  PUT body `{settings}`; no GitHub token read/write/echo anywhere.
- POST `/admin/notifications/test` manage_forms `{formId,notificationId,to}` →
  `{queued:true}` (only implement with real send/queue).
- POST `/admin/submissions/{id}/retry` edit_submissions `{deliveryId}` → `{queued:true}`.

Admin JSON global `window.cffAdmin = {restUrl,nonce,pluginUrl,screen:'builder'|
'submissions'|'settings'|'analytics',formId?:number,locale,features:{fieldTypes,uploads,xlsx}}`.
restUrl includes trailing /cff/v1/; nonce is wp_rest **only on uncached admin pages**.
Preview calls real runtime `mountRuntime(host,{form:schemaEnvelope,preview:true})`
with draft public projection. Preview must never create sessions or send jobs.
Builder uses mountBuilder(root, config=window.cffAdmin); submissions uses
mountSubmissions(root, config=window.cffAdmin). Foundation stubs accept root only;
admin/visitor owners replace them with these final signatures.

## Submissions, hooks and jobs

`ChatFlow\Submissions\Submission` immutable DTO exposes id(), uuid(), formId(),
formVersion(), status(), answers(), meta(), endingId(), createdAt(), toArray().
`ChatFlow\Submissions\Repository`: `get(int $id): ?Submission`,
`find(array $filters,int $page=1,int $perPage=20): array{items:array,total:int}`,
`savePartial(array $data): Submission`, `complete(int $id,array $data): Submission`,
`update(int $id,array $changes): ?Submission`, `delete(int $id): bool`.
Internal data DTO uses storage snake_case; public/admin APIs use camelCase above.
Server lane owns transactions and hooks after durable writes; no external IO in
repositories. `SubmitSessionAction::execute(string $sessionId,array $body,
string $requestToken,string $idempotencyKey): array|WP_Error` orchestrates replay,
field validation, spam/meta and atomic completion. No endpoint is a not-implemented
feature; don't register optional endpoints until implemented.

Completed/partial/abandoned hooks take `(Submission $submission, Form $form)`;
session_started takes `(array $session, Form $form)` (no credentials in session).
deleted takes `(Submission $submission, Form $form)` before deletion;
submissions_purged takes `(array $ids,array $criteria)` after a batch.
form_published takes `(Form $form)`. All callbacks isolated: exceptions never
change a committed visitor outcome; jobs log redacted failure and retry.

Submission::toArray() is the plan's stable payload (schema/event version 1):
`{event:'submission.completed'|'submission.partial'|'submission.abandoned',
submission:{uuid,status,created_at,duration_ms,ending},form:{id,slug,title,version},
answers:{key:value},fields:[{key,label,type,value}],meta:{ip,browser,os,device,
page_url,referrer,landing_page,utm:{source,medium,campaign,term,content},click_ids}}`.
Only collected/privacy-permitted metadata included. No credentials, private
settings, webhook URLs, resume hashes, admin URLs or server filesystem paths.
Metadata extension filter may add safe keys; sanitization remains mandatory.
Jobs lane documents hook details in docs/hooks.md and payload examples in
docs/payload.md; no alternate incompatible webhook shape.

Filters: submission_payload `(array,Submission,Form): array`, validate_answer
`(issues,step,value,Form): array`, submission_meta `(meta,Form): array`, redirect_url
`(url,Submission,Form): string` (validate after filter), email_args
`(wpMailArgs,Submission,Form): array`, autoresponder_args same, public_schema
`(publicEnvelope,Form): array` (re-project after filter), field_types list above.
Slow work uses `cff_submission_completed_async(Submission,Form)` via scheduler.
Internal `cff_dispatch_delivery(int $deliveryId)` AS group **cff** stores only a
delivery row ID in args; cff_deliveries freezes event payload and destination ID,
loads secrets/settings from the matching form snapshot. Enqueue completed async,
admin mail, autoresponders and each webhook as separate deduped outbox rows;
unique dedupe_hash prevents duplicate delivery on submit retries. Three attempts
total, backoff 60s then 300s. Log redacted outcome to submission_notes; no tokens,
headers, raw HTTP responses or secret URLs in errors. Outbox recovery schedules
pending rows missed by a crash. Manual retry is capability/nonce protected.
Webhook sends canonical UTF-8 payload bytes, X-CFF-Signature `sha256=<hex HMAC>`;
X-CFF-Event and X-CFF-Delivery (delivery ID) support receiver dedupe. Use
wp_safe_remote_post/SSRF protections; disallow loopback/private hosts, unsafe
redirects, and forwarding sensitive headers across redirects. Secrets remain
private settings and are stripped from exports unless explicitly privileged.

## Storage/lifecycle and assets

Installer migrations 1/2 create 13 per-site InnoDB tables. LONGTEXT JSON supports
MySQL5.7/MariaDB10.3. All timestamps UTC. statuses partial/completed/abandoned/spam/
trash are VARCHAR (no ENUM upgrade friction). schema/settings snapshot, session
hash/status/revision/expiry, idempotency response, protected upload/export ownership,
notes, transactional delivery outbox, audit logs, events/daily statistics and
atomic rate buckets are already provisioned for Phases 2/3. variables, visited,
consent, step_timings, variant_id and rollup dimensions reserve scoring/A-B/analytics
without claiming those features. No raw resume/session credentials in analytics.
No foreign keys; repository deletion removes dependent rows/files in bounded batches.
Use wpdb->prepare for all user values and fixed/whitelisted identifiers.

Activation upgrades each site in batches of 100 on multisite, adds caps only to
mapped roles (`cff_capability_roles` filter), flushes rewrites. New network sites
initialize after core tables exist. Per-request init upgrades the current site's
version, never advances after SQL failure. Deactivate removes only cff jobs/cron,
not data/caps. Uninstall keeps data unless **each site** sets
cff_settings.delete_data_on_uninstall true; removes only caps added by this plugin.
Deletion of a WP site explicitly removes that site's plugin tables. Protected
files are not created in Phase 0; server lane must add owned private-file deletion
to purge/eraser/uninstall via a cleanup hook rather than editing Installer.php.

Admin entrypoints assets/src/{builder,submissions}/index.tsx and blocks/index.ts
compile via @wordpress/scripts to build/admin/{builder,submissions,blocks}.js
with corresponding .asset.php dependency/version manifests; enqueue only on their
admin/editor screens, WP's React, no duplicate React bundle.
Exports live under window.CFFAdmin.{builder,submissions,blocks}. Admin JSX uses
the classic WordPress createElement/Fragment transform (import from wp-element),
not react-jsx-runtime, which is unavailable on the minimum WordPress 6.4.
Runtime assets/src/runtime/index.tsx and tracking/index.ts compile via Vite to
build/runtime/{runtime,tracking}.js (self-contained ES modules, Preact, no jQuery).
Runtime CSS must be imported as text and placed inside the ShadowRoot, not global
theme CSS. PHP frontend enqueues type=module only where embedded; tracking only
when globally opted in. JS runtime exports mountRuntime and window.ChatFlow
open/prefill/registerField; dispatch cff:start, cff:step, cff:complete with no PII.
Block name chatflow/form, shortcode chatflow, fullpage base chat; server owns
embedding/template/rewrite, admin owns block PHP registration/editor scripts.

See README.md and docs/release.md for exact verified commands and release contents.
No licence system, telemetry, native CRM connectors, payments or AI chat.
