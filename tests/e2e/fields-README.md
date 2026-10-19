# Isolated all-field browser coverage

These tests require a **disposable native WordPress**, `http://localhost:8892`, database `chatflow_fields_test`. They refuse other hosts/databases. Install the **packaged ZIP** before running; do not point WordPress at this source checkout. No dependency/build changes or node_modules symlink are needed.

Current local fixture:

- WP: `/home/hermes/chatflow-qa/iteration-2/wp-fields`
- Private upload/export storage: `/home/hermes/chatflow-qa/iteration-2/private-fields/storage` (outside webroot, configured before activation)
- Private mode-600 credentials/env: `/home/hermes/chatflow-qa/iteration-2/private-fields/{credentials.json,e2e.env}`
- Server: `wp --path=/home/hermes/chatflow-qa/iteration-2/wp-fields server --host=localhost --port=8892`

From this worktree:

```sh
source /home/hermes/chatflow-qa/iteration-2/private-fields/e2e.env
python3 tools/fixtures/qa-fields-run.py --seed
```

The runner reuses installed Playwright from `CFF_FIELDS_NODE_MODULES` (default `/home/hermes/chatflow-forms/node_modules`) through a disposable Node 24 ESM resolver outside the repository. Optional `CFF_FIELDS_WP_PATH`, `CFF_FIELDS_RESULTS_DIR`, and `CFF_E2E_CHROMIUM_EXECUTABLE` configure local paths. Visitors run anonymously; the runner does not read admin credentials. No passwords are embedded or reset. `seed.php` is **never executed**.

`qa-fields-seed.php` validates/publishes 21 independent field fixtures using the real repository API, plus a pinned-version fixture and safe copies of the existing visitor journey pages. Re-seeding creates new forms and points the deterministic page slugs to them; use only this disposable database. Notifications are not delivered externally. All browser requests to non-loopback hosts are aborted. The existing WhatsApp link is checked, never followed.

`fields-all.spec.ts` answers real frontend controls and reads completed answers back from WordPress. Coverage includes required/invalid inputs, phone +62 normalization, numeric min/max/step, date min/max, single-choice Other, multi-choice min/max, boolean false, consent, scores, configured slider, address, local raster media, oversized rejection/valid private text upload, hidden/calculated persisted values, display-only statement/summary, back/edit/restart/resume, and old published-schema pinning after republish.

`fields-existing.spec.ts` imports **unchanged** `visitor.spec.ts` and adds only the loopback network/base-URL guard. Its branching/resume/completion, numeric scores, launcher delayed handshake/focus, popup/backdrop/auto-open, and sitewide targeting are identified separately in reports; they are not claimed as new all-field coverage.

The runner opts into `CFF_FIELDS_QA=1`, which collects only the native `fields-*.spec.ts` entry points. Default wp-env E2E collection excludes those wrappers and uses the original visitor entry point, preventing Playwright's duplicate test-file import error. For direct native-field CLI runs, set `CFF_FIELDS_QA=1`; do not export that mode for unrelated test suites.

Outputs: `fields-final-run.json`, incremental `fields-runs.jsonl`, `fields-results.json`, `fields-result.md`, and representative desktop/mobile `fields-*.png` under the results directory. The report maps canonical `field.*`, selected `display.*`, and `sessions.*` IDs and records exact test name/project and actual **browser** evidence level. No claim for physical devices, fullpage, block, Elementor, offline/idempotency, or magic-link delivery.

To rerun against another package: replace only the installed ZIP on the disposable WordPress, reactivate if needed, keep private storage configuration, and rerun `qa-fields-run.py --seed`. Do not rebuild/copy source into the plugin directory. Keep the baseline JSON/screenshot evidence if comparing packages.
