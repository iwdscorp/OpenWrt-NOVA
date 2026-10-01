#!/bin/sh
[ -n "$IPKG_INSTROOT" ] && exit 0
# Keep LuCI accessible when the active NOVA theme is uninstalled.
if [ "$(uci -q get luci.main.mediaurlbase)" = '/luci-static/nova' ]; then
    uci set luci.main.mediaurlbase='/luci-static/bootstrap'
fi
uci -q delete luci.themes.NOVA
uci commit luci
exit 0
