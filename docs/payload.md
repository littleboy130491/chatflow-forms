# Submission payload, v1

`ChatFlow\Submissions\Submission::toArray()` delegates to
`ChatFlow\Integrations\Payload::build(Submission, Form, ?string $event=null)`.
The `Form` must be the matching immutable version, not its current draft. Hooks
receive DTOs; the webhook body is this same projection. Events are exactly
`submission.completed`, `submission.partial`, or `submission.abandoned`.

```json
{
  "event": "submission.completed",
  "submission": {
    "uuid": "8f7e02cc-8b85-4e89-a46c-fb9831fd74ab",
    "status": "completed",
    "created_at": "2026-10-13T01:02:03+00:00",
    "duration_ms": 42000,
    "ending": "end_default"
  },
  "form": {"id": 42, "slug": "survey", "title": "Survey", "version": 1},
  "answers": {"nama": "Budi", "layanan": ["Website", "Maintenance"]},
  "fields": [
    {"key": "nama", "label": "Nama", "type": "short_text", "value": "Budi"},
    {"key": "layanan", "label": "Layanan", "type": "multi_choice", "value": ["Website", "Maintenance"]}
  ],
  "meta": {
    "ip": "203.0.113.0", "browser": "Chrome", "os": "Windows", "device": "desktop",
    "page_url": "https://example.org/survey", "referrer": "https://example.org/",
    "landing_page": "https://example.org/landing",
    "utm": {"source": "newsletter", "medium": "email", "campaign": "launch"},
    "click_ids": {"gclid": "collected-click-id"}
  }
}
```

## Exact fields and normalization

* The six top-level keys shown above are fixed. There is no settings/config block.
* `submission.uuid` is the public UUID, not the internal database ID.
  `status` follows the event; `created_at` is ISO-8601 UTC, `duration_ms` a
  nonnegative integer, and `ending` an ending ID or `null` when not selected.
* `form` contains exactly `id` (integer), `slug`, `title`, `version` (integer).
  Titles, labels and option definitions come from that version's snapshot.
* `answers` maps field keys to JSON values: text/email/phone/date strings,
  numbers, booleans, choice values (not IDs/labels), multi-choice arrays and
  explicit `null` for skips. Only schema input keys present in the stored answers
  are included. Display-only statement/summary/media fields never store answers.
  The server lane must reject unvisited/tampered answers before constructing the
  DTO; this projector is not a substitute for replay/validation.
* `fields` is an ordered list, in snapshot step order, with exactly
  `key`, `label`, `type`, `value`, mirroring `answers`. Labels/text are stripped of
  markup. JSON values are bounded to depth 5, 200 entries per collection and
  100000 characters per string; nonfinite numbers and non-JSON objects become null.
* `meta` includes only collected values permitted by frozen privacy settings.
  `privacy.storeMeta=false` removes all metadata. `privacy.ipMode` defaults to
  `anonymized`, may be `full`, or `none`. Safe core keys are exactly `ip`,
  `browser`, `os`, `device`, `page_url`, `referrer`, `landing_page`, `utm`,
  `click_ids`. UTM members: source/medium/campaign/term/content. Click IDs:
  gclid/fbclid/msclkid/ttclid. Missing members are omitted, not guessed.
* Metadata URLs have query strings, fragments and userinfo removed, to avoid
  leaking signed links/tokens. Explicit UTM/click-ID values remain separately.
  Metadata extensions must be scalar `custom_[a-z0-9_]{1,50}` keys, cannot contain
  token/secret/pass/credential/cookie/header/path/url/hash/authorization/nonce,
  and are still sanitized. Plugin authors are responsible for their values'
  privacy. Raw UA, resume hashes, request tokens, credentials, private settings,
  internal context/variables, filesystem paths and admin links are not included.
* `cff_submission_payload(array, Submission, Form)` can adjust answers and safe
  metadata. The final projection re-whitelists input keys, rebuilds fields and
  applies privacy again; it cannot override identity/event/snapshot or spread
  arbitrary top-level keys. Failed callbacks retain the previous filter value.

## Canonical bytes and webhook verification

`Payload::bytes(array $payload): string` recursively sorts object keys using
string ordering, preserves array order, emits UTF-8 JSON without escaped Unicode
or slashes, and serializes empty top-level answers/meta as `{}`. No insignificant
whitespace is emitted. Malformed UTF-8/JSON throws instead of signing corruption.
The database stores these bytes once. The worker sends them unchanged, including
on automatic retries and manual resend; it never reads live draft settings.
Async/email DTOs use an internal in-memory `_cff_payload_frozen` marker (not a
database column) so `toArray()` does not rerun payload filters on frozen events.
It still re-projects schema inputs and privacy-permitted metadata.

Headers:

```text
Content-Type: application/json; charset=utf-8
X-CFF-Event: submission.completed
X-CFF-Delivery: 123
X-CFF-Signature: sha256=<hex HMAC-SHA256 over raw body bytes>
```

Receiver example (read the raw body before JSON decoding):

```php
$raw = file_get_contents('php://input');
$expected = 'sha256=' . hash_hmac('sha256', $raw, $privateConfiguredSecret);
if (!hash_equals($expected, $_SERVER['HTTP_X_CFF_SIGNATURE'] ?? '')) {
    http_response_code(401);
    exit;
}
$event = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
// Atomically record site/form + X-CFF-Delivery; repeated IDs are acknowledgments.
// Process once, then return 2xx. Never log secrets or entire request bodies.
```

Delivery is **at least once**. A crash between remote acceptance and local status
update can resend. All async listeners/receivers must implement idempotency using
submission UUID + event (and delivery ID for webhooks); partial events have one
new delivery per saved session revision. Manual resend uses the same delivery ID
and bytes; a receiver that dedupes it will correctly acknowledge without redoing
side effects. The header is not itself covered by the body HMAC, so also verify
the body identity and use HTTPS. There is no signed timestamp/replay window in v1.

Only HTTPS, port 443, no userinfo/fragments, and public DNS/IP destinations are
accepted. All resolved A/AAAA addresses must be public. cURL is required and the
verified address is pinned for the request; proxies and redirects are disabled,
TLS certificate validation remains enabled. Loopback/private/reserved/mapped
addresses fail closed. Custom headers permit Authorization and nonreserved X-*
only; Host/Cookie/Content-Length/proxy/forwarding and CFF headers cannot be set.
Configured signing secrets must be at least 16 bytes and stay in private form
version settings, never delivery bodies/activity/public schemas/exports.

## Internal test deliveries

Admin notification tests use `notification.test`, `submission_id=0`, a random
dedupe identity, and a private internal body `{form:{id},recipient,sample}`.
`sample` is the stable payload above. This body is never sent to webhooks or
submission hooks. The worker loads the published settings snapshot and forces
only the test recipient after filters, removing Cc/Bcc. Previewing does not queue
or send anything. Delivery rows (including test recipient/sample PII) must be
included in the server privacy/retention cleanup policy; public payload rules do
not make delivery storage non-personal data.
