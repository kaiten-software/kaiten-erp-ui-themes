"""Inject Kaiten brand into desk boot and website context."""

import frappe


def _company_brand() -> dict:
	from kaiten_erp_ui_themes.api import resolve_company_brand

	return resolve_company_brand()


def extend_bootinfo(bootinfo) -> None:
	info = _company_brand()
	bootinfo["kaiten_brand"] = info["name"]
	bootinfo["kaiten_company"] = info


def update_website_context(context) -> None:
	info = _company_brand()
	context["kaiten_brand"] = info["name"]
	context["kaiten_company"] = info
