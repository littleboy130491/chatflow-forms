# Builds, release and private updates

`composer install` restores locked developer/build dependencies. `composer scope`
copies only runtime requirements/transitives into vendor-prefixed, runs the
PUC-specific namespace repair (its manual major-version alias and bundled parsers
are not discovered by Strauss), and tests isolated scoped autoload plus changelog
parsing. Action Scheduler intentionally keeps its official shared-loader path
under vendor/woocommerce/action-scheduler; it is not renamed or independently
booted later than plugins_loaded. Production never loads vendor/autoload.php.

`npm ci` and `npm run build` produce build/admin/*.js/.asset.php via WordPress
webpack with externalized wp-element/wp-i18n, and build/runtime/*.js as Preact ES
modules via Vite. Generated TS schemas are committed for lane imports; CI verifies
regeneration produces no difference. Admin exports are under
window.CFFAdmin.{builder,submissions,blocks}; visitor exports mountRuntime.
WordPress npm packages are build/type-only devDependencies: WordPress supplies
their runtime scripts, and dependency-extraction manifests externalize them.
The dev-toolchain simple-git override pins the patched 4.0.2 security release;
Docker environment startup and both WordPress suites validate compatibility.
No forced peer resolution is used. Production npm audit is clean. Upstream
dev-only advisories (not shipped) remain in the WordPress build/lint toolchain;
do not run builds against untrusted repositories or patterns.

`npm run package` requires all build/dependency prerequisites and emits
build/chatflow-forms.zip with exactly one chatflow-forms/ root. It includes plugin
bootstrap/uninstall/autoload, src/, schema/, build/admin, build/runtime,
vendor-prefixed with licences, shared Action Scheduler and its licence, README,
LICENSE and composer.json. It excludes node_modules, development Composer vendor,
tests, source TS, PLAN, repository/workflow files, caches, credentials and logs.
No symlinks are allowed. Packaging uses PHP PharData/ZIP with zlib compression.

CI runs locked installs, scope isolation, PHP unit/static/style checks,
TypeScript/lint/Vitest, reproducible type generation, builds/package validation,
and disposable WordPress single-site/multisite integration suites. The tag release
workflow calls those checks before rebuilding/uploading the asset. Actions use
immutable commit references. No branch protection/security gate is bypassed.

To release: update the plugin header, CFF_VERSION, composer/package version metadata
and README status, commit with regenerated locks/build contracts, then create a
matching `vX.Y.Z` tag. The release job rejects a tag/version mismatch. No tag or
release was created by the Phase 0 implementation task. Existing release assets
are never silently overwritten. Normal changes do not automatically make a release.

The updater uses scoped plugin-update-checker 5.6 and GitHub release assets with
the exact name chatflow-forms.zip. Read access is via `CFF_GITHUB_TOKEN` **constant
only**; configure it outside the plugin. The library uses authenticated GitHub
asset API URLs for private assets and strips authentication on redirected hosts.
Updates are rejected if they point at a source archive. Live authenticated GitHub
update/download has not been tested here; no private token/release was required to
build or validate the foundation. Local mock tests cover release URL filtering and
scoped updater creation, and the generated zip can be installed with WP-CLI.
