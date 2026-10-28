import { describe, expect, it } from 'vitest';
import { blankForm, makeStep } from '../../../assets/src/builder/model';
import { exportForm, parseFormFile } from '../../../assets/src/builder/formIO';
import { exportOptions } from '../../../assets/src/submissions/model';

describe('Phase two admin contracts', () => {
  it('creates new visitor fields using coordinated defaults without enabling unavailable registry types', () => {
    for (const type of ['rating', 'scale', 'nps'] as const) expect(makeStep(type,[]).validation).toBeUndefined();
    expect(makeStep('slider',[]).validation).toEqual({min:0,max:100,step:1});
    expect(makeStep('address',[]).settings?.addressFields).toEqual(['street','city','postcode','country']);
  });
  it('exports no webhook header credentials and disables destinations without mutating draft', () => {
    const form = blankForm();
    form.settings.integrations = { webhooks: [{id:'hook_one',url:'https://example.test/hook',events:['completed'],enabled:true,secret:'fixture-secret',headers:{Authorization:'fixture-token'}}] };
    const file = exportForm(form);
    expect(file.settings.integrations?.webhooks?.[0]).toMatchObject({enabled:false,secret:'',headers:{}});
    expect(form.settings.integrations?.webhooks?.[0]?.headers?.Authorization).toBe('fixture-token');
    expect(parseFormFile(JSON.stringify(file)).format).toBe('chatflow/form');
  });
  it('uses exact CSV/XLSX private export contract and snapshots filters', () => {
    const filters = {formId:42,status:'completed' as const};
    expect(exportOptions(filters,[],['name'],'keys',',').format).toBe('csv');
    const options = exportOptions(filters,[23],['name'],'labels',';','xlsx');
    expect(options).toMatchObject({formId:42,format:'xlsx',ids:[23]});
    filters.formId = 43;
    expect(options.filters.formId).toBe(42);
  });
});
