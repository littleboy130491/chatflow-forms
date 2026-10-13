# ChatFlow Forms — Phase 0

Private WordPress plugin foundation; PHP 8.1+, WordPress 6.4+. This is not yet a
usable chat/form builder. Bootstrap, per-site migrations/capabilities, protected
form CPT, schema validation/publishing, signed tokens, scoped dependencies,
private updater and release packaging work. Admin/runtime entrypoints are clearly
labelled stubs; REST, embedding, logic, submissions, jobs and email belong to the
next five lanes. No licence system, telemetry, native CRM connectors, payments or
AI chat. PLAN.md is untouched.

## Development

Use Composer 2, Node 24.18+, npm 11.16+, Docker with Compose. Both dependency
locks are committed; use install/ci, never ignore peer-dependency errors.

```sh
composer install --no-interaction
composer scope
npm ci --no-audit --no-fund
npm run build
composer test
composer analyse
composer lint
npm run typecheck
npm run lint
npm test
npm run env:start
npm run test:wp
npm run test:wp:multisite
npm run env:stop
npm run package
```

wp-env pins WordPress 6.4.5/PHP 8.1 and separate disposable development/test
databases. Tests are shell-driven, not browser tests. Do not point the integration
suite at a production database. PHPUnit 9.6 is required by the WordPress 6.4 test
bootstrap. The plugin must not be installed directly from a source archive:
scoped vendor/build files are generated, not committed. Install the tagged
`chatflow-forms.zip` release asset; see docs/release.md.

## Foundation API example (trusted PHP)

```php
$forms = new \ChatFlow\Forms\FormRepository();
$form = $forms->create('Survey', $validated_schema, $private_settings);
if (!is_wp_error($form)) {
    $live = $forms->publish($form->id(), $form->draftRevision());
}
```

Controllers must check capabilities/nonces; repositories are internal services.
Do not directly write schema meta or expose private `Form::toArray()` publicly.
See docs/architecture.md for binding DTO/REST/token/replay/jobs/build contracts,
and docs/lanes.json for disjoint lane ownership. Canonical JSON schemas generate
the shared TypeScript types via `npm run schema:types`. PHP and TS structural
schema tests consume the same fixtures. The pure logic lane adds replay fixtures.

Multisite network activation upgrades each site and initializes new sites.
Deactivation cancels plugin work but keeps data. Uninstall keeps data unless each
site explicitly opts in using `cff_settings.delete_data_on_uninstall=true`; it
then deletes that site's plugin tables/forms and only plugin-added capabilities.

Private updates are disabled without the `CFF_GITHUB_TOKEN` PHP constant, set in
server configuration with read-only access to this repository. No environment,
option or query-string token fallback. Never commit the token. Updates only accept
the packaged GitHub release asset, not source zips or branch/tag fallbacks.
