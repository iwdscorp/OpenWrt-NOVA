NOVA 2.8.1-r1 — bilingual native LuCI theme with policy-oriented firewall workspace
================================
Test target: OpenWrt 25.12.5 x86_64, LuCI openwrt-25.12, PassWall 2.

Release 2.8.1
-------------
Scoped firewall-header polish: one title/icon/context/tabs panel, theme-matched
purple underline navigation, meaningful isolated Showing x/y count, logical RTL/LTR
alignment and narrow-screen layout. Table columns, actions and firewall rules are
unchanged. Local APK upgrade, template compiles, catalog checks and installed
hashes pass; fresh browser visual QA remains unverified.

Release 2.8
-----------
Firewall Policy & Objects workspace: distinct Zones & forwarding, Traffic policies,
Service publishing (DNAT), Source translation (SNAT), and Address sets screens.
Inspired by Fortinet's sequence/interface-pair policy views, not a FortiGate clone:
https://docs.fortinet.com/document/fortigate/7.0.0/administration-guide/497952/policy-views-and-policy-lookup
Each list has purpose-specific columns, search, configured-state filtering and
read-only sequence/source-destination grouping. Rules expose source, destination,
service, schedule, action; DNAT exposes external -> internal ports; SNAT shows
the actual outbound zone (UCI src) and rewrite mode. NAT ACCEPT is exemption,
not a traffic allow action. Zones expose router input/output, within-zone forward,
network members, masquerade and the actual one-way inter-zone forwarding paths.
Default policies are explained separately. No fake policy hits or UTM functions.
The original form is preserved intact in a collapsible advanced editor. Edit/Add
delegate to original LuCI handlers; Delete/Clone/Reorder and general defaults
remain there. Native Save & Apply, reset, validation and ACL handling are retained.
Safe text nodes protect configured names/addresses even with native E's HTML
semantics. Pending inline widget values are read; no UCI writes by the workspace.
Five screens covered in Persian/RTL and English/LTR code-only DOM tests, with a
captured native 9-rule UCI fixture plus isolated synthetic DNAT/SNAT/IPset cases.
Native cells, object identity and handlers are preserved, including after rerender.
Actual APK upgrade 2.7 -> 2.8 succeeded on the local OpenWrt VM. Installed runtime,
stylesheet, header/footer hashes match source; three native ucode templates compile.
Native catalogs still pass all 3542 Persian forms and 3548 English checks in both
isolated/installed modes. Network/firewall/PassWall2 hashes are unchanged; NOVA/fa
remains selected. No demo firewall rules were added or rewritten.
Loading/migration failures retain the native page. Fresh browser visual/layout,
mobile, live-modal/save/apply/reorder checks remain unverified; blocked browser
access is not bypassed. These tests are not a substitute for rendered-page QA.

Architecture
------------
This is a native ucode theme, not a React mock and not a replacement router API.
LuCI retains ownership of its RPCs, UCI configuration, validation, tabs, ACLs,
Save & Apply and rollback behavior. Theme JS only controls navigation, layout
direction and an actual system-info summary refreshed every five seconds.
2.1 adds native table enhancement (modern JS and legacy Lua/PassWall tables),
responsive labelled row cards, interface identity/metrics/action cards, and
isolated bidirectional values. Existing controls and event handlers are retained.
MutationObserver also enhances fresh polling rows and modal fields.
2.2 adds an Estedad Arabic/Latin type system, a purple/navy visual language,
larger interface labels, dark identity headers, and genuine live traffic charts
on Interfaces and Overview. Read-only network.device status counters yield bps
from byte deltas and elapsed seconds; netifd dump supplies interface state.
No fake history, external telemetry, extra router daemon or CDN is required.
Charts sample every 3 seconds, keep up to 3 minutes in this page session, handle
counter reset/background gaps, and support range, legend, pause and hover controls.
System info supplies the memory gauge. Link-up is not Internet reachability proof.

2.3 adds controls.css: single-row scrollable native tabs, coherent purple focus
and explicit invalid states, selected/hover dropdown surfaces, dynamic list
chips, wrapped PassWall row actions, readable modal metrics and mobile targets.
Dropdown geometry and preview/open semantics remain controlled by LuCI.
DynamicList's removal glyph stays physically right to preserve its native
rect.right - clientX hit test; moving only that glyph for RTL breaks removal.

2.4 adds persian.css: Estedad reaches native label/legend/table/inline UI text,
including previously explicit Segoe UI faces. Icon-font classes and raw code
retain their intended faces. The shell copy is now translated through LuCI.
Direction preferences are scoped to language, so an old global LTR choice
does not override Persian RTL. Explicit new language-scoped choices persist.
The native LMO contains 222 labels and descriptions; new network-global help
preserves formatting placeholders and HTML. Translation keys normalize ASCII
whitespace like LuCI. This is not a complete translation of every plugin.

2.5 audits every installed LuCI/PassWall2 UI source, not only the shell: network,
DHCP/DNS, firewall, wireless/protocol forms, status, system, package-manager and
PassWall2 client/server/node/subscription/rule/update/log pages. The 178-file
static audit resolves 3237 gettext keys: 3206 have Persian translations, zero
untranslated prose keys, and 31 explicit technical identifiers remain original.
Eleven dynamic calls are separately reviewed in src/dynamic-review.json.
Literal and dynamically interpolated upstream labels use a small scoped
compatibility layer; inputs, values, logs and native handlers are not replaced.
Fifteen interpolated DHCP help paragraphs and CSRF recovery text are included.
The merged catalog has 3543 LMO entries (3542 translation forms plus plural
metadata), supports gettext contexts/plurals, and preserves printf tokens,
HTML tags and conditional/iteration templates. It does not require separate
base/firewall/package-manager/PassWall2 Persian catalogs to fill audited keys.
The Persian language selector label is registered as فارسی; selecting language
and theme remains a user choice. Theme/network/VPN configuration is not forced.

Functional base.css comes from the tested LuCI Bootstrap runtime (Apache-2.0).
cascade.css and components.css supply NOVA styling. Tailwind 4.1.13 utilities are compiled locally
with no Preflight reset, avoiding conflicts with native LuCI form semantics.
Estedad Regular/Medium/Bold are bundled with OFL licensing; Vazirmatn remains a
fallback. Source: https://github.com/aminabedi68/Estedad at
0dbe689787b8c2ea302373cb601d0f352f9f98e5. Font QA checked Persian/Latin coverage.
nova.fa.lmo uses LuCI's own native translation catalog. Original upstream PO
sources and attribution, including GPL-3.0 PassWall translations, are provided.
Installed language catalogs apply globally while the package is installed.

2.6 adds explicit English LTR alongside Persian RTL. languages.css uses local
system UI Latin fonts in English, readable English line-height and left-aligned
field labels/help. Persian Estedad, icon fonts and raw monospace logs are retained.
Sidebar, workspace, tabs, tables and mobile cards follow logical layout direction.
The chart's empty-state message no longer forces RTL in English; its time axis
stays chronologically LTR in both languages. Telemetry loading/live/pause/error
labels and number formatting are covered in both languages by code-only tests.
English navigation polishes PassWall subscription/rule/core-update headings.
A globe shortcut opens native System settings; select Language and Style there.
The direction button is NOT a language selector. English defaults to LTR and
ignores legacy English RTL preferences; deliberate new manual overrides persist.
The package registers English/Persian but does not change the selected language.
nova.en.lmo contains only English plural metadata (n != 1), no identity catalog.
It makes native English selection loadable after Persian, while untranslated
keys use LuCI's original English source. Persian's plural rule remains n > 1.
Versioned JS module filenames prevent old menu/chart modules surviving upgrade.

2.7 replaces index-spaced traffic plots with actual timestamp coordinates and
explicit missing/reset gaps. It adds RX/TX endpoint markers, weighted averages,
peak rates, observed session byte volume, 1/3/15-minute time windows, tile
sparklines, memory history, CPU one-minute load history (NOT CPU percent), and
separate device comparison charts. Shared wan/wan6 devices are deduplicated.
WAN/LAN/bridge traffic is deliberately not summed as "Internet consumption".
Device cumulative packet/drop counters are available in a native disclosure.
History is bounded to 301 points per series and lasts only in this page session;
there is no fabricated history, persistent database or per-client/app accounting.
SVG pixel transitions animate for 420ms; raw samples and labels are unchanged.
CSS animates the memory gauge/live dot/cards. A Motion control, OS reduced-motion,
Pause and document hiding stop transitions. Polling remains every three seconds.
Monotonic elapsed time is anchored to the page's initial wall clock, so adjusting
the browser clock does not corrupt rates. Keyboard arrow keys inspect chart data.
Rendering/animation/calculation tests include genuine lab ubus payloads, missing
data/recovery, counter resets, zero traffic, shared devices, interface deletion,
buffer bounds and final animated coordinates. These are code-only tests, not
browser screenshots or authenticated browser interaction evidence.

Build
-----
npm ci
npm run build
npm test

On Linux with full apk-tools 3.x:
sh scripts/build-apk.sh "$PWD" > ../luci-theme-nova-2.7.0-r1.apk

On this Windows machine with Docker Desktop WSL's full apk-tools:
powershell / pwsh: ./scripts/build-windows.ps1
The script uses a private /dev/shm staging directory, verifies the APK and streams
its bytes to Windows. It does not repair or modify the Docker Desktop disk.
An OpenWrt SDK Makefile is also included; that SDK build path was not exercised.

Installation
------------
apk add --no-network --allow-untrusted /tmp/luci-theme-nova-2.7.0-r1.apk
/etc/init.d/uhttpd restart
Select NOVA in System > System > Language and Style, then Save & Apply.
Select English for LTR, or فارسی for RTL, in the same native settings tab.
Reload with Ctrl+F5 after upgrading. LuCI's language selection is router-wide,
not a private per-user preference. Auto follows supported browser languages.
Dependencies: luci-base and luci-theme-bootstrap. Architecture: noarch.
The package registers the theme only. It does not alter network or VPN settings,
automatically select a language/theme, add repositories, or disable signature
verification globally. This local package is unsigned.
Uninstall falls back to Bootstrap if NOVA is active.

Verification
------------
Earlier releases, real VM: package install, replacement/upgrade, removal, Bootstrap fallback,
reinstallation, registration and theme selection via native Save & Apply.
Earlier releases, browser: 19 top-level LuCI menu routes plus 10 PassWall 2 menu routes opened.
Interface Devices/Advanced Settings tabs, PassWall DNS, node editor, firewall
navigation, desktop and 390px mobile layouts, drawer and RTL/LTR checks.
Node regression test covers syntax, PassWall alias navigation, active tab,
translation-index structure and the RTL drawer selector.
Screenshots and detailed scope are supplied separately in nova-v2-evidence.

Release 2.3: all four NOVA stylesheets parsed with Lightning CSS; new regression
checks cover tab scrolling, focus/error colors, native dropdown geometry and
the DynamicList physical-right remove hit target. Browser automation rejected
access to the local URL this turn. No 2.3 visual screenshots or interactive
desktop/mobile checks are claimed; earlier screenshots only represent 2.2.
Actual APK 2.2 -> 2.3 upgrade succeeded on the VM. controls.css on the VM has
the same SHA256 as the source, and the installed header references its versioned
URL. Network, firewall and PassWall configuration hashes were unchanged.

Release 2.4: five strict CSS parses, all 222 LMO key/value lookups and preserved
formatting placeholders, direction-preference cases and prior tests passed.
Actual VM upgrade 2.3 -> 2.4 succeeded. ucode loaded the installed native LuCI
Persian catalogs and confirmed the new shell/global-network labels.
Installed persian.css and LMO hashes match the source. Network, firewall and
PassWall hashes were unchanged. No fresh browser visual checks are claimed;
the previously rejected browser action was not bypassed.

Release 2.5: native browser gettext functions tested for all 3542 translation
forms (including contexts and plurals). Formatting/HTML/template checks, exact
raw UI label handling without input mutation, known log prefixes and all prior
regressions passed. Actual APK 2.4 -> 2.5 upgrade succeeded on the VM. Native
ucode translate/ntranslate returned all 3542 expected forms with zero missing
or differing values, both with the isolated catalog and installed catalog set.
Network, firewall and PassWall2 configuration hashes were unchanged. Source and
installed LMO/runtime-label JS/Tailwind hashes match. Fresh 2.5 rendered UI and
interactive desktop/mobile tests remain unverified due to the browser policy.

Release 2.6: six strict CSS parses, 3548 English source/context/plural checks,
3542 Persian forms, bilingual direction/font/menu/telemetry component tests pass.
Actual 2.5 -> 2.6 APK upgrade succeeded; header/footer/login templates compile
on the native ucode VM. Installed English and Persian catalogs passed native
checks in both isolated and installed modes; fa -> en -> fa succeeds without
text leakage. Runtime source hashes match. Network/firewall/PassWall2 hashes
remain unchanged and the existing lab language remains Persian by choice.
No fresh 2.6 browser visual or interactive desktop/mobile QA is claimed; the
previously rejected local-browser action was not bypassed. The code-only DOM
component tests are not rendered-page evidence. English wording of third-party
plugins is their source wording except for the scoped NOVA navigation polish.

Boundaries
----------
Release 2.7: build/tests pass; seven strict stylesheet parses; all earlier
English/Persian native catalog checks pass. Four actual read-only VM ubus samples
replay through the component in both languages; displayed rates equal measured
byte deltas and elapsed time. Edge-case code tests cover time placement, clipped
weighted averages, gaps, zeros, failure recovery, counter resets, shared devices,
device removal, 15-minute buffer bounds, keyboard and exact animation completion.
Actual APK upgrade from 2.6 -> 2.7 succeeds. Installed runtime/style/header hashes
match source; all three ucode templates compile. Network/firewall/PassWall2
configuration hashes remain unchanged. Lab language remains fa. No new browser
visual/mobile/interactive checks are claimed; blocked access was not bypassed.

No actual wireless radio is available in QEMU. No live VPN/subscription has been
connected. The pre-existing test firmware's transparent-proxy components and
Xray/Sing-box binaries are incomplete; their warnings are retained, not hidden.
PassWall 1 and other OpenWrt/LuCI releases are not runtime-verified.
Opening a page is not proof that every destructive/network action on it works.
The source is isolated from the earlier theme and from the unrelated project
whose OpenWrt image was copied for this local lab.
