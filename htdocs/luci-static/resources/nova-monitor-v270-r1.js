'use strict';
'require baseclass';
'require rpc';
'require poll';

// Exact netifd byte counters, sampled in the browser; no fabricated history.
function rates(previous, current, elapsed) {
 if(!previous || !Number.isFinite(elapsed) || elapsed<1 || elapsed>15 || ![previous.rx,previous.tx,current.rx,current.tx].every(Number.isSafeInteger) || previous.rx<0 || previous.tx<0 || current.rx<previous.rx || current.tx<previous.tx)return null;
 return {rx:(current.rx-previous.rx)*8/elapsed,tx:(current.tx-previous.tx)*8/elapsed};
}
function geometry(points, key, maximum, width, height) {
 if(!points.length)return '';
 return points.map((point,index)=>(index?'L':'M')+(index*width/Math.max(1,points.length-1)).toFixed(2)+','+(height-Math.max(0,Math.min(maximum,point[key]))/maximum*height).toFixed(2)).join(' ');
}
// Timestamp spacing is real. Missing/reset intervals are gaps, not zero traffic.
function coordinates(points,key,maximum,width,height,start,end){
 return points.map((p,i)=>({...p,breakBefore:!!p.breakBefore||i>0&&!Number.isFinite(points[i-1][key])})).filter(p=>p.time>=start&&p.time<=end&&Number.isFinite(p[key])).map(p=>({time:p.time,x:(p.time-start)/Math.max(1,end-start)*width,y:height-Math.max(0,Math.min(maximum,p[key]))/maximum*height,breakBefore:p.breakBefore}));
}
function paths(points,height){
 const segments=[];points.forEach((p,i)=>{if(!i||p.breakBefore||p.time-points[i-1].time>15000)segments.push([]);segments[segments.length-1].push(p);});
 const xy=p=>p.x.toFixed(2)+','+p.y.toFixed(2);
 return {line:segments.map(s=>s.map((p,i)=>(i?'L':'M')+xy(p)).join(' ')).join(' '),area:segments.map(s=>'M'+s.map(xy).join(' L')+' L'+s[s.length-1].x.toFixed(2)+','+height+' L'+s[0].x.toFixed(2)+','+height+' Z').join(' ')};
}
function statistics(points,start,end){
 let seconds=0,rx=0,tx=0;
 for(const p of points){const elapsed=Number.isFinite(start)&&Number.isFinite(end)?Math.max(0,Math.min(p.time,end)-Math.max(p.time-p.elapsed*1000,start))/1000:p.elapsed;seconds+=elapsed;rx+=p.rx*elapsed;tx+=p.tx*elapsed;}
 return {rx:seconds?rx/seconds:null,tx:seconds?tx/seconds:null,peakRx:points.length?Math.max(...points.map(p=>p.rx)):null,peakTx:points.length?Math.max(...points.map(p=>p.tx)):null};
}
// Animation interpolates SVG pixels only. Samples, summaries and tooltips never
// interpolate, extrapolate or invent data. Final frame equals the measured path.
function paintSeries(series,target,height,duration){
 if(series.frame&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(series.frame);
 series.target=target;series.height=height;
 const from=series.positions||[],byTime=new Map(from.map(p=>[p.time,p]));
 let began=null;
 function paint(progress){
  const points=target.map(p=>{const old=byTime.get(p.time)||from[from.length-1]||{x:p.x,y:height};return {...p,x:old.x+(p.x-old.x)*progress,y:old.y+(p.y-old.y)*progress};});
  const d=paths(points,height);series.line.setAttribute('d',d.line);series.area.setAttribute('d',d.area);series.positions=points;
  if(series.dot){const last=points[points.length-1];series.dot.style.display=last?'':'none';if(last){series.dot.setAttribute('cx',last.x);series.dot.setAttribute('cy',last.y);}}
 }
 if(!duration||!from.length||typeof requestAnimationFrame!=='function'){paint(1);series.frame=null;return;}
 function frame(time){if(began===null)began=time;const progress=Math.min(1,(time-began)/duration);paint(1-Math.pow(1-progress,3));series.frame=progress<1?requestAnimationFrame(frame):null;}
 series.frame=requestAnimationFrame(frame);
}
function svg(tag,attributes,children) {
 const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
 Object.entries(attributes||{}).forEach(([key,value])=>node.setAttribute(key,String(value)));
 (children||[]).forEach(child=>node.appendChild(child));return node;
}
const icons={network:'M4 6h16v5H4z M6 8h.01M9 8h.01M12 11v5M5 20v-4h14v4M12 16v4',download:'M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4',upload:'M12 16V4m-5 5 5-5 5 5M5 17v4h14v-4',memory:'M7 7h10v10H7zM9 1v6m6-6v6M9 17v6m6-6v6M1 9h6m-6 6h6m10-6h6m-6 6h6',router:'M3 13h18v7H3zM6 17h.01M10 17h.01M6 13V4m12 9V4M10 5q2-2 4 0'};
function icon(name){return svg('svg',{viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'},[svg('path',{d:icons[name]||icons.network})]);}

return baseclass.extend({
 rates:rates,geometry:geometry,coordinates:coordinates,paths:paths,statistics:statistics,paintSeries:paintSeries,
 start:function(){
  const page=L.env.dispatchpath.join('/');
  if(page!=='admin/network/network'&&page!=='admin/status/overview')return;
  const fa=document.documentElement.lang.startsWith('fa'),t=(persian,english)=>fa?persian:english;
  const main=document.getElementById('maincontent');if(!main||main.querySelector('.nova-insights'))return;
  const infoCall=rpc.declare({object:'system',method:'info',expect:{'':{}}});
  const deviceCall=rpc.declare({object:'network.device',method:'status',expect:{'':{}}});
  const interfaceCall=rpc.declare({object:'network.interface',method:'dump',expect:{interface:[]}});
  const format=(value,decimals=1)=>new Intl.NumberFormat(fa?'fa-IR':'en-US',{maximumFractionDigits:decimals}).format(value);
  const speed=value=>value==null?'—':value>=1e6?format(value/1e6)+' Mbps':format(value/1e3)+' Kbps';
  const capacity=value=>value>=1073741824?format(value/1073741824)+' GiB':value>=1048576?format(value/1048576)+' MiB':value>=1024?format(value/1024)+' KiB':format(value,0)+' B';
  // Stable elapsed time even if the browser's wall clock is adjusted mid-chart.
  const clockOrigin=typeof performance!=='undefined'?Date.now()-performance.now():0;
  const nowTime=()=>typeof performance!=='undefined'?clockOrigin+performance.now():Date.now();
  const history=new Map(),previous=new Map(),volumes=new Map(),systemHistory=[];
  let selected='',selectedName='',latest=[],span=60,paused=false,lastDeviceData={},gap=false,lastSample=0;
  const motionPreference=typeof window!=='undefined'&&window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  let motionOff=false;try{motionOff=localStorage.getItem('nova-motion-off')==='1';}catch(e){}
  const animatedSeries=new Set();
  const shown={rx:true,tx:true};let selectedIndex=null;
  const shell=E('section',{class:'nova-insights','aria-label':t('بینش زنده شبکه','Live network insights')});
  const cards={},tile=(name,label,sub)=>{
   const value=E('strong',{dir:'auto'},'—'),note=E('small',{},sub);cards[name]={value:value,note:note};
   const spark=svg('svg',{viewBox:'0 0 160 32',preserveAspectRatio:'none','aria-hidden':'true',class:'nova-tile-spark'}),line=svg('path',{fill:'none',stroke:'currentColor','stroke-width':2}),area=svg('path',{fill:'currentColor','fill-opacity':.08});spark.appendChild(area);spark.appendChild(line);cards[name].series={line,area};animatedSeries.add(cards[name].series);
   return E('article',{class:'nova-live-tile nova-tile-'+name},[E('span',{class:'nova-tile-icon'},icon(name)),E('span',{class:'nova-tile-label'},label),value,note,spark]);
  };
  shell.appendChild(E('div',{class:'nova-live-tiles grid gap-4'},[
   tile('network',t('رابط‌های فعال','Active interfaces'),t('وضعیت واقعی netifd','Actual netifd state')),
   tile('download',t('دریافت لحظه‌ای','Current receive'),t('در انتظار نمونه دوم','Waiting for second sample')),
   tile('upload',t('ارسال لحظه‌ای','Current transmit'),t('در انتظار نمونه دوم','Waiting for second sample')),
   tile('memory',t('مصرف حافظه','Memory usage'),t('آمار سیستم روتر','Router system statistics'))
  ]));
  const selector=E('select',{'aria-label':t('رابط نمودار','Chart interface'),class:'nova-chart-select'});
  const live=E('span',{class:'nova-live-pill'},t('در حال اتصال','Connecting'));
  const pause=E('button',{type:'button',class:'nova-chart-pause','aria-pressed':'false'},t('توقف نمودار','Pause chart'));
  const motion=E('button',{type:'button',class:'nova-chart-motion'});
  const timebuttons=[60,180,900].map(seconds=>{
   const button=E('button',{type:'button',class:'nova-chart-range'+(seconds===span?' active':''),'aria-pressed':String(seconds===span)},t(seconds===60?'۱ دقیقه':seconds===180?'۳ دقیقه':'۱۵ دقیقه',seconds===60?'1 minute':seconds===180?'3 minutes':'15 minutes'));
   button.addEventListener('click',()=>{span=seconds;timebuttons.forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});draw();});return button;
  });
  const plot=svg('svg',{viewBox:'0 0 720 210',preserveAspectRatio:'none',role:'img',tabindex:'0','aria-label':t('نمودار زنده دریافت و ارسال؛ کلیدهای چپ و راست برای بررسی نمونه‌ها','Live receive and transmit chart; left and right keys inspect samples')});
  plot.appendChild(svg('defs',{},['rx','tx'].map((key,index)=>svg('linearGradient',{id:'nova-gradient-'+key,x1:0,y1:0,x2:0,y2:1},[svg('stop',{offset:'0%','stop-color':index?'#8b5cf6':'#16b8a6','stop-opacity':.24}),svg('stop',{offset:'100%','stop-color':index?'#8b5cf6':'#16b8a6','stop-opacity':.015})]))));
  for(let y=0;y<=210;y+=52.5)plot.appendChild(svg('line',{x1:0,x2:720,y1:y,y2:y,stroke:'#e8edf5','stroke-dasharray':'4 6'}));
  const curves={};['tx','rx'].forEach(key=>{curves[key]={area:svg('path',{fill:'url(#nova-gradient-'+key+')'}),line:svg('path',{fill:'none',stroke:key==='rx'?'#16b8a6':'#8b5cf6','stroke-width':2.8,'vector-effect':'non-scaling-stroke','stroke-linecap':'round','stroke-linejoin':'round'}),dot:svg('circle',{r:4,fill:key==='rx'?'#16b8a6':'#8b5cf6',stroke:'white','stroke-width':2})};plot.appendChild(curves[key].area);plot.appendChild(curves[key].line);plot.appendChild(curves[key].dot);animatedSeries.add(curves[key]);});
  const cursor=svg('line',{x1:0,x2:0,y1:0,y2:210,stroke:'#8796b0','stroke-dasharray':'3 4',visibility:'hidden'});plot.appendChild(cursor);
  const tooltip=E('div',{class:'nova-chart-tooltip',hidden:true,dir:'auto'}),empty=E('div',{class:'nova-chart-empty',dir:fa?'rtl':'ltr'},t('نمونه‌گیری از روتر؛ نمودار پس از دو نمونه آغاز می‌شود.','Sampling router counters; chart starts after two samples.'));
  const scale=E('div',{class:'nova-chart-scale',dir:'ltr'}),timeLabels=E('div',{class:'nova-chart-times',dir:'ltr'});
  const summary=E('div',{class:'nova-traffic-summary'}),sampleNote=E('small',{class:'nova-sample-note'});
  const legend=['rx','tx'].map(key=>{
   const button=E('button',{type:'button',class:'nova-chart-legend '+key,'aria-pressed':'true'},[E('i',{}),t(key==='rx'?'دریافت':'ارسال',key==='rx'?'Receive':'Transmit')]);
   button.addEventListener('click',()=>{shown[key]=!shown[key];button.classList.toggle('muted',!shown[key]);button.setAttribute('aria-pressed',String(shown[key]));draw();});return button;
  });
  const chart=E('article',{class:'nova-traffic-panel'},[
   E('div',{class:'nova-panel-heading'},[E('div',{},[E('span',{class:'nova-panel-kicker'},t('دید لحظه‌ای','LIVE TELEMETRY')),E('h2',{},t('جریان ترافیک شبکه','Network traffic flow'))]),live]),
   E('div',{class:'nova-chart-toolbar'},[selector,E('div',{class:'nova-chart-controls'},timebuttons.concat(pause,motion))]),
   E('div',{class:'nova-chart-body'},[scale,E('div',{class:'nova-chart-canvas'},[plot,empty,tooltip])]),timeLabels,
   summary,E('div',{class:'nova-chart-foot'},[E('div',{class:'nova-chart-legends'},legend),sampleNote])
  ]);
  const memoryValue=E('strong',{},'—'),memoryRing=E('div',{class:'nova-memory-ring'},E('div',{},[memoryValue,E('span',{},t('حافظه','MEMORY'))]));
  const systemNote=E('p',{},t('در انتظار اطلاعات سیستم','Waiting for system information'));
  const details=E('div',{class:'nova-link-details'}),deviceHeading=E('strong',{dir:'ltr'},'—');
  function miniChart(title,key,color){const value=E('strong',{dir:'auto'},'—'),line=svg('path',{fill:'none',stroke:color,'stroke-width':2}),area=svg('path',{fill:color,'fill-opacity':.1}),graph=svg('svg',{viewBox:'0 0 220 54',preserveAspectRatio:'none','aria-hidden':'true'},[area,line]);const series={line,area};animatedSeries.add(series);return {value,series,node:E('div',{class:'nova-system-trend'},[E('div',{},[E('span',{},title),value]),graph]),key};}
  const memoryTrend=miniChart(t('روند حافظهٔ مصرف‌شده','Memory usage trend'),'memory','#9d83ef'),loadTrend=miniChart(t('بار پردازنده · میانگین ۱ دقیقه، نه درصد','CPU load · 1-minute average, not percent'),'load','#e3a153');
  const counterDetails=E('div',{class:'nova-counter-details'});
  const side=E('aside',{class:'nova-health-panel'},[
   E('div',{class:'nova-panel-heading'},[E('div',{},[E('span',{class:'nova-panel-kicker'},t('وضعیت سیستم','SYSTEM HEALTH')),E('h2',{},t('سلامت و اتصال','Health & connectivity'))]),icon('memory')]),
   memoryRing,systemNote,memoryTrend.node,loadTrend.node,E('div',{class:'nova-topology'},[E('span',{class:'nova-topology-icon'},icon('router')),E('div',{},[E('small',{},t('دستگاه رابط انتخاب‌شده','Selected interface device')),deviceHeading])]),details,E('details',{class:'nova-counter-disclosure'},[E('summary',{},t('بسته‌ها و حذف‌شده‌ها','Packets and drops')),counterDetails])
  ]);
  shell.appendChild(E('div',{class:'nova-insights-grid'},[chart,side]));
  const comparisons=E('div',{class:'nova-interface-charts'}),comparisonNodes=new Map();
  shell.appendChild(E('article',{class:'nova-comparison-panel'},[E('div',{class:'nova-panel-heading'},[E('div',{},[E('span',{class:'nova-panel-kicker'},t('دید همهٔ رابط‌ها','ALL INTERFACES')),E('h2',{},t('مقایسهٔ ترافیک رابط‌ها','Interface traffic comparison'))])]),E('p',{},t('هر دستگاه جداگانه؛ جمع WAN، LAN و پل‌ها ترافیک اینترنت نیست. برای نمودار بزرگ روی رابط بزنید.','Each device separately; adding WAN, LAN and bridges is not Internet traffic. Select a device for its full chart.')),comparisons]));
  const tabs=document.getElementById('tabmenu');main.insertBefore(shell,tabs.nextSibling);
  // The interface native tab remains operable; hide insights on Devices/Globals.
  const view=document.getElementById('view');
  if(page==='admin/network/network'&&view){
   const mount=()=>{
    // Move only our own panel; LuCI's native tab bar stays in its original map.
    const map=view.querySelector('#cbi-network'),menu=map?.querySelector(':scope > .cbi-tabmenu');
    if(menu&&shell.parentNode!==map)map.insertBefore(shell,menu.nextSibling);
    const panel=view.querySelector('#cbi-network-interface');if(panel)shell.hidden=panel.closest('[data-tab-active="false"]')!==null;
   };
   new MutationObserver(mount).observe(view,{childList:true,attributes:true,subtree:true,attributeFilter:['data-tab-active']});mount();
  }
  function stopAnimations(){animatedSeries.forEach(series=>{if(series.target)paintSeries(series,series.target,series.height,0);});}
  function motionState(){const off=motionOff||!!motionPreference?.matches||paused||document.hidden;shell.classList.toggle('nova-motion-off',off);motion.setAttribute('aria-pressed',String(!off));motion.textContent=off?t('حرکت: خاموش','Motion: off'):t('حرکت: روشن','Motion: on');motion.disabled=!!motionPreference?.matches;if(off)stopAnimations();}
  const duration=()=>motionOff||motionPreference?.matches||paused||document.hidden?0:420;
  motion.addEventListener('click',()=>{motionOff=!motionOff;try{localStorage.setItem('nova-motion-off',motionOff?'1':'0');}catch(e){}motionState();});
  motionPreference?.addEventListener?.('change',motionState);
  if(document.addEventListener)document.addEventListener('visibilitychange',motionState);
  if(typeof window!=='undefined'&&window.addEventListener)window.addEventListener('pagehide',stopAnimations,{once:true});
  motionState();
  pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?t('ادامه نمودار','Resume chart'):t('توقف نمودار','Pause chart');pause.setAttribute('aria-pressed',String(paused));live.textContent=paused?t('نمایش متوقف','Display paused'):t('زنده','Live');motionState();if(!paused)draw();});
  function selectDevice(value){selected=value;selector.value=value;selectedName=selector.options[selector.selectedIndex]?.textContent||selected;selectedIndex=null;tooltip.hidden=true;curves.rx.positions=curves.tx.positions=[];draw();updateDetails();}
  selector.addEventListener('change',()=>selectDevice(selector.value));
  plot.addEventListener('pointermove',event=>{if(!latest.length)return;const rect=plot.getBoundingClientRect(),time=(lastSample||nowTime())-span*1000+(event.clientX-rect.left)/rect.width*span*1000;selectedIndex=latest.reduce((nearest,p,i)=>Math.abs(p.time-time)<Math.abs(latest[nearest].time-time)?i:nearest,0);showTooltip();});
  plot.addEventListener('keydown',event=>{if(!latest.length)return;if(event.key==='Escape'){selectedIndex=null;tooltip.hidden=true;cursor.setAttribute('visibility','hidden');return;}if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();selectedIndex=Math.max(0,Math.min(latest.length-1,(selectedIndex??latest.length-1)+(event.key==='ArrowRight'?1:-1)));showTooltip();});
  plot.addEventListener('pointerleave',()=>{selectedIndex=null;tooltip.hidden=true;cursor.setAttribute('visibility','hidden');});
  function showTooltip(){if(selectedIndex==null||!latest[selectedIndex]){tooltip.hidden=true;cursor.setAttribute('visibility','hidden');return;}const point=latest[selectedIndex],x=(point.time-((lastSample||nowTime())-span*1000))/(span*1000)*720;cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);cursor.setAttribute('visibility','visible');tooltip.hidden=false;tooltip.textContent=new Date(point.time).toLocaleTimeString(fa?'fa-IR':'en-US')+' · '+t('دریافت ','RX ')+speed(point.rx)+' / '+t('ارسال ','TX ')+speed(point.tx);}
  function draw(){
   const samples=history.get(selected)||[],now=lastSample||nowTime(),start=now-span*1000;latest=samples.filter(p=>p.time>=start);
   const maximum=Math.max(1000,...latest.flatMap(p=>[shown.rx?p.rx:0,shown.tx?p.tx:0]));
   scale.textContent='';[maximum,maximum/2,0].forEach(value=>scale.appendChild(E('span',{},speed(value))));
   timeLabels.textContent='';[start,start+span*500,now].forEach(time=>timeLabels.appendChild(E('span',{},new Date(time).toLocaleTimeString(fa?'fa-IR':'en-US'))));
   empty.hidden=latest.length>0;
   empty.textContent=t('نمونه‌گیری از روتر؛ نمودار پس از دو نمونه آغاز می‌شود.','Sampling router counters; chart starts after two samples.');
   ['rx','tx'].forEach(key=>{paintSeries(curves[key],coordinates(latest,key,maximum,720,210,start,now),210,duration());[curves[key].line,curves[key].area,curves[key].dot].forEach(node=>{node.style.visibility=shown[key]?'visible':'hidden';});});
   const point=latest[latest.length-1],last=point&&now-point.time<=15000?point:null;
   cards.download.value.textContent=speed(last?.rx);cards.upload.value.textContent=speed(last?.tx);cards.download.note.textContent=cards.upload.note.textContent=selectedName||selected||'—';
   const stats=statistics(latest,start,now),volume=volumes.get(selected);
   summary.textContent='';[
    [t('میانگین دریافت / ارسال','Average receive / transmit'),speed(stats.rx)+' / '+speed(stats.tx)],
    [t('اوج دریافت / ارسال','Peak receive / transmit'),speed(stats.peakRx)+' / '+speed(stats.peakTx)],
    [t('حجم مشاهده‌شده در این نشست','Observed transfer this session'),volume?capacity(volume.rx)+' / '+capacity(volume.tx):'—']
   ].forEach(([label,value])=>summary.appendChild(E('div',{},[E('span',{},label),E('bdi',{dir:'auto'},value)])));
   sampleNote.textContent=t('هر ۳ ثانیه · ','Every 3 seconds · ')+format(latest.length,0)+t(' نمونه · تاریخچهٔ همین صفحه · فاصلهٔ خالی یعنی دادهٔ ناموجود',' samples · this page session · gaps mean missing data');
   [['download','rx'],['upload','tx']].forEach(([tile,key])=>paintSeries(cards[tile].series,coordinates(latest,key,maximum,160,32,start,now),32,duration()));
   [memoryTrend,loadTrend].forEach(trend=>{const points=systemHistory.filter(p=>p.time>=start),last=points[points.length-1];trend.value.textContent=Number.isFinite(last?.[trend.key])?format(last[trend.key],trend.key==='memory'?0:2)+(trend.key==='memory'?'%':''):'—';paintSeries(trend.series,coordinates(points,trend.key,trend.key==='memory'?100:Math.max(1,...points.map(p=>p.load||0)),220,54,start,now),54,duration());});
   paintSeries(cards.memory.series,coordinates(systemHistory,'memory',100,160,32,start,now),32,duration());
   paintSeries(cards.network.series,coordinates(systemHistory,'active',Math.max(1,interfaceData.length),160,32,start,now),32,duration());
   drawComparisons(start,now);showTooltip();
  }
  let interfaceData=[];
  function drawComparisons(start,now){
   const devices=[...new Set(interfaceData.map(net=>net.l3_device||net.device).filter(name=>lastDeviceData[name]))].sort();
   // No router-wide sum: bridges/VLANs/tunnels can count the same packet twice.
   for(const [name,row] of comparisonNodes)if(!devices.includes(name)){[row.rx,row.tx].forEach(series=>{if(series.frame&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(series.frame);animatedSeries.delete(series);});row.button.remove();comparisonNodes.delete(name);}
   devices.forEach(name=>{
    let row=comparisonNodes.get(name);
    if(!row){const graph=svg('svg',{viewBox:'0 0 220 54',preserveAspectRatio:'none','aria-hidden':'true'}),rx={line:svg('path',{fill:'none',stroke:'#16b8a6','stroke-width':2}),area:svg('path',{fill:'#16b8a6','fill-opacity':.08})},tx={line:svg('path',{fill:'none',stroke:'#8b5cf6','stroke-width':2}),area:svg('path',{fill:'#8b5cf6','fill-opacity':.08})};[rx,tx].forEach(s=>{graph.appendChild(s.area);graph.appendChild(s.line);animatedSeries.add(s);});const values=E('div',{class:'nova-comparison-values'}),state=E('span',{class:'nova-comparison-state'}),button=E('button',{type:'button',class:'nova-comparison-item','aria-pressed':'false'},[E('div',{class:'nova-comparison-heading'},[E('bdi',{dir:'ltr'},name),state]),graph,values]);button.addEventListener('click',()=>selectDevice(name));comparisons.appendChild(button);row={button,values,state,rx,tx};comparisonNodes.set(name,row);}
    row.button.setAttribute('aria-pressed',String(selected===name));row.state.textContent=interfaceData.some(net=>(net.l3_device||net.device)===name&&net.up)?t('فعال','Online'):t('غیرفعال','Offline');
    const points=(history.get(name)||[]).filter(p=>p.time>=start),point=points[points.length-1],last=point&&now-point.time<=15000?point:null,max=Math.max(1000,...points.flatMap(p=>[p.rx,p.tx]));
    row.values.textContent='';[['rx',t('دریافت','Receive')],['tx',t('ارسال','Transmit')]].forEach(([key,label])=>{row.values.appendChild(E('span',{class:key},[label+' ',E('bdi',{dir:'auto'},speed(last?.[key]))]));paintSeries(row[key],coordinates(points,key,max,220,54,start,now),54,duration());});
   });
  }
  function updateDetails(){
   const current=interfaceData.find(net=>(net.l3_device||net.device)===selected),device=lastDeviceData[selected];deviceHeading.textContent=selected||'—';details.textContent='';
   const gateway=current?.route?.find(route=>route.target==='0.0.0.0'&&route.mask===0)?.nexthop;
   const fields=[[t('IPv4','IPv4'),current?.['ipv4-address']?.map(ip=>ip.address+'/'+ip.mask).join(', ')||'—'],[t('دروازه','Gateway'),gateway||'—'],[t('DNS','DNS'),current?.['dns-server']?.join(', ')||'—'],[t('MAC','MAC'),device?.macaddr||'—']];
   fields.forEach(([label,value])=>details.appendChild(E('div',{},[E('span',{},label),E('bdi',{dir:'ltr'},value)])));
   const stat=device?.statistics;counterDetails.textContent='';
   counterDetails.appendChild(E('small',{},t('شمارنده‌های تجمعی دستگاه، نه خطای همین لحظه','Cumulative device counters, not current error rates')));
   [['rx_packets',t('بستهٔ دریافت','Received packets')],['tx_packets',t('بستهٔ ارسال','Sent packets')],['rx_dropped',t('حذف‌شدهٔ دریافت','Receive drops')],['tx_dropped',t('حذف‌شدهٔ ارسال','Transmit drops')]].forEach(([key,label])=>counterDetails.appendChild(E('div',{},[E('span',{},label),E('bdi',{dir:'auto'},Number.isFinite(stat?.[key])?format(stat[key],0):'—')])));
   document.querySelectorAll('#cbi-network-interface .cbi-section-table-row').forEach(row=>{
    const net=interfaceData.find(net=>net.interface===row.getAttribute('data-sid'));
    row.classList.toggle('nova-interface-up',!!net?.up);
    let badge=row.querySelector('.nova-interface-status');if(!badge){badge=E('span',{class:'nova-interface-status'});row.querySelector('.ifacebox-head')?.appendChild(badge);}
    badge.textContent=net?(net.up?t('فعال','Online'):t('غیرفعال','Offline')):t('نامشخص','Unknown');
   });
  }
  let inFlight=false;
  const update=()=>{
   if(document.hidden||inFlight)return Promise.resolve();inFlight=true;
   return Promise.all([deviceCall(),interfaceCall(),L.resolveDefault(infoCall(),null)]).then(([devices,nets,info])=>{
    lastDeviceData=devices;interfaceData=nets.filter(net=>net.interface!=='loopback');
    const options=interfaceData.filter(net=>devices[net.l3_device||net.device]);
    const optionKeys=options.map(net=>net.interface+':'+(net.l3_device||net.device)).join('|');
    if(selector.getAttribute('data-options')!==optionKeys){selector.textContent='';options.forEach(net=>selector.appendChild(E('option',{value:net.l3_device||net.device},net.interface+' · '+(net.l3_device||net.device))));selector.setAttribute('data-options',optionKeys);if(!options.some(net=>(net.l3_device||net.device)===selected)){const preferred=options.find(net=>net.interface==='wan')||options[0];selected=preferred?.l3_device||preferred?.device||'';}selector.value=selected;selectedName=selector.options[selector.selectedIndex]?.textContent||selected;}
    const time=nowTime();lastSample=time;new Set(options.map(net=>net.l3_device||net.device)).forEach(name=>{
     const statistics=devices[name]?.statistics;
     if(!statistics||![statistics.rx_bytes,statistics.tx_bytes].every(Number.isSafeInteger)||statistics.rx_bytes<0||statistics.tx_bytes<0){const prior=previous.get(name);if(prior)prior.gap=true;return;}
     const current={rx:statistics.rx_bytes,tx:statistics.tx_bytes,time:time},prior=previous.get(name);
     if(prior&&time-prior.time<1000)return;
     const elapsed=prior?(time-prior.time)/1000:0,rate=rates(prior,current,elapsed);
     if(prior&&Number.isSafeInteger(current.rx)&&Number.isSafeInteger(current.tx)&&current.rx>=prior.rx&&current.tx>=prior.tx){const volume=volumes.get(name)||{rx:0,tx:0};volume.rx+=current.rx-prior.rx;volume.tx+=current.tx-prior.tx;volumes.set(name,volume);}
     previous.set(name,current);let samples=history.get(name)||[];
     if(rate)samples.push({time,rx:rate.rx,tx:rate.tx,elapsed,breakBefore:gap||!!prior?.gap});
     else current.gap=true;
     history.set(name,samples.filter(point=>time-point.time<=900000).slice(-301));
    });
    const active=interfaceData.filter(net=>net.up).length;
    cards.network.value.textContent=format(active,0)+' / '+format(interfaceData.length,0);cards.network.note.textContent=t('فعال از کل رابط‌های گزارش‌شده','Active / reported interfaces');
    const systemPoint={time,active,breakBefore:gap||!info};
    if(info?.memory?.total&&Number.isFinite(info.memory.available??info.memory.free)){const memory=info.memory,used=Math.max(0,Math.min(100,100*(memory.total-(memory.available??memory.free))/memory.total));systemPoint.memory=used;cards.memory.value.textContent=format(used,0)+'%';cards.memory.note.textContent=capacity(memory.total);memoryValue.textContent=format(used,0)+'%';memoryRing.style.setProperty('--nova-memory',used+'%');systemNote.textContent=t('حافظه در دسترس: ','Available memory: ')+capacity(memory.available??memory.free);}
    else{cards.memory.value.textContent=memoryValue.textContent='—';systemNote.textContent=t('اطلاعات سیستم در دسترس نیست','System information unavailable');}
    if(Number.isFinite(info?.load?.[0]))systemPoint.load=info.load[0]/65536;
    systemHistory.push(systemPoint);while(systemHistory.length>301||systemHistory[0]?.time<time-900000)systemHistory.shift();
    // Bound maps if interfaces are created/deleted repeatedly during this session.
    for(const [name,prior] of previous)if(time-prior.time>900000){previous.delete(name);history.delete(name);volumes.delete(name);}
    gap=false;live.classList.remove('error');shell.classList.remove('nova-data-stale');live.textContent=paused?t('نمایش متوقف','Display paused'):t('زنده','Live');updateDetails();if(!paused)draw();
   }).catch(()=>{gap=true;stopAnimations();shell.classList.add('nova-data-stale');live.classList.add('error');live.textContent=t('داده در دسترس نیست','Data unavailable');empty.hidden=false;empty.textContent=t('دریافت آمار از روتر ناموفق بود؛ داده قبلی ممکن است قدیمی باشد.','Router statistics unavailable; previous values may be stale.');}).finally(()=>{inFlight=false;});
  };
  update();poll.add(update,3);
 }
});
