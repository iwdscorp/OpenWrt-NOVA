// Code-only component tests, not a browser or a visual/interaction claim.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../htdocs/luci-static/resources/nova-monitor-v270-r1.js',import.meta.url),'utf8');
class Node {
 constructor(tag,attrs={},children=[]){this.tag=tag;this.attrs=attrs;this.children=[];for(const child of Array.isArray(children)?children:[children])this.appendChild(child);this.listeners={};this.style={setProperty(){}};this.classes=new Set((attrs.class||'').split(' '));this.classList={remove:c=>this.classes.delete(c),add:c=>this.classes.add(c),toggle:(c,on)=>{on??=!this.classes.has(c);on?this.classes.add(c):this.classes.delete(c);return on;}};}
 appendChild(node){this.children.push(node);if(typeof node==='object')node.parent=this;return node;}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);}
 setAttribute(k,v){this.attrs[k]=v;} getAttribute(k){return this.attrs[k];}
 addEventListener(k,v){this.listeners[k]=v;}
 querySelector(){return null;}
 get options(){return this.children.filter(c=>c.tag==='option');} get selectedIndex(){return this.options.findIndex(c=>c.attrs?.value===this.value);}
 get textContent(){return this.children.map(c=>typeof c==='string'?c:c.textContent||'').join('');}
 set textContent(value){this.children=[String(value)];}
}
const E=(...args)=>new Node(...args);
function find(node,cls){if(node.classes?.has(cls))return node;for(const child of node.children||[])if(typeof child==='object'){const result=find(child,cls);if(result)return result;}}
for(const lang of ['en','fa'])for(const reduced of [false,true]){
 let update,failed=false,clock=1000000,wallOffset=0;const documentEvents={};
 const main=E('main'),tabs=E('div');main.insertBefore=node=>main.appendChild(node);
 const data={info:{memory:{total:1073741824,available:536870912},load:[32768]},status:{eth0:{statistics:{rx_bytes:100,tx_bytes:200,rx_packets:1,tx_packets:2,rx_dropped:0,tx_dropped:0},macaddr:'52:54:00:12:34:56'},'br-lan':{statistics:{rx_bytes:500,tx_bytes:600}}},dump:[{interface:'wan',l3_device:'eth0',up:true,'ipv4-address':[{address:'10.0.2.15',mask:24}],route:[{target:'0.0.0.0',mask:0,nexthop:'10.0.2.2'}],'dns-server':['10.0.2.3']},{interface:'lan',l3_device:'br-lan',up:true},{interface:'wan6',l3_device:'eth0',up:true}]};
 const context={performance:{now:()=>clock-1000000},Date:class extends Date{static now(){return clock+wallOffset;}},window:{matchMedia:()=>({matches:reduced,addEventListener(){}})},baseclass:{extend:o=>o},document:{documentElement:{lang},hidden:false,addEventListener:(name,callback)=>{documentEvents[name]=callback;},createElementNS:(_,tag)=>E(tag),getElementById:id=>id==='maincontent'?main:id==='tabmenu'?tabs:null,querySelectorAll:()=>[]},E,rpc:{declare:({method})=>()=>failed?Promise.reject(Error('test RPC unavailable')):Promise.resolve(data[method])},poll:{add:(callback,seconds)=>{assert.equal(seconds,3);update=callback;}},L:{env:{dispatchpath:['admin','status','overview']},resolveDefault:(p,fallback)=>p.catch(()=>fallback)}};
 const monitor=vm.runInNewContext('(function(){'+source+'})()',context);
 monitor.start();
 assert.equal(find(main,'nova-chart-empty').attrs.dir,lang==='fa'?'rtl':'ltr');
 if(lang==='en')assert.doesNotMatch(main.textContent,/[\u0600-\u06ff]/,'Loading labels must be English');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(find(main,'nova-chart-empty').hidden,false,'Baseline is not a rate');
 clock+=3000;data.status.eth0.statistics.rx_bytes+=3000;data.status.eth0.statistics.tx_bytes+=1500;await update();
 assert.equal(find(main,'nova-chart-empty').hidden,true,'One measured rate must be visible, including its endpoint');
 assert.equal(find(main,'nova-tile-download').children[2].textContent,lang==='fa'?'۸ Kbps':'8 Kbps');
 assert.equal(find(main,'nova-interface-charts').children.length,2,'wan and wan6 share one device chart; no duplicate sum');
 assert.ok(find(main,'nova-traffic-summary').textContent.includes(lang==='fa'?'۲٫۹ KiB':'2.9 KiB'),'Observed transfer uses bytes, not fabricated history');
 wallOffset=3600000;clock+=6000;data.status.eth0.statistics.rx_bytes+=6000;data.status.eth0.statistics.tx_bytes+=3000;await update();
 const graph=find(main,'nova-chart-canvas').children[0],path=graph.children.find(c=>c.tag==='path'&&c.attrs.stroke==='#16b8a6');
 assert.equal(path.attrs.d,'M648.00,0.00 L720.00,0.00','A 6-second interval takes its actual place in the 60-second axis');
 graph.listeners.keydown({key:'ArrowLeft',preventDefault(){}});assert.equal(find(main,'nova-chart-tooltip').hidden,false);
 graph.listeners.keydown({key:'Escape'});assert.equal(find(main,'nova-chart-tooltip').hidden,true);
 assert.equal(find(main,'nova-chart-motion').attrs['aria-pressed'],String(!reduced));
 if(reduced)assert.equal(find(main,'nova-chart-motion').disabled,true);
 assert.ok(main.textContent.includes(lang==='fa'?'زنده':'Live'));
 assert.ok(main.textContent.includes('10.0.2.15/24'),'Technical values retain original bytes');
 assert.ok(main.textContent.includes(lang==='fa'?'دروازه':'Gateway'));
 if(lang==='en')assert.doesNotMatch(main.textContent,/[\u0600-\u06ff]/,'Live labels and number formatting must be English');
 const pause=find(main,'nova-chart-pause');pause.listeners.click();
 assert.equal(pause.textContent,lang==='fa'?'ادامه نمودار':'Resume chart');
 pause.listeners.click();assert.equal(pause.textContent,lang==='fa'?'توقف نمودار':'Pause chart');
 context.document.hidden=true;documentEvents.visibilitychange();assert.equal(find(main,'nova-insights').classes.has('nova-motion-off'),true);
 context.document.hidden=false;documentEvents.visibilitychange();assert.equal(find(main,'nova-insights').classes.has('nova-motion-off'),reduced);
 failed=true;clock+=3000;await update();
 assert.equal(find(main,'nova-live-pill').textContent,lang==='fa'?'داده در دسترس نیست':'Data unavailable');
 if(lang==='en')assert.doesNotMatch(main.textContent,/[\u0600-\u06ff]/,'Failure labels must be English');
 failed=false;clock+=3000;data.status.eth0.statistics.rx_bytes+=6000;await update();
 assert.equal(path.attrs.d.match(/M/g).length,2,'Failure/recovery must not connect over missing data');
 clock+=3000;data.status.eth0.statistics.rx_bytes=0;data.status.eth0.statistics.tx_bytes=0;await update();
 clock+=3000;data.status.eth0.statistics.rx_bytes=3000;data.status.eth0.statistics.tx_bytes=1500;await update();
 assert.equal(path.attrs.d.match(/M/g).length,3,'Reset must not draw a negative spike or bridge its gap');
 const selector=find(main,'nova-chart-select');selector.value='br-lan';selector.listeners.change();
 assert.equal(find(main,'nova-tile-download').children[2].textContent,lang==='fa'?'۰ Kbps':'0 Kbps','A real idle device is zero, not unavailable');
 data.dump=data.dump.filter(net=>net.interface!=='lan');clock+=3000;await update();
 assert.equal(find(main,'nova-interface-charts').children.length,1,'Removed interfaces must not leave ghost chart nodes');
 for(let i=0;i<320;i++){clock+=3000;data.status.eth0.statistics.rx_bytes+=10;await update();}
 const note=find(main,'nova-sample-note').textContent;
 assert.ok(note.includes(lang==='fa'?'۲۱ نمونه':'21 samples'),'Window sample count remains bounded and time-based');
}
// Test the animation frame pipeline separately: it must finish at exact coordinates.
let callback=null,frames=0;
const animator=vm.runInNewContext('(function(){'+source+'})()',{baseclass:{extend:o=>o},requestAnimationFrame:cb=>{callback=cb;frames++;return frames;},cancelAnimationFrame(){callback=null;}});
const series={line:E('path'),area:E('path'),dot:E('circle')};
animator.paintSeries(series,[{time:1,x:0,y:50}],100,420);
animator.paintSeries(series,[{time:1,x:0,y:20},{time:2,x:100,y:0}],100,420);
callback(0);assert.equal(series.line.attrs.d,'M0.00,50.00 L0.00,50.00');
callback(210);assert.ok(series.dot.attrs.cx>0&&series.dot.attrs.cx<100);
callback(420);assert.equal(series.line.attrs.d,'M0.00,20.00 L100.00,0.00');assert.equal(series.frame,null);
assert.equal(series.dot.attrs.cx,100);assert.equal(series.dot.attrs.cy,0);
const nativeSamples=JSON.parse(fs.readFileSync(new URL('fixtures/telemetry-native.json',import.meta.url),'utf8'));
for(const lang of ['en','fa']){
 let index=0,update;
 const main=E('main'),tabs=E('div');main.insertBefore=node=>main.appendChild(node);
 const context={Date:class extends Date{static now(){return nativeSamples[index].time;}},baseclass:{extend:o=>o},document:{documentElement:{lang},hidden:false,createElementNS:(_,tag)=>E(tag),getElementById:id=>id==='maincontent'?main:id==='tabmenu'?tabs:null,querySelectorAll:()=>[]},E,rpc:{declare:({method})=>()=>Promise.resolve(nativeSamples[index][method==='status'?'status':method==='dump'?'dump':'info'])},poll:{add:cb=>{update=cb;}},L:{env:{dispatchpath:['admin','status','overview']},resolveDefault:(p,fallback)=>p.catch(()=>fallback)}};
 const monitor=vm.runInNewContext('(function(){'+source+'})()',context);monitor.start();await new Promise(resolve=>setImmediate(resolve));
 for(index=1;index<nativeSamples.length;index++){
  await update();
  assert.equal(find(main,'nova-live-pill').classes.has('error'),false,'Native recorded RPC payloads must parse and render');
  const name=find(main,'nova-chart-select').value,prev=nativeSamples[index-1].status[name].statistics,now=nativeSamples[index].status[name].statistics;
  const actual=(now.rx_bytes-prev.rx_bytes)*8/((nativeSamples[index].time-nativeSamples[index-1].time)/1000);
  const expected=new Intl.NumberFormat(lang==='fa'?'fa-IR':'en-US',{maximumFractionDigits:1}).format(actual/1e3)+' Kbps';
  assert.equal(find(main,'nova-tile-download').children[2].textContent,expected,'Displayed rate must exactly follow actual native VM byte deltas');
  assert.equal(find(main,'nova-chart-empty').hidden,true);
 }
 if(lang==='en')assert.doesNotMatch(main.textContent,/[\u0600-\u06ff]/);
}
console.log('PASS: four actual OpenWrt ubus samples replayed through English/Persian component; rates equal native byte deltas (not a browser visual test)');
console.log('PASS: bilingual/reduced-motion telemetry, measured counters, time windows, shared devices, keyboard, failure/reset gaps, cleanup, bounded histories and exact animation completion (code-only)');
