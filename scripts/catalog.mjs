// Merge gettext catalogs without replacing native LuCI views or configuration.
import fs from 'node:fs';
import path from 'node:path';
import gettext from 'gettext-parser';
import {canonicalKey} from './lmo-hash.mjs';
export const root=path.resolve(import.meta.dirname,'..');
export const identity=(id,context='',plural='')=>canonicalKey(context)+'\x01'+canonicalKey(id)+'\x02'+plural;
export const hashKey=(row,index)=> (row.msgctxt?canonicalKey(row.msgctxt)+'\x01':'')+canonicalKey(row.msgid)+(row.msgid_plural?'\x02'+index:'');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,'src',file),'utf8'));
export function installedTranslations(){
 const source=read('installed-source.json'),values=read('installed-translations.json'),patterns=read('template-translations.json');
 for(const id of patterns.ids){
  const row=source.find(r=>r.id===id);if(!row)throw Error('Unknown template ID: '+id);
  let translated=row.msgid;
  for(const [key,value] of Object.entries(patterns.replacements).sort((a,b)=>b[0].length-a[0].length))translated=translated.replaceAll(key,value);
  if(!/[\u0600-\u06ff]/.test(translated))throw Error('Untranslated template: '+id);
  values[id]=translated;
 }
 return source.map(row=>{
  if(!values[row.id])throw Error('Missing translation ID '+row.id);
  return {...row,msgstr:Array.isArray(values[row.id])?values[row.id]:[values[row.id]],origin:'NOVA full UI'};
 });
}
export function catalog(){
 const rows=new Map();
 for(const file of fs.readdirSync(path.join(root,'src/upstream-fa')).filter(f=>f.endsWith('.po'))){
  const data=gettext.po.parse(fs.readFileSync(path.join(root,'src/upstream-fa',file)),{defaultCharset:'utf-8'});
  for(const group of Object.values(data.translations))for(const row of Object.values(group)){
   if(row.msgid&&row.msgstr?.[0]&&/[\u0600-\u06ff]/.test(row.msgstr.join('')))rows.set(identity(row.msgid,row.msgctxt,row.msgid_plural),{...row,origin:file});
  }
 }
 for(const row of installedTranslations())rows.set(identity(row.msgid,row.msgctxt,row.msgid_plural),row);
 for(const [msgid,value] of Object.entries(read('fa.json')))rows.set(identity(msgid),{msgid,msgstr:[value],origin:'NOVA'});
 if(fs.existsSync(path.join(root,'src/additional-fa.json')))for(const row of read('additional-fa.json'))rows.set(identity(row.msgid,row.msgctxt,row.msgid_plural),{...row,origin:'NOVA reviewed supplement'});
 return [...rows.values()];
}
// LuCI's formatter supports %h/%q and %.1024m as well as ordinary printf tokens.
export function placeholders(text){return (text.match(/%(?:\d+\$)?[-+#0]*(?:\d+)?(?:\.\d+)?[a-zA-Z%]/g)||[]).sort();}
export function templateTokens(text){return (text.match(/%\{[\w.]+[?#:]?|\{[a-z_][\w]*\}/g)||[]).sort();}
const templateStructure=text=>text.match(/%\{[\w.]+[?#:]?|}/g)||[];
const markupTags=text=>(text.match(/<\/?(?:code|abbr|var|strong|em|br|span|a)\b[^>]*>/g)||[]).map(t=>t.replace(/\s[^>]*/,t.endsWith('/>')?'/>':'>').replace('/>','>')).sort();
export function validateCatalog(rows){
 for(const row of rows){
  if(row.msgid_plural&&row.msgstr.length!==2)throw Error('Persian plural needs 2 forms: '+row.msgid);
  row.msgstr.forEach((value,i)=>{
   const source=i&&row.msgid_plural?row.msgid_plural:row.msgid;
   if(!value||!/[\u0600-\u06ff]/.test(value))throw Error('Not Persian: '+row.msgid);
   if(JSON.stringify(placeholders(source))!==JSON.stringify(placeholders(value)))throw Error('Placeholder mismatch: '+row.msgid);
   if(JSON.stringify(templateTokens(source))!==JSON.stringify(templateTokens(value)))throw Error('Template mismatch: '+row.msgid);
   if(source.includes('%{')&&JSON.stringify(templateStructure(source))!==JSON.stringify(templateStructure(value)))throw Error('Template structure mismatch: '+row.msgid);
   if(JSON.stringify(markupTags(source))!==JSON.stringify(markupTags(value)))throw Error('HTML tag mismatch: '+row.msgid);
  });
 }
}
