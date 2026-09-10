"""Tag orphan jewellery nav menus onto an Active Jewellery content profile.

Menus with an empty Menu Config are global — they leak into every profile.
The jewellery preset titles (Masters, Purchase, Sales, …) were left untagged
on sites that built those menus before profiles existed. This patch only
touches those orphans. HRMS / Suryahub menus already linked to a config are
left alone. A site with no matching orphans is a no-op, so solar-only and
HR-only installs do not grow an empty Jewellery card.
"""

from __future__ import annotations

import frappe

JEWELLERY_TITLES = (
	"Masters",
	"Purchase",
	"Sales",
	"Stock",
	"Accounts",
	"Manufacturing",
	"Operations",
	"Schemes",
	"HRMS",
	"Reports",
)


def execute() -> None:
	if not frappe.db.exists("DocType", "Kaiten Nav Menu"):
		return
	if not frappe.db.exists("DocType", "Custom Menu Config"):
		return

	rows = frappe.get_all(
		"Kaiten Nav Menu",
		filters={"enabled": 1, "title": ("in", list(JEWELLERY_TITLES))},
		fields=["name", "menu_config"],
		ignore_permissions=True,
	)
	orphans = [row.name for row in rows if not row.menu_config]
	if not orphans:
		return

	from kaiten_erp_ui_themes.api import _ensure_config, clear_menu_cache

	config = _ensure_config("Jewellery", "Jewellery ERP")
	for name in orphans:
		frappe.db.set_value("Kaiten Nav Menu", name, "menu_config", config, update_modified=False)
	clear_menu_cache()
