// Supplemental native gettext compatibility for audited upstream UI literals.
// Never rewrite input values, logs, commands, identifiers, or control elements.
(function(){
 'use strict';
 if(document.documentElement.lang!=='fa'||typeof window._!=='function')return;
 var nativeTranslate=window._;
 var prefixes=['Unable to load log data: ','The syslog output, pre-filtered for messages related to: '];
 window._=function(s,c){
  var translated=nativeTranslate(s,c);
  if(translated!==s||typeof s!=='string'||c!=null)return translated;
  for(var i=0;i<prefixes.length;i++)if(s.indexOf(prefixes[i])===0)return nativeTranslate(prefixes[i])+s.slice(prefixes[i].length);
  return translated;
 };
 var exact={'Core':'Core','ID':'ID','Ping':'Ping','TCPing':'TCPing','Continue »':'Continue »','auto':'auto','dummy':'dummy','unicast':'unicast','(root)':'(root)','0 Mbit/s':'0 Mbit/s'};
 window.novaLocalizeLabels=function(scope){
  scope.querySelectorAll('th,.th,h1,h2,h3,h4,label,option,button,.cbi-value-title,.cbi-section-descr,p.right a').forEach(function(label){
   if(label.closest('pre,code,textarea,.cbi-value-description'))return;
   Array.from(label.childNodes).forEach(function(node){
    if(node.nodeType!==3)return;
    var key=node.data.trim();if(!Object.prototype.hasOwnProperty.call(exact,key))return;
    var value=window._(exact[key]);if(value!==key)node.data=node.data.replace(key,value);
   });
  });
 };
 document.addEventListener('DOMContentLoaded',function(){window.novaLocalizeLabels(document);});
}());
