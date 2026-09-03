"""Inject Kaiten brand into desk boot and website context."""

import frappe


def _brand() -> str:
	from kaiten_erp_ui_themes.api import resolve_brand

	return resolve_brand()


def extend_bootinfo(bootinfo) -> None:
	bootinfo["kaiten_brand"] = _brand()


def update_website_context(context) -> None:
	context["kaiten_brand"] = _brand()
