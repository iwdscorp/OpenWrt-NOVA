'use strict';
'require baseclass';
'require ui';
'require rpc';
'require poll';

const iconPaths = {
 status:'M3 12h4l3-7 4 14 3-7h4',
 network:'M4 4h6v6H4zM14 14h6v6h-6zM7 10v7h7M14 4h6v6h-6zM17 10v4',
 system:'M4 5h16v12H4zM9 21h6M12 17v4',
 services:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
 passwall:'M12 3l8 4v5c0 5-8 9-8 9s-8-4-8-9V7zM8 12l3 3 5-6',
 logout:'M9 4H4v16h5M10 12h11M17 8l4 4-4 4',
 chevron:'M6 9l6 6 6-6',
 vpn:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3'
};
const faLabels = {
 'Status':'وضعیت','Overview':'نمای کلی','System':'سیستم','Network':'شبکه','Services':'سرویس‌ها',
 'Interfaces':'اینترفیس‌ها','Routing':'مسیریابی','Firewall':'فایروال','DHCP':'DHCP','DNS':'DNS',
 'DHCP and DNS':'DHCP و DNS','Diagnostics':'عیب‌یابی','Wireless':'بی‌سیم','Administration':'مدیریت دسترسی',
 'Software':'بسته‌های نرم‌افزاری','Startup':'سرویس‌های راه‌اندازی','Scheduled Tasks':'وظایف زمان‌بندی',
 'Backup / Flash Firmware':'پشتیبان و به‌روزرسانی','Reboot':'راه‌اندازی مجدد','System Log':'گزارش سیستم',
 'Processes':'پردازش‌ها','Realtime Graphs':'نمودارهای زنده','Log out':'خروج','PassWall 2':'پس‌وال ۲',
 'Basic Settings':'تنظیمات اصلی','Node List':'نودها','Node Subscribe':'اشتراک‌ها','Other Settings':'تنظیمات تکمیلی',
 'Rule Manage':'مدیریت قوانین','Rule Management':'مدیریت قوانین','App Update':'به‌روزرسانی هسته','Log':'گزارش',
 'Load Balancing':'توازن بار','Server':'سرور','Advanced Settings':'تنظیمات پیشرفته'
};
const enLabels = {'Node Subscribe':'Subscriptions','Rule Manage':'Rule Management','App Update':'Core Updates'};
function label(text) {
 const lang=document.documentElement.lang;
 return lang.startsWith('fa') ? (faLabels[text] || _(text)) : (lang.startsWith('en') ? (enLabels[text] || _(text)) : _(text));
}
function icon(name, cls) {
 const ns='http://www.w3.org/2000/svg', s=document.createElementNS(ns,'svg'),p=document.createElementNS(ns,'path');
 s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');
 s.setAttribute('stroke-width','1.65');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');
 s.setAttribute('class',cls||'nova-nav-icon');s.setAttribute('aria-hidden','true');
 p.setAttribute('d',iconPaths[name]||iconPaths.services);s.appendChild(p);return s;
}
function active(path) { return L.env.dispatchpath.slice(0,path.length).join('/')===path.join('/'); }
return baseclass.extend({
 __init__() {
  return ui.menu.load().then(tree=>this.render(tree)).catch(err=>ui.addNotification(null,E('p',{},err.message)));
 },
 render(tree) {
  const root=document.getElementById('topmenu'), modes=ui.menu.getChildren(tree);
  const mode=modes.find(n=>n.name===L.env.dispatchpath[0])||modes[0];
  if(!mode)return;
  ui.menu.getChildren(mode).forEach(group=>{
   const path=[mode.name,group.name],children=ui.menu.getChildren(group), isActive=active(path);
   if(!children.length) {
    root.appendChild(E('li',{},E('a',{'class':'nova-nav-link','href':L.url(...path)},[icon(group.name),E('span',{},label(group.title))])));
    return;
   }
   const id='nova-group-'+group.name;
   let saved=null;try{saved=sessionStorage.getItem(id)}catch(e){}
   const expanded=isActive||saved==='1';
   const list=E('ul',{'id':id,'class':'nova-submenu'});
   list.hidden=!expanded;
   children.forEach(child=>{
    const cp=path.concat(child.name), selected=active(cp);
    list.appendChild(E('li',{},E('a',{'href':L.url(...cp),'aria-current':selected?'page':null},label(child.title))));
    if(selected) {
     document.getElementById('nova-context').textContent=label(group.title)+' / '+label(child.title);
     document.getElementById('nova-page-title').textContent=label(child.title);
     // getChildren resolves aliases and may replace their children. Tabs must
     // traverse the original tree, as LuCI bootstrap does (e.g. PassWall).
     const raw=cp.reduce((node,key)=>node?.children?.[key],tree);
     if(raw)this.renderTabs(raw,cp,document.getElementById('tabmenu'));
    }
   });
   const button=E('button',{'type':'button','class':'nova-nav-toggle','aria-expanded':String(expanded),'aria-controls':id},[
    icon(group.name),E('span',{},label(group.title)),icon('chevron','nova-nav-chevron')
   ]);
   button.addEventListener('click',()=>{
    list.hidden=!list.hidden;button.setAttribute('aria-expanded',String(!list.hidden));
    try{sessionStorage.setItem(id,list.hidden?'0':'1')}catch(e){}
   });
   root.appendChild(E('li',{'class':'nova-nav-group'+(isActive?' active':'')},[button,list]));
  });
  if(modes.length>1){const mm=document.getElementById('modemenu');mm.hidden=false;modes.forEach(m=>mm.appendChild(E('li',{},E('a',{href:L.url(m.name)},label(m.title)))));}
  if(L.env.dispatchpath.join('/')==='admin/status/overview')this.summary();
 },
 renderTabs(tree,path,container) {
  const children=ui.menu.getChildren(tree);if(!children.length)return;
  const tabs=E('ul',{'class':'tabs','aria-label':label(tree.title)});
  children.forEach(child=>{
   const cp=path.concat(child.name),selected=active(cp);
   tabs.appendChild(E('li',{'class':selected?'active':''},E('a',{href:L.url(...cp),'aria-current':selected?'page':null},label(child.title))));
  });
  container.appendChild(tabs);container.style.display='';
  const selected=children.find(child=>active(path.concat(child.name)));
  if(selected)this.renderTabs(selected,path.concat(selected.name),container);
 },
 summary() {
  const callInfo=rpc.declare({object:'system',method:'info',expect:{'':{}}});
  const update=()=>callInfo().then(info=>{
   const fa=document.documentElement.lang.startsWith('fa');
   const mem=info.memory||{},used=mem.total?Math.round((mem.total-(mem.available??mem.free))/mem.total*100):null;
   const seconds=info.uptime||0,uptime=Math.floor(seconds/86400)+'d '+Math.floor(seconds%86400/3600)+'h '+Math.floor(seconds%3600/60)+'m';
   const values=[
    [fa?'زمان روشن‌بودن':'Uptime',uptime,fa?'از آخرین راه‌اندازی':'Since last boot'],
    [fa?'حافظهٔ مصرف‌شده':'Memory used',used===null?'—':used+'%',mem.total?Math.round(mem.total/1048576)+' MB RAM':'—'],
    [fa?'بار پردازنده':'CPU load',info.load?(info.load[0]/65536).toFixed(2):'—',fa?'میانگین یک دقیقه':'1 minute average'],
    [fa?'زمان روتر':'Router time',info.localtime?new Date(info.localtime*1000).toISOString().slice(11,19):'—',fa?'زمان گزارش‌شده توسط سیستم':'Reported by system']
   ];
   const row=E('section',{'class':'nova-status-summary','aria-label':fa?'خلاصه وضعیت':'Status summary'},values.map(v=>E('div',{'class':'nova-summary-item'},[E('span',{'class':'nova-summary-label'},v[0]),E('strong',{},v[1]),E('small',{},v[2])])));
   const main=document.getElementById('maincontent'),tabs=document.getElementById('tabmenu');
   const current=main.querySelector('.nova-status-summary');
   if(current)current.replaceWith(row);else main.insertBefore(row,tabs.nextSibling);
  }).catch(()=>{});
  update();poll.add(update,5);
 }
});
