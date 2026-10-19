#!/usr/bin/env python3
"""Run only local field fixtures and existing visitor journeys without node_modules links."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--seed', action='store_true', help='Create fresh local forms/pages; never changes credentials')
args = parser.parse_args()
repo = Path(__file__).resolve().parents[2]
wp = os.environ.get('CFF_FIELDS_WP_PATH', '/home/hermes/chatflow-qa/iteration-2/wp-fields')
root = Path(os.environ.get('CFF_FIELDS_RESULTS_DIR', '/home/hermes/chatflow-qa/iteration-2'))
modules = Path(os.environ.get('CFF_FIELDS_NODE_MODULES', '/home/hermes/chatflow-forms/node_modules'))
env = dict(os.environ)
env['CFF_E2E_BASE_URL'] = 'http://localhost:8892'
env['CFF_E2E'] = '1'
env['CFF_FIELDS_QA'] = '1'
env.setdefault('CFF_E2E_CHROMIUM_EXECUTABLE', '/home/hermes/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
# Refuse to seed/run against any accidentally supplied shared database or staging host.
subprocess.run(['wp', '--path='+wp, 'eval', "if (DB_NAME !== 'chatflow_fields_test' || home_url() !== 'http://localhost:8892') throw new RuntimeException('Not isolated fields WordPress.');"], env=env, check=True)
if args.seed:
    subprocess.run(['wp', '--path='+wp, 'eval-file', str(repo/'tools/fixtures/qa-fields-seed.php')], env=env, check=True)
root.mkdir(parents=True, exist_ok=True)
resolver = root/'fields-node-resolver.mjs'
resolver.write_text("import {registerHooks} from 'node:module';\nregisterHooks({resolve(s,c,n){return n(s==='@playwright/test'?"+json.dumps((modules/'@playwright/test/index.mjs').as_uri())+":s,c);}});\n")
env['NODE_OPTIONS'] = (env.get('NODE_OPTIONS','')+' --import '+str(resolver)).strip()
report = root/'fields-final-run.json'
with report.open('w') as out:
    result = subprocess.run([str(modules/'.bin/playwright'), 'test', '--config', 'tests/e2e/playwright.config.ts', 'fields-all.spec.ts', 'fields-existing.spec.ts', '--reporter=json'], cwd=repo, env=env, stdout=out)
subprocess.run([sys.executable, str(repo/'tools/fixtures/qa-fields-report.py'), str(report)], env=env, check=True)
print('Browser report:',report)
sys.exit(result.returncode)
