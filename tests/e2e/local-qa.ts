export function shouldSkipLocalQa(optIn: string | undefined, artifactsExist: () => boolean) {
  return optIn !== '1' || !artifactsExist();
}

type LocalResponse = { url(): string; headers(): Record<string, string> };
type LocalRoute<R extends LocalResponse> = {
  request(): { url(): string };
  fetch(options: { maxRedirects: number }): Promise<R>;
  fulfill(options: { response: NoInfer<R> }): Promise<unknown>;
  abort(): Promise<unknown>;
};

// Fetch without following redirects: route.continue() alone does not intercept
// every hop of a redirect chain. Validate Location before the browser sees it.
export async function guardLocalRoute<R extends LocalResponse>(guard: ReturnType<typeof createLocalQaGuard>, route: LocalRoute<R>) {
  try {
    const requested = guard.assertUrl(route.request().url());
    const response = await route.fetch({ maxRedirects: 0 });
    guard.assertUrl(response.url());
    const location = response.headers().location;
    if (location) guard.assertUrl(new URL(location, requested).href);
    await route.fulfill({ response });
  } catch (error) {
    await route.abort();
    throw error;
  }
}

type LoginPage = {
  goto(url: string): Promise<unknown>;
  waitForLoadState(state: 'networkidle'): Promise<unknown>;
  url(): string;
};

export async function prepareLocalLogin<T>(guard: ReturnType<typeof createLocalQaGuard>, page: LoginPage, readAuth: () => T): Promise<T> {
  await page.goto(guard.assertUrl('/wp-login.php'));
  await page.waitForLoadState('networkidle');
  guard.assertUrl(page.url());
  return readAuth();
}

type QaEnvironment = { CFF_E2E?: string | undefined; CFF_E2E_BASE_URL?: string | undefined };

export function createLocalQaGuard(env: QaEnvironment) {
  if (env.CFF_E2E !== '1') throw new Error('Requires explicit CFF_E2E=1.');
  const selected = new URL(env.CFF_E2E_BASE_URL ?? 'http://127.0.0.1:8891');
  if (!['http:', 'https:'].includes(selected.protocol) || !['localhost', '127.0.0.1'].includes(selected.hostname) || selected.username || selected.password) {
    throw new Error('QA base must be credential-free HTTP(S) localhost or 127.0.0.1.');
  }
  const base = selected.origin;
  function assertUrl(value: string) {
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== base || url.username || url.password) throw new Error('QA URL must stay on the allowed local origin.');
    return url.href;
  }
  function validateFixture(value: unknown) {
    if (!value || typeof value !== 'object') throw new Error('Invalid QA fixture.');
    const f = value as Record<string, unknown>;
    if (!Number.isSafeInteger(f.formId) || Number(f.formId) <= 0 || typeof f.publicUrl !== 'string' || !f.pages || typeof f.pages !== 'object' || Array.isArray(f.pages)) throw new Error('Invalid QA fixture IDs or URLs.');
    const timestamp = typeof f.slug === 'string' ? /^qa-admin-functions-embed-(\d{8}-\d{6})$/.exec(f.slug)?.[1] : undefined;
    const formTitle = f.formTitle ?? (timestamp ? `QA admin-functions embed ${timestamp}` : undefined);
    if (typeof formTitle !== 'string' || !/^QA admin-functions embed \d{8}-\d{6}$/.test(formTitle)) throw new Error('Expected an exact QA fixture form title.');
    const pages: Record<string, string> = {};
    for (const [kind, url] of Object.entries(f.pages)) {
      if (typeof url !== 'string') throw new Error('Invalid QA fixture page URL.');
      pages[kind] = assertUrl(url);
    }
    return { ...f, blockRegistered: f.blockRegistered, elementorRegistered: f.elementorRegistered, elementorClass: f.elementorClass, formId: f.formId as number, formTitle, publicUrl: assertUrl(f.publicUrl), pages };
  }
  function assertFixtureForm(fixture: { formTitle: string }, actualTitle: string) {
    if (actualTitle !== fixture.formTitle) throw new Error('Refusing to mutate a form other than the exact expected QA fixture.');
  }
  return { base, assertUrl, validateFixture, assertFixtureForm };
}
