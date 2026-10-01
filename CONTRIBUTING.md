# Contributing to NOVA

Small, evidence-backed changes are welcome. First read [Compatibility](README.md#compatibility-first) and [Verification](docs/VERIFICATION.md).

## Develop locally

Use Node.js 24 and npm. On Windows substitute `npm.cmd` where PowerShell blocks npm scripts.

```sh
npm ci
npm run build
npm test
```

Do not hand-edit generated `tailwind.css` or LMO catalogs. Update sources and rebuild.

## Preserve native behavior

- Keep LuCI's RPC/UCI ownership, ACLs, native widget objects, validation, tabs, Save & Apply and rollback.
- Do not replace native controls, change table cell indices or reorder configuration for a visual grouping.
- Render configured/user text using text nodes, not scalar native `E` children interpreted as HTML.
- Keep Persian/English copy consistent, use logical CSS properties and isolate technical values with bidi/LTR.
- Preserve DynamicList remove hit targets and dropdown geometry calculated by LuCI.
- Use real counter samples; never invent throughput, hit counts, historic usage or security verdicts.
- Avoid CDN/runtime build dependencies on the router. Respect reduced motion.

## Evidence in a pull request

Include firmware/LuCI versions, pages affected, test commands/results and screenshots from actual authenticated pages when available. Cover both languages and narrow/wide screens. State unexecuted checks explicitly. A build or code-only DOM test is not an end-to-end result.

Do not execute destructive/network-changing actions on a production router for a styling test. Use an isolated lab and obtain permission before modifying real firewall/network settings.

## Reports and privacy

Use the repository issue templates once it is published. Redact passwords, tokens, private keys, subscription URLs, device identifiers, addresses and hostnames as appropriate. Do not attach full router backups or raw production configs.

For a suspected vulnerability, do not publish exploit details or credentials in a public issue. Check the repository's Security tab for an enabled private reporting channel; if none exists, ask the maintainer to establish one without disclosing sensitive details publicly. No response SLA is promised.

## Licenses

Preserve original headers and notices. Mark the origin/license of new assets or translations. The project has MIT, Apache-2.0, GPL-3.0 and OFL components; see [translation notices](TRANSLATION-NOTICE.txt) and all root license files. Do not relabel the whole distribution MIT-only.
