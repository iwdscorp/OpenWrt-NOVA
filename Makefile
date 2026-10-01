include $(TOPDIR)/rules.mk

LUCI_TITLE:=NOVA 2 bilingual Persian RTL and English LTR LuCI theme
LUCI_DEPENDS:=+luci-base +luci-theme-bootstrap
PKG_VERSION:=2.8.1
PKG_RELEASE:=1
PKG_LICENSE:=MIT Apache-2.0 OFL-1.1 GPL-3.0
PKG_MAINTAINER:=NOVA theme contributors

define Package/luci-theme-nova/prerm
#!/bin/sh
[ -n "$$IPKG_INSTROOT" ] && exit 0
if [ "$$(uci -q get luci.main.mediaurlbase)" = '/luci-static/nova' ]; then
 uci set luci.main.mediaurlbase='/luci-static/bootstrap'
fi
uci -q delete luci.themes.NOVA
uci commit luci
exit 0
endef

include ../../luci.mk

# CSS is precompiled; no Node.js or CDN is needed on the router.
