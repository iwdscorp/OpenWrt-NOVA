// Repository presentation checks, not a rendered GitHub or remote CI result.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const required=['README.md','docs/README.fa.md','docs/INSTALL.md','docs/RELEASING.md','docs/VERIFICATION.md','docs/releases/v2.8.0.md','CHANGELOG.md','CONTRIBUTING.md','docs/assets/nova-banner.svg','.github/workflows/ci.yml','.github/ISSUE_TEMPLATE/bug_report.md','.github/ISSUE_TEMPLATE/feature_request.md','.github/PULL_REQUEST_TEMPLATE.md'];
for(const name of required)assert.ok(fs.existsSync(path.join(root,name)),'Missing repository file: '+name);
const markdown=[];
function collect(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const name=path.join(dir,entry.name);if(entry.isDirectory())collect(name);else if(entry.name.endsWith('.md'))markdown.push(name);}}
collect('docs');collect('.github');markdown.push('README.md','CHANGELOG.md','CONTRIBUTING.md');
let count=0;
for(const name of markdown){
 const source=read(name);
 assert.doesNotMatch(source,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|[A-Za-z0-9._%+-]+@gmail\.com|C:\\Users\\/,'Do not publish credentials/personal email/local account paths: '+name);
 const prose=source.replace(/```[\s\S]*?```/g,'');
 const links=[...prose.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)].map(match=>match[1]);
 links.push(...Array.from(prose.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g),match=>match[1]));
 for(const target of links){if(/^(?:https?:|mailto:|#)/.test(target))continue;assert.doesNotMatch(target,/^[a-z]+:/i,'Unsupported local URI in '+name);
  const destination=path.resolve(root,path.dirname(name),decodeURIComponent(target.split('#')[0]));
  assert.ok(destination.startsWith(root+path.sep),'Link leaves repository: '+name+' -> '+target);
  assert.ok(fs.existsSync(destination),'Broken local link: '+name+' -> '+target);count++;
 }
}
const ci=read('.github/workflows/ci.yml');
assert.match(ci,/permissions:\s*\n\s+contents: read/);
assert.match(ci,/persist-credentials: false/);
assert.doesNotMatch(ci,/pull_request_target|workflow_run|contents: write|secrets\./);
assert.equal([...ci.matchAll(/uses:\s+actions\/[\w-]+@([a-f0-9]{40})/g)].length,2,'Pin both official actions to full verified commits');
for(const command of ['npm ci','npm run build','npm test'])assert.ok(ci.includes(command));
assert.match(read('docs/README.fa.md'),/<div dir="rtl">/);
const persianReadme=read('docs/README.fa.md');
assert.equal([...persianReadme.matchAll(/<div dir="rtl">/g)].length,[...persianReadme.matchAll(/<\/div>/g)].length,'Balance Persian RTL sections around LTR command blocks');
assert.match(persianReadme,/پیش‌انتشار/,'Preserve the Persian release qualification');
assert.match(persianReadme,/هنوز آزموده نشده‌اند/,'Preserve the unverified compatibility boundary');
assert.doesNotMatch(persianReadme,/پس از انتشار در GitHub|گردش زنده|گردش کامل|DOM کدمحور/,'Use current publication status and natural Persian wording');
assert.match(read('README.md'),/معرفی و راهنمای فارسی/,'Make the Persian introduction discoverable on the main page');
for(const name of ['README.md','docs/README.fa.md'])assert.match(read(name),/https:\/\/turanio\.ir/,'Preserve Turanio project credit in both languages');
assert.match(read('README.md'),/does not change the existing licenses/,'Attribution notice must not silently relicense third-party or existing code');
assert.match(persianReadme,/مجوزهای موجود را تغییر نمی‌دهد/,'Preserve the Persian license boundary');
const overviewImage=fs.readFileSync(path.join(root,'docs/assets/nova-overview-v2.2.jpg'));
assert.deepEqual([...overviewImage.subarray(0,3)],[255,216,255],'The overview asset must be a JPEG capture');
assert.match(read('README.md'),/Historical screenshot — NOVA 2\.2/,'Label historical UI evidence with the captured version');
assert.match(persianReadme,/تصویر واقعی از نسخهٔ ۲\.۲/,'Keep the captured version visible to Persian readers');
for(const name of ['README.md','docs/README.fa.md','docs/INSTALL.md']){
 const upgradeDoc=read(name);
 assert.match(upgradeDoc,/Keep settings/,'Distinguish settings preservation from package preservation');
 assert.match(upgradeDoc,/Bootstrap/,'Keep a documented firmware-upgrade fallback');
 assert.match(upgradeDoc,/https:\/\/openwrt\.org\/docs\/guide-user\/installation\/sysupgrade\.packages/,'Link the official package-preservation guidance');
}
assert.match(read('README.md'),/https:\/\/github\.com\/iwdscorp\/OpenWrt-NOVA\/releases\/download\/v2\.8\.1\/luci-theme-nova-2\.8\.1-r1\.apk/,'Preserve the verified package download destination');
assert.match(read('README.md'),/pre-release/,'Do not present incomplete runtime acceptance as a stable release');
assert.doesNotMatch(read('README.md')+read('docs/README.fa.md')+read('docs/RELEASING.md'),/ayriatoorani-arch|prepared but not published yet/,'Do not retain the old account or stale publication status');
assert.match(read('docs/VERIFICATION.md'),/live modal\/save\/apply\/reorder workflow not executed/);
const banner=read('docs/assets/nova-banner.svg');assert.match(banner,/<title[^>]*>/);assert.match(banner,/not a screenshot/);assert.doesNotMatch(banner,/<script|<foreignObject|\bon\w+\s*=|(?:href|src)\s*=\s*["']https?:/);
const en=JSON.parse(read('docs/verification/NOVA-2.8-EN-NATIVE-VERIFICATION.json')),fa=JSON.parse(read('docs/verification/NOVA-2.8-FA-NATIVE-VERIFICATION.json'));
assert.equal(en.length,2);assert.equal(fa.length,2);for(const row of en){assert.equal(row.count,3548);assert.deepEqual(row.different,[]);}for(const row of fa){assert.equal(row.count,3542);assert.deepEqual(row.missing,[]);assert.deepEqual(row.different,[]);}
console.log('PASS: '+markdown.length+' repository Markdown files, '+count+' local links/assets, bilingual entry points, privacy/verified-release links, pinned read-only CI and native evidence reports (not GitHub rendering/remote execution).');
