"""Inject Kaiten brand into desk boot and website context."""

import frappe

THEME_MODULE = "Kaiten ERP UI Themes"


def _company_brand() -> dict:
	from kaiten_erp_ui_themes.api import resolve_company_brand

	return resolve_company_brand()


def _hide_theme_module(bootinfo) -> None:
	hidden = list(bootinfo.get("hidden_modules") or [])
	if THEME_MODULE not in hidden:
		hidden.append(THEME_MODULE)
	bootinfo["hidden_modules"] = hidden


def _apply_solar_desk_if_needed(bootinfo) -> None:
	"""Solar desk when no other app already set jewellery/HR portals."""
	existing = bootinfo.get("kaiten_desk")
	if isinstance(existing, dict):
		portals = existing.get("menu_portals")
		if portals:
			return
		area = existing.get("area")
		if area and area != "solar":
			return
	bootinfo["kaiten_desk"] = {
		"mode": "kaiten",
		"area": "solar",
		"areas": [{"id": "solar", "label": "Home"}],
		"menu_portals": [],
		"remember": 0,
	}


def extend_bootinfo(bootinfo) -> None:
	info = _company_brand()
	bootinfo["kaiten_brand"] = info["name"]
	bootinfo["kaiten_company"] = info
	_hide_theme_module(bootinfo)
	_apply_solar_desk_if_needed(bootinfo)


def update_website_context(context) -> None:
	info = _company_brand()
	context["kaiten_brand"] = info["name"]
	context["kaiten_company"] = info
