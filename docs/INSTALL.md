# Install and recover

[Overview](../README.md) · [فارسی](README.fa.md)

## Before installing

- Tested target: OpenWrt 25.12.5 x86_64, native ucode LuCI openwrt-25.12.
- Check your firmware version and package manager. This release is APK, not IPK or Android APK.
- Back up configuration through **System → Backup / Flash Firmware**. Keep your existing theme and a known management-access method.
- Download the package/checksum from the published [v2.8.1 pre-release](https://github.com/iwdscorp/OpenWrt-NOVA/releases/tag/v2.8.1). This is not a claim of completed browser/mobile or physical-device acceptance testing.
- Check SHA-256 locally; a checksum detects corruption but is not a package signature.

On Windows:

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath .\luci-theme-nova-2.8.1-r1.apk
```

On Linux:

```sh
sha256sum luci-theme-nova-2.8.1-r1.apk
```

The existing locally verified 2.8.1 artifact has SHA-256:

```text
a952a26bbd191dcb059e0aa300fd12f55172a745461dfc8de2edad2aa7a15626
```

A rebuild can produce different bytes. Always compare with the checksum of the artifact you actually downloaded.

## LuCI upload · no SFTP

Open **System → Software → Upload Package**, choose the APK and install it. If the version exposes an option for an untrusted local package, allow only this upload. Do not change repositories or disable global signature verification.

If your interface does not expose that option, use the SSH method after transferring the APK using an available supported upload method. SFTP is not a requirement of NOVA, and the theme does not enable an SFTP server.

## Offline SSH installation

With the file already in `/tmp`:

```sh
apk add --no-network --allow-untrusted /tmp/luci-theme-nova-2.8.1-r1.apk
/etc/init.d/uhttpd restart
```

`--allow-untrusted` is scoped to this command. This package is not signed by OpenWrt's official repository keys. Do not install files from an untrusted distributor.

## Select language and theme

Open **System → System → Language and Style**. Select **NOVA**, choose **فارسی** or **English**, then **Save & Apply**. Reload with **Ctrl+F5**. Installation registers the theme/languages but does not force a selection.

The theme uses existing LuCI authentication; it does not set or replace your router password. No laboratory login credentials are shipped in this repository.

## Updates and firmware upgrades

Updating the **NOVA package** replaces its runtime files; manual modifications to those files can be overwritten. The current installation hooks only register NOVA and its languages, without changing network/firewall configuration or forcing your selected theme/language.

Updating **LuCI** normally leaves NOVA installed, but compatibility can change. Check the tested firmware/LuCI versions before relying on a new version.

A standard **OpenWrt firmware upgrade with an official image** does not preserve separately installed packages by default. **Keep settings** retains configuration, not a guarantee that the NOVA package and its files will survive. See [the official package-preservation guide](https://openwrt.org/docs/guide-user/installation/sysupgrade.packages).

1. Before the firmware upgrade, back up settings and keep the verified NOVA APK on your computer, not only in the router's temporary storage.
2. Temporarily select **Bootstrap** under **Language and Style** while it is installed. This reduces the risk of retaining a selected NOVA path after its files disappear; it does not preserve the package.
3. After upgrading, check the new firmware's package manager and LuCI compatibility. Do not install this APK on an IPK/opkg target or assume an untested LuCI version is supported.
4. If needed, reinstall a compatible NOVA package, select NOVA and your language, then reload with **Ctrl+F5**.

A custom firmware image that includes a compatible NOVA package can avoid a separate reinstall. NOVA is currently a locally installed package, not part of the official OpenWrt package repository or an automatically preserved firmware image. Automatic recovery through Attended Sysupgrade has not been verified for this package.

## Return to the previous theme

Use **Language and Style** to select your previous theme. For an installed Bootstrap fallback through SSH:

```sh
uci set luci.main.mediaurlbase='/luci-static/bootstrap'
uci commit luci
/etc/init.d/uhttpd restart
```

To uninstall after switching away:

```sh
apk del luci-theme-nova
```

Only the theme is removed. Do not remove LuCI, firewall or network packages to troubleshoot styling.

## If something looks wrong

1. Confirm the displayed NOVA version is 2.8.1 and reload without cache.
2. Confirm the selected LuCI language, not just the manual direction toggle.
3. In Firewall, **Advanced editor / rule order** exposes the original controls.
4. Report the firmware/LuCI/package version, language, screen width and page path. Redact hostnames, addresses, credentials and subscription URLs.
5. Distinguish styling problems from underlying plugin/network failures; NOVA does not install VPN engines or fix missing PassWall binaries.
