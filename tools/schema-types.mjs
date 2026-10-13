import { compileFromFile } from 'json-schema-to-typescript';
import { writeFile } from 'node:fs/promises';
const options = { bannerComment: '/* Generated from schema/*.schema.json. Run npm run schema:types. */', additionalProperties: false };
await writeFile('assets/src/shared/schema.generated.ts', await compileFromFile('schema/form.schema.json', options));
await writeFile('assets/src/shared/settings.generated.ts', await compileFromFile('schema/settings.schema.json', options));
