# Submissions / global admin UX evidence

Branch: `feat/admin-ux-submissions`. Base: `b0ba28d`.

## Audit reviewed

Read `/home/hermes/chatflow-qa/findings.json` and inspected screenshots
`20-submissions.png`, `20-settings.png`, `21-submission-detail-loaded.png`.
Addressed inbox/configuration hierarchy, raw identifiers/operators/dates, global
settings task grouping, row-checkbox semantics, and safe Tools entry.

## RED → GREEN execution

Actual Vitest runs, before implementation of each slice:

- Inbox/disclosures: 2 failures (missing Columns and Advanced filters disclosures)
  → 2 passing tests after implementation.
- Global settings: 1 failure (missing Settings sections navigation), 2 existing
  tests passing → 3 passing. Test now edits General, switches to Notifications,
  saves, and verifies the complete payload including hidden secret masks,
  privacy, retention, email and proxy fields.
- Detail: 1 failure (UUID/entity-encoded title used as heading), 3 passing →
  4 passing; checks notes/activity separation and clipboard UUID metadata.
- Analytics/Tools: 2 failures (encoded form option and destructive default entry),
  4 passing → 6 passing.
- Frozen inbox labels: 1 failure (raw key rather than question label), 6 passing
  → 7 passing. Uses the existing permission-checked submission detail endpoint,
  not a manage_forms-only API.
- Layout: 2 assertion failures (missing content alignment/sticky save and mobile
  grid rule) → 2 passing layout tests. An initial test harness URL error was
  corrected before recording these actual assertion failures.
- Export-only picker: 1 failure (search input offered despite export-forms not
  supporting search) → passing. Export-only users get paging, without a fake
  search or unauthorized analytics request.

Final targeted command:

```
./node_modules/.bin/vitest run tests/js/admin-inbox-ux.test.tsx tests/js/admin-inbox-ux-layout.test.ts
```

Result: **2 files, 12 tests passed**. Additional regressions cover UTC timestamp
interpretation, all operator labels, safe entity decoding, and retaining a
selected form across option pages.

Other verification:

- `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`: PASS.
- `./node_modules/.bin/eslint assets/src/submissions tests/js/admin-inbox-ux*`: PASS.
- `git diff --check`: PASS.
- Final full Vitest run: **492 passed, 1 failed, 493 total**. Only failure: existing `tests/js/admin/i18n.test.ts`
  requires catalog coverage of new translated strings (first: `Overview · UTC`).
  No test was weakened or excluded. Translation catalogs are outside ownership.

## Integration handoff / limitations

- No build, PHP edits, schema/API changes, package changes, deploy, push or PR.
  Parent owns build/package/staging browser verification and fresh screenshots.
- Existing `node_modules` was reused through an untracked symlink; do not stage it.
- Inbox enrichment issues one additional GET per distinct form/version on the
  loaded page. It only keeps titles/question labels in component state. A missing
  or denied frozen snapshot falls back to field keys/form number without blocking
  the inbox. GET detail was checked to be read-only (does not mark responses read).
- Filters retain all previous operator values and fields, capability conditions,
  confirmation prompts and export payload semantics. Advanced controls stay
  mounted inside native details; settings sections stay mounted with `hidden`;
  saving still sends the entire settings object, not the visible section.
- Purge's existing dedicated criteria UI is not redesigned; Tools now defaults
  to Export / Import / System status, or the audit log for purge-only users.
- Layout tests verify CSS contracts/computed desktop properties in jsdom, not
  actual mobile pixel layout. Staging real-browser verification remains needed.

## New strings requiring parent-owned catalog coverage

All production strings use existing `__` translation patterns:

- Advanced
- Advanced filters
- Aggregate reports use UTC calendar days. The form funnel below uses the site timezone, so daily boundaries and totals may differ.
- All settings saved.
- Columns
- Contains
- Copy response ID
- Does not equal
- Equals
- Field keys
- Find more forms
- General
- Greater than
- Greater than or equal to
- Integrations and AI
- Is empty
- Is not empty
- Less than
- Less than or equal to
- Notifications
- Overview · UTC
- Privacy and retention
- Response
- Response ID
- Save applies to all sections.
- Settings sections
- Site timezone: %s
- Site-wide defaults and services. Individual forms can override supported defaults in their own Settings.
- Technical activity
- Technical details
