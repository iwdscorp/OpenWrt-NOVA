// LuCI cbi.js gettext runtime; Apache-2.0, upstream commit in TRANSLATION-NOTICE.txt.

const cbi_d=[];if(typeof window!=='undefined')
window.cbi_d=cbi_d;const cbi_strings={path:{},label:{}};if(typeof window!=='undefined')
window.cbi_strings=cbi_strings;function s8(bytes,off){const n=bytes[off];return(n>0x7F)?(n-256)>>>0:n;}
function u16(bytes,off){return((bytes[off+1]<<8)+bytes[off])>>>0;}
function sfh(s){if(s===null||s.length===0)
return null;const bytes=[];for(let i=0;i<s.length;i++){let ch=s.charCodeAt(i);if(ch>=0xD800&&ch<=0xDBFF&&i+1<s.length){const next=s.charCodeAt(i+1);if(next>=0xDC00&&next<=0xDFFF){ch=0x10000+((ch-0xD800)<<10)+(next-0xDC00);i++;}}
if(ch<=0x7F)
bytes.push(ch);else if(ch<=0x7FF)
bytes.push(((ch>>>6)&0x1F)|0xC0,(ch&0x3F)|0x80);else if(ch<=0xFFFF)
bytes.push(((ch>>>12)&0x0F)|0xE0,((ch>>>6)&0x3F)|0x80,(ch&0x3F)|0x80);else if(ch<=0x10FFFF)
bytes.push(((ch>>>18)&0x07)|0xF0,((ch>>>12)&0x3F)|0x80,((ch>>6)&0x3F)|0x80,(ch&0x3F)|0x80);}
if(!bytes.length)
return null;let hash=(bytes.length>>>0);let len=(bytes.length>>>2);let off=0,tmp;while(len--){hash+=u16(bytes,off);tmp=((u16(bytes,off+2)<<11)^hash)>>>0;hash=((hash<<16)^tmp)>>>0;hash+=hash>>>11;off+=4;}
switch((bytes.length&3)>>>0){case 3:hash+=u16(bytes,off);hash=(hash^(hash<<16))>>>0;hash=(hash^(s8(bytes,off+2)<<18))>>>0;hash+=hash>>>11;break;case 2:hash+=u16(bytes,off);hash=(hash^(hash<<11))>>>0;hash+=hash>>>17;break;case 1:hash+=s8(bytes,off);hash=(hash^(hash<<10))>>>0;hash+=hash>>>1;break;}
hash=(hash^(hash<<3))>>>0;hash+=hash>>>5;hash=(hash^(hash<<4))>>>0;hash+=hash>>>17;hash=(hash^(hash<<25))>>>0;hash+=hash>>>6;return(0x100000000+hash).toString(16).slice(1);}
var plural_function=null;function trimws(s){return String(s).trim().replace(/[ \t\n]+/g,' ');}
function _(s,c){var k=(c!=null?trimws(c)+'\u0001':'')+trimws(s);return(window.TR&&TR[sfh(k)])||s;}
function N_(n,s,p,c){if(plural_function==null&&window.TR)
plural_function=new Function('n',(TR['00000000']||'plural=(n != 1);')+'return +plural');var i=plural_function?plural_function(n):(n!=1),k=(c!=null?trimws(c)+'\u0001':'')+trimws(s)+'\u0002'+i.toString();return(window.TR&&TR[sfh(k)])||(i?p:s);}
