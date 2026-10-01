# Build and publish

Published destination: the public [iwdscorp/OpenWrt-NOVA](https://github.com/iwdscorp/OpenWrt-NOVA) repository. Source and the [v2.8.1 pre-release](https://github.com/iwdscorp/OpenWrt-NOVA/releases/tag/v2.8.1) are published. The GitHub connector uses a different account; publishing used the maintainer's authenticated Git credentials. Do not commit credentials or paste access tokens into an issue or chat.

## Repository setup

Repository name: `OpenWrt-NOVA`. OpenWrt package name: `luci-theme-nova`.

Suggested About description:

> Modern OpenWrt LuCI theme with Persian/English support, RTL/LTR layouts, live traffic charts, and redesigned firewall pages.

Suggested topics: `openwrt`, `luci`, `luci-theme`, `persian`, `rtl`, `tailwindcss`, `firewall`, `passwall2`.

Upload/push **this source directory only**, not its parent workspace. Keep local VM images, lab scripts, SSH keys/known-host files, router backups, credentials, node_modules and temporary build files out of the repository. Review selected files before the first push.

Use a normal repository README first. GitHub Pages is a separate website deployment and has not been created or enabled by this preparation.

## Build

```sh
npm ci
npm run build
npm test
```

The read-only GitHub workflow runs these checks; it does **not** claim runtime router verification, build APKs or automatically publish releases.

### APK prerequisites

`scripts/build-apk.sh` requires Linux shell, apk-tools **3.x with `mkpkg`**, and writable `/dev/shm` staging. It copies prebuilt runtime files and component license notices into a noarch APK and verifies the unsigned package. Logs go to stderr; APK bytes go to stdout.

On the locally verified Windows/WSL setup:

```powershell
./scripts/build-windows.ps1
```

The helper defaults to the `docker-desktop` WSL distribution, where apk-tools 3 was available. This is an environment prerequisite, not a promise that a fresh Docker Desktop installation includes the tool. Other distributions must provide their own apk-tools 3 environment.

The checked-in Makefile is also intended for a compatible LuCI/OpenWrt build tree; standalone source checkout is not an SDK and does not make `make` alone sufficient. Official SDK/feed builds were not executed in this release.

## Version synchronization

Before changing the package version, update package.json/package-lock.json, Makefile, APK build metadata, Windows destination, UI version and changed asset cache keys. Rebuild, test and verify the final exact artifact. Never overwrite the previous published release with silently changed bytes.

## Local runtime gate

Install in an isolated compatible OpenWrt lab. Confirm package upgrade, template compilation, installed-file hashes, language behavior and unchanged unrelated configs. Run native browser workflows when access is available; otherwise document them as unverified. Do not include laboratory credentials in evidence.

The current 2.8.1 artifact was built and locally verified after a scoped firewall-header update. Its checksum is recorded in [2.8.1 release notes](releases/v2.8.1.md).

## Publish checklist

- [x] Confirm repository owner/name and public visibility with the maintainer.
- [x] Confirm authenticated publishing access; review repository-only source selection and privacy.
- [ ] Push reviewed source and confirm the remote build/test result.
- [x] Replace pending-publication wording and add exact, tested release download links.
- [x] Tag the reviewed release commit as `v2.8.1` and create a Release using the prepared notes.
- [x] Attach the exact verified APK, a source archive and checksums; include verification evidence in the source.
- [x] Keep the original artifact checksum distinct from any rebuilt artifact/source archive checksum.
- [x] Mark the release as pre-release while important browser/runtime acceptance checks remain pending.
- [x] Verify uploaded asset names, sizes and SHA-256 digests after publication.

The initial distribution contains mixed-license components. Preserve source, PO attribution and font/license notices in the release; consult applicable license terms rather than marketing it as an MIT-only bundle.

GitHub documentation: [README behavior](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes), [release management](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository), [workflow security](https://docs.github.com/en/actions/reference/security/secure-use).
