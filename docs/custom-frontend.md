# Custom frontend in your (child) theme

A theme can **replace the visitor chat UI entirely** or just **restyle** it, without
editing the plugin. ChatFlow keeps doing everything that must stay trustworthy:
sessions and resume, validation, branching logic, spam protection, uploads,
submission, notifications and integrations. Your code only draws the interface.

## Files

Put these in your theme (a child theme is recommended, so theme updates keep them):

```
wp-content/themes/your-child-theme/
└── chatflow/
    ├── frontend.js    ← replaces the chat UI (optional)
    └── frontend.css   ← extra styles inside the chat (optional)
```

| File | Effect |
| --- | --- |
| `chatflow/frontend.js` | An ES module that calls `window.ChatFlow.registerFrontend(...)`. Every form renders with it. |
| `chatflow/frontend.css` | Loaded inside the chat's shadow root, after the built-in styles. Works with the built-in chat or your own. |
| `chatflow/frontend-{form-slug}.js` / `.css` | Only for that form; wins over `frontend.js`. |
| `chatflow/frontend-{form-id}.js` / `.css` | Same, by form ID. |

The child theme is searched first, then the parent theme. Files are versioned by
their modification time, so browsers pick up changes immediately.

A complete, working example (a one-question-at-a-time card) lives in
[`examples/child-theme`](../examples/child-theme): copy it to `wp-content/themes/`,
or copy its `chatflow/` folder into your own child theme.

## Writing `frontend.js`

```js
window.ChatFlow.registerFrontend(({ api, root, close, mode }) => {
  const draw = state => {
    root.innerHTML = '';
    const step = state.activeStep;
    if (!step) return;
    for (const message of step.messages ?? []) {
      const p = document.createElement('p');
      p.innerHTML = api.html(api.markdown(message)); // safe: escaped, links filtered
      root.append(p);
    }
    if (step.type === 'single_choice') {
      for (const option of step.options) {
        const button = document.createElement('button');
        button.textContent = option.label;
        button.onclick = () => api.answer(option.value);
        root.append(button);
      }
    }
  };
  draw(api.getState());
  return api.subscribe(draw); // the returned function is called on unmount
});
```

- `root` is your container **inside the form's shadow root**: page and theme CSS
  do not reach it, so style it with `chatflow/frontend.css`.
- Launcher and popup modes keep the plugin's launcher button and panel; your UI
  renders inside the panel. Call `close()` to close it.
- Use any framework you like (bundle it into `frontend.js`), or plain DOM code as
  in the example.

### State (`api.getState()`)

| Field | Meaning |
| --- | --- |
| `phase` | `loading`, `resume` (saved progress found), `ready`, `submitting`, `done` or `error`. |
| `activeStep` | The step to show, with `type`, `label`, `messages`, `options`, `validation`, `settings`. `null` on the final review (show a summary and a submit button) and after submitting. |
| `steps` | Steps shown so far, ending with the active one. |
| `answers`, `progress` | Answers by field key; progress 0–100. |
| `busy`, `offline`, `conflict`, `newerVersion` | Disable buttons while busy; show notices otherwise. |
| `error`, `fieldError` | Phrase keys; show `api.phrase(key)`. |
| `canSkip` | The active optional step can be skipped. |
| `completion` | After submitting: ending `messages` (Markdown) and `buttons` (`url` already safe). |
| `contact`, `contactClosedMessage` | The direct contact button (already filtered by its working hours), or the message to show outside them. |

### Actions

`api.answer(value)` (string, number, boolean or string[] by field type) ·
`api.next()` (acknowledge a statement, confirm the review step) · `api.skip()` ·
`api.back()` · `api.edit(stepId)` · `api.submit()` · `api.restart()` ·
`api.retry()` · `api.continueSaved()` · `api.resolveConflict(keepThisTab)` ·
`api.upload(file)` · `api.contactClicked()`.

Statement steps continue by themselves in the built-in chat unless the builder's
*Wait for the visitor to press a button* is ticked (`settings.autoContinue === false`);
the example shows how to do the same.

### Helpers

| Helper | Use |
| --- | --- |
| `api.phrase(key)` | Translated UI text (honours the form's phrase overrides). |
| `api.text(template)` | Merge tags replaced with answers, as plain text. Use for labels and button text. |
| `api.markdown(template)` + `api.html(markdown)` | Bot messages: merge tags (escaped) then **bold**, *italic* and safe links only. The only HTML you should insert with `innerHTML`. |
| `api.link(template)` | A link with merge tags URL-encoded; `null` unless http(s), mailto: or tel:. |
| `api.inputValue(step)`, `api.answerLabel(step, value)` | Pre-fill values; readable answers (option labels). |

`api.version` is `1`. New fields may be added; existing ones keep their meaning.

## Safety net

- If `frontend.js` fails to load, throws, or has not registered within 4 seconds,
  visitors get the built-in chat instead, never a blank form.
- The built-in honeypot is not rendered by custom frontends; captcha, minimum
  completion time, rate limits and server-side validation still apply.
- Never insert answers or other text with `innerHTML` except through `api.html()`.

## Preview and turning it off

- The builder's preview loads your theme's `frontend.js` / `frontend.css`, so you
  see your UI while editing. Per-form files apply on the site only.
- Filters: `cff_theme_frontend_directories` (where to look, `path => URL`) and
  `cff_theme_frontend_asset` (`$url, $type, $form`; return `null` to use the
  built-in chat for a form).
