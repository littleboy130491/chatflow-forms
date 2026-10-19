/** Run the unchanged existing visitor journeys with local-only network guard. */
import { test, expect } from '@playwright/test';
import './visitor.spec';
test.beforeEach(async ({page,baseURL})=>{
 expect(baseURL).toBe('http://localhost:8892');
 await page.route('**/*',route=>['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
});
