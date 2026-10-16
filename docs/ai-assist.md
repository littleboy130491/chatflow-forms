# AI assist (Phase 3, optional)

Two builder helpers use Anthropic's Claude API, as planned in PLAN.md Phase 3:

- **Generate a form from a prompt.** On the Forms page and the New form screen,
  describe the form (audience, questions, language) and choose **Generate draft**.
  The result is an unpublished draft that opens in the builder for review.
- **Rephrase bot copy.** On the builder's **Design** tab, pick a tone (friendly,
  professional, playful, concise or formal) and choose **Rephrase**. Question
  labels, bot messages and ending messages are rewritten in place; **Undo
  rephrase** restores the previous copy. Nothing is published until you publish.

Both stay hidden until an API key is configured.

## Setup

**ChatFlow → Settings → AI assist (Claude):** paste an Anthropic API key
(`sk-ant-…`). Leave it blank to turn the feature off. Malformed keys are refused
on save. The key stays in private global settings and is never sent to the
browser or included in exports.

## How it works

- Requests run on your WordPress server through the WordPress HTTP API
  (`POST https://api.anthropic.com/v1/messages`), never from the browser.
- Model: `claude-opus-5-5` (filter: `cff_ai_model`). Effort is `medium` for
  generation and `low` for rephrasing. Responses use structured outputs
  (`output_config.format`), so Claude returns JSON in a fixed shape.
- Server-side refusal fallbacks are enabled (`fallbacks: "default"`, beta
  `server-side-fallback-2026-07-01`): if Claude declines, the API retries on
  Anthropic's recommended fallback model within the same request.
- **Generation** asks Claude for a deliberately small blueprint (title, bot name,
  up to 30 steps of supported types, options, ending). The plugin assigns all
  IDs, keys, option values and settings itself, then runs the normal schema
  validation and logic diagnostics before saving the draft. Branching rules,
  notifications and integrations are never generated.
- **Rephrasing** only accepts rewrites for the texts it sent, as plain text, and
  only when every merge tag (`{{name}}`) of the original is kept. Anything else
  keeps the original text.

## Privacy and limits

- Only the admin's description, or the form's own copy, is sent to Anthropic.
  Submissions, answers, visitor data and settings are never sent.
- Available to users with `cff_manage_forms`, through REST with a nonce;
  30 AI requests per user per hour.
- Errors are generic (key rejected, rate limited, unavailable, declined,
  cut off); provider response bodies are never shown or stored.
- Each request may take up to two minutes and is billed to your Anthropic
  account.
