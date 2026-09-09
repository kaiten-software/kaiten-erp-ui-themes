"""One top-level menu of a content profile, and the groups and links inside it.

A menu belongs to a Custom Menu Config, which is the thing a user picks under
Menu content. Leaving the config empty makes the menu global: it joins every
profile. Nothing here touches Default content, which stays the site's own
Workspaces, so a site that never creates one of these keeps the menu that
maintains itself.
"""

import frappe
from frappe import _
from frappe.model.document import Document


class KaitenNavMenu(Document):
	def validate(self) -> None:
		self._require_a_target()

	def on_update(self) -> None:
		self._forget_cached_menus()

	def on_trash(self) -> None:
		self._forget_cached_menus()

	@staticmethod
	def _forget_cached_menus() -> None:
		from kaiten_erp_ui_themes.api import clear_menu_cache

		clear_menu_cache()

	def _require_a_target(self) -> None:
		for row in self.items or []:
			if row.type != "Link":
				continue
			if row.link_type == "URL":
				if not row.url:
					frappe.throw(_("Row {0}: a URL link needs a URL.").format(row.idx))
			elif not row.link_to:
				frappe.throw(_("Row {0}: choose what {1} this link opens.").format(row.idx, row.link_type or _("record")))
