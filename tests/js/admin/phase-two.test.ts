import { describe, expect, it } from 'vitest';
import { blankForm, makeStep } from '../../../assets/src/builder/model';
import { exportForm, parseFormFile } from '../../../assets/src/builder/formIO';
import { pageIds } from '../../../assets/src/builder/EngagementSettings';
import { exportOptions } from '../../../assets/src/submissions/model';

describe('Phase two admin contracts', () => {
  it('creates new visitor fields using coordinated defaults without enabling unavailable registry types', () => {
    expect(makeStep('rating',[]).validation).toEqual({min:1,max:5});
    expect(makeStep('scale',[]).validation).toEqual({min:1,max:10});
    expect(makeStep('nps',[]).validation).toEqual({min:0,max:10});
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
  it('accepts only bounded positive integer page IDs and deduplicates', () => {
    expect(pageIds('1, 12,1')).toEqual([1,12]);
    expect(pageIds('')).toEqual([]);
    for (const value of ['-1','0','1.2','2e2','1 or 1=1','9007199254740993',Array(501).fill('1').join(',')]) expect(pageIds(value)).toEqual([]);
  });
});
