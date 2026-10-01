// Inventory only: parse installed UI source, compare native translation hashes.
import fs from 'node:fs';
import path from 'node:path';
import {parse,parseExpressionAt} from 'acorn';
import gettext from 'gettext-parser';
import {sfh,canonicalKey} from './build-lmo.mjs';
import {catalog} from './catalog.mjs';
const input=path.resolve(process.argv[2]),destination=path.resolve(process.argv[3]);
const root=path.resolve(import.meta.dirname,'..');
const entries=new Map(),errors=[],dynamic=[];
function identity(id,context='',plural=''){return context+'\x01'+id+'\x02'+plural;}
function add(id,context,plural,file){
 if(typeof id!=='string'||!id.trim())return;
 id=canonicalKey(id);context=canonicalKey(context||'');plural=plural||'';
 const key=identity(id,context,plural),record=entries.get(key)||{msgid:id,msgctxt:context,msgid_plural:plural,files:[]};
 if(!record.files.includes(file))record.files.push(file);entries.set(key,record);
}
let bindings=new Map();
function constant(node,seen=new Set()){
 if(node?.type==='Literal'&&typeof node.value==='string')return node.value;
 if(node?.type==='Identifier'&&!seen.has(node.name)&&bindings.has(node.name)){seen.add(node.name);return constant(bindings.get(node.name),seen);}
 if(node?.type==='BinaryExpression'&&node.operator==='+'){const a=constant(node.left,new Set(seen)),b=constant(node.right,new Set(seen));if(a!=null&&b!=null)return a+b;}
 if(node?.type==='TemplateLiteral'){
  const values=node.expressions.map(n=>constant(n,new Set(seen)));if(values.every(v=>v!=null))return node.quasis.map((q,i)=>q.value.cooked+(values[i]||'')).join('');
 }
}
function collectBindings(node){
 const declarations=new Map();
 const scan=n=>{if(!n||typeof n!=='object')return;if(n.type==='VariableDeclaration'&&n.kind==='const')for(const row of n.declarations)if(row.id.type==='Identifier'){const list=declarations.get(row.id.name)||[];list.push(row.init);declarations.set(row.id.name,list);}for(const [k,v] of Object.entries(n))if(k!=='loc'){if(Array.isArray(v))v.forEach(scan);else if(v&&typeof v==='object')scan(v);}};
 scan(node);bindings=new Map([...declarations].filter(([k,v])=>v.length===1).map(([k,v])=>[k,v[0]]));
}
function walk(node,file){
 if(!node||typeof node!=='object')return;
 if(node.type==='CallExpression'&&node.callee?.type==='Identifier'&&['_','N_'].includes(node.callee.name)){
  const plural=node.callee.name==='N_',id=constant(node.arguments[plural?1:0]),ctx=constant(node.arguments[plural?3:1]);
  if(id!=null)add(id,ctx,plural?constant(node.arguments[2]):'',file);else dynamic.push({file,line:node.loc.start.line,code:'non-constant '+node.callee.name+' argument'});
 }
 for(const [key,value] of Object.entries(node))if(key!=='loc'){if(Array.isArray(value))value.forEach(v=>walk(v,file));else if(value&&typeof value==='object')walk(value,file);}
}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const poTranslations=new Map();
for(const file of files(path.join(root,'src/upstream-fa')).filter(f=>f.endsWith('.po'))){
 const data=gettext.po.parse(fs.readFileSync(file),{defaultCharset:'utf-8'});
 for(const group of Object.values(data.translations))for(const row of Object.values(group)){
  if(!row.msgid)continue;
  poTranslations.set(identity(canonicalKey(row.msgid),canonicalKey(row.msgctxt||''),row.msgid_plural||''),{...row,origin:path.basename(file)});
 }
}
const override=JSON.parse(fs.readFileSync(path.join(root,'src/fa.json')));
for(const [key,value] of Object.entries(override))poTranslations.set(identity(canonicalKey(key)),{msgid:key,msgstr:[value],origin:'NOVA'});
const installedSourceFile=path.join(root,'src/installed-source.json'),installedTranslationsFile=path.join(root,'src/installed-translations.json');
if(fs.existsSync(installedSourceFile)&&fs.existsSync(installedTranslationsFile)){
 const supplemental=JSON.parse(fs.readFileSync(installedTranslationsFile));
 for(const row of JSON.parse(fs.readFileSync(installedSourceFile)))if(supplemental[row.id])poTranslations.set(identity(row.msgid,row.msgctxt,row.msgid_plural),{...row,msgstr:Array.isArray(supplemental[row.id])?supplemental[row.id]:[supplemental[row.id]],origin:'NOVA full UI'});
}
for(const row of catalog())poTranslations.set(identity(canonicalKey(row.msgid),canonicalKey(row.msgctxt||''),row.msgid_plural||''),row);
const lmoTranslations=new Map();
const lmo=fs.readFileSync(path.join(input,'usr/lib/lua/luci/i18n/passwall2.fa.lmo'));
for(let i=lmo.readUInt32BE(lmo.length-4);i<lmo.length-4;i+=16)lmoTranslations.set(lmo.readUInt32BE(i),lmo.subarray(lmo.readUInt32BE(i+8),lmo.readUInt32BE(i+8)+lmo.readUInt32BE(i+12)).toString());
const candidates=files(input).filter(f=>/\.(?:js|lua|ut|htm|json)$/.test(f)&&/^(www|usr)\//.test(path.relative(input,f).replaceAll('\\','/'))&&!f.endsWith('Sortable.min.js'));
for(const file of candidates){
 const rel=path.relative(input,file).replaceAll('\\','/'),text=fs.readFileSync(file,'utf8');
 if(file.endsWith('.js')){
  try{const ast=parse(text,{ecmaVersion:'latest',allowReturnOutsideFunction:true,locations:true});collectBindings(ast);walk(ast,rel);}catch(error){errors.push({file:rel,error:error.message});}
 }else if(file.endsWith('.json')){
  try{const collect=node=>{if(!node||typeof node!=='object')return;if(typeof node.title==='string')add(node.title,'','',rel);Object.values(node).forEach(collect);};collect(JSON.parse(text));}catch(error){errors.push({file:rel,error:error.message});}
 }else{
  const literal='("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')';
  const pattern=new RegExp('(\\b_|\\btranslatef?|\\btranslate)\\s*\\(\\s*'+literal+'(?:\\s*,\\s*'+literal+')?','g');
  for(const match of text.matchAll(pattern))try{add(parseExpressionAt(match[2],0,{ecmaVersion:'latest'}).value,match[1]!=='translatef'&&match[3]?parseExpressionAt(match[3],0,{ecmaVersion:'latest'}).value:'','',rel);}catch(error){errors.push({file:rel,error:error.message});}
  for(const match of text.matchAll(/<%:\s*([^%]+?)\s*%>/g))add(match[1],'','',rel);
  bindings=new Map();
  for(const match of text.matchAll(/\b_\s*\(\s*(`(?:[^`\\]|\\.)*`)/g))try{add(constant(parseExpressionAt(match[1],0,{ecmaVersion:'latest'})),'','',rel);}catch(error){errors.push({file:rel,error:error.message});}
 }
}
const missing=[],covered=[],technical=[];
const names=new Set(['IPv4','IPv6','IPv6-PD','IP','MAC','MTU','DNS','DHCP','DHCPv6','NTP','TCP','UDP','ICMP','HTTP','HTTPS','FTP','SSH','SFTP','SCP','LAN','WAN','VLAN','VPN','TLS','SSL','QUIC','SNI','ALPN','SOCKS','SOCKS5','Xray','Sing-Box','sing-box','PassWall','OpenWrt','LuCI','DS-Lite','6in4','6to4','6rd','WireGuard','PPPoE','PPP','DSL','VDSL','ADSL','BSSID','SSID','WPA','WPA2','WPA3','AES','MD5','SHA256','STUN','TUN','TAP','L2TP','PPTP','VXLAN','GRE','IPIP','ECN','DSCP','RPS','RSS','DUID','ULA','DHCPv4','IGMP','MLD']);
function isTechnical(id){return names.has(id)||/^(?:[-—….,:!?*#\/\d\s]+|%[sdhf]|\d+(?:\.\d+)?(?:ms|s|m|h|d| kB| MB| MHz)|0x[0-9a-f]+)$/i.test(id);}
for(const record of entries.values()){
 const key=identity(record.msgid,record.msgctxt,record.msgid_plural),row=poTranslations.get(key),hashKey=(record.msgctxt?record.msgctxt+'\x01':'')+record.msgid+(record.msgid_plural?'\x020':'');
 const value=row?.msgstr?.[0]||lmoTranslations.get(sfh(hashKey));
 if(value&&/[\u0600-\u06ff]/.test(value)){covered.push({...record,translation:value,origin:row?.origin||'installed PassWall'});}
 else if(isTechnical(record.msgid)){technical.push({...record,translation:value||record.msgid});}
 else missing.push({...record,translation:value||'',origin:row?.origin||''});
}
const report={sourceFiles:candidates.length,uniqueStrings:entries.size,covered:covered.length,missing:missing.length,technical:technical.length,parseErrors:errors,dynamic,records:{covered,missing,technical}};
fs.writeFileSync(destination,JSON.stringify(report,null,2));
if(process.argv.includes('--snapshot')){
 if(fs.existsSync(installedSourceFile))throw Error('Installed source snapshot already exists; preserve stable IDs');
 fs.writeFileSync(installedSourceFile,JSON.stringify(missing.map((row,i)=>({...row,id:i+1})),null,2));
}
console.log(JSON.stringify({sourceFiles:report.sourceFiles,uniqueStrings:report.uniqueStrings,covered:report.covered,missing:report.missing,technical:report.technical,parseErrors:errors,dynamic:dynamic.length},null,2));
