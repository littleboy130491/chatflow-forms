# MCP server for AI agents

ChatFlow includes a [Model Context Protocol](https://modelcontextprotocol.io)
server, so AI agents such as Claude (Desktop, Code or claude.ai), ChatGPT, Cursor
or VS Code can work with your forms: list and read them, draft new ones, edit and
publish them, and read submissions and analytics.

It is **off by default**.

## Turn it on

1. **ChatFlow → Settings → MCP server (AI agents)**: tick *Enable the MCP server*
   and save.
2. **Users → Profile → Application passwords**: create an application password
   for the account the agent should act as. WordPress offers application
   passwords on HTTPS sites (and on local development sites).
3. Add the server to your agent:

   - URL: `https://your-site.example/wp-json/cff/v1/mcp`
   - Transport: Streamable HTTP
   - Header: `Authorization: Basic <base64 of "username:application password">`

   Claude Code:

   ```sh
   claude mcp add --transport http chatflow https://your-site.example/wp-json/cff/v1/mcp \
     --header "Authorization: Basic $(printf '%s' 'admin:abcd efgh ijkl mnop qrst uvwx' | base64)"
   ```

   Clients configured with JSON (Cursor, VS Code, Claude Desktop through a remote
   MCP bridge) take the same URL and header:

   ```json
   {
     "mcpServers": {
       "chatflow": {
         "type": "http",
         "url": "https://your-site.example/wp-json/cff/v1/mcp",
         "headers": { "Authorization": "Basic YWRtaW46YWJjZCBlZmdoIGlqa2wgbW5vcCBxcnN0IHV2d3g=" }
       }
     }
   }
   ```

The settings page shows the exact endpoint and a ready-to-copy command.

## What agents can do

An agent acts as the WordPress user whose application password it uses. It only
sees the tools that user's ChatFlow capabilities allow.

| Tool | Capability | Does |
| --- | --- | --- |
| `list_forms` | `cff_manage_forms` or `cff_view_submissions` | Forms with status, published version and statistics. |
| `get_form` | `cff_manage_forms` | Schema, settings and `draftRevision` (draft by default, or `version: "published"`). |
| `get_form_schema` | `cff_manage_forms` | The form and settings JSON Schemas, field types and an example form. |
| `list_templates` | `cff_manage_forms` | Built-in templates. |
| `validate_form` | `cff_manage_forms` | Schema errors, publish blockers and logic warnings, without saving. |
| `create_form` | `cff_manage_forms` | A new **draft**, from a template or a full schema. |
| `update_form` | `cff_manage_forms` | Saves the draft (title, schema and/or settings). Needs the current `draftRevision`, so it never overwrites newer edits. |
| `publish_form` | `cff_manage_forms` | Publishes the draft. |
| `list_submissions` | `cff_view_submissions` | Submissions with answers; filter by form, status, dates or text. |
| `get_submission` | `cff_view_submissions` | One submission with answers, metadata and notes. |
| `get_analytics` | `cff_view_submissions` | Views, starts, completions, drop-off and sources. |
| `get_theme_frontend` | `cff_manage_forms` | Whether the theme replaces or restyles the chat (see [custom frontend](custom-frontend.md)). |

There are no delete tools. Edits only change the draft; visitors keep the live
version until `publish_form`. Saving takes the same editing lock as the builder.

Resources (read-only reference for agents): `chatflow://schema/form`,
`chatflow://schema/settings`, `chatflow://docs/custom-frontend`,
`chatflow://examples/frontend.js`, `chatflow://examples/frontend.css` and
`chatflow://docs/hooks`. With them an agent can also write a theme's
`chatflow/frontend.js` for you.

## Security

- Every request needs a WordPress user (application password, HTTP Basic). Cookie
  sessions without a REST nonce are ignored by WordPress, and cross-origin browser
  requests are rejected.
- Submissions can contain personal data. Connect only agents you trust, and use
  an account with only the capabilities the agent needs (for example a user with
  `cff_view_submissions` alone for reporting).
- Revoke access any time by deleting the application password or turning the
  server off.

## WordPress Abilities API and MCP Adapter

On WordPress 6.9 and later, the same tools are also registered as abilities
(`chatflow-forms/list-forms`, `chatflow-forms/create-form` …, category
`chatflow-forms`) while the server is enabled, with the same permission checks.
Sites that run the official
[WordPress MCP Adapter](https://github.com/WordPress/mcp-adapter) can serve them
from its endpoint instead.

## Protocol details

Stateless Streamable HTTP: `POST` JSON-RPC 2.0 messages (single or batched) and
get JSON responses; notifications get `202 Accepted`. There is no server-sent
event stream (`GET` returns `405`) and no session ID. Supported protocol versions:
`2025-06-18`, `2025-03-26` and `2024-11-05`. Tool failures (validation, conflicts,
permissions) come back as tool results with `isError: true` and a JSON body with
`code`, `message` and, for schema problems, `errors`.

Filters: `cff_mcp_enabled` (`bool`) overrides the setting; `cff_mcp_tools` adds,
changes or removes tools (each with `title`, `description`, `inputSchema`,
`annotations`, `capabilities` and a `handler` that returns an array or `WP_Error`).
