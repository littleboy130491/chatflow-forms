# Shared deterministic logic contract

Each JSON file is a hand-specified `{name,schema,answers,context,mode,expected}`
replay case run unchanged by PHP and TypeScript. Supplementary operators,
interpolation and diagnostics are in `../logic-checks.json`. Expectations are not
generated from either engine. Pure tests require no WordPress/DB/browser/clock.

```sh
vendor/bin/phpunit tests/php/Logic
npx vitest run tests/js/logic
vendor/bin/phpstan analyse src/Logic src/Fields
vendor/bin/phpcs src/Logic src/Fields tests/php/Logic
npm run typecheck
npx eslint assets/src/shared tests/js/logic
```

`ChatFlow\Logic\Engine(new Registry())` and shared `replay` reconstruct the path
from zero every time. Variables are reset; only normalized visited answers survive.
Partial mode stops at the first absent input (even optional); `null` explicitly
skips an optional input. Complete mode permits omitted optional answers and stops
at missing/invalid required input. Consent remains required even after `unrequire`.
Statement/summary display steps never require or store answers. Unknown/unvisited,
display and tampered hidden values are reported/discarded, not silently persisted.
Server controllers must reject nonempty `errors`; runtime branch edits should prune
`discardedKeys` then replay. Loop warnings are diagnostics; actual revisits are a
`cff_logic_loop` failure, never an infinite traversal.

Hidden values derive from frozen `context.hidden[fieldKey]` first, then explicit
URL/meta/default/merge settings. Cookie sources must be resolved by the server into
`context.hidden`; engines never read cookies or globals. Inject validated UTC
`context.now` for age checks and private `context.defaultEndingId` for completion
settings. Future answers cannot affect earlier rules. Progress counts answered
inputs against the remaining estimated current path, omitting hidden/display/skipped
steps; unanswered conditional branches are estimates, not promises.

## Other choices

Existing canonical `option.isOther=true` enables free text for `single_choice`:
`{value:"configured-option-value",other:"plain text"}`. Exactly two string keys;
no option IDs, labels, extra properties or arbitrary objects. Text is sanitized,
nonempty when selected, and capped at 1000 Unicode characters. Normal choices stay
strings and `multi_choice` stays string[]; Other text on multi-choice is explicitly
unsupported. Conditions on answer operands and option rules use the configured
choice value; ordinary strict JSON equality is unchanged. Interpolation renders
`value: other`. No canonical schema addition is necessary. All HTML consumers must
escape interpolation after substitution; substitutions are plain text, nonrecursive,
and unknown tags are empty. URL interpolation encodes only placeholder values.

## Portable regex and validation limits

ASCII patterns <=512 characters, input <=4096 Unicode characters. Supports literal
characters, anchors, ASCII character classes/ranges, dot (excluding LF/CR/U+2028/
U+2029), ASCII `\d`, `\w`, `\s` and their complements, escaped punctuation,
fixed repetition <=1000 and **one** variable repetition (`?`, `*`, `+`, `{n,m}`).
Unbounded repetition requires both anchors. Groups, alternation, backreferences,
flags, lookarounds, repeated quantifiers and multiple variable repetitions are
rejected. This deliberately avoids browser catastrophic backtracking. Matching is
case-sensitive; `$` requires the actual end, not a position before a final newline.
Conditions have a defensive depth limit of 64. Date/age arithmetic uses strict
Gregorian dates and the injected UTC date, never the local clock. Numeric operators
do not coerce strings or booleans. Phone normalization is light E.164 (default ID),
not carrier/existence verification. MX checking is diagnosed as unsupported; no
network validation occurs in the pure engine.

## Integration

Compose Registry/Engine in the integrator's existing module wiring. No foundation,
schema or manifest edits belong to this lane. Public DTO additions coordinated with
backend/runtime are frozen session `context`, session `savePartial`, safe resolved
`form.media` URLs, and client `pageTitle`; private settings never enter the envelope.
The Indonesian summary fixture verifies field/replay behavior, not the complete
production survey/template supplied by the backend lane. Build checks on this branch
include foundation entrypoints; they are not integrated-runtime verification.
