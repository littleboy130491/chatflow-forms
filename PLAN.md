# Chat Questionnaire — WordPress Plugin Plan

Working name: **ChatFlow Forms** (slug `chatflow-forms`, prefix `cff_`, REST namespace `cff/v1`).

A WordPress plugin that renders forms as a conversation: one question at a time, chat bubbles, typing indicators and quick-reply chips, in the style of the hims.com intake flow. Admins build forms in a drag-and-drop builder with field types, validation, required flags and conditional logic. Every submission is stored with its answers and tracking data (IP, page URL, referrer, browser, device, UTM parameters and so on). After submitting, the visitor sees a thank-you message or is redirected, as with a normal form.

### Decisions so far

| Topic | Decision |
|---|---|
| Repository | A **new, private repository** just for the plugin. This plan moves there with the scaffold. |
| Distribution | **Private plugin.** No wordpress.org listing, no free/pro split, no licence keys. Updates ship as GitHub releases (see §3.1). |
| Integrations | A **PHP hook API** that fires after each submission (and on partial saves), plus a generic **webhook** setting that sends the same data without code. Native CRM connectors are optional later and would be built on the same hook. See §8. |
| Partial answers / resume | **In the MVP.** A cookie remembers the visitor's session so they can pick up where they left off, with a clear **Start over** option. See §5.5. |
| First template and acceptance test | The **Imajiner website survey** (imajiner.id/survey), rebuilt as a chat. See §17. |
| Name | **ChatFlow Forms**, repo `littleboy130491/chatflow-forms` (private). |
| After submit | **Set by the admin per form**: thank-you message (with optional buttons such as WhatsApp), redirect, or a different ending per answer. |
| Hosting | **Generic.** Must work with or without Cloudflare and with any common caching or optimisation plugin. See §10.1. |
| Export | **CSV export** of submissions in the MVP. See §7.3. |
| Purge | A **purge tool** that deletes submissions in a date range. The default is "older than 360 days". See §7.7. |
| Autoresponder | **Admin-editable autoresponder emails** sent to the respondent after submission. See §8.1. |

---

## 1. Goals and non-goals

### Goals (v1)
1. A conversational front end: one question per step, animated bot messages, quick replies, a progress bar, and Back/Edit for earlier answers. Mobile first.
2. A visual form builder: add, reorder and group fields; set field type, label, bot copy, placeholder, required, validation, options and conditional logic; live preview.
3. Reliable submissions: server-side validation against the form schema, spam protection, then a completion action (message, redirect, or a redirect chosen by the answers).
4. A submissions admin: list, filter, search, detail view, CSV export, bulk delete, read/unread and starred states.
5. Tracking metadata on each submission: IP, user agent with parsed browser, OS and device type, page URL, referrer, first-touch landing page, UTM and click IDs, logged-in user, locale, timezone, screen size, time to complete.
6. Notifications and integrations: admin email, confirmation email to the respondent, a documented **integration hook** that fires after submission, and webhooks.
7. Resume and start over: answers are saved as the visitor goes; returning visitors are asked whether to continue or start over. Unfinished answers appear in the admin as **partial** submissions (abandoned-lead capture).
8. Privacy: IP anonymisation, a manual purge tool and optional automatic retention (default 360 days), WordPress personal-data exporter and eraser, and a consent field.

### Non-goals (v1, possible later)
- AI/LLM free-text conversation (the "chat" is scripted).
- Payments.
- Multi-page branching shown as a visual node graph. v1 uses a list plus rules; the graph view comes in Phase 3.
- Quizzes with scoring and calculated outcomes. The schema reserves room for them (Phase 3).
- A hosted SaaS dashboard.

---

## 2. UX reference: what makes hims.com-style flows feel good

Patterns to copy:

| Pattern | Implementation |
|---|---|
| **One thing at a time** | Only the current question is interactive. Earlier Q&A stays visible above it as chat history. |
| **Bot "speaks" first** | Each step can have one or more *bot messages* before the input appears (for example "Nice to meet you, {{first_name}} 👋" then "How old are you?"). |
| **Typing indicator** | Three animated dots for 400–1200 ms, scaled to message length. Skipped under `prefers-reduced-motion`. |
| **Quick-reply chips** | Single and multiple choice render as tappable pill buttons. Single choice advances on tap, with no Next button. |
| **Answer echoes as user bubble** | The chosen or typed answer appears as a right-aligned user bubble. |
| **Edit previous answer** | Tapping a past user bubble rewinds to that step. Answers on paths that no longer apply are discarded. |
| **Progress** | A thin top bar estimated from the remaining steps on the current logic path, not the total count. |
| **Personalisation / piping** | Merge tags `{{field_key}}` in any bot copy, plus `{{answer:field_key}}` and `{{meta:utm_source}}`. |
| **Micro-delight** | Emoji reactions to some answers (configurable per option), slide-up bubble animation, a small confetti burst on completion (optional). |
| **Input keyboard hints** | `inputmode`, `autocomplete` and `type` set per field so the right mobile keyboard opens. |
| **Info-only steps** | "Statement" steps (text, image, video) that need only a "Got it" tap. |
| **Summary before submit** | An optional review card listing all answers, each with an edit button. |
| **Resume / start over** | A cookie remembers the session; returning visitors can continue or start over (§5.5). |

Display modes:
1. **Inline**: embedded in page content (shortcode or block).
2. **Full page**: a takeover layout on a dedicated URL with no theme chrome, like a hims intake.
3. **Floating launcher**: a chat bubble in the bottom corner that opens a panel. Optional auto-open after N seconds or at a scroll percentage.
4. **Popup / modal**: opened by a button with `data-cff-open="form-id"`.

---

## 3. Tech stack and architecture

| Layer | Choice | Why |
|---|---|---|
| PHP | 8.1+, WordPress 6.4+, PSR-4 autoload via Composer (`ChatFlow\` → `src/`) | Modern and testable. Composer dependencies are scoped with PHP-Scoper/Strauss to avoid plugin conflicts. |
| Admin UI (builder, submissions detail, settings) | React + `@wordpress/scripts`, `@wordpress/components`, `@wordpress/data`, `@dnd-kit` for drag and drop | Native WP look, ships with WP's React, no extra framework. |
| Front-end runtime | **Preact + TypeScript**, about 30 KB gzipped, CSS custom properties for theming, rendered inside a **Shadow DOM** host | Small, fast, and isolated from theme CSS. |
| Logic engine | A pure TypeScript module **mirrored in PHP** (same rules, same tests via shared JSON fixtures) | The client decides the flow; the server re-validates so it can't be bypassed. |
| Storage | A custom post type for forms (schema in post meta) plus **custom DB tables** for submissions | Forms get revisions, trash and capabilities for free. Submissions need volume, indexes and fast filters. |
| UA parsing | `matomo/device-detector` (scoped) behind an interface, with a lightweight regex fallback | Accurate browser, OS and device data. |
| Email | `wp_mail()` with HTML templates | Works with any SMTP plugin. |
| Background work | Action Scheduler (bundled, as WooCommerce does) for webhooks and email retries | Non-blocking submit with retries. |

### 3.1 Private distribution and updates
- The plugin lives in a private GitHub repository. A GitHub Actions workflow builds a release zip (Composer `--no-dev`, compiled assets, no `node_modules` or tests) when a `v*` tag is pushed.
- Sites update from the normal WordPress Plugins screen via **plugin-update-checker** (YahnisElsts, MIT), pointed at the private repo's releases. The site reads a read-only GitHub token from a `wp-config.php` constant (`CFF_GITHUB_TOKEN`); it is never stored in the database or shown in the admin.
- Fallback: upload the release zip manually.
- No licence-key system, telemetry or upsell screens.

### High-level flow

```
Visitor page ──(shortcode/block)──► <cff-chat> host + runtime.js
   │ GET  /cff/v1/forms/{id}            → public schema (cached, no admin-only data)
   │ POST /cff/v1/sessions              → start session (token, first-touch meta)
   │ PATCH /cff/v1/sessions/{token}     → partial answers (optional, debounced)
   │ POST /cff/v1/sessions/{token}/submit → validate → store → completion action
   ▼
Submission stored ─► do_action('cff_submission_created') ─► emails / webhooks (Action Scheduler)
```

---

## 4. Data model

### 4.1 Forms: CPT `cff_form`
- `post_title`: form name. `post_status`: draft or publish.
- Meta `_cff_schema`: JSON (see 4.2), the **draft** being edited in the builder.
- Meta `_cff_published_schema` and `_cff_version` (int): the **live** version. Publishing copies draft to live and increments the version. Each submission stores the version it was made against, so old submissions still render correctly after the form changes.
- Meta `_cff_settings`: appearance, completion, notifications, integrations and spam settings.
- Snapshots of each published version are kept in `{prefix}cff_form_versions` (`form_id`, `version`, `schema`, `created_at`, `created_by`).

### 4.2 Form schema (JSON)

```json
{
  "schemaVersion": 1,
  "bot": { "name": "Ava", "avatar": 123, "typingSpeed": "normal" },
  "steps": [
    {
      "id": "stp_a1",
      "key": "first_name",
      "type": "short_text",
      "messages": ["Hey there! 👋", "What should we call you?"],
      "label": "First name",
      "placeholder": "Type your name…",
      "required": true,
      "validation": { "minLength": 2, "maxLength": 50 },
      "logic": []
    },
    {
      "id": "stp_b2",
      "key": "goal",
      "type": "single_choice",
      "messages": ["Nice to meet you, {{first_name}}!", "What brings you here today?"],
      "options": [
        { "id": "opt_1", "label": "Hair loss", "value": "hair", "emoji": "💇" },
        { "id": "opt_2", "label": "Skin care", "value": "skin", "reaction": "Great choice ✨" }
      ],
      "required": true,
      "logic": [
        { "if": { "all": [{ "field": "goal", "op": "eq", "value": "skin" }] },
          "then": { "action": "jump", "to": "stp_skin1" } }
      ]
    }
  ],
  "groups": [ { "id": "grp_1", "title": "About you", "stepIds": ["stp_a1", "stp_b2"] } ],
  "endings": [
    { "id": "end_default", "type": "message", "messages": ["Thanks {{first_name}}! We'll be in touch."] },
    { "id": "end_skin", "type": "redirect", "url": "/skin-plan/?name={{first_name}}", "appendQuery": true }
  ],
  "variables": [ { "key": "score", "type": "number", "default": 0 } ]
}
```

### 4.3 Field types

**Input**
| Type | Notes |
|---|---|
| `short_text` | min/max length, regex pattern |
| `long_text` | textarea, auto-grow, character counter |
| `email` | format check; optional MX check on the server |
| `phone` | country selector and E.164 normalisation (`libphonenumber-js` on the client, light check in PHP) |
| `number` | min, max, step, unit suffix |
| `date` | min/max, "must be 18+" preset, native picker on mobile |
| `single_choice` | chips (auto-advance), cards with images, or a dropdown for long lists; optional "Other" free text |
| `multi_choice` | chips with a "Continue" button; min/max selections; an "None of the above" option that clears the rest |
| `yes_no` | two big buttons |
| `rating` | stars or emoji, 1–5 or 1–10 |
| `scale` / `nps` | 0–10 slider or buttons with end labels |
| `slider` | range with live value bubble |
| `file_upload` | MIME and size limits, stored in a protected uploads subfolder |
| `address` | street, city, postcode, country sub-fields; optional Google Places autocomplete |
| `consent` | checkbox and text with privacy-policy link, always required when present |
| `hidden` | value from a URL param, cookie, merge tag or default (for example `utm_campaign`) |

**Display (no input)**
| Type | Notes |
|---|---|
| `statement` | bot text or rich text with a "Got it" / "Continue" button |
| `media` | image, GIF or video embed |
| `summary` | review card of answers before submit |

Every step shares: `id` (immutable), `key` (machine name used in exports, merge tags and webhooks), `messages[]` (bot copy), `label` (admin and export column name), `required`, `helpText`, `logic[]`, and `hiddenByDefault`.

### 4.4 Conditional logic

Rule = **condition** + **action**, evaluated in order. The first matching navigation action wins.

- **Conditions**: `all` / `any` groups (nestable one level deep in the UI, unlimited in the schema). Operands: answers, variables, hidden fields, URL params.
- **Operators**: `eq`, `neq`, `contains`, `not_contains`, `in`, `not_in`, `gt`, `gte`, `lt`, `lte`, `between`, `is_empty`, `is_not_empty`, `starts_with`, `matches` (regex), `date_before`, `date_after`, `age_gte`.
- **Actions**:
  - `show` / `hide`: step-level visibility; a hidden step is skipped.
  - `jump`: go to a step id.
  - `end`: go to an ending id (enables "disqualify" flows and different redirects).
  - `set_variable`: add, subtract or set (groundwork for scoring).
  - `require` / `unrequire`: conditional required.
- **Evaluation**: after each answer, the engine computes the next step. Only steps actually visited count; answers to skipped steps are dropped from the payload, and the server rejects them too.
- **Validation in the builder**: warns on jump loops, unreachable steps, references to deleted fields, and conditions that reference later steps.

### 4.5 Submissions tables

`{prefix}cff_submissions`
| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT PK | |
| `uuid` | CHAR(36) UNIQUE | public reference, used in redirects and webhooks |
| `form_id` | BIGINT, indexed | |
| `form_version` | INT | |
| `status` | ENUM `partial`,`completed`,`spam`,`trash` | indexed |
| `answers` | LONGTEXT (JSON) | `{ key: value }` snapshot |
| `ending_id` | VARCHAR(64) | which ending was reached |
| `is_read`, `is_starred` | TINYINT | |
| `user_id` | BIGINT NULL | logged-in WP user |
| `ip` | VARBINARY(16) | INET6, optionally anonymised |
| `user_agent` | TEXT | |
| `browser`, `browser_version`, `os`, `os_version`, `device_type`, `device_brand` | VARCHAR | parsed at save time |
| `page_url`, `referrer`, `landing_page`, `landing_referrer` | TEXT | page/referrer of this session plus first touch |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` | VARCHAR(255) | indexed source/campaign |
| `click_ids` | JSON | `gclid`, `fbclid`, `msclkid`, `ttclid` |
| `locale`, `timezone`, `screen` | VARCHAR | from the browser |
| `country` | CHAR(2) NULL | from `CF-IPCountry` or similar header if present; optional GeoLite2 |
| `started_at`, `completed_at`, `duration_ms` | DATETIME / INT | |
| `step_timings` | JSON | ms per step, for drop-off analytics |
| `created_at`, `updated_at` | DATETIME | |

`{prefix}cff_submission_values`: one row per field, for filtering and search on answers.
| `submission_id` | `field_key` | `value_text` (indexed prefix) | `value_num` |

`{prefix}cff_submission_notes`: admin notes and activity log (`submission_id`, `user_id`, `type` such as note, email_sent or webhook_ok/fail, `body`, `created_at`).

`{prefix}cff_events` (Phase 2 analytics): `form_id`, `session_token`, `step_id`, `event` (view, answer, back, abandon), `ts`. Aggregated nightly into `{prefix}cff_stats_daily`.

DB schema is managed by a versioned `Installer` with incremental migrations keyed on `cff_db_version`.

---

## 5. Front-end runtime

### 5.1 Embedding
- **Shortcode**: `[chatflow id="42" mode="inline|fullpage|launcher|popup" theme="light|dark|auto"]`
- **Gutenberg block** `chatflow/form`: form picker, mode, height, and overrides; it renders a live preview in the editor.
- **Elementor widget**: optional, Phase 2.
- **Full-page route**: `/{settings.base}/{form-slug}/` with a blank template; the base is configurable, default `chat`.
- **PHP**: `cff_render_form( 42, [ 'mode' => 'launcher' ] )`.
- **JS API**: `window.ChatFlow.open('42')`, `.prefill({ email })`, events `cff:start`, `cff:step`, `cff:complete` for GTM, GA4 and Meta Pixel.

Assets are enqueued **only** on pages where a form renders. The schema is inlined as JSON in the markup to save a round trip, and the REST endpoint is the fallback.

### 5.2 Runtime modules (`assets/src/runtime/`)
- `engine/`: logic evaluation, next-step resolution, merge-tag interpolation, validation. Pure functions, unit tested.
- `store/`: state machine (`idle → botTyping → awaitingInput → submitting → done | error`), answer history stack, persistence to `localStorage` keyed by form id and version.
- `ui/`: `ChatWindow`, `BotBubble`, `UserBubble`, `TypingDots`, `ProgressBar`, one input component per field type, `SummaryCard`, `Ending`.
- `tracking/`: captures first-touch data (landing page, referrer, UTMs) on **any** page via a 1 KB snippet storing a `cff_ft` cookie or localStorage entry, so attribution survives navigation before the form is opened.
- `api/`: fetch wrapper with nonce/token, retries and offline queueing.

### 5.3 Behaviour details
- Auto-scroll to the newest message. An `aria-live="polite"` region announces bot messages.
- Enter submits text; Shift+Enter adds a newline in long text. Arrow keys and number keys select chips.
- Validation errors appear as a gentle bot message ("Hmm, that email doesn't look right 🤔"), not red form errors.
- Back: a header button plus tap-to-edit on bubbles.
- Theming: CSS variables (`--cff-primary`, `--cff-bubble-bot-bg`, `--cff-radius`, `--cff-font`, and so on) set per form in the builder, with presets (Clean, Playful, Dark, Clinical).
- Bot avatar, name and "online" dot; optional sound on new messages (off by default).

### 5.4 Completion actions (per ending)
1. **Message**: bot messages with merge tags, optional CTA buttons (link, restart, or close for the launcher).
2. **Redirect**: URL with merge tags. Options: append answers as query params (whitelisted keys only), append `submission=uuid`, delay with a "Taking you there…" message.
3. **Conditional**: logic `end` actions choose the ending, for example a different product page per answer.
4. A JS hook (`cff:complete`) always fires first, so pixels and analytics run before a redirect.

### 5.5 Resume and start over

**How it's stored**
- When a visitor starts a form, the server creates a session and sets a cookie **`cff_s_{formId}`** holding a signed session token (HMAC with `wp_salt()`). The cookie is first-party, `SameSite=Lax`, `Secure`, and lasts 30 days by default (configurable per form).
- Each answer is saved straight away to the server as a **partial** submission (`PATCH /sessions/{token}`, debounced) and mirrored to `localStorage` so it restores instantly, even offline.
- The answers themselves are **not** stored in the cookie. Cookies are capped at about 4 KB (a long text answer would overflow it), and they're sent with every request, so personal details (phone, email) would travel with every page view and could end up in server or CDN logs. The cookie only carries the token; the answers stay on the server and in `localStorage`.
- Because the session is created through REST, this works with full-page caching.

**What the visitor sees on return**
1. The runtime finds the cookie, fetches the session and replays the earlier conversation instantly, with no typing delays.
2. The bot asks: *"Welcome back, {{nama}}! 👋 Continue where you left off?"* with two chips: **Continue** and **Start over**. This prompt can be turned off per form, in which case the chat silently resumes.
3. If the form was republished since and the saved path no longer fits, answers that still match are kept, and the chat resumes at the first step that needs an answer.

**Start over**
- Always available in the chat header menu (↺), on the resume prompt, and as an optional button on the ending screen.
- It asks for confirmation ("Start from the beginning? Your answers will be cleared."), then clears the cookie and `localStorage`, closes the old session, and starts a new session from step one.
- The old partial submission is **kept** in the admin (marked *abandoned*) so the lead isn't lost, unless the per-form setting "delete partial on start over" is on.

**When it ends**
- On a successful submit, the partial becomes *completed* and the cookie is cleared. If the visitor opens the form again, they see a fresh conversation, or an "Already submitted" ending if the form limits one submission per person.
- Partials untouched for N days (default 30) become *abandoned*, and are then covered by the purge/retention rules in §7.7.

**Admin**
- The submissions list has status tabs **Completed · Partial · Abandoned · Spam**. Partial rows show the last step reached and a progress percentage.
- An option sends the admin email or fires the integration hook when a partial becomes abandoned, but only if it contains contact details (for example a phone number).

---

## 6. REST API (`cff/v1`)

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/forms/{id}` | public (published only) | public schema and appearance; strips notification settings, webhook URLs and internal notes |
| POST | `/sessions` | public + HMAC form token | creates a session token (signed, 24 h), records start time and first-touch meta |
| GET | `/sessions/{token}` | session token (from cookie) | returns the saved answers and current step for resume |
| PATCH | `/sessions/{token}` | session token | saves partial answers (debounced, on by default) |
| DELETE | `/sessions/{token}` | session token | **Start over**: closes the session, marks the partial abandoned, clears the cookie |
| POST | `/sessions/{token}/submit` | session token | full validation, spam checks, store, returns `{ ending, redirectUrl?, messages? }` |
| POST | `/uploads` | session token | file upload for `file_upload` fields; returns a temporary file id |
| GET/POST/PUT/DELETE | `/admin/forms…` | `cff_manage_forms` | builder CRUD, publish, duplicate, import/export JSON |
| GET | `/admin/submissions` | `cff_view_submissions` | paginated list with filters |
| GET/PATCH/DELETE | `/admin/submissions/{id}` | view/edit caps | detail, mark read/starred, notes |
| POST | `/admin/submissions/export` | `cff_export_submissions` | queues a CSV/XLSX export job, returns a download link |

**Server-side submit pipeline** (`SubmitSessionAction`):
1. Verify the session token signature and expiry; the form must be published and the version must match.
2. Spam checks: honeypot field, a minimum time since session start (default 3 s), per-IP rate limit (transients, for example 10 submits per 10 minutes), optional Cloudflare Turnstile, hCaptcha or reCAPTCHA v3, optional Akismet.
3. **Replay the logic engine (PHP) on the answers** to get the visited path. Reject answers to unvisited steps and require every visited required step.
4. Sanitize and validate each value by field type (`FieldType::sanitize()` / `::validate()`).
5. Collect meta: IP (from a trusted-proxy-aware resolver; settings list which headers to trust), UA parse, client-sent meta (validated and length-capped).
6. Insert the submission and value rows in a transaction.
7. `do_action( 'cff_submission_created', $submission, $form )`; queue emails and webhooks via Action Scheduler.
8. Return the ending payload. The redirect URL is built server-side and passes `wp_validate_redirect` unless the admin allowlists external hosts.

---

## 7. Admin

Menu: **ChatFlow** → Forms · Submissions · Analytics (Phase 2) · Settings · Tools (import/export, system status).

### 7.1 Forms list
A `WP_List_Table` with name, status (draft/live), submissions count, completion rate, last submission, shortcode copy button, and actions: Edit, Duplicate, Preview, Export JSON, Trash.
"New form" opens a template picker: Blank, Lead capture, Health intake (hims-style), Product recommender, Feedback/NPS, Appointment request.

### 7.2 Form builder (React SPA on its own admin page)

```
┌──────────────┬───────────────────────────────┬──────────────────────┐
│ Field palette│  Flow (drag & drop list)      │  Inspector           │
│  ▸ Text      │  ① 👋 Statement: Welcome      │  [Content][Logic]    │
│  ▸ Choice    │  ② First name   (required)    │  [Validation][Style] │
│  ▸ Contact   │  ③ Goal ◆ 2 rules             │                      │
│  ▸ Display   │  ── Group: Skin ──            │  Bot messages  [+]   │
│  ▸ Advanced  │  ④ Skin type                  │  Label / key         │
│              │  ⑤ Email                      │  Options (sortable)  │
│              │  ⏹ Endings: Default, Skin     │  Required ☑          │
├──────────────┴───────────────────────────────┴──────────────────────┤
│ Top bar: Form name · Draft/Live · Undo/Redo · Preview ▸ · Publish   │
└─────────────────────────────────────────────────────────────────────┘
```

Tabs across the top of the builder: **Build · Logic · Design · Settings · Share**.

- **Build**: drag from the palette or press `/` to search field types; drag to reorder (`@dnd-kit`, keyboard accessible); multi-select to group, duplicate or delete; inline edit of the first bot message; badges for required, logic and hidden.
- **Inspector → Content**: multiple bot messages (each with a merge-tag picker), label, auto-generated key (editable, uniqueness enforced, warning when renaming a key that already has submissions), placeholder, help text, options with bulk paste, images, emoji, values, per-option reaction text.
- **Inspector → Logic**: rule builder UI: "If [field ▾] [operator ▾] [value ▾] (+ AND/OR) → [Jump to ▾ / End with ▾ / Show / Hide / Set variable]". Value pickers adapt to the field type (option dropdown for choices, date picker for dates).
- **Logic tab**: a table of all rules across the form, plus diagnostics (unreachable steps, loops, broken references). Phase 3 adds a **flow map** (React Flow) showing branches visually.
- **Design**: preset themes, colours, font (system or Google font), corner radius, bot name and avatar, typing speed, chat width, launcher icon, position and auto-open trigger, custom CSS (scoped to the Shadow DOM).
- **Settings**: endings and completion actions; notifications (admin email to multiple recipients with conditional routing by answer, plus respondent confirmation); spam; partial-submission capture on/off; limit submissions (total, per user, closing date); "require login"; save-and-resume.
- **Share**: shortcode, block hint, full-page URL with QR code, launcher site-wide toggle with page include/exclude rules, embed snippet, prefill URL builder.
- **Preview**: a right-side drawer running the **real runtime** against the draft schema, with a device toggle (mobile/desktop) and a "jump to step" debug selector showing current variables and the logic path.
- **Quality of life**: autosave the draft every 10 s, undo/redo (history stack in `@wordpress/data`), conflict warning if two admins edit at once (post lock), and a "Publish" diff summary ("3 steps changed, 1 added").

### 7.3 Submissions
- **List** (`WP_List_Table`, or a React table if filters get rich):
  - Columns: ★, date, form, first 3 configurable answer columns (for example name and email), source (UTM or referrer domain), device icon, country, status.
  - Filters: form, date range, status (completed/partial/spam), read/unread, starred, UTM source/campaign, device type, plus an **answer filter** (field + operator + value, using `cff_submission_values`).
  - Search across answers, email and IP.
  - Bulk actions: mark read/unread, star, mark spam, trash, delete permanently, export selected, resend notification.
  - Unread count badge on the menu item.
- **Detail view**:
  - Left: the conversation replayed as chat bubbles (a nice touch), with a toggle to a plain Q&A table.
  - Right: a meta panel (submitted at, duration, ending reached, IP with a copy button, browser, OS, device, page URL, referrer, landing page, UTMs, click IDs, user link, locale, timezone, screen).
  - Bottom: notes and activity log (emails sent, webhook results with a retry button).
  - Prev/next navigation, print, delete.
- **CSV export** (MVP):
  - **Where**: an "Export CSV" button on the submissions list exports exactly what the current filters show; the bulk action "Export selected" exports ticked rows; **Tools → Export** gives full options.
  - **Options**: form (one form per file, so the columns match), date range (presets: last 7/30/90 days, this month, custom), status (completed / partial / abandoned / spam), columns (answers in form order; tracking meta grouped and optional; submission id, uuid, date, status, ending), header style (field labels or keys), delimiter (`,` or `;`; `;` suits Excel in Indonesian locales).
  - **Format**: UTF-8 with BOM so Excel shows emoji and accents; multi-choice values joined with `, `; dates in the site timezone (ISO 8601); phone numbers kept as text; formula-injection protection (§9).
  - **Size**: up to 5,000 rows stream straight to download. Larger exports run in the background (Action Scheduler, chunks of 1,000) and the admin gets a notice and email with a private download link that expires after 24 hours.
  - Answers are keyed on field `key`, so exports stay consistent across form versions; a column for a removed field is kept if old rows have data.
  - XLSX export comes in Phase 2.

### 7.4 Analytics (Phase 2)
Per form: views → starts → completions funnel, completion rate, average time, **drop-off per step** (bar chart from `step_timings` and `cff_events`), answer distribution per choice field, sources by UTM or referrer, device split. Date-range picker. Built with `@wordpress/components` and a small chart library (Chart.js).

### 7.5 Settings (global)
- General: full-page base slug, default theme, load the first-touch tracking script site-wide (on/off).
- Privacy: store IP (full / anonymised last octet / none), store user agent, automatic retention (§7.7), Do-Not-Track respect.
- Spam: captcha provider and keys, honeypot, minimum time, rate limits, Akismet.
- Email: from name and address, HTML template logo and colour.
- Visitor IP source (§10.1): *Automatic* (default), *Direct connection only*, *Cloudflare*, *Custom proxy* (header plus trusted IP ranges).
- Uninstall: "delete all data on uninstall" toggle (off by default).

### 7.6 Capabilities and roles
`cff_manage_forms`, `cff_view_submissions`, `cff_edit_submissions`, `cff_delete_submissions`, `cff_export_submissions`, `cff_purge_submissions`, `cff_manage_settings`. All are granted to Administrator on activation; a filter allows mapping them to other roles (for example an Editor sees submissions only).

### 7.7 Purge data and retention

**Manual purge (ChatFlow → Tools → Purge data)**
- **Date range**: "Older than [360] days" (the default), or a custom from–to range.
- **Filters**: form (all or one), status (completed, partial, abandoned, spam, trash). All are ticked by default.
- **Preview first**: "This will permanently delete **1,248 submissions** from 3 forms (12 Jan 2024 – 18 Oct 2025), including 37 uploaded files." Buttons: *Export these to CSV first* and *Delete permanently*.
- **Confirmation**: type `DELETE` to confirm. The purge runs in the background in batches of 500 with a progress bar, so it won't time out on shared hosting.
- **What's deleted**: submission rows, answer values, notes and activity, uploaded files, and analytics events for those sessions. `cff_submission_deleted` fires per submission (batched as `cff_submissions_purged` with the id list) so integrations can sync deletions.
- **Audit**: each purge is logged (who, when, criteria, count) under Tools → Purge log; the log holds no personal data.

**Automatic retention (Settings → Privacy)**
- "Automatically delete submissions older than [360] days." **Off by default**, so nothing disappears without the admin choosing it; when turned on, the default is 360 days.
- Optional separate shorter period for partial/abandoned submissions.
- Runs daily via WP-Cron/Action Scheduler with the same batched deleter as the manual purge.
- Per-form override ("keep forever" or a different number of days).

---

## 8. Notifications and integrations

### 8.1 Email
- **Admin email**: to, cc and bcc, subject with merge tags, body template (`{{all_answers}}`, `{{meta_table}}`, `{{admin_link}}`), conditional recipients ("if layanan = Maintenance, send to support@…"), Reply-To set to the respondent's email field.
- **Autoresponder** (to the respondent, MVP): see below.

**Autoresponder emails**

Set per form in **Form → Settings → Autoresponder**:
- **Enable** toggle. Available when the form has an email field.
- **Send to**: choose which email field to use. If that field was skipped, nothing is sent and the activity log says why.
- **From name / From email / Reply-To**: default to the global email settings; Reply-To can be a fixed address or the admin notification address.
- **Subject**: with merge tags, e.g. `Terima kasih, {{nama}}! Permintaan demo Anda sudah kami terima`.
- **Body**: the WordPress rich-text editor (`wp_editor`: bold, lists, links, images) with a **merge-tag picker**: any answer `{{field_key}}`, `{{all_answers}}` (a formatted table), `{{form_title}}`, `{{submission_id}}`, `{{site_name}}`, `{{date}}`, plus a "button" shortcode `[cff_button url="https://wa.me/…"]Chat via WhatsApp[/cff_button]`.
- **Multiple autoresponders with conditions**: each can have a rule like the form logic, e.g. "send *Template eCommerce* if `jenis_website` = Online Shop". If several match, all are sent unless "send only the first match" is ticked.
- **Timing**: send immediately (queued, so submit stays fast) or after a delay (e.g. 30 minutes) via Action Scheduler.
- **Attachments** (optional): pick files from the Media Library, e.g. a company profile PDF.
- **Preview and test**: preview with sample answers or a real past submission; "Send test email" to any address.
- **Layout**: all emails (admin and autoresponder) use a global HTML layout set in **Settings → Email**: logo, brand colour, footer text, plain-text fallback generated automatically. Developers can override the layout by copying `templates/emails/layout.php` into `theme/chatflow/emails/`.
- **Saved templates**: autoresponder content can be saved as a reusable template and loaded into other forms.
- **Logging**: each send (or failure from `wp_mail`) is recorded in the submission's activity log, with a "Resend" button.
- Sent through `wp_mail()`, so it uses whatever SMTP plugin the site has (WP Mail SMTP, FluentSMTP, Post SMTP and so on). The settings page warns if no SMTP plugin is detected, since default PHP mail often lands in spam.
- Hook: `cff_autoresponder_args` filter to adjust recipients, subject, body or attachments in code.


### 8.2 Integration hook (main extension point)

After a submission is stored, the plugin fires one documented action with everything an integration needs:

```php
/**
 * Fires after a submission is completed and stored.
 *
 * @param \ChatFlow\Submissions\Submission $submission  Answers, meta, status, uuid, form version.
 * @param \ChatFlow\Forms\Form             $form        Form id, title, schema, settings.
 */
do_action( 'cff_submission_completed', $submission, $form );
```

Example: send each lead to a CRM.

```php
add_action( 'cff_submission_completed', function ( $submission, $form ) {
    if ( $form->slug() !== 'survey-website' ) {
        return;
    }

    wp_remote_post( 'https://crm.example.com/api/leads', [
        'headers' => [ 'Authorization' => 'Bearer ' . CRM_TOKEN ],
        'body'    => wp_json_encode( $submission->toArray() ),
        'timeout' => 10,
    ] );
}, 10, 2 );
```

**`Submission::toArray()`** returns a stable payload. The same shape is used by webhooks, so code and no-code integrations see identical data:

```json
{
  "event": "submission.completed",
  "submission": { "uuid": "…", "status": "completed", "created_at": "2026-10-13T09:12:00+07:00", "duration_ms": 94000, "ending": "end_default" },
  "form": { "id": 42, "slug": "survey-website", "title": "Survey Website", "version": 3 },
  "answers": { "nama": "Budi", "whatsapp": "+628123456789", "jenis_website": "Online Shop / eCommerce" },
  "fields": [ { "key": "nama", "label": "Nama Anda", "type": "short_text", "value": "Budi" } ],
  "meta": { "ip": "…", "browser": "Chrome 141", "os": "Android 15", "device": "mobile", "page_url": "…", "referrer": "…", "landing_page": "…", "utm": { "source": "google", "medium": "cpc", "campaign": "…" }, "click_ids": { "gclid": "…" } }
}
```

**Slow integrations don't slow the visitor down.** Next to the synchronous hook there is an async twin, run by Action Scheduler a few seconds later with automatic retries (3 attempts, backoff):

```php
add_action( 'cff_submission_completed_async', $callback, 10, 2 ); // recommended for HTTP calls
```

If the callback throws, the error is written to the submission's activity log and the job is retried. The admin can also re-run a failed integration from the submission detail screen.

**Full hook list**

| Hook | Type | When / use |
|---|---|---|
| `cff_submission_completed` | action | after a completed submission is stored (sync) |
| `cff_submission_completed_async` | action | same data, run in the background with retries |
| `cff_submission_partial_saved` | action | each time partial answers are saved |
| `cff_submission_abandoned` | action | a partial is marked abandoned (start over or timeout) |
| `cff_session_started` | action | a visitor starts a form |
| `cff_submission_deleted` | action | before a submission is deleted (sync external systems / GDPR) |
| `cff_submission_payload` | filter | modify the payload array used by hooks and webhooks |
| `cff_validate_answer` | filter | add custom server-side validation per field |
| `cff_submission_meta` | filter | add custom tracking meta |
| `cff_redirect_url` | filter | change the ending redirect URL |
| `cff_email_args` | filter | change notification emails |
| `cff_public_schema` | filter | change the schema sent to the browser |
| `cff_field_types` | filter | register custom field types (PHP side; JS side via `window.ChatFlow.registerField`) |

All hooks are documented in `docs/hooks.md` in the plugin repo, with examples.

### 8.3 Webhooks (no-code)
- Multiple per form, set up in **Form → Settings → Integrations**: URL, events (completed / partial / abandoned), optional custom headers.
- Sends the same JSON payload as above with an HMAC signature header (`X-CFF-Signature`) for verification.
- Delivered through the async hook (retries plus a log in the submission's activity panel, with a "resend" button).
- Works with Zapier, Make, n8n, Google Apps Script (for Google Sheets) and similar tools.

### 8.4 Later (optional)
Native connectors (Google Sheets, Mailchimp, HubSpot, Slack, Meta CAPI, GA4 Measurement Protocol) would be thin add-ons that listen to `cff_submission_completed_async`. They aren't needed for v1.

---

## 9. Privacy, security and compliance

- **Sanitisation and escaping**: per field type on input; `esc_html` and `wp_kses_post` on output; admin answer rendering always escaped. Bot messages allow a limited markdown subset (bold, italic, links) rendered safely.
- **Nonces and capabilities** on every admin endpoint; public endpoints use signed session tokens (HMAC with `wp_salt()`) rather than WP nonces, so they work with full-page caching.
- **File uploads**: stored in `wp-content/uploads/cff-private/` with `.htaccess` deny and a random filename; served only through an authenticated admin download endpoint. MIME is checked with `wp_check_filetype_and_ext`; extension allowlist; size cap.
- **Redirect safety**: only same-host or allowlisted hosts.
- **Rate limiting** per IP and per form.
- **SQL**: all queries via `$wpdb->prepare`; list filters whitelisted.
- **GDPR**: hooks for `wp_privacy_personal_data_exporters` and `_erasers` (matched by email field values); retention cron; IP anonymisation; a consent field storing consent text and version; option to not store meta at all.
- **CSV injection**: prefix cells starting with `= + - @` with `'` on export.

---

## 10. Performance

- The runtime bundle (about 30 KB gz) and CSS load only when a form is present; the launcher mode lazy-loads the full runtime when it is first opened (launcher stub about 3 KB).
- The public schema is cached in an object-cache or transient and busted on publish.
- Submission list queries use indexes on `(form_id, status, created_at)`, `utm_source`, and `(field_key, value_text(64))`.
- No front-end jQuery dependency.
- Compatible with page caching: no per-user data in HTML; the session starts via REST.

### 10.1 Hosting and plugin compatibility (generic)

The plugin makes no assumptions about the host. It must work on shared hosting, VPS and managed WordPress, with or without a CDN.

**Visitor IP**
- *Automatic* (default): use `REMOTE_ADDR`. Read `CF-Connecting-IP` only when the request actually comes from a published Cloudflare IP range (bundled list, refreshed weekly by cron). Read `X-Forwarded-For` / `X-Real-IP` only when `REMOTE_ADDR` is a private/loopback address (typical reverse proxy). This avoids trusting forged headers.
- Manual modes in settings for unusual setups, plus a **"Detected IP for this request"** diagnostic on the settings page.
- Country: from `CF-IPCountry` when Cloudflare is detected, else empty (optional GeoLite2 database upload later).

**Page caching** (WP Rocket, LiteSpeed Cache, W3 Total Cache, WP Super Cache, WP Fastest Cache, SiteGround/Kinsta/WP Engine caches, Cloudflare APO)
- Pages with a form can be cached safely: the HTML contains no nonces or visitor data.
- All visitor data goes through REST requests, which send `Cache-Control: no-store` and `nocache_headers()`.
- The resume cookie is only read by JavaScript; no cache exclusion rule is needed.

**JS/CSS optimisation** (minify, combine, defer, "delay JavaScript until interaction")
- The runtime is a self-contained ES module with no dependency on jQuery or load order.
- The plugin registers exclusions automatically where the optimiser offers a filter (e.g. WP Rocket `rocket_delay_js_exclusions` / `rocket_exclude_defer_js`, LiteSpeed `litespeed_optm_js_defer_exc`, Autoptimize `autoptimize_filter_js_exclude`), and adds `data-no-optimize="1"` and `data-cfasync="false"` to its tags (the latter stops Cloudflare Rocket Loader from deferring it).
- If a script is still delayed, the form shows a lightweight "Loading chat…" placeholder and starts when the script runs.

**Security plugins / WAF** (Wordfence, iThemes/Solid, Sucuri, Cloudflare WAF)
- Uses standard `wp-json` REST routes with JSON bodies; no `admin-ajax` or unusual endpoints. If REST is blocked, a clear error appears in the admin diagnostics.

**Other**
- Works with the plugin's own Shadow DOM isolation in any theme (block themes, Astra, Kadence, GeneratePress, Hello Elementor) and inside page builders through the shortcode.
- Multisite: network-activatable, tables per site.
- PHP 8.1–8.4, MySQL 5.7+/MariaDB 10.3+, WordPress 6.4+.
- A **System status** page (Tools) lists versions, REST reachability, cron health, SMTP detection, detected caching/optimisation plugins and IP mode, so support issues are quick to diagnose.

---

## 11. Accessibility and i18n

- WCAG 2.2 AA: focus management on each new step, live region announcements, all chips are buttons with `aria-pressed`, visible focus rings, contrast checked in the Design tab, reduced-motion support, and a full keyboard path.
- i18n: all strings via `__()` and `wp_set_script_translations`; RTL stylesheet; form content translatable via WPML/Polylang config (`wpml-config.xml`) in Phase 2.

---

## 12. Plugin directory structure

```
chatflow-forms/
├── chatflow-forms.php            # bootstrap, headers, constants
├── uninstall.php
├── composer.json / package.json
├── src/
│   ├── Plugin.php                # service container + hooks registration
│   ├── Install/Installer.php     # tables, caps, migrations
│   ├── Forms/                    # CPT, FormRepository, SchemaValidator, Versioning
│   ├── Fields/                   # FieldType interface + one class per type, Registry
│   ├── Logic/                    # Engine.php (PHP mirror), Operators, Interpolator
│   ├── Submissions/              # Repository, SubmitSessionAction, Meta collectors, Export
│   ├── Tracking/                 # IpResolver, UserAgentParser, Attribution
│   ├── Spam/                     # Honeypot, TimeTrap, RateLimiter, Captcha providers
│   ├── Notifications/            # Mailer, Templates, Webhooks
│   ├── Rest/                     # Controllers per resource
│   ├── Admin/                    # Menus, ListTables, pages, Settings
│   ├── Frontend/                 # Shortcode, Block, FullPageRoute, Assets, Launcher
│   ├── Privacy/                  # Exporter, Eraser, Retention cron
│   ├── Integrations/             # Hook dispatcher, async jobs, Webhooks
│   ├── Updates/                  # plugin-update-checker bootstrap (private GitHub releases)
│   └── Templates/                # bundled form templates (JSON), e.g. survey-website-id.json
├── assets/src/
│   ├── runtime/                  # Preact chat UI (front end)
│   ├── shared/logic/             # TS logic engine (used by runtime + builder preview)
│   ├── builder/                  # React builder app
│   ├── submissions/              # React detail view / analytics
│   └── blocks/form/              # Gutenberg block
├── build/                        # compiled assets (committed for releases)
├── docs/                         # hooks.md, payload.md, field-types.md, release.md
├── .github/workflows/            # CI + release zip on tag
├── templates/                    # full-page template, email templates (overridable in theme: /chatflow/)
├── languages/
└── tests/
    ├── php/                      # PHPUnit + WP test suite
    ├── js/                       # Jest/Vitest unit tests
    ├── fixtures/logic/*.json     # shared engine fixtures (run by BOTH PHP and JS)
    └── e2e/                      # Playwright
```

---

## 13. Testing strategy

- **Logic parity**: about 100 JSON fixtures (schema, answers, expected path, ending, errors) run by both the TS engine (Vitest) and the PHP engine (PHPUnit). CI fails if they disagree.
- **PHP**: PHPUnit with `wp-env`: field sanitisation and validation, the submit pipeline (happy path, spam, tampered answers to hidden steps, expired token), repository queries, export, privacy eraser.
- **JS**: component tests for every input type and the state machine (back/edit, resume from storage).
- **E2E (Playwright)**: build a form in the builder, publish, complete it on the front end in mobile and desktop viewports, assert the submission appears with meta, the redirect works, and the email was sent (MailHog/Mailpit).
- **Static analysis**: PHPStan level 6 with WordPress stubs, PHPCS (WordPress Coding Standards), ESLint and TypeScript strict.
- **Compatibility matrix**: PHP 8.1–8.4, WP latest-2 to latest, popular themes (Twenty Twenty-Five, Astra, Kadence), and caching plugins (WP Rocket, LiteSpeed).

---

## 14. Delivery phases

### Phase 0: Foundations (week 1)
- New private repo, plugin scaffold, Composer/PSR-4 with Strauss prefixing, build tooling (`@wordpress/scripts` for admin, a separate entry for the Preact runtime), `wp-env`.
- CI (lint, PHPStan, tests, build) and a release workflow (tag → zip → GitHub release). Update checker wired up.
- Installer and DB tables, capabilities, CPT.
- Schema JSON definition and validator (JSON Schema).

### Phase 1: MVP (weeks 2–7)
1. **Logic engine (TS and PHP) and fixtures**: show/hide, jump, end, required; merge tags.
2. **Front-end runtime**: inline and full-page modes; field types `short_text`, `long_text`, `email`, `phone` (default +62), `number`, `single_choice`, `multi_choice`, `yes_no`, `date`, `consent`, `statement`, `hidden`; typing indicator, chips, progress, back/edit; endings (message, redirect, CTA buttons including WhatsApp).
3. **Sessions, resume and start over** (§5.5): cookie token, partial saves, resume prompt, start over, partial/abandoned statuses.
4. **REST and submit pipeline**: server validation, honeypot, time trap, rate limit, tracking meta (IP, UA parse, page URL, referrer, first-touch landing, UTMs, click IDs, locale, timezone, screen, duration).
5. **Builder v1**: palette, drag-reorder list, inspector (content, validation, logic rule builder), endings, design basics (colours, bot name and avatar), live preview, draft/publish with versioning, autosave.
6. **Submissions admin v1**: Completed/Partial/Abandoned/Spam tabs, filters, search, bulk actions; detail view with chat replay and meta panel; read/star; **CSV export** (§7.3); **purge tool** and optional retention (§7.7).
7. **Integrations** (§8): `cff_submission_completed` (+ async with retries), the other actions and filters, webhooks, activity log, `docs/hooks.md`.
8. **Notifications**: admin email and **autoresponder** (editor, merge tags, conditions, delay, test send, global layout).
9. **Embedding**: shortcode (also works inside Elementor's Shortcode widget) and Gutenberg block.
10. **i18n**: all UI strings translatable; bundled **Indonesian (`id_ID`)** translation for the front end and admin; per-form overrides for built-in chat phrases ("Continue", "Start over", error messages).
11. **Privacy basics**: IP anonymisation, exporter/eraser.
12. **Imajiner survey template** (§17), used as the acceptance test.
13. **Compatibility pass** (§10.1): tested with and without Cloudflare and with the common caching/optimisation plugins.

**MVP exit criteria**
- The Imajiner survey is rebuilt in the builder from scratch in under 15 minutes.
- On a phone, a visitor completes it, closes the tab midway, comes back, continues, and can also start over.
- The admin sees the completed submission with all answers and meta, and the abandoned partial too.
- A sample `cff_submission_completed_async` listener and a webhook both receive the payload.
- CSV export opens correctly in Excel and Google Sheets; purging "older than 360 days" removes only matching rows.
- The autoresponder arrives with merge tags filled in, and its test send works.
- All logic parity fixtures pass.

### Phase 2: Engagement and insight (weeks 8–11)
- Floating launcher and popup modes, auto-open triggers, site-wide display rules.
- Analytics: funnel, step drop-off, answer distributions, sources.
- More field types: `rating`, `scale/nps`, `slider`, `file_upload`, `address`, `media`, `summary`.
- Captcha providers (Turnstile, hCaptcha, reCAPTCHA v3), Akismet.
- Templates gallery, form import/export JSON, duplicate.
- XLSX export, background exports.
- Native Elementor widget; WPML/Polylang support.
- Per-option emoji reactions, confetti, theme presets.

### Phase 3: Power features (weeks 12+)
- Variables and scoring, calculated fields, outcome-based endings ("Your plan: …").
- Visual flow map (React Flow) with editable branches.
- Optional native connectors on top of the integration hook (§8.4).
- A/B testing of bot copy and step order.
- Optional AI assist: generate a form from a prompt; rephrase bot copy in a chosen tone.
- Resume on another device via an emailed or WhatsApp magic link.

---

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Client and server logic drift | Shared fixtures run in both languages in CI; a single schema spec. |
| Theme CSS breaking the chat UI | Shadow DOM isolation; theme fonts inherited only if opted in. |
| Page caching breaks nonces | Signed session tokens issued via REST instead of WP nonces in HTML. |
| Bundled Composer dependencies conflict with other plugins | Prefix vendors with Strauss/PHP-Scoper. |
| Schema changes after submissions exist | Versioned published schemas; submissions store their version; exports key on `field.key`; warning when renaming keys. |
| Spam on a conversational form (cheap to automate) | Layered defences: honeypot, time trap, rate limit, captcha, Akismet; spam status rather than drop, for review. |
| Large submission volumes | Custom tables with indexes, paginated queries, background export, retention cron. |
| Resume cookie blocked (privacy browsers, consent banners) | `localStorage` mirror still restores on the same device; the cookie is classed as functional/necessary and documented for cookie-consent plugins. |
| Integration code slowing down or breaking submit | Heavy work goes on the async hook; exceptions are caught, logged and retried, never shown to the visitor. |
| Accessibility of animated chat UI | Live regions, reduced motion, keyboard path, audited with axe in E2E. |

---

## 16. Open questions

None blocking. Decisions are recorded at the top of this document.

---

## 17. First template: Imajiner website survey

Source: **imajiner.id/survey**, currently an Elementor multi-step form ("Form Survey Multi Step") with 11 fields over 3 steps, in Indonesian, ending with a **Request Free Demo** button. Below it is rebuilt as a chat. Field keys are the machine names used in exports and integrations.

### 17.1 Flow

| # | Key | Type | Bot says (chat copy) | Answer UI | Required | Logic |
|---|---|---|---|---|---|---|
| 0 | `intro` | statement | "Halo! 👋 Saya Ima dari Imajiner." · "Saya akan bantu memahami kebutuhan website Anda, cuma ±2 menit." · "Tenang, Anda **tidak akan dikejar-kejar sales** 😉" | button "Yuk mulai" | — | — |
| 1 | `punya_website` | single_choice | "Sebelumnya, apakah Anda sudah pernah punya website?" | chips: Belum pernah · Pernah, beli dari penyedia jasa · Pernah, buat sendiri · Pernah, dibuatkan teman / rekan | ✓ | if = *Belum pernah* → skip `alamat_website` |
| 2 | `alamat_website` | short_text (url) | "Boleh tahu alamat website-nya?" | input, placeholder `contoh.com`, "Lewati" chip | — | shown only if `punya_website` ≠ Belum pernah |
| 3 | `layanan` | single_choice | "Layanan apa yang Anda butuhkan?" | chips: Membuat website baru · Re-design website yang sudah ada · Maintenance website · Lainnya (+ free text) | ✓ | if `punya_website` = Belum pernah → hide *Re-design* and *Maintenance* options (optional, see note) |
| 4 | `jenis_website` | single_choice | "Website seperti apa yang Anda inginkan?" | cards: 🛒 Online Shop / eCommerce · 🏢 Company / Business Profile · 📰 Blog / Portal Berita · 🎯 One Page (Landing / Sales Page) · Lainnya | ✓ | — |
| 5 | `deskripsi` | long_text | "Ceritakan singkat tentang website impian Anda ✨" | textarea, placeholder "misalnya: saya ingin membuat online shop dengan tema fashion, dilengkapi fitur Blog, seperti fashionshop.com", "Lewati" chip | — | — |
| 6 | `budget` | single_choice | "Berapa estimasi budget yang Anda siapkan?" · small note: "Info ini membantu kami memberi rekomendasi yang paling pas 🙏" | chips: < Rp5 jt · Rp5–10 jt · Rp10–25 jt · Rp25–50 jt · > Rp50 jt · Belum tahu | ✓ | — |
| 7 | `privasi` | statement | "Sedikit lagi! Imajiner menjamin kerahasiaan data Anda dan tidak akan menyebarkannya tanpa izin 🔒" | auto-continue | — | — |
| 8 | `nama` | short_text | "Dengan siapa saya berbicara?" | input, `autocomplete=name` | ✓ | — |
| 9 | `whatsapp` | phone | "Senang kenalan, {{nama}}! Nomor HP / WhatsApp yang bisa dihubungi?" | phone input, default +62, numeric keyboard | ✓ | — |
| 10 | `email` | email | "Alamat email Anda? (opsional)" | input, "Lewati" chip | — | — |
| 11 | `boleh_ditelepon` | yes_no | "Bolehkah tim kami menelepon untuk diskusi lebih lanjut?" | Ya 👍 · Tidak, chat saja | ✓ | — |
| 12 | `catatan` | long_text | "Ada hal lain yang ingin Anda sampaikan?" | textarea, "Tidak ada" chip | — | — |
| 13 | `summary` | summary | "Ini ringkasan jawaban Anda, sudah benar?" | review card with edit buttons, CTA **Request Free Demo** | — | — |

**Ending `end_default`** (message): "Terima kasih, {{nama}}! 🎉 Tim Imajiner akan menghubungi Anda di {{whatsapp}} pada jam kerja (09.00–18.00 WIB, Senin–Jumat)." Buttons: **Chat via WhatsApp** (a `wa.me` link with a pre-filled message built from the answers) and **Kembali ke beranda**. The admin can switch this ending to a redirect (e.g. `/terima-kasih/`) or add answer-specific endings.

**Autoresponder** (if email was given): subject "Terima kasih, {{nama}}! Permintaan demo Anda sudah kami terima", body summarising `{{all_answers}}`, the office hours and a **Chat via WhatsApp** button.

**Hidden fields**: `utm_source`, `utm_medium`, `utm_campaign`, `gclid`, `fbclid` (captured automatically as meta); `sumber_halaman` = page title.

**Bot**: name "Ima", Imajiner logo as avatar, brand colours from the site, typing speed "normal".

### 17.2 What changes from the current form, and why

| Current form | Chat version | Why |
|---|---|---|
| "Apa alamat website Anda?" is always shown | Only shown if they already have a website | Fewer pointless questions. |
| Budget is a required **free-text** field | Range chips plus "Belum tahu" | One tap instead of typing; clean data for filtering and reporting; less drop-off on a sensitive question. |
| Email optional, phone required | Same, phone as a proper phone field (+62, validated, normalised to E.164) | Ready for WhatsApp links and CRM. |
| The no-sales-pressure promise sits at the top of the page | It's the bot's opening line | Sets a friendly tone in the conversation itself. |
| Privacy note sits beside the submit button | A short bot message right before asking for contact details | Reassures at the moment it matters. |
| Three steps with Sebelumnya / Selanjutnya | One question at a time with a progress bar, back and edit | The chat format you asked for. |
| No resume | Cookie resume plus start over | Visitors from ads often get interrupted. |

Note on step 3: hiding *Re-design* and *Maintenance* for people with no website is optional. It's logical, but someone may still pick them by mistake, so I'd only do it if you agree.

### 17.3 Acceptance test script (E2E)
1. Open the survey on a mobile viewport → the intro appears with a typing animation.
2. Pick "Belum pernah" → the website-address question is skipped.
3. Answer up to `whatsapp`, then close the tab.
4. Reopen → "Welcome back, Budi! Continue?" → **Continue** → resumes at `email`.
5. Finish → summary → **Request Free Demo** → thank-you message with a working WhatsApp button.
6. Admin: the submission is *completed* with all answers and meta (device = mobile, UTMs from the test URL).
7. A sample async integration listener and a webhook (request bin) both received the payload.
8. Reopen and choose **Start over** → a fresh chat; the earlier session isn't duplicated.
9. Start again, stop at step 6, wait past the abandon timeout (shortened in test) → it appears under *Abandoned*, and `cff_submission_abandoned` fired.
