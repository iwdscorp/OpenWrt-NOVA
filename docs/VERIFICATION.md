# Capability and verification

Latest patch: **2.8.1** adds only firewall header presentation. Local build/tests,
APK upgrade 2.8 → 2.8.1, template/catalog checks and installed hashes pass.
Header DOM tests cover both languages, title-before-tabs structure, exactly one
active navigation item, the real SVG namespace and isolated labelled counts.
Native rows/actions and network/firewall/PassWall configuration are unchanged.
Fresh rendered browser/mobile verification is still pending.

This is a record of **local evidence**, not a claim that remote GitHub CI or a production router has been tested. The detailed 2.8 reports below are historical baseline evidence.

| Capability | Implemented | Verified scope / remaining work |
| --- | --- | --- |
| Native theme installation | Yes | APK upgrade 2.7 → 2.8 on OpenWrt 25.12.5 QEMU; uhttpd restart |
| Ucode templates | Yes | Header, footer and login compile natively |
| Persian / English | Yes | 3,542 Persian forms and 3,548 English checks, isolated/installed catalog modes |
| Firewall workspace | Yes | Five pages, both languages; code-only DOM and native nine-rule UCI fixture |
| Original firewall controls | Retained/delegated | Node/cell/handler identity tested; live modal/save/apply/reorder workflow not executed |
| Real telemetry | Yes | Four actual read-only ubus samples replayed; rate arithmetic and edge cases tested |
| Charts / motion | Yes | Component/time/reduced-motion tests; fresh browser appearance and feel not verified |
| Desktop / mobile presentation | Implemented | Eight stylesheets parse; fresh rendered responsive QA pending |
| PassWall 2 | Theme integration | Navigation/catalog tests; VPN engines/subscriptions not live-tested |
| Other firmware / PassWall 1 | Not verified | Do not infer support from noarch packaging |
| Per-policy hit counts, IPS, app control | No | Not a FortiGate engine or UTM product |
| Persistent history / per-user accounting | No | Current charts are page-session measurements |

Network, firewall and PassWall2 configuration hashes were unchanged by installation. The tests did not add demo firewall rules to the router. The firewall fixture is from the local QEMU lab; synthetic cases exist only in tests.

## Evidence

- [Historical 2.2 overview screenshot](assets/nova-overview-v2.2.jpg): existing local QEMU capture, reviewed before publication. Not a fresh capture or visual acceptance check of 2.8.1; telemetry/firewall implementation has since changed. Its visible addresses and device details belong to the local QEMU lab, not a production router.

- [2.8.1 header patch verification](verification/NOVA-2.8.1-VERIFICATION.txt)

- [Detailed local verification report](verification/NOVA-2.8-VERIFICATION.txt)
- [Native English report](verification/NOVA-2.8-EN-NATIVE-VERIFICATION.json)
- [Native Persian report](verification/NOVA-2.8-FA-NATIVE-VERIFICATION.json)
- [Firewall DOM tests](../scripts/test-firewall.mjs)
- [Captured firewall fixture](../scripts/fixtures/firewall-native.json)
- [Telemetry/language tests](../scripts/test-languages.mjs)
- [Historical implementation notes](../README.txt)

Browser access for fresh local visual checks was blocked. No alternate browser, raw CDP, page fetch or indirect screenshot was used to bypass that restriction. Code-only tests and native compilation are not rendered-page proof.

No production-readiness badge, current UI screenshot or remote CI success is claimed without corresponding evidence.
