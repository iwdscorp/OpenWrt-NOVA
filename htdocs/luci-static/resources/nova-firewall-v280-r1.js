'use strict';
'require baseclass';
'require uci';
'require dom';

// LuCI's E treats scalar children as HTML. Only pass attributes to native E;
// append all user/config text as text nodes and filter optional null children.
const nativeElement=E;
function node(tag,attributes={},children=[]){
 const element=nativeElement(tag,attributes);
 const append=value=>{if(value==null)return;if(Array.isArray(value))value.forEach(append);else element.appendChild(value.nodeType?value:document.createTextNode(String(value)));};
 append(children);return element;
}

// A presentation workspace over LuCI's existing form. Never writes UCI/RPC,
// replaces a native control, invents a hit counter, or reorders a policy.
const pages={
 zones:{type:'zone',title:['زون‌ها و مسیر عبور','Zones & forwarding'],description:['اعضای هر زون، سیاست ارتباط با روتر و مسیرهای مجاز بین زون‌ها.','Zone members, router access policies and permitted inter-zone paths.']},
 rules:{type:'rule',title:['سیاست‌های ترافیک','Traffic policies'],description:['هر ردیف مشخص می‌کند کدام ترافیک، از کجا به کجا، با چه سرویس و اقدامی تطبیق می‌یابد.','Each row identifies the source, destination, service, schedule and action of a traffic rule.']},
 forwards:{type:'redirect',title:['انتشار سرویس · DNAT','Service publishing · DNAT'],description:['نگاشت آدرس و پورت بیرونی به سرویس داخلی؛ این بخش با اجازهٔ عمومی ترافیک متفاوت است.','Map an external address and port to an internal service; this is not a general allow policy.']},
 snats:{type:'nat',title:['ترجمهٔ آدرس مبدأ · SNAT','Source translation · SNAT'],description:['تغییر آدرس یا پورت مبدأ خروجی؛ نه انتقال پورت ورودی و نه قانون اجازه/رد.','Rewrite outbound source addresses or ports; not inbound port forwarding or an allow/deny rule.']},
 ipsets:{type:'ipset',title:['مجموعه‌های آدرس','Address sets'],description:['مجموعهٔ IP، شبکه یا MAC برای استفاده در تطبیق قوانین؛ خودِ مجموعه دسترسی ایجاد نمی‌کند.','IP, network or MAC sets used in rule matches; a set does not grant access by itself.']}
};
const list=value=>Array.isArray(value)?value.map(String):value==null||value===''?[]:String(value).trim().split(/\s+/);
const flag=(value,fallback=false)=>value==null?fallback:!['0','false','off','no','disabled'].includes(String(value).toLowerCase());
function chain(row){return row.src?(row.dest?'FORWARD':'INPUT'):'OUTPUT';}
function model(row,page,index,defaults){
 const m={...row,sid:row['.name'],order:index+1,name:row.name||row['.name'],enabled:flag(row.enabled,true),src:row.src||'@router',dest:row.dest||'@router',chain:chain(row),action:row.target||'',family:row.family||'',proto:list(row.proto),srcIp:list(row.src_ip),destIp:list(row.dest_ip),srcPort:list(row.src_port),destPort:list(row.dest_port),schedule:['weekdays','monthdays','start_time','stop_time','start_date','stop_date'].filter(key=>row[key]!=null&&row[key]!=='').map(key=>({key,value:list(row[key]).join(', ')}))};
 m.tone=m.action==='ACCEPT'?'allow':m.action==='DROP'||m.action==='REJECT'?'deny':'other';
 if(page==='zones'){m.input=row.input||defaults.input||'';m.output=row.output||defaults.output||'';m.forward=row.forward||defaults.forward||'';m.networks=list(row.network);m.masq=flag(row.masq);m.masq6=flag(row.masq6);}
 if(page==='forwards'){m.externalIp=list(row.src_dip);m.externalPort=list(row.src_dport);m.action=row.target||'';}
 if(page==='forwards')m.chain='DNAT';
 // In LuCI's nat section, UCI `src` means OUTBOUND zone, not source zone.
 if(page==='snats'){m.src='*';m.dest=row.src||'@router';m.chain='SNAT';m.rewriteIp=list(row.snat_ip);m.rewritePort=list(row.snat_port);}
 if(page==='ipsets'){m.entries=list(row.entry);m.matches=list(row.match);}
 return m;
}
function liveRow(row,native){
 const result={...row};if(!native)return result;
 // Only read widget values, including uncommitted inline checkbox/dropdown edits.
 for(const name of ['enabled','input','output','forward','masq','masq6','name','family','match','entry']){
  const cell=native.querySelector('[data-name="'+name+'"]');if(!cell)continue;
  const element=cell.querySelector('.cbi-dropdown,.cbi-checkbox,input,select,textarea');if(!element)continue;
  const widget=dom.findClassInstance(element);
  if(typeof widget?.getValue==='function')result[name]=widget.getValue();
  else if(element.type==='checkbox')result[name]=element.checked?'1':'0';
  else if(element.tagName==='SELECT'||element.tagName==='INPUT')result[name]=element.value;
 }
 return result;
}
function matchText(node){
 if(!node)return '';
 if(node.nodeType===3)return node.nodeValue;
 if(node.nodeType!==1||node.classList.contains('cbi-tooltip'))return '';
 if(node.tagName==='BR')return '\n';
 const text=Array.from(node.childNodes).map(matchText).join('');return node.tagName==='VAR'?' '+text+' ':text;
}
return baseclass.extend({
 pages,model,chain,list,flag,liveRow,
 start(){
  const path=L.env.dispatchpath;if(path.slice(0,3).join('/')!=='admin/network/firewall')return Promise.resolve(null);
  const page=path[3]||'zones';if(!pages[page])return Promise.resolve(null);
  const view=document.getElementById('view'),main=document.getElementById('maincontent');if(!view||!main)return Promise.resolve(null);
  return uci.load('firewall').then(()=>this.mount(view,main,page)).catch(()=>null);
 },
 mount(view,main,page){
  if(!pages[page]||document.getElementById('nova-firewall-workspace'))return null;
  const fa=document.documentElement.lang.startsWith('fa'),t=(a,b)=>fa?a:b,label=pair=>t(pair[0],pair[1]);
  const meta=pages[page],tech=value=>node('bdi',{dir:'ltr'},String(value)),textList=(values,empty)=>values.length?node('div',{class:'nova-fw-values'},values.map(value=>tech(value))):node('span',{class:'nova-fw-muted'},empty);
  const zoneName=name=>name==='@router'?t('خود روتر','This router'):name==='*'?t('همهٔ زون‌ها','Any zone'):name;
  const badge=(value,tone)=>node('span',{class:'nova-fw-badge '+(tone||'')},value);
  const actionBadge=value=>badge(value||t('تعیین نشده','Not specified'),value==='ACCEPT'?'allow':value==='DROP'||value==='REJECT'?'deny':'other');
  const shell=node('section',{id:'nova-firewall-workspace',class:'nova-firewall-workspace',hidden:true,'aria-label':label(meta.title)});
  const nav=node('nav',{class:'nova-fw-nav','aria-label':t('بخش‌های فایروال','Firewall sections')},Object.entries(pages).map(([key,p])=>node('a',{href:L.url('admin','network','firewall',key),'aria-current':key===page?'page':null},label(p.title))));
  const count=node('span',{class:'nova-fw-count','aria-live':'polite'}),stats=node('div',{class:'nova-fw-stats'}),extras=node('div',{class:'nova-fw-context'});
  const search=node('input',{type:'search',class:'nova-fw-search',placeholder:t('جستجوی نام، IP، زون یا سرویس…','Search name, IP, zone or service…'),'aria-label':t('جستجوی فهرست','Search this list')});
  const enabledFilter=node('select',{'aria-label':t('فیلتر وضعیت','Status filter')},[node('option',{value:'all'},t('همهٔ وضعیت‌ها','All statuses')),node('option',{value:'on'},t('فعال','Enabled')),node('option',{value:'off'},t('غیرفعال','Disabled'))]);
  const mode=node('select',{'aria-label':t('نحوهٔ نمایش سیاست‌ها','Policy view')},[node('option',{value:'sequence'},t('ترتیب پیکربندی','Configuration order')),node('option',{value:'pairs'},t('مبدأ ← مقصد','Source → destination'))]);
  mode.hidden=page==='zones'||page==='ipsets';
  const add=node('button',{type:'button',class:'nova-fw-create'},t('ایجاد آیتم','Create item'));
  const original=node('button',{type:'button',class:'nova-fw-original-button'},t('ویرایش پیشرفته / ترتیب قوانین','Advanced editor / rule order'));
  const container=node('div',{class:'nova-fw-grid-scroll'}),notes=node('p',{class:'nova-fw-order-note'},t('این فهرست پیکربندی UCI است، نه شمارندهٔ اجرای قوانین. قواعد تولیدشده توسط PassWall یا اسکریپت‌ها در این فهرست نیستند. گروه‌بندی یا جستجو ترتیب واقعی قوانین را تغییر نمی‌دهد. برای اعمال تغییرات از «ذخیره و اعمال» استفاده کنید.','This is UCI configuration, not runtime hit counters. Rules generated by PassWall or scripts are not listed here. Grouping/search does not change rule order. Use Save & Apply to deploy changes.'));
  shell.append(nav,node('header',{class:'nova-fw-heading'},[node('div',{},[node('span',{class:'nova-fw-kicker'},t('سیاست‌ها و اشیای شبکه','POLICY & OBJECTS')),node('h1',{},label(meta.title)),node('p',{},label(meta.description))]),count]),stats,extras,node('div',{class:'nova-fw-toolbar'},[search,enabledFilter,mode,add,original]),container,notes);
  main.insertBefore(shell,view);
  let nativeDetails=null,nativeMap=null,rows=[],nativeRows=new Map(),lastSignature='',disposed=false,pending=false;
  function openOriginal(){if(nativeDetails){nativeDetails.open=true;nativeDetails.scrollIntoView?.({block:'nearest',behavior:'auto'});}}
  original.addEventListener('click',openOriginal);
  function nativeAction(sid,selector){
   const root=sid?nativeRows.get(sid):nativeMap?.querySelector('#cbi-firewall-'+meta.type);
   const button=root?.querySelector(selector);
   if(!button||button.disabled||!button.isConnected)return false;
   // Open the actual form before invoking its handler: native geometry,
   // validation, UCI buffers, ACL checks and modal lifecycle remain intact.
   openOriginal();button.click();return true;
  }
  add.addEventListener('click',()=>nativeAction(null,'.cbi-section-create .cbi-button-add'));
  function cell(content){return node('td',{},content);}
  const scheduleLabels={weekdays:t('روزهای هفته','Weekdays'),monthdays:t('روزهای ماه','Month days'),start_time:t('از ساعت','Start time'),stop_time:t('تا ساعت','End time'),start_date:t('از تاریخ','Start date'),stop_date:t('تا تاریخ','End date')};
  function schedule(m){return m.schedule.length?node('div',{class:'nova-fw-schedule'},m.schedule.map(s=>node('span',{},[scheduleLabels[s.key]+': ',tech(s.value)]))):node('span',{class:'nova-fw-muted'},t('بدون محدودیت زمانی','No time restriction'));}
  function service(m,port){return node('div',{class:'nova-fw-service'},[textList(m.proto.map(p=>p.toUpperCase()),t('پیش‌فرض ویرایشگر','Editor default')),textList(port,t('پورت مشخص نشده','No explicit port')),m.family?badge(m.family):null]);}
  function endpoint(name,ips,ports){return node('div',{class:'nova-fw-endpoint'},[badge(zoneName(name),'zone'),textList(ips,t('بدون محدودیت آدرس','No address restriction')),ports?.length?node('small',{},[t('پورت مبدأ: ','Source port: '),textList(ports,'')]):null]);}
  function rowNode(m){
   const edit=node('button',{type:'button',class:'nova-fw-edit','data-native-sid':m.sid},t('ویرایش','Edit'));
   const native=nativeRows.get(m.sid),nativeEdit=native?.querySelector('.cbi-button-edit');edit.disabled=!nativeEdit||!!nativeEdit.disabled;
   edit.addEventListener('click',()=>nativeAction(m.sid,'.cbi-button-edit'));
   const complete=node('button',{type:'button',class:'nova-fw-inspect','aria-expanded':'false'},t('جزئیات','Details'));
   const name=node('div',{class:'nova-fw-rule-name'},[node('strong',{},m.name),node('small',{},[tech(m.sid),page!=='zones'&&page!=='ipsets'?' · '+m.chain:''])]);
   let cells;
   if(page==='zones')cells=[cell(name),cell(textList(m.networks,t('شبکه‌ای عضو نشده','No member network'))),cell(actionBadge(m.input)),cell(actionBadge(m.output)),cell(actionBadge(m.forward)),cell([m.masq?badge('IPv4 NAT','nat'):null,m.masq6?badge('IPv6 NAT','nat'):null,!m.masq&&!m.masq6?node('span',{class:'nova-fw-muted'},t('خاموش','Off')):null])];
   else if(page==='ipsets')cells=[cell(name),cell(badge(m.family||t('پیش‌فرض','Default'))),cell(textList(m.matches,t('مشخص نشده','Not specified'))),cell(textList(m.entries,t('عضو صریح ندارد؛ جزئیات فایل/ست خارجی را ببینید','No explicit members; inspect file/external-set details'))),cell(badge(m.enabled?t('فعال','Enabled'):t('غیرفعال','Disabled'),m.enabled?'enabled':'disabled'))];
   else if(page==='forwards')cells=[cell(tech(m.order)),cell(name),cell(endpoint(m.src,m.srcIp,m.srcPort)),cell([textList(m.externalIp,t('هر آدرس محلی منطبق با زون','Any local address matching the zone')),service(m,m.externalPort)]),cell(endpoint(m.dest,m.destIp)),cell(textList(m.destPort,t('بدون بازنویسی پورت','No port rewrite'))),cell(actionBadge(m.action)),cell(badge(m.enabled?t('فعال','Enabled'):t('غیرفعال','Disabled'),m.enabled?'enabled':'disabled'))];
   else if(page==='snats')cells=[cell(tech(m.order)),cell(name),cell(endpoint(m.src,m.srcIp,m.srcPort)),cell(endpoint(m.dest,m.destIp)),cell(service(m,m.destPort)),cell(m.action==='MASQUERADE'?t('IP اینترفیس خروجی · خودکار','Outbound interface IP · automatic'):m.action==='ACCEPT'?t('بدون بازنویسی آدرس','Do not rewrite address'):[textList(m.rewriteIp,t('آدرس بازنویسی مشخص نشده','No explicit rewrite address')),textList(m.rewritePort,t('بدون بازنویسی پورت','No port rewrite'))]),cell(badge(m.action||t('تعیین نشده','Not specified'),'nat')),cell(badge(m.enabled?t('فعال','Enabled'):t('غیرفعال','Disabled'),m.enabled?'enabled':'disabled'))];
   else cells=[cell(tech(m.order)),cell(name),cell(endpoint(m.src,m.srcIp,m.srcPort)),cell(endpoint(m.dest,m.destIp)),cell(service(m,m.destPort)),cell(schedule(m)),cell(actionBadge(m.action)),cell(badge(m.enabled?t('فعال','Enabled'):t('غیرفعال','Disabled'),m.enabled?'enabled':'disabled'))];
   const tr=node('tr',{class:'nova-fw-policy-row'+(!m.enabled?' is-disabled':''),'data-config-sid':m.sid},cells.concat(cell(node('div',{class:'nova-fw-operations'},[edit,complete]))));
   const detailRow=node('tr',{class:'nova-fw-detail-row',hidden:true},node('td',{colspan:String(cells.length+1)},[
    node('strong',{},t('تطبیق کامل و گزینه‌های صریح','Full match and explicit options')),
    node('pre',{},matchText(native?.querySelector('[data-name="_match"]'))||t('اطلاعات تکمیلی در ویرایشگر اصلی است.','Additional details are in the native editor.')),
    page==='forwards'||page==='snats'?schedule(m):null,
    node('dl',{},Object.entries(m).filter(([k,v])=>!k.startsWith('.')&&['src_mac','device','direction','icmp_type','mark','dscp','helper','limit','limit_burst','log','ipset','extra','utc_time','reflection','loadfile','external','subnet','family','masq_src','masq_dest','set_mark','set_xmark','set_dscp','set_helper'].includes(k)&&v!=null&&v!=='').flatMap(([k,v])=>[node('dt',{},tech(k)),node('dd',{},tech(list(v).join(', ')))]))
   ]));
   complete.addEventListener('click',()=>{detailRow.hidden=!detailRow.hidden;complete.setAttribute('aria-expanded',String(!detailRow.hidden));});
   return [tr,detailRow];
  }
  function headers(){
   const ops=t('عملیات','Operations'),name=t('نام / شناسهٔ UCI','Name / UCI ID'),source=t('مبدأ','Source'),destination=t('مقصد','Destination'),state=t('وضعیت پیکربندی','Configured status');
   if(page==='zones')return [t('زون','Zone'),t('شبکه‌های عضو','Member networks'),t('به روتر · INPUT','To router · INPUT'),t('از روتر · OUTPUT','From router · OUTPUT'),t('داخل زون · FORWARD','Within zone · FORWARD'),t('NAT مبدأ','Source NAT'),ops];
   if(page==='ipsets')return [name,t('خانوادهٔ آدرس','Address family'),t('فیلد تطبیق','Match fields'),t('اعضای مجموعه','Set members'),state,ops];
   if(page==='forwards')return ['#',name,source,t('سرویس بیرونی','External service'),t('میزبان داخلی','Internal host'),t('پورت داخلی','Internal port'),t('اقدام NAT','NAT action'),state,ops];
   if(page==='snats')return ['#',name,t('آدرس / پورت مبدأ','Source address / port'),t('زون خروجی / آدرس مقصد','Outbound zone / destination address'),t('سرویس','Service'),t('بازنویسی مبدأ','Source rewrite'),t('اقدام NAT','NAT action'),state,ops];
   return ['#',name,source,destination,t('سرویس / پورت مقصد','Service / destination port'),t('زمان‌بندی','Schedule'),t('اقدام','Action'),state,ops];
  }
  function draw(){
   const query=(search.value||'').trim().toLowerCase(),filter=enabledFilter.value||'all';
   const filtered=rows.filter(m=>(filter==='all'||m.enabled===(filter==='on'))&&(!query||Object.values(m).flatMap(v=>Array.isArray(v)?v.map(x=>typeof x==='object'?x.value:x):[v]).join(' ').toLowerCase().includes(query)));
   const names=headers(),tbody=node('tbody'),table=node('table',{class:'nova-fw-table','aria-label':label(meta.title)},[node('thead',{},node('tr',{},names.map(name=>node('th',{scope:'col'},name)))),tbody]);
   const grouped=!mode.hidden&&mode.value==='pairs';
   if(grouped){const groups=new Map();for(const m of filtered){const key=m.chain+' · '+zoneName(m.src)+' → '+zoneName(m.dest);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(m);}for(const [title,members] of groups){tbody.appendChild(node('tr',{class:'nova-fw-group'},node('th',{colspan:String(names.length),scope:'rowgroup'},title+' · '+members.length)));members.forEach(m=>tbody.append(...rowNode(m)));}}
   else filtered.forEach(m=>tbody.append(...rowNode(m)));
   if(!filtered.length)tbody.appendChild(node('tr',{class:'nova-fw-empty'},node('td',{colspan:String(names.length)},rows.length?t('هیچ آیتمی با این فیلتر تطبیق ندارد.','No items match this filter.'):label(meta.description)+' '+t('هنوز آیتمی در این بخش تعریف نشده است.','No items are configured in this section yet.'))));
   container.replaceChildren(table);count.textContent=filtered.length+' / '+rows.length;
  }
  search.addEventListener('input',draw);enabledFilter.addEventListener('change',draw);mode.addEventListener('change',draw);
  function refresh(){
   if(disposed)return;
   nativeMap=view.querySelector('#cbi-firewall');const grid=nativeMap?.querySelector('#cbi-firewall-'+meta.type);
   if(!nativeMap||!grid){shell.hidden=true;main.classList.remove('nova-firewall-ready');return;}
   if(!nativeDetails||!nativeDetails.isConnected){nativeDetails=node('details',{class:'nova-native-firewall'},[node('summary',{},t('ویرایشگر اصلی LuCI · تنظیمات پیشرفته، حذف، تکثیر و ترتیب','Native LuCI editor · advanced settings, delete, clone and order'))]);nativeMap.parentNode.insertBefore(nativeDetails,nativeMap);nativeDetails.appendChild(nativeMap);}
   // Preserve the actual map, row cells, control objects, IDs and event handlers.
   if(!nativeDetails.contains(nativeMap))nativeDetails.appendChild(nativeMap);
   nativeRows=new Map(Array.from(grid.querySelectorAll('tr.cbi-section-table-row[data-sid]')).map(row=>[row.getAttribute('data-sid'),row]));
   const defaults=uci.sections('firewall','defaults')[0]||{};
   rows=uci.sections('firewall',meta.type).filter(row=>page!=='forwards'||row.target!=='SNAT').map((row,index)=>model(liveRow(row,nativeRows.get(row['.name'])),page,index,defaults));
   const source=JSON.stringify({rows,defaults,forwardings:uci.sections('firewall','forwarding'),native:[...nativeRows].map(([sid,row])=>[sid,!!row.querySelector('.cbi-button-edit'),!!row.querySelector('.cbi-button-edit')?.disabled,matchText(row.querySelector('[data-name="_match"]'))])});
   add.disabled=!grid.querySelector('.cbi-section-create .cbi-button-add')||!!grid.querySelector('.cbi-section-create .cbi-button-add')?.disabled;
   shell.hidden=false;main.classList.add('nova-firewall-ready');
   if(source===lastSignature)return;lastSignature=source;
   const all=uci.sections('firewall'),total=type=>all.filter(row=>row['.type']===type).length;
   stats.replaceChildren(...[[t('قوانین ترافیک','Traffic rules'),total('rule')],[t('انتشار سرویس','Service publishing'),all.filter(row=>row['.type']==='redirect'&&row.target!=='SNAT').length],[t('ترجمهٔ مبدأ','Source translation'),total('nat')],[t('زون / مجموعهٔ آدرس','Zones / address sets'),total('zone')+' / '+total('ipset')]].map(([title,value])=>node('div',{},[node('span',{},title),node('strong',{},String(value))])));
   extras.replaceChildren();
   if(page==='zones'){
    const definitions=[['INPUT',t('ترافیک به خود روتر','Traffic addressed to this router'),defaults.input],['OUTPUT',t('ترافیک ساخته‌شده توسط روتر','Traffic generated by this router'),defaults.output],['FORWARD',t('پیش‌فرض ترافیک عبوری بدون تطبیق','Default for unmatched forwarded traffic'),defaults.forward]];
    extras.appendChild(node('div',{class:'nova-fw-defaults'},definitions.map(([key,description,value])=>node('div',{},[node('strong',{},tech(key)),node('span',{},description),actionBadge(value)]))));
    extras.appendChild(node('div',{class:'nova-fw-paths'},[node('strong',{},t('مسیرهای مجاز بین زون‌ها · یک‌طرفه','Permitted inter-zone paths · one-way')),...uci.sections('firewall','forwarding').filter(row=>flag(row.enabled,true)).map(row=>node('span',{},[badge(row.src||t('مشخص نشده','Not specified'),'zone'),node('bdi',{dir:'ltr'},' → '),badge(row.dest||t('مشخص نشده','Not specified'),'zone')])),node('small',{},t('NAT به‌تنهایی اجازهٔ عبور ایجاد نمی‌کند؛ مسیر معکوس نیز خودکار مجاز نیست.','NAT alone does not grant forwarding permission; the reverse path is not automatically permitted.'))]));
   }
   draw();
  }
  function scheduleRefresh(){if(pending||disposed)return;pending=true;setTimeout(()=>{pending=false;try{refresh();}catch(e){shell.hidden=true;if(nativeDetails)nativeDetails.open=true;main.classList.remove('nova-firewall-ready');}},40);}
  const observer=new MutationObserver(scheduleRefresh);observer.observe(view,{childList:true,subtree:true});
  view.addEventListener('change',scheduleRefresh,true);view.addEventListener('input',scheduleRefresh,true);
  const dispose=()=>{disposed=true;observer.disconnect();view.removeEventListener('change',scheduleRefresh,true);view.removeEventListener('input',scheduleRefresh,true);};
  window.addEventListener('pagehide',dispose,{once:true});
  try{refresh();}catch(e){shell.hidden=true;if(nativeDetails)nativeDetails.open=true;main.classList.remove('nova-firewall-ready');}
  return {shell,refresh,dispose,nativeAction};
 }
});
