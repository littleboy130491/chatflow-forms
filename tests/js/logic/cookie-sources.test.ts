import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { allowedCookieSource, cookieSourceMessage } from '../../../assets/src/shared/cookies';
import { diagnoseSchema } from '../../../assets/src/shared/logic';
import type { FormSchema } from '../../../assets/src/shared/contracts';
const cases = JSON.parse(readFileSync('tests/fixtures/cookie-sources.json', 'utf8')) as {name:string;allowed:boolean}[];
it.each(cases)('fails closed for cookie $name', ({name,allowed}) => {
  expect(allowedCookieSource(name)).toBe(allowed);
  const schema: FormSchema = {schemaVersion:1,bot:{name:'Test'},steps:[{id:'cookie',key:'cookie',label:'Cookie',type:'hidden',messages:[],settings:{source:'cookie',sourceKey:name}}],endings:[{id:'done',type:'message',messages:['Done']}]};
  expect(diagnoseSchema(schema)).toEqual(allowed ? [] : [{path:'/steps/0/settings/sourceKey',code:'restricted_cookie',message:cookieSourceMessage}]);
});
