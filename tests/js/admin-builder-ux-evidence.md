# Builder UX verification

Worktree: `/home/hermes/chatflow-builder-ux`, branch `feat/admin-ux-builder`.
No dependency changes, full asset build, PHP/catalog changes, deployment or push.
`node_modules` is an untracked symlink to the parent install and is not committed.

## RED → GREEN evidence

Each slice below was added to the named tests before its implementation, and run
with `node_modules/.bin/vitest run` before changing production code.

| Slice | RED command / expected failure | GREEN evidence |
| --- | --- | --- |
| Contextual inspector | `tests/js/admin-builder-ux.test.tsx` — Statement exposed Placeholder / Required / Keyboard hint | Same file passed after hiding input-only controls and disclosing technical settings |
| Summary cards / palette / responsive editing | same file — card contained an editable `input` | Same file + `tests/js/admin/builder.test.tsx`: 6 passed |
| Share publishing gate and modes | same file — draft exposed `/chat//`, QR rendered immediately | Same file: 4 passed after Share implementation |
| Publish confirmation / success | same file `-t 'explains publishing'` — missing draft Share state | Same file + existing builder tests: 9 passed, including save-before-publish and live-version status |
| Task-based settings / inheritance | same file `-t 'groups settings'` — no settings section navigation | Same file + existing components/release controls: 32 passed |
| Flow labels / default contrast | `tests/js/admin-builder-ux-map.test.tsx` — raw `end_internal_123`; default contrast 3.3116 below 4.5 | Included in final passing suite |
| Mobile focus | main test file `-t 'moves keyboard focus'` — focus remained on body instead of Back to flow | Included in final passing suite |
| Question-first inspector / clear preview transition | main test file `-t 'leads with\|draft preview transition'` — label outside Advanced; machine-oriented preview title | Included in final passing suite |

The map test was corrected to compare normalized (trimmed) accessible text and
assert bounded width + wrapping, rather than clipping the connection handles.
The contrast RED was rerun using the real runtime fallback after the first test
attempt passed an absent optional colour to the contrast function.

## Final checks

- `node_modules/.bin/vitest run --exclude tests/js/admin/i18n.test.ts`
  - **26 test files, 490 tests passed.**
- `npm run typecheck`
  - **PASS** (both admin and runtime TypeScript projects).
- `node_modules/.bin/eslint assets/src/builder tests/js/admin-builder-ux*.tsx`
  - **PASS**, no warnings/errors.
- `git diff --check`
  - **PASS**.

## Integration limitations / handoff

- The existing `tests/js/admin/i18n.test.ts` requires every new English string in
  the bundled Indonesian catalogs. It fails on new builder strings (first
  reported: `Redirect to website`). Catalogs are expressly outside this branch's
  ownership; the parent must regenerate/update them during integration. Existing
  tests were not weakened or edited.
- New light/auto forms and the Sky palette get an AA-safe blue accent. Existing
  saved colours and explicit global default colours are deliberately preserved.
  Dark messaging uses fixed runtime colours outside the owned builder surface;
  this change does not claim to repair that separate runtime palette.
- No full build or live staging browser claims here. Parent owns aggregated ZIP,
  staging installation, desktop/tablet/mobile browser verification and screenshots.
- Existing FormStart/mountFormStart and forms-list.ts are untouched; parent can
  integrate its Forms chooser independently.
