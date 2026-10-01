import { readfile } from 'fs';
import { load_catalog, close_catalog, change_catalog, translate, ntranslate } from 'luci.core';
let rows = json(readfile('/tmp/nova-catalog.json')), report = [];
// Use the installed dispatcher's exact source-fallback semantics.
let _ = (...args) => translate(...args) ?? args[0];
let N_ = (...args) => ntranslate(...args) ?? (args[0] == 1 ? args[1] : args[2]);
for (let mode in ['isolated', 'installed']) {
 close_catalog('en'); close_catalog('fa');
 let directory = mode == 'isolated' ? '/tmp/nova-catalog' : '/usr/lib/lua/luci/i18n';
 if (!load_catalog('fa', directory) || !change_catalog('fa')) die('Cannot initialize Persian\n');
 if (_('Network operations') == 'Network operations') die('Persian initial state not active\n');
 if (!load_catalog('en', directory) || !change_catalog('en')) die('Cannot select English catalog\n');
 let count = 0, different = [];
 for (let row in rows) {
  let value = row.msgctxt ? _(row.msgid, row.msgctxt) : _(row.msgid);
  count++;
  if (value != row.msgid) push(different, { key: row.msgid, actual: value });
  if (row.msgid_plural) for (let n in [0, 1, 2, 5]) {
   value = row.msgctxt ? N_(n, row.msgid, row.msgid_plural, row.msgctxt) : N_(n, row.msgid, row.msgid_plural);
   count++;
   if (value != (n == 1 ? row.msgid : row.msgid_plural)) push(different, { key: row.msgid, n, actual: value });
  }
 }
 if (!change_catalog('fa') || _('Network operations') == 'Network operations') die('Cannot restore Persian\n');
 push(report, { mode, count, different, language_switch: 'fa -> en -> fa' });
}
print(sprintf('%J\n', report));
