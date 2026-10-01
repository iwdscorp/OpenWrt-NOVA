// Read-only second pass: UI literals not passed through gettext.
import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'acorn';
const input=path.resolve(process.argv[2]),result=[];
function add(node,file,kind){if(node?.type==='Literal'&&typeof node.value==='string'&&/[a-zA-Z]{2}/.test(node.value))result.push({file,line:node.loc.start.line,kind,value:node.value});}
function children(node,file){if(node?.type==='ArrayExpression')node.elements.forEach(n=>children(n,file));else add(node,file,'DOM text');}
function walk(n,file){
 if(!n||typeof n!=='object')return;
 if(n.type==='CallExpression'){
  if(n.callee.type==='Identifier'&&n.callee.name==='E'){children(n.arguments[n.arguments.length>=3?2:1],file);}
  if(n.callee.type==='MemberExpression'&&n.callee.property.name==='value')add(n.arguments[1],file,'option label');
 }
 if(n.type==='Property'&&['title','placeholder','aria-label','alt'].includes(n.key.name||n.key.value))add(n.value,file,'UI attribute');
 for(const [k,v] of Object.entries(n))if(k!=='loc'){if(Array.isArray(v))v.forEach(x=>walk(x,file));else if(v&&typeof v==='object')walk(v,file);}
}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const f of files(path.join(input,'www/luci-static/resources')).filter(f=>f.endsWith('.js')&&!f.endsWith('.min.js'))){const rel=path.relative(input,f).replaceAll('\\','/');walk(parse(fs.readFileSync(f,'utf8'),{ecmaVersion:'latest',allowReturnOutsideFunction:true,locations:true}),rel);}
fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2));
console.log([...new Set(result.map(x=>x.value))].map(x=>JSON.stringify(x)).join('\n'));
