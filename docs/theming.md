# Chat theme

Each form has its own theme on the builder's **Design → Chat theme** panel. A
live sample conversation next to the controls updates as you change them; the
full **Preview** also restyles without restarting.

## Styles

- **Messaging** (default for new forms): a modern messenger look with a chat
  wallpaper, bubbles with tails, read ticks on the visitor's answers, a round
  send button and keyboard-style answer buttons.
- **Classic**: plain, compact bubbles that blend into the page. Existing forms
  keep this style until you change it.

## Options

| Setting | Values | Notes |
| --- | --- | --- |
| Palette | Sky, Meadow, Lavender, Sunset, Graphite, Night | Sets all colours, light/dark and the wallpaper in one click. |
| Light or dark | Light, Dark, Follow device | Dark mode uses built-in dark colours. |
| Colours | Accent, header background/text, chat background, bot bubble/text, visitor bubble/text | Leave a colour empty to use the style's default. |
| Wallpaper | Doodles, Dots, Gradient, Plain | Messaging only. |
| Answer buttons | Keyboard grid, Pills | Messaging only. |
| Bubble tails | On/off | Messaging only. |
| Corner radius, chat width | 0–32 px, 320–1200 px | |

Everything is stored in the form's `settings.appearance` and validated by
`schema/settings.schema.json` on save. Colours are sanitised again in the
visitor's browser; custom CSS stays scoped to the chat's Shadow DOM.

## Talking directly on WhatsApp

- **Any time:** Design → Bot → *Direct contact link* adds a full-width button
  below the conversation (green with the WhatsApp icon for WhatsApp links). Build the link from a
  number and a pre-filled message; merge tags such as `{{name}}` are replaced with
  the answers given so far when the visitor clicks. https, tel: and mailto: links
  work too. Clicks dispatch a `cff:contact` event on the form element for
  analytics.
- **After submitting:** on Settings → Endings, give an ending a *Link* button and
  use *Build a WhatsApp link*; the message can include every answer. WhatsApp
  links (wa.me, api.whatsapp.com) are always allowed, so they do not need to be
  listed in *Allowed external redirect hosts*.
