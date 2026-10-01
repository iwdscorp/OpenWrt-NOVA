// SuperFastHash / LuCI ASCII key normalization, Apache-2.0 (see LICENSE-LuCI).
export function sfh(text) {
 const b=Buffer.from(text),n=b.length;let h=n,i=0,t;
 const u=x=>x>>>0, s=x=>x>127?x-256:x;
 while(i+4<=n){h=u(h+b.readUInt16LE(i));t=u((b.readUInt16LE(i+2)<<11)^h);h=u((h<<16)^t);h=u(h+(h>>>11));i+=4;}
 switch(n-i){
  case 3:h=u(h+b.readUInt16LE(i));h=u(h^(h<<16));h=u(h^(s(b[i+2])<<18));h=u(h+(h>>>11));break;
  case 2:h=u(h+b.readUInt16LE(i));h=u(h^(h<<11));h=u(h+(h>>>17));break;
  case 1:h=u(h+s(b[i]));h=u(h^(h<<10));h=u(h+(h>>>1));break;
 }
 h=u(h^(h<<3));h=u(h+(h>>>5));h=u(h^(h<<4));h=u(h+(h>>>17));h=u(h^(h<<25));return u(h+(h>>>6));
}
export function canonicalKey(text){return text.replace(/[\t\n\r\f\v ]+/g,' ').trim();}
