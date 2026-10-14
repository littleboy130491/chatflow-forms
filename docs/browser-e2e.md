# Browser acceptance suite

The browser suite runs against an **actual WordPress server**, not jsdom or a
mocked REST API. It covers template creation/publishing in wp-admin,
conditional branching, persistent resume across full navigation, mobile and
desktop submission completion, floating launcher lazy initialization,
popup dismissal/timed opening, and page-targeted site-wide placement.

## Run locally

Requirements: Docker Compose, PHP 8.1/Composer 2, Node 24.18+/npm 11.16+.

```sh
composer install --no-interaction --prefer-dist
composer scope
npm ci --no-audit --no-fund
npm run build
npm install --no-save --no-package-lock @playwright/test@1.56.1
npx playwright install chromium
npm run env:start
node tools/wp-env.mjs run cli --env-cwd=wp-content/plugins/chatflow-forms env CFF_E2E=1 wp eval-file tests/e2e/seed.php
npm run test:e2e
npm run env:stop
```

The WordPress server is expected at `http://localhost:8888` (override via
`CFF_E2E_BASE_URL`). Browser tests use default disposable wp-env admin
credentials (`admin`/`password`); **never run them against production**.
The seeding script refuses non-local sites or execution without `CFF_E2E=1`.

Two projects use Chromium, one desktop and one mobile-emulated (Pixel 7).
The mobile emulation checks viewport/touch behavior; it is **not** a real
mobile device or an audited accessibility test.

Artifacts (screenshots/traces on failure) are saved under
`tests/e2e/artifacts` and uploaded by GitHub Actions after failures.

## What these tests do not prove

- Real phone behavior (mobile is emulated), screen reader and accessibility
  audit, or usability with customers on different browsers.
- Actual email inbox or outbound webhook receipt.
- Apache/nginx variants, caching/CDN optimizers, Cloudflare WAF, real cron,
  and compatibility across WordPress/PHP versions.
- Accurate external analytics from ad/marketing pixels, or real providers'
  CAPTCHA integrations.

Those require separate acceptance checks and real integration environments.
