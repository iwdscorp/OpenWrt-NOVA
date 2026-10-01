// Code-only DOM checks. This is NOT a browser, layout or live modal test.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('htdocs/luci-static/resources/nova-firewall-v281-r1.js');
new Function(source);
assert.doesNotMatch(source,/uci\.(set|add|remove|save|apply|reorder)\s*\(|rpc\.|innerHTML\s*=/,'Workspace must not write config or insert unsanitized HTML');
assert.match(read('ucode/template/themes/nova/footer.ut'),/L.require\('nova-firewall-v281-r1'\)/);
assert.match(read('ucode/template/themes/nova/header.ut'),/firewall.css\?v=2\.8\.1-r1/);
assert.match(read('htdocs/luci-static/nova/nova.js'),/table.closest\('\.nova-firewall-workspace'\)/);
const captured=JSON.parse(read('scripts/fixtures/firewall-native.json')).values;
const baseline=Object.values(captured).map(row=>structuredClone(row));
assert.equal(baseline.filter(row=>row['.type']==='rule').length,9);
assert.equal(baseline.filter(row=>row['.type']==='zone').length,2);
const synthetic=[
 {'.name':'dnat','.type':'redirect',name:'HTTPS publishing',src:'wan',dest:'lan',proto:['tcp'],src_dip:'198.51.100.2',src_dport:'443',dest_ip:'192.0.2.10',dest_port:'8443',target:'DNAT',reflection:'1',weekdays:'Mon Tue'},
 {'.name':'oldsnat','.type':'redirect',target:'SNAT'},
 {'.name':'snat','.type':'nat',name:'Office egress',src:'wan',src_ip:'192.0.2.0/24',dest_ip:'203.0.113.8',proto:'tcp udp',dest_port:'443',snat_ip:'198.51.100.3',target:'SNAT',start_time:'09:00:00'},
 {'.name':'masq','.type':'nat',name:'Automatic egress',src:'wan',target:'MASQUERADE'},
 {'.name':'noNAT','.type':'nat',name:'NAT exemption',src:'wan',target:'ACCEPT'},
 {'.name':'set','.type':'ipset',name:'Office devices',family:'ipv4',match:['src_ip'],entry:['192.0.2.4','192.0.2.5'],enabled:'0'},
 {'.name':'out','.type':'rule',name:'Router output',dest:'wan',target:'REJECT',proto:'tcp',dest_port:'22',enabled:'0'},
 {'.name':'unsafe','.type':'rule',name:'<img src=x onerror=alert(1)>',src:'lan',dest:'wan',target:'DROP',src_ip:'192.0.2.123',proto:['tcp'],dest_port:'8080',mark:'0x10',weekdays:'Mon',start_time:'09:00:00',device:'eth0'}
];
function setup(lang,page,data=baseline){
 const {document,window}=parseHTML('<!doctype html><html lang="'+lang+'" dir="'+(lang==='fa'?'rtl':'ltr')+'"><body class="nova"><main id="maincontent"><div id="tabmenu"></div><div id="view"></div></main></body></html>');
 const instances=new WeakMap(),callbacks=[],tasks=[];
 function E(tag,attrs={},children=[]){
  const node=document.createElement(tag);
  for(const [key,value] of Object.entries(attrs))if(value!==null&&value!==undefined&&value!==false){if(key==='hidden'||key==='disabled')node[key]=true;else node.setAttribute(key,value);}
  function append(value){if(value==null)return;if(Array.isArray(value)){value.forEach(append);return;}node.appendChild(value.nodeType?value:document.createTextNode(String(value)));}
  append(children);return node;
 }
 const config=structuredClone(data),unchanged=JSON.stringify(config);
 const uci={load:()=>Promise.resolve(),sections:(name,type)=>config.filter(row=>!type||row['.type']===type)};
 for(const key of ['set','add','remove','save','apply','reorder'])uci[key]=()=>{throw new Error('Config mutation forbidden: '+key);};
 const dom={findClassInstance:node=>instances.get(node)};
 // Match installed LuCI DOM.create/append semantics: scalar child is innerHTML;
 // array scalar child is text, including null. A safe mock would miss both bugs.
 function luciElement(tag,attrs={},children){
  const element=E(tag,attrs);
  if(Array.isArray(children))children.forEach(child=>element.appendChild(child?.nodeType?child:document.createTextNode(String(child))));
  else if(children?.nodeType)element.appendChild(children);
  else if(children!=null)element.innerHTML=String(children);
  return element;
 }
 const context={document,window,MutationObserver:window.MutationObserver,E:luciElement,uci,dom,L:{env:{dispatchpath:['admin','network','firewall',page]},url:(...p)=>'/cgi-bin/luci/'+p.join('/')},baseclass:{extend:o=>o},setTimeout:fn=>tasks.push(fn)};
 const module=vm.runInNewContext('(function(){'+source+'})()',context);
 const view=document.getElementById('view'),main=document.getElementById('maincontent');
 function createNative(){
  const map=E('div',{id:'cbi-firewall',class:'cbi-map'}),type=module.pages[page]?.type||'rule',grid=E('div',{id:'cbi-firewall-'+type,class:'cbi-section cbi-tblsection'}),table=E('table',{class:'table cbi-section-table'}),body=E('tbody');
  map.appendChild(grid);grid.appendChild(table);table.appendChild(body);
  for(const item of config.filter(row=>row['.type']===type&&!(type==='redirect'&&row.target==='SNAT'))){
   const checkbox=E('input',{type:'checkbox',id:'cbid.firewall.'+item['.name']+'.enabled'});checkbox.checked=item.enabled!=='0';
   const edit=E('button',{class:'cbi-button cbi-button-edit'},'Edit'),remove=E('button',{class:'cbi-button cbi-button-remove'},'Delete'),drag=E('button',{class:'cbi-button drag-handle'},'↕');
   edit.addEventListener('click',()=>callbacks.push('edit:'+item['.name']));remove.addEventListener('click',()=>callbacks.push('remove:'+item['.name']));drag.addEventListener('click',()=>callbacks.push('order:'+item['.name']));
   const row=E('tr',{id:'cbi-firewall-'+item['.name'],class:'tr cbi-section-table-row','data-sid':item['.name']},[E('td',{'data-name':'_match'},[E('small',{},['From ',E('var',{},item.src||'router'),E('br'),'<match text>'])]),E('td',{'data-name':'enabled'},checkbox),E('td',{class:'td cbi-section-actions'},[drag,edit,remove])]);body.appendChild(row);
  }
  const add=E('button',{class:'cbi-button cbi-button-add'},'Add');add.addEventListener('click',()=>callbacks.push('add'));grid.appendChild(E('div',{class:'cbi-section-create'},add));
  return map;
 }
 const map=createNative();view.appendChild(map);
 const nativeNodes=Array.from(map.querySelectorAll('*')),cells=Array.from(map.querySelectorAll('tr')).map(row=>Array.from(row.childNodes)),html=map.toString();
 const controller=module.mount(view,main,page);
 return {module,controller,document,window,view,main,map,nativeNodes,cells,html,config,unchanged,instances,callbacks,tasks,createNative,E};
}
for(const lang of ['fa','en'])for(const page of ['zones','rules','forwards','snats','ipsets']){
 const s=setup(lang,page,[...baseline,...synthetic]);const {document,controller,map}=s;
 assert.ok(!controller.shell.hidden,page+' must render');assert.ok(s.main.classList.contains('nova-firewall-ready'));
 assert.equal(document.querySelectorAll('#nova-firewall-workspace').length,1);
 assert.equal(document.querySelectorAll('.nova-native-firewall').length,1);
 assert.equal(document.querySelectorAll('.nova-fw-header-panel').length,1,'One unified firewall header');
 assert.equal(document.querySelector('.nova-fw-header-panel').firstElementChild.tagName,'HEADER','Heading precedes tabs');
 assert.equal(document.querySelectorAll('.nova-fw-header-panel h1').length,1);
 assert.equal(document.querySelector('.nova-fw-heading-icon svg').namespaceURI,'http://www.w3.org/2000/svg','Icon must use SVG namespace, not HTML E');
 assert.equal(document.querySelector('.nova-fw-heading-icon').getAttribute('aria-hidden'),'true');
 assert.equal(document.querySelectorAll('.nova-fw-nav a').length,5);
 assert.equal(document.querySelectorAll('.nova-fw-nav a[aria-current=page]').length,1);
 assert.match(document.querySelector('.nova-fw-kicker').textContent,lang==='fa'?/شبکه.*دیوار آتش/:/Network.*Firewall/);
 assert.match(document.querySelector('.nova-fw-count').textContent,lang==='fa'?/نمایش/:/Showing/);
 assert.equal(document.querySelector('.nova-fw-count bdi').getAttribute('dir'),'ltr');
 assert.equal(map.toString(),s.html,'No native HTML, cells or controls may change');
 assert.ok(s.nativeNodes.every(node=>map.contains(node)),'Preserve exact native nodes');
 Array.from(map.querySelectorAll('tr')).forEach((row,i)=>assert.deepEqual(Array.from(row.childNodes),s.cells[i],'Native filter/sort uses cell indices'));
 const nativeIds=[...map.querySelectorAll('[id]')].map(node=>node.id);assert.equal(new Set(nativeIds).size,nativeIds.length);
 const headers=document.querySelector('.nova-fw-table thead').textContent;
 assert.ok(lang==='fa'?/[\u0600-\u06ff]/.test(headers):!/[\u0600-\u06ff]/.test(headers));
 assert.ok(Array.from(document.querySelectorAll('.nova-fw-values bdi')).every(node=>node.getAttribute('dir')==='ltr'),'Technical data isolated for RTL');
 const first=document.querySelector('.nova-fw-edit'),sid=first.getAttribute('data-native-sid');first.click();
 assert.deepEqual(s.callbacks,['edit:'+sid]);assert.equal(document.querySelector('.nova-native-firewall').open,true);
 document.querySelector('.nova-fw-create').click();assert.equal(s.callbacks.at(-1),'add');
 const inspect=document.querySelector('.nova-fw-inspect');inspect.click();assert.equal(inspect.getAttribute('aria-expanded'),'true');assert.equal(inspect.closest('tr').nextElementSibling.hidden,false);inspect.click();assert.equal(inspect.getAttribute('aria-expanded'),'false');
 assert.equal(document.querySelector('.nova-fw-detail-row pre img'),null,'Details are plain text');
 assert.equal(JSON.stringify(s.config),s.unchanged,'Presentation does not mutate UCI objects');
 assert.doesNotMatch(controller.shell.textContent,/null|undefined/,'Optional fields must not turn into LuCI literal null children');
 assert.equal(s.module.mount(s.view,s.main,page),null,'Only one workspace');
 controller.dispose();
}
const rule=setup('en','rules',[...baseline,...synthetic]);
assert.equal(rule.module.chain({src:'wan'}),'INPUT');assert.equal(rule.module.chain({dest:'wan'}),'OUTPUT');assert.equal(rule.module.chain({src:'lan',dest:'wan'}),'FORWARD');
assert.equal(rule.module.model({'.name':'un',src:'lan'},'rules',0,{}).action,'','Never invent an allow action');
assert.equal(rule.module.model({'.name':'nat',src:'wan'},'snats',0,{}).src,'*');assert.equal(rule.module.model({'.name':'nat',src:'wan'},'snats',0,{}).dest,'wan');assert.equal(rule.module.model({'.name':'nat',src:'wan'},'snats',0,{}).chain,'SNAT');
const bad=rule.document.querySelector('[data-config-sid=unsafe]');assert.equal(bad.querySelector('img'),null);assert.match(bad.textContent,/<img src=x/);
assert.match(bad.nextElementSibling.textContent,/eth0/);assert.match(bad.nextElementSibling.textContent,/0x10/);
const search=rule.document.querySelector('.nova-fw-search');search.value='192.0.2.123';search.dispatchEvent(new rule.window.Event('input'));assert.equal(rule.document.querySelectorAll('.nova-fw-policy-row').length,1);
search.value='nothing matches';search.dispatchEvent(new rule.window.Event('input'));assert.match(rule.document.querySelector('.nova-fw-empty').textContent,/No items match/);
search.value='';search.dispatchEvent(new rule.window.Event('input'));
const mode=rule.document.querySelector('[aria-label="Policy view"]');mode.querySelector('[value=pairs]').selected=true;mode.dispatchEvent(new rule.window.Event('change'));assert.ok(rule.document.querySelectorAll('.nova-fw-group').length>0);
assert.equal(JSON.stringify(rule.config),rule.unchanged,'Grouping must not reorder UCI');
const nativeRow=rule.map.querySelector('[data-sid=unsafe]'),enabled=nativeRow.querySelector('input');enabled.checked=false;rule.controller.refresh();assert.ok(rule.document.querySelector('[data-config-sid=unsafe]').classList.contains('is-disabled'),'Pending inline checkbox update reflected');
const select=rule.E('select',{},[rule.E('option',{value:'REJECT'},'REJECT')]);nativeRow.appendChild(rule.E('td',{'data-name':'input'},select));rule.instances.set(select,{getValue:()=> 'DROP'});assert.equal(rule.module.liveRow({input:'ACCEPT'},nativeRow).input,'DROP','Use native widget getValue for uncommitted values');
const oldEdit=nativeRow.querySelector('.cbi-button-edit');oldEdit.disabled=true;rule.controller.refresh();assert.ok(rule.document.querySelector('[data-native-sid=unsafe]').disabled);assert.equal(rule.controller.nativeAction('unsafe','.cbi-button-edit'),false);
oldEdit.disabled=false;rule.controller.refresh();oldEdit.remove();rule.controller.refresh();assert.ok(rule.document.querySelector('[data-native-sid=unsafe]').disabled,'Missing native editor must disable proxy');
const newMap=rule.createNative();rule.view.replaceChildren(newMap);rule.controller.refresh();assert.equal(rule.document.querySelectorAll('.nova-native-firewall').length,1);assert.ok(rule.document.querySelector('.nova-native-firewall').contains(newMap));rule.document.querySelector('[data-native-sid=unsafe]').click();assert.equal(rule.callbacks.at(-1),'edit:unsafe');
rule.view.replaceChildren(rule.E('div',{},'Native migration / ACL / loading message'));rule.controller.refresh();assert.equal(rule.controller.shell.hidden,true);assert.equal(rule.main.classList.contains('nova-firewall-ready'),false);assert.match(rule.view.textContent,/Native migration/);rule.controller.dispose();
const zones=setup('fa','zones');assert.equal(zones.document.querySelectorAll('.nova-fw-defaults>div').length,3);assert.equal(zones.document.querySelectorAll('.nova-fw-paths>span').length,1);assert.match(zones.document.querySelector('.nova-fw-paths').textContent,/lan.*wan/);assert.equal(zones.document.querySelectorAll('.nova-fw-policy-row').length,2);zones.controller.dispose();
const nat=setup('en','snats',synthetic);assert.match(nat.document.querySelector('[data-config-sid=snat]').textContent,/wan/);assert.match(nat.document.querySelector('[data-config-sid=masq]').textContent,/Outbound interface IP · automatic/);assert.match(nat.document.querySelector('[data-config-sid=noNAT]').textContent,/Do not rewrite address/);assert.equal(nat.document.querySelector('[data-config-sid=noNAT] .allow'),null,'NAT ACCEPT is exemption, not traffic allow');assert.match(nat.document.querySelector('[data-config-sid=snat]').nextElementSibling.textContent,/09:00:00/);nat.controller.dispose();
const dnat=setup('en','forwards',synthetic);assert.equal(dnat.document.querySelectorAll('.nova-fw-policy-row').length,1);assert.match(dnat.document.querySelector('.nova-fw-policy-row').textContent,/198.51.100.2.*443.*192.0.2.10.*8443/);dnat.controller.dispose();
const empty=setup('en','forwards');assert.match(empty.document.querySelector('.nova-fw-empty').textContent,/No items are configured/);empty.controller.dispose();
const rerender=setup('en','rules');rerender.view.replaceChildren(rerender.E('div',{},'Loading'));await new Promise(resolve=>setTimeout(resolve,0));rerender.tasks.splice(0).forEach(fn=>fn());assert.equal(rerender.controller.shell.hidden,true,'Observer retains native loading message');
rerender.view.replaceChildren(rerender.createNative());await new Promise(resolve=>setTimeout(resolve,0));rerender.tasks.splice(0).forEach(fn=>fn());assert.equal(rerender.controller.shell.hidden,false,'Observer reconnects workspace after native rerender');rerender.controller.dispose();
const skip=setup('en','custom');assert.equal(skip.controller,null);assert.equal(await skip.module.start(),null);
console.log('PASS: firewall code-only DOM, real 9-rule UCI fixture, both languages, five workspaces, native node/handler/cell identity, edit/add delegation, XSS-safe copy, pending inline values, rerender, empty/migration fallback, SNAT exit-zone semantics, grouping without UCI writes. Visual/browser interaction remains unverified.');
