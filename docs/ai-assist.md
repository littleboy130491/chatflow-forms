# AI assist (Phase 3, optional)

Two builder helpers use an AI model of your choice (Anthropic Claude, any model
on OpenRouter, or an OpenAI-compatible endpoint), as planned in PLAN.md Phase 3:

- **Generate a form from a prompt.** On the Forms page and the New form screen,
  describe the form (audience, questions, language) and choose **Generate draft**.
  The result is an unpublished draft that opens in the builder for review.
- **Rephrase bot copy.** On the builder's **Design** tab, pick a tone (friendly,
  professional, playful, concise or formal) and choose **Rephrase**. Question
  labels, bot messages and ending messages are rewritten in place; **Undo
  rephrase** restores the previous copy. Nothing is published until you publish.

Both stay hidden until the selected provider is configured.

## Setup

**ChatFlow → Settings → AI assist:** choose a provider and fill in its fields.
Each provider keeps its own fields, so switching back and forth keeps saved keys.
Malformed keys, model names and URLs are refused on save. Keys stay in private
global settings, are shown masked, and are never sent to the browser or
included in exports.

| Provider | Fields | Request |
| --- | --- | --- |
| Anthropic (default) | API key (`sk-ant-…`) | `POST https://api.anthropic.com/v1/messages` |
| OpenRouter | API key (`sk-or-…`), optional model ID (default `openrouter/auto`) | `POST https://openrouter.ai/api/v1/chat/completions` |
| OpenAI-compatible | Base URL (e.g. `https://api.openai.com/v1`), model, optional API key | `POST {base URL}/chat/completions` |

OpenAI-compatible covers OpenAI and services with the same Chat Completions API
(Groq, Together, Mistral, DeepSeek, self-hosted gateways on a public https
address). Base URLs must be https without credentials, query or fragment; the
`cff_ai_allow_http_endpoint` filter can allow plain http. Requests use
`wp_safe_remote_post()`, so private and loopback addresses are refused unless
WordPress's `http_request_host_is_external` filter allows them.

## How it works

- Requests run on your WordPress server through the WordPress HTTP API, never
  from the browser, with redirects disabled.
- Anthropic model: `claude-opus-5-5` (filter: `cff_ai_model`). Effort is `medium` for
  generation and `low` for rephrasing. Responses use structured outputs
  (`output_config.format`), so Claude returns JSON in a fixed shape.
- OpenRouter and OpenAI-compatible requests ask for strict JSON Schema output
  (`response_format: json_schema`). OpenRouter only routes to providers that
  support it (`provider.require_parameters`). If an endpoint rejects JSON Schema
  with HTTP 400, the request is retried once in plain JSON mode with the schema
  in the instructions. Choose a model that follows JSON instructions well.
- Anthropic server-side refusal fallbacks are enabled (`fallbacks: "default"`, beta
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

- Only the admin's description, or the form's own copy, is sent to the provider.
  Submissions, answers, visitor data and settings are never sent.
- Available to users with `cff_manage_forms`, through REST with a nonce;
  30 AI requests per user per hour.
- Errors are generic (key rejected, rate limited, unavailable, declined,
  cut off); provider response bodies are never shown or stored.
- Each request may take up to two minutes and is billed to your account
  with the provider.
