/**
 * Example custom ChatFlow frontend: one question at a time on a card.
 * Loaded by ChatFlow Forms from the active theme's chatflow/frontend.js, after the runtime.
 * The plugin still handles sessions, validation, branching, spam checks and submission;
 * this file only draws the UI with the api described in docs/custom-frontend.md.
 */
const h = (tag, props = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'html') node.innerHTML = value; // only ever api.html() output, which is escaped
    else if (value !== false && value !== null && value !== undefined) node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat(Infinity).filter(child => child !== null && child !== false && child !== undefined));
  return node;
};

window.ChatFlow.registerFrontend(({ api, root }) => {
  const t = key => api.phrase(key);
  const bubble = message => h('p', { class: 'cf-message', html: api.html(api.markdown(message)) });

  const input = (step, state) => {
    const value = api.inputValue(step);
    const busy = state.busy;
    const choices = step.type === 'yes_no' ? [{ value: true, label: t('yes') }, { value: false, label: t('no') }] : (step.options ?? []);
    switch (step.type) {
      case 'statement':
        if (step.settings?.autoContinue !== false) return null;
        return h('button', { class: 'cf-primary', disabled: busy, onClick: () => api.next() }, step.settings?.buttonLabel ?? t('continue'));
      case 'single_choice': case 'yes_no':
        return h('div', { class: 'cf-choices', role: 'group', 'aria-label': step.label },
          choices.map(option => h('button', { class: 'cf-choice', disabled: busy, onClick: () => api.answer(option.value) }, option.label)));
      case 'multi_choice': {
        const picked = new Set(Array.isArray(value) ? value : []);
        return h('form', { class: 'cf-choices', onSubmit: event => { event.preventDefault(); api.answer([...picked]); } },
          choices.map(option => h('label', { class: 'cf-check' }, h('input', { type: 'checkbox', checked: picked.has(option.value), onChange: event => event.target.checked ? picked.add(option.value) : picked.delete(option.value) }), option.label)),
          h('button', { class: 'cf-primary', disabled: busy }, t('continue')));
      }
      case 'rating': case 'scale': case 'nps': {
        const [min, max] = step.type === 'nps' ? [0, 10] : step.type === 'rating' ? [1, 5] : [1, 10];
        return h('div', { class: 'cf-scale', role: 'group', 'aria-label': step.label },
          Array.from({ length: max - min + 1 }, (_, i) => h('button', { class: 'cf-choice', disabled: busy, onClick: () => api.answer(min + i) }, String(min + i))));
      }
      case 'slider': {
        const min = step.validation?.min ?? 0, max = step.validation?.max ?? 100;
        const range = h('input', { type: 'range', name: 'value', min, max, step: step.validation?.step ?? 1, 'aria-label': step.label });
        range.value = typeof value === 'number' ? value : min;
        const shown = h('output', {}, range.value);
        range.addEventListener('input', () => { shown.textContent = range.value; });
        return h('form', { class: 'cf-field', onSubmit: event => { event.preventDefault(); api.answer(Number(range.value)); } }, range, shown, h('button', { class: 'cf-primary', disabled: busy }, t('continue')));
      }
      case 'consent':
        return h('form', { onSubmit: event => { event.preventDefault(); api.answer(event.target.elements.agree.checked); } },
          h('label', { class: 'cf-check' }, h('input', { type: 'checkbox', name: 'agree' }), h('span', { html: api.html(api.markdown(step.settings?.consentText ?? step.label)) })),
          h('button', { class: 'cf-primary', disabled: busy }, t('continue')));
      case 'short_text': case 'long_text': case 'email': case 'phone': case 'number': case 'date': {
        const type = { email: 'email', phone: 'tel', number: 'number', date: 'date' }[step.type] ?? 'text';
        const field = step.type === 'long_text'
          ? h('textarea', { name: 'value', rows: 4, 'aria-label': step.label, placeholder: step.placeholder ?? '' })
          : h('input', { name: 'value', type, 'aria-label': step.label, placeholder: step.placeholder ?? '' });
        field.value = value ?? '';
        return h('form', { class: 'cf-field', onSubmit: event => { event.preventDefault(); const raw = event.target.elements.value.value; api.answer(step.type === 'number' ? (raw === '' ? null : Number(raw)) : raw); } },
          field, h('button', { class: 'cf-primary', disabled: busy }, t('continue')));
      }
      default:
        return h('p', { class: 'cf-note' }, t('unsupported'));
    }
  };

  const review = state => h('section', { class: 'cf-review' },
    h('h2', {}, t('summary')),
    h('dl', {}, state.steps.filter(step => step.key in state.answers && !['statement', 'summary', 'media'].includes(step.type)).map(step => [
      h('dt', {}, step.label),
      h('dd', {}, api.answerLabel(step, state.answers[step.key]), ' ', h('button', { class: 'cf-link', onClick: () => api.edit(step.id) }, t('edit'))),
    ])),
    h('button', { class: 'cf-primary', disabled: state.busy || state.offline, onClick: () => api.submit() }, t('submit')));

  // Statements continue by themselves unless the builder ticked "wait for a button" (autoContinue: false).
  let advancedFrom = null;
  const autoContinue = state => {
    const step = state.activeStep;
    if (step?.type !== 'statement' || step.settings?.autoContinue === false || advancedFrom === step.id || state.busy) return;
    advancedFrom = step.id;
    setTimeout(() => api.next(), 900);
  };

  const draw = state => {
    const card = h('div', { class: 'cf-card', 'aria-busy': state.busy ? 'true' : 'false' });
    card.append(h('div', { class: 'cf-progress' }, h('span', { style: `width:${state.progress}%` })));
    if (state.error) card.append(h('div', { class: 'cf-error', role: 'alert' }, t(state.error), ' ', h('button', { class: 'cf-link', onClick: () => api.retry() }, t('retry'))));
    if (state.phase === 'loading' || state.phase === 'submitting') card.append(h('p', { class: 'cf-note', role: 'status' }, t('loading')));
    else if (state.phase === 'resume') card.append(h('p', {}, t(state.newerVersion ? 'newerVersion' : 'welcomeBack')),
      h('button', { class: 'cf-primary', onClick: () => api.continueSaved() }, t('continue')), ' ',
      h('button', { class: 'cf-link', onClick: () => api.restart() }, t('startOver')));
    else if (state.phase === 'done' && state.completion) card.append(...state.completion.messages.map(bubble),
      ...state.completion.buttons.filter(button => button.url).map(button => h('a', { class: 'cf-primary', href: button.url, target: '_blank', rel: 'noopener noreferrer' }, api.text(button.label))));
    else if (state.phase === 'ready' && state.activeStep) {
      const step = state.activeStep;
      card.append(...(step.messages ?? []).map(bubble));
      if (step.type === 'summary') card.append(review(state));
      else card.append(input(step, state));
      if (state.fieldError) card.append(h('p', { class: 'cf-error', role: 'alert' }, t(state.fieldError)));
      card.append(h('nav', { class: 'cf-nav' },
        h('button', { class: 'cf-link', onClick: () => api.back() }, t('back')),
        state.canSkip ? h('button', { class: 'cf-link', onClick: () => api.skip() }, t('skip')) : null));
    } else if (state.phase === 'ready') card.append(review(state));
    if (state.contact) card.append(h('a', { class: 'cf-contact', href: state.contact.url, target: '_blank', rel: 'noopener noreferrer', onClick: () => api.contactClicked() }, state.contact.label));
    else if (state.contactClosedMessage) card.append(h('p', { class: 'cf-note' }, state.contactClosedMessage));
    root.replaceChildren(card);
    autoContinue(state);
    root.querySelector('input:not([type=checkbox]), textarea')?.focus({ preventScroll: true });
  };

  draw(api.getState());
  return api.subscribe(draw);
});
