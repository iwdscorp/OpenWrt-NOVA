import { readfile } from 'fs';
import { load_catalog, close_catalog, change_catalog, translate, ntranslate } from 'luci.core';
let rows = json(readfile('/tmp/nova-catalog.json'));
let report = [];
for (let mode in ['isolated', 'installed']) {
 close_catalog('fa');
 load_catalog('fa', mode == 'isolated' ? '/tmp/nova-catalog' : '/usr/lib/lua/luci/i18n');
 change_catalog('fa');
 let count = 0, missing = [], different = [];
 for (let row in rows) {
  for (let i = 0; i < length(row.msgstr); i++) {
   let value = row.msgid_plural
    ? (row.msgctxt ? ntranslate(i ? 2 : 1, row.msgid, row.msgid_plural, row.msgctxt) : ntranslate(i ? 2 : 1, row.msgid, row.msgid_plural))
    : (row.msgctxt ? translate(row.msgid, row.msgctxt) : translate(row.msgid));
   count++;
   if (value == null) push(missing, row.msgid);
   else if (value != row.msgstr[i]) push(different, { key: row.msgid, expected: row.msgstr[i], actual: value });
  }
 }
 push(report, { mode, count, missing, different });
}
print(sprintf('%J\n', report));
