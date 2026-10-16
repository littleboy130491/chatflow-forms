# Native connectors (Phase 3)

Native connectors send submissions to Slack, Mailchimp, HubSpot, Google
Analytics 4 and the Meta Conversions API without Zapier or custom code. They
are thin add-ons over the existing delivery outbox (PLAN.md §8.4): each enabled
connector becomes a `connector` delivery row, so it gets the same frozen
payload, three bounded attempts, activity log, cancellation on deletion and
manual resend as webhooks. Nothing is sent from the visitor's browser.

## Setup

1. **ChatFlow → Settings → Connector credentials.** Enter credentials for the
   providers you use. A provider is either blank (off) or complete; partly
   filled or malformed credentials are refused on save. Credentials stay in
   private global settings and are never part of a form export or public
   projection.
2. **Form builder → Settings → Native connectors.** Add a connector, choose the
   events (`completed`, `partial`, `abandoned`) and map questions. Publishing
   validates every enabled connector against the form's questions; a broken
   mapping blocks publishing with a path such as `/integrations/connectors/0`.
3. Publish. Only published versions deliver, and each delivery uses the version
   the visitor answered.

## Providers

| Provider | Request | Required per form | Data sent |
|---|---|---|---|
| Slack | `POST` to your incoming webhook (`hooks.slack.com`) | nothing | Form title, status, optional intro with merge tags, up to 25 answered fields |
| Mailchimp | `PUT /3.0/lists/{audience}/members/{md5(email)}`, then tags | audience ID, email question, **consent question** | Email, mapped merge fields (`FNAME` → `nama`), tags. Double opt-in is on unless turned off |
| HubSpot | `POST /crm/v3/objects/contacts/batch/upsert` keyed by email | email question | Email and mapped contact properties (`firstname` → `nama`) |
| Google Analytics 4 | Measurement Protocol `POST /mp/collect` | **consent question** | Event name (default `generate_lead`), form ID/version, status, UTM source/medium/campaign. No answers or contact details |
| Meta Conversions API | `POST /v23.0/{pixel}/events` | **consent question** | Event name (default `Lead`), time, SHA-256 of normalized email/phone, `fbc` from `fbclid`, HTTPS page URL. Event ID is the submission UUID for pixel deduplication |

Mapping keys must match the provider's naming (Mailchimp merge tags like
`FNAME`; HubSpot internal property names like `firstname`). Values are
single-line text; multi-choice answers are joined with commas and an Other
answer uses its free text.

## Consent and privacy

- Mailchimp, GA4 and Meta always require a consent question; the connector only
  queues and sends when that answer is exactly *yes*. Slack and HubSpot accept
  an optional consent gate.
- GA4 uses the submission UUID as `client_id`, so events are not joined to a
  browser session and carry no personal data. Meta receives only hashed email
  and phone. Access tokens are sent in the JSON body, never in the URL.
- Slack and HubSpot receive the answers you map or that appear in the form.
  Review your privacy notice before enabling them.

## Delivery and security

- Requests only go to each provider's fixed host over HTTPS with TLS
  verification, no redirects and a 10-second timeout. A request for any other
  host is refused before sending.
- Outcomes are generic (`sent`, `connector_http_400`, `connector_not_configured`,
  `connector_missing_email`, …); provider response bodies are never stored.
- Missing credentials are retried like any failure, so adding them within the
  retry window lets queued deliveries succeed. After three attempts, resend from
  the submission's delivery log.
