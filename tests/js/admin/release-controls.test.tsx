// @vitest-environment jsdom
import { act, type ReactNode, type ChangeEvent } from 'react';
import { createElement as h, createRoot } from '@wordpress/element';
import { afterEach, expect, it, vi } from 'vitest';
import { AdminApi } from '../../../assets/src/builder/api';
import { answerColumns, answerKeys, readAnswerColumns } from '../../../assets/src/submissions/answer-columns';
import { storedIp, uploadIds, downloadUpload } from '../../../assets/src/submissions/downloads';
import { exportDates } from '../../../assets/src/submissions/export-dates';
import { Detail } from '../../../assets/src/submissions/Detail';
import { Export } from '../../../assets/src/submissions/Export';
import type { AdminConfig } from '../../../assets/src/builder/api';
import type { SubmissionDetail, SubmissionDTO } from '../../../assets/src/submissions/model';
vi.mock('@wordpress/components', () => {
  type Props = {children?:ReactNode;onClick?:()=>void;disabled?:boolean;label?:string;value?:unknown;onChange?:(value:string)=>void;options?:{value:string;label:string}[]};
  return {Button:(p:Props)=>h('button',{onClick:p.onClick,disabled:p.disabled},p.children), Notice:(p:Props)=>h('div',{role:'alert'},p.children), TextControl:(p:Props)=>h('label',{},p.label,h('input',{value:p.value as string,onChange:(e: ChangeEvent<HTMLInputElement>)=>p.onChange?.(e.target.value)})), TextareaControl:(p:Props)=>h('textarea',{'aria-label':p.label}), SelectControl:(p:Props)=>h('label',{},p.label,h('select',{value:p.value as string,onChange:(e:ChangeEvent<HTMLSelectElement>)=>p.onChange?.(e.target.value)},p.options?.map(v=>h('option',{key:v.value,value:v.value},v.label)))), ToggleControl:(p:Props)=>h('label',{},p.label,h('input',{type:'checkbox'}))};
});
const config:AdminConfig={restUrl:location.origin+'/wp-json/cff/v1/',pluginUrl:location.origin+'/plugin/',nonce:'fixture-nonce',screen:'submissions',locale:'en',features:{fieldTypes:[],uploads:true,xlsx:false},capabilities:{view_submissions:true,export_submissions:true}};
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();localStorage.clear();document.body.replaceChildren();});
it('bounds column preferences to three returned keys; persists no answers and tolerates denied storage',()=>{
 const rows=[{answers:{name:'secret-answer',email:'private@example.test',third:'x',fourth:'x'}}] as Pick<SubmissionDTO, 'answers'>[]; const allowed=answerKeys(rows);
 expect(answerColumns(['fourth','name','name','missing','email','third'],allowed)).toEqual(['fourth','name','email']); localStorage.setItem('cols',JSON.stringify(['fourth','name'])); expect(readAnswerColumns(localStorage,'cols')).toEqual(['fourth','name']); expect(localStorage.getItem('cols')).not.toContain('secret-answer'); expect(readAnswerColumns({getItem(){throw Error('denied')}} as unknown as Storage,'cols')).toBeNull();
});
it('copies only actual stored IPs, never reconstructing none/opaque metadata',()=>{
 expect(storedIp({ip:'192.0.2.0'})).toBe('192.0.2.0');expect(storedIp({ip:'2001:db8::1'})).toBe('2001:db8::1'); for(const ip of ['',null,'none','999.1.1.1','secret-token','<script>']) expect(storedIp({ip})).toBeUndefined();expect(storedIp({})).toBeUndefined();
});
it('uses precise UTC day presets including leap/month boundaries and preserves custom dates',()=>{
 const now=new Date('2026-03-01T12:00:00Z'); expect(exportDates('7',now)).toEqual({from:'2026-02-23',to:'2026-03-01'});expect(exportDates('30',now)).toEqual({from:'2026-01-31',to:'2026-03-01'});expect(exportDates('90',now)).toEqual({from:'2025-12-02',to:'2026-03-01'});expect(exportDates('month',now)).toEqual({from:'2026-03-01',to:'2026-03-01'});expect(exportDates('active',now)).toEqual({});
});
it('authenticates file downloads in headers, rejects redirects/origins/caps/UUIDs and revokes blob URLs',async()=>{
 const id='12345678-1234-4234-8234-123456789abc';expect(uploadIds([id,id,'not-an-id'])).toEqual([id]);const transport=vi.fn().mockResolvedValue(new Response('fixture',{headers:{'content-disposition':'attachment; filename="fixture.txt"'}}));vi.stubGlobal('fetch',transport);const create=vi.fn().mockReturnValue('blob:fixture'),revoke=vi.fn();vi.stubGlobal('URL',Object.assign(URL,{createObjectURL:create,revokeObjectURL:revoke}));vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});vi.useFakeTimers();
 try {await downloadUpload(new AdminApi(config),id);expect(transport.mock.calls[0]?.[1]).toMatchObject({headers:{'X-WP-Nonce':'fixture-nonce'},cache:'no-store',credentials:'same-origin',redirect:'error'});expect(transport.mock.calls[0]?.[0]).not.toContain('?');vi.runAllTimers();expect(revoke).toHaveBeenCalledWith('blob:fixture');await expect(downloadUpload(new AdminApi({...config,capabilities:{}}),id)).rejects.toThrow();await expect(downloadUpload(new AdminApi({...config,restUrl:'https://evil.test/'}),id)).rejects.toThrow();transport.mockResolvedValue(new Response('',{status:403}));await expect(downloadUpload(new AdminApi(config),id)).rejects.toThrow();}finally{vi.useRealTimers();}
});
it('renders file download and stored-IP buttons in Detail, then shows a denied-download error',async()=>{
 const id='12345678-1234-4234-8234-123456789abc';const detail={id:1,uuid:'fixture',answers:{attachment:[id]},meta:{ip:'192.0.2.0'},visited:['attachment'],notes:[],consent:{},createdAt:'2026-01-01',durationMs:0,formVersion:1,form:{title:'Fixture',schema:{steps:[{id:'attachment',key:'attachment',type:'file_upload',label:'File',messages:[]}]} }} as unknown as SubmissionDetail;
 const api=new AdminApi(config,vi.fn().mockResolvedValue(new Response(JSON.stringify(detail)))); const host=document.createElement('div');document.body.append(host);const root=createRoot(host);vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('',{status:403})));
 try {await act(async()=>{root.render(h(Detail,{api,id:1,onClose:()=>{},onChanged:()=>{},onNavigate:()=>{}}));});const file=[...host.querySelectorAll('button')].find(b=>b.textContent==='Download attached file')!;expect(file).toBeTruthy();await act(async()=>file.click());expect(host.textContent).toContain('File download denied or unavailable.');await act(async()=>{[...host.querySelectorAll('button')].find(b=>b.textContent==='Metadata and consent')!.click();});expect(host.textContent).toContain('Copy stored IP');}finally{await act(async()=>root.unmount());}
});
it('rehydrates owned exports by resource ID and disables creation until a form is selected',async()=>{
 const request=vi.fn().mockImplementation((url:string)=>Promise.resolve(new Response(JSON.stringify(url.includes('export-forms')?{items:[{id:5,title:'Form'}],total:1,page:1,perPage:50}:{exportId:8,status:'ready'}))));const api=new AdminApi(config,request);const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try {await act(async()=>root.render(h(Export,{api,filters:{status:'completed'},ids:[1],exportId:8})));expect(request.mock.calls.some(call=>String(call[0]).endsWith('admin/exports/8'))).toBe(true);expect([...host.querySelectorAll('button')].find(b=>b.textContent==='Create private export')?.disabled).toBe(true);expect(host.textContent).toContain('Required form');}finally{await act(async()=>root.unmount());}
});
