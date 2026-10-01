# Changelog

Changes are grouped by theme release. Local verification scope is documented separately in [Verification](docs/VERIFICATION.md).

## 2.8.1-r1

- Unify the firewall title, decorative SVG shield, Network/Firewall context and navigation in one header panel.
- Match header tabs to the theme's purple palette; keep the native policy list and actions unchanged.
- Add a labelled Showing x/y counter with isolated numeric direction and a narrow-screen header layout.
- Verify header structure/namespace/navigation in both language DOM tests and upgrade the local VM without firewall/network/PassWall changes.
- Fresh browser visual QA remains unverified.

## 2.8.0-r1

- Add purpose-specific firewall Policy & Objects workspaces for zones, traffic policies, DNAT, SNAT and address sets.
- Add search, configured-status filters, sequence/source-destination grouping and plain-text match details.
- Explain default input/output/forward policies and show configured one-way forwarding paths.
- Correct SNAT outbound-zone interpretation and distinguish NAT exemption from traffic allow.
- Preserve the native form and edit/create delegation; retain delete/clone/reorder in the advanced editor.
- Add bilingual code-only DOM tests and captured native firewall fixture.
- Upgrade local VM from 2.7; verify templates, catalogs and installed hashes without rewriting network/firewall/PassWall configuration.

## 2.7.0-r1

- Add real RX/TX motion, endpoint markers, separate interface comparisons and 1/3/15-minute session windows.
- Add timestamp-based coordinates, clipped weighted statistics, RAM/system-load histories and packet/drop disclosure.
- Handle gaps, counter resets, shared devices and monotonic elapsed time; respect reduced motion and visibility.

## 2.6.0-r1

- Add English LTR layout/type stack, native English plural metadata and independent language direction preferences.
- Verify native fa → en → fa catalog switching and English source/context/plural behavior.

## 2.5.0-r1

- Expand Persian native catalogs with context/plural support, installed-source inventory and scoped runtime-label handling.
- Retain upstream licenses and preserve input values, technical keys and raw payloads.

## Earlier 2.x

Native ucode shell, Tailwind utilities, local fonts, native table/interface enhancement, bidi value isolation, live telemetry and control styling. See [historical notes](README.txt).

## Repository preparation · not a new router release

Add bilingual GitHub READMEs, identity banner, install/recovery documentation, transparent verification, release checklist, contribution templates and a build/test workflow. GitHub publication and remote workflow execution remain pending.
