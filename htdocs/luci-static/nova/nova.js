(function(){
 'use strict';
 var root=document.documentElement,button=document.getElementById('nova-menu-toggle'),scrim=document.querySelector('.nova-scrim');
 function close(){root.classList.remove('nova-menu-open');if(button)button.setAttribute('aria-expanded','false');if(scrim)scrim.hidden=true;}
 if(button)button.addEventListener('click',function(){var open=!root.classList.contains('nova-menu-open');root.classList.toggle('nova-menu-open',open);button.setAttribute('aria-expanded',String(open));scrim.hidden=!open;});
 if(scrim)scrim.addEventListener('click',close);
 document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});
 var direction=document.getElementById('nova-direction');
 // Start from the selected language, never the previous language's layout.
 // English's v2 key also discards legacy RTL settings from the Persian demo.
 var language=(root.lang||'en').toLowerCase();
 root.dir=/^(?:fa|ar)(?:-|$)/.test(language)?'rtl':'ltr';
 var directionKey='nova-direction-'+root.lang+(/^en(?:-|$)/.test(language)?'-v2':'');
 try{var saved=localStorage.getItem(directionKey);if(saved==='rtl'||saved==='ltr')root.dir=saved;}catch(e){}
 function directionState(){if(direction)direction.setAttribute('aria-pressed',String(root.dir==='rtl'));}
 directionState();
 if(direction)direction.addEventListener('click',function(){root.dir=root.dir==='rtl'?'ltr':'rtl';directionState();try{localStorage.setItem(directionKey,root.dir);}catch(e){}});
 // Enhance the real LuCI DOM, never replace rows, controls or their handlers.
 // Polling replaces status nodes; the observer also styles those fresh nodes.
 var main=document.querySelector('body.nova:not(.nova-login)');
 var technicalNames=/^(?:ipaddr|ip6addr|ip6gw|ip6prefix|ip6hint|ip6ifaceid|ula_prefix|dhcp_default_duid|gateway|netmask|broadcast|macaddr|mtu|metric|port|server_port|address|server|dns|ifname|device|network|src_ip|dest_ip|src_port|dest_port|listen_port)$/;
 function technical(value){return !/[\u0600-\u06ff]/.test(value)&&/(?:\d|^[a-z]+[-.]?[a-z]*\d+$)/i.test(value);}
 function isolate(parent){
  if(parent.querySelector('input:not([type=hidden]),select,textarea,button,a,.nova-value'))return;
  var nodes=Array.from(parent.childNodes),text=nodes.filter(function(node){return node.nodeType===3;});
  if(nodes.every(function(node){return node.nodeType===3||node.nodeType===8||node.nodeType===1&&node.matches('input[type=hidden]');})&&text.some(function(node){return node.textContent.trim();})){
   var value=document.createElement('bdi');value.className='nova-value';
   text.forEach(function(node){value.appendChild(node);});value.dir=technical(value.textContent)?'ltr':'auto';parent.appendChild(value);
  }
 }
 function enhance(){
  if(!main)return;
  if(typeof window!=='undefined'&&window.novaLocalizeLabels)window.novaLocalizeLabels(main);
  main.querySelectorAll('table,.table').forEach(function(table){
   if(table.closest('.nova-firewall-workspace'))return;
   var headers=Array.from(table.querySelectorAll(':scope > thead > tr > th,:scope > tbody > .cbi-section-table-titles > th,:scope > tbody > .table-titles > th,:scope > .tr.table-titles > .th,:scope > .tr.cbi-section-table-titles > .th'));
   if(!headers.length)return;
   headers.forEach(function(header){header.dir='auto';});
   table.classList.add('nova-data-table');
   var rows=Array.from(table.querySelectorAll(':scope > tbody > tr,:scope > .tr')).filter(function(row){return !row.matches('.table-titles,.cbi-section-table-titles,.cbi-section-table-descr');});
   var cards=rows.length>0;
   table.classList.toggle('nova-empty-table',rows.length===0||rows.every(function(row){return row.classList.contains('placeholder');}));
   rows.forEach(function(row){
    var cells=Array.from(row.children).filter(function(cell){return cell.matches('td,.td');});
    if(cells.length!==headers.length||cells.some(function(cell){return cell.colSpan>1;})){cards=false;return;}
    cells.forEach(function(cell,index){
     var label=cell.getAttribute('data-title')||headers[index].textContent.trim();
     if(!label&&headers[index].querySelector('input[type=checkbox]'))label=document.documentElement.lang==='fa'?'انتخاب':'Select';
     if(cell.classList.contains('cbi-section-actions'))label=document.documentElement.lang==='fa'?'عملیات':'Actions';
     cell.setAttribute('data-nova-label',label);isolate(cell);
    });
   });
   table.classList.toggle('nova-card-table',cards);
  });
  main.querySelectorAll('[id$="-ifc-description"] > .nowrap:not(.nova-stat),[id$="-ifc-status"] > span > .nowrap:not(.nova-stat)').forEach(function(stat){
   var label=stat.querySelector(':scope > strong');if(!label)return;
   var value=document.createElement('bdi');value.className='nova-stat-value';value.dir='auto';
   Array.from(stat.childNodes).forEach(function(child){if(child!==label)value.appendChild(child);});
   stat.classList.add('nova-stat');label.classList.add('nova-stat-label');label.dir='auto';label.textContent=label.textContent.replace(/[:\uff1a]\s*$/,'');stat.appendChild(value);
   if(technical(value.textContent))value.dir='ltr';
   if(/^IPv[46]|^MAC|^RX|^TX/.test(label.textContent))stat.classList.add('nova-stat-technical');
  });
  main.querySelectorAll('.cbi-value-field input:not([type=checkbox]):not([type=radio]),.cbi-value-field textarea').forEach(function(input){
   var field=input.closest('[data-name]'),name=field?field.getAttribute('data-name'):(input.name||input.id||'').split('.').pop();
   input.dir=technicalNames.test(name||'')||/^(?:url|number|password)$/.test(input.type)?'ltr':'auto';
  });
  main.querySelectorAll('.ifacebadge > span:not(.cbi-tooltip-container),.ifacebox-body > small').forEach(function(value){value.dir='auto';});
  main.querySelectorAll('.cbi-map-descr,.cbi-section-descr,.cbi-value-description').forEach(function(text){text.dir='auto';});
 }
 if(main){
  var pending=false;
  new MutationObserver(function(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;enhance();});}).observe(main,{childList:true,subtree:true});
  enhance();
 }
 // LuCI alone owns tabs, validation, apply/rollback and configuration controls.
}());
