#!/usr/bin/env python3
"""Aggregate actual Playwright JSON reports; never infer pass from test presence.
Usage: python3 tools/fixtures/qa-fields-report.py /absolute/report.json [...]
Outputs to CFF_FIELDS_RESULTS_DIR (default isolated iteration-2 directory).
"""
import json
import os
from pathlib import Path
import sys

root = Path(os.environ.get('CFF_FIELDS_RESULTS_DIR', '/home/hermes/chatflow-qa/iteration-2'))
types = 'short_text long_text email phone number date single_choice multi_choice yes_no consent hidden statement summary rating scale nps slider address media file_upload calculated'.split()
runs = []
def collect(node, report):
    for spec in node.get('specs', []):
        for test in spec['tests']:
            runs.append({'test_name': spec['title'], 'file': spec['file'], 'project': test['projectName'], 'status': test['status'], 'report': str(report), 'errors': [result.get('error', {}).get('message', '') for result in test['results'] if result.get('error')]})
    for child in node.get('suites', []):
        collect(child, report)
for arg in sys.argv[1:]:
    collect(json.loads(Path(arg).read_text()), Path(arg))

def item(identifier, matching, note=''):
    selected = [run for run in runs if matching(run['test_name'])]
    # Latest explicitly supplied report wins per browser project and exact test name.
    latest = {(run['project'], run['test_name']): run for run in selected}
    evidence = list(latest.values())
    projects = {run['project'] for run in evidence}
    status = 'fail' if any(run['status'] not in ('expected', 'skipped') for run in evidence) else 'pass' if projects == {'desktop-chromium', 'mobile-chromium'} and all(run['status'] == 'expected' for run in evidence) else 'blocked'
    return {'id': identifier, 'status': status, 'evidence_level': 'browser' if evidence else None, 'evidence': evidence, 'notes': note}
items = [item('field.'+t, lambda title, t=t: title == f'fields {t}: real visitor validation and persisted completion', 'Visitor input via real Chromium; completed answers read back from isolated native WordPress database. Display-only types assert no answer persisted.') for t in types]
selectors = {
 'display.inline': lambda n: n.startswith('a visitor can branch'),
 'display.launcher': lambda n: n.startswith('launcher defers'),
 'display.popup': lambda n: n.startswith('popup supports'),
 'display.auto_targeting_triggers': lambda n: n.startswith(('popup supports', 'site-wide targeting')),
 'sessions.resume_same_device': lambda n: n.startswith(('a visitor can branch', 'fields navigation:')),
 'sessions.back_edit_restart': lambda n: n.startswith('fields navigation:'),
 'sessions.pinned_versions': lambda n: n.startswith('fields pinned versions:'),
}
items += [item(k, v, 'Existing visitor.spec.ts journey (unchanged) unless test name starts fields; not a claim for unrelated admin or integration features.') for k, v in selectors.items()]
assert len([i for i in items if i['id'].startswith('field.')]) == 21
package_path = root/'fields-package.json'
result = {'base_url': 'http://localhost:8892', 'wp_path': '/home/hermes/chatflow-qa/iteration-2/wp-fields', 'package': json.loads(package_path.read_text()) if package_path.exists() else None, 'items': items, 'runs': runs, 'limits': ['No external links clicked or messages delivered; non-local browser requests aborted.', 'No claim for fullpage/block/Elementor/magic-link/offline journeys, not exercised by these tests.']}
(root/'fields-results.json').write_text(json.dumps(result, indent=2))
lines = ['# Fields and visitor browser coverage', '', 'Isolated native WordPress: `http://localhost:8892`; database `chatflow_fields_test`.', 'Baseline packaged ZIP, no production changes. Tests cover desktop Chrome and Pixel 7 emulation (not physical-device testing).', '', '| Matrix ID | Status | Evidence level | Exact tests |', '|---|---|---|---|']
for entry in items:
    names = sorted({run['test_name'] for run in entry['evidence']})
    lines.append('| '+entry['id']+' | '+entry['status']+' | '+str(entry['evidence_level'])+' | '+'; '.join(names)+' |')
lines += ['', '## Evidence', '', '* `fields-results.json`: exact report paths, project, test and error per feature.', '* `fields-*-desktop-chromium.png` and `fields-*-mobile-chromium.png`: real frontend screenshots.', '* Existing inline/launcher/popup/auto-open/sitewide/branch/resume/score journeys are imported unchanged through `fields-existing.spec.ts`, with a local-only network guard.', '* New field tests include required/invalid text, email and phone; +62 persisted normalization; numeric bounds/step; date bounds; Other; multi-choice min/max; false yes/no; consent; configured scores/slider; address; local image; private file upload; hidden/calculated values; display-only statements/summary; navigation and pinned versions.', '', '## Limits', ''] + ['* '+limit for limit in result['limits']]
(root/'fields-result.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'fields': {s: sum(i['status'] == s for i in items[:21]) for s in ['pass','fail','blocked']}, 'runs': len(runs)}, indent=2))
