// LMO layout / SuperFastHash port from LuCI src/lib/lmo.c and po2lmo.c.
// Original copyright Jo-Philipp Wich, Apache-2.0; hash Paul Hsieh.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
import {sfh,canonicalKey} from './lmo-hash.mjs';
export {sfh,canonicalKey} from './lmo-hash.mjs';
import {catalog,hashKey,validateCatalog} from './catalog.mjs';
export function encodeLmo(rows,pluralForm){
let offset=0;const chunks=[],entries=[],hashes=new Map();
function add(id,value,forms,key){
 if(hashes.has(id))throw Error('Hash collision: '+key+' / '+hashes.get(id));hashes.set(id,key);
 const bytes=Buffer.from(value),pad=Buffer.alloc((4-bytes.length%4)%4);
 entries.push([id,forms,offset,bytes.length]);chunks.push(bytes,pad);offset+=bytes.length+pad.length;
}
add(0,pluralForm,0,'Plural-Forms');
for(const row of rows)row.msgstr.forEach((value,i)=>add(sfh(hashKey(row,i)),value,row.msgid_plural?2:1,hashKey(row,i)));
entries.sort((a,b)=>a[0]-b[0]);
const index=Buffer.alloc(entries.length*16+4);
entries.forEach((entry,i)=>entry.forEach((v,j)=>index.writeUInt32BE(v,i*16+j*4)));
index.writeUInt32BE(offset,index.length-4);
return {bytes:Buffer.concat([...chunks,index]),entries:entries.length};
}
export async function compile(){
const rows=catalog();validateCatalog(rows);
const dest=path.join(root,'root/usr/lib/lua/luci/i18n');fs.mkdirSync(dest,{recursive:true});
const fa=encodeLmo(rows,'nplurals=2; plural=(n > 1);');
fs.writeFileSync(path.join(dest,'nova.fa.lmo'),fa.bytes);
// A loadable English catalog selects the correct language even after Persian.
// No identity translations: all English text uses LuCI's native source fallback.
const en=encodeLmo([],'nplurals=2; plural=(n != 1);');
fs.writeFileSync(path.join(dest,'nova.en.lmo'),en.bytes);
console.log(`Compiled ${fa.entries} Persian entries and English plural metadata`);
return {rows,entries:fa.entries};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await compile();
