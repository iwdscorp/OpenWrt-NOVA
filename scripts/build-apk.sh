#!/bin/sh
# Requires apk-tools 3.x with mkpkg. Package bytes go to stdout, logs to stderr.
set -eu
src=$(cd "$1" && pwd)
buildroot=$(mktemp -d /dev/shm/nova-apk.XXXXXX)
trap 'case "$buildroot" in /dev/shm/nova-apk.*) rm -rf "$buildroot";; esac' EXIT
data="$buildroot/data"
mkdir -p "$data/www" "$data/usr/share/ucode/luci/template/themes" "$data/usr/share/licenses/luci-theme-nova"
cp -R "$src/htdocs/." "$data/www/"
cp -R "$src/ucode/template/themes/nova" "$data/usr/share/ucode/luci/template/themes/"
cp -R "$src/root/." "$data/"
cp "$src/LICENSE" "$src/LICENSE-LuCI" "$src/LICENSE-PassWall" "$src/TRANSLATION-NOTICE.txt" "$src/LICENSE-Vazirmatn.txt" "$src/LICENSE-Estedad.txt" "$data/usr/share/licenses/luci-theme-nova/"
find "$data" -type d -exec chmod 755 '{}' ';'
find "$data" -type f -exec chmod 644 '{}' ';'
chmod 755 "$data/etc/uci-defaults/90_luci-theme-nova"
apk mkpkg --compat 3.0 --files "$data" --output "$buildroot/nova.apk" \
  --info name:luci-theme-nova --info version:2.8.1-r1 --info arch:noarch \
  --info 'description:NOVA 2 bilingual Persian RTL and English LTR LuCI theme with native PassWall navigation' \
  --info 'license:MIT AND Apache-2.0 AND OFL-1.1 AND GPL-3.0' \
  --info 'depends:luci-base luci-theme-bootstrap' \
  --script "post-install:$src/scripts/post-install.sh" \
  --script "post-upgrade:$src/scripts/post-install.sh" \
  --script "pre-deinstall:$src/scripts/pre-deinstall.sh" >&2
apk verify --allow-untrusted "$buildroot/nova.apk" >&2
cat "$buildroot/nova.apk"
