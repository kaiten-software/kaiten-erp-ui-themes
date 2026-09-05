"""One top-level menu on the bar, and the groups and links inside it.

Existence of any enabled record here switches the shell off its automatic,
Workspace-derived menu and onto this configuration. That is the whole opt-in:
a site that never creates one of these keeps the menu that maintains itself.
"""

import frappe
from frappe import _
from frappe.model.document import Document


class KaitenNavMenu(Document):
	def validate(self) -> None:
		self._require_group_before_links()
		self._require_a_target()

	def on_update(self) -> None:
		self._forget_cached_menus()

	def on_trash(self) -> None:
		self._forget_cached_menus()

	@staticmethod
	def _forget_cached_menus() -> None:
		from kaiten_erp_ui_themes.api import clear_shell_nav_cache

		clear_shell_nav_cache()

	def _require_group_before_links(self) -> None:
		"""Links before the first Card Break have no group to belong to.

		Catching it here beats dropping those rows silently at render time and
		leaving someone to wonder where their links went.
		"""
		seen_group = False
		for row in self.items or []:
			if row.type == "Card Break":
				seen_group = True
				continue
			if not seen_group:
				frappe.throw(
					_("Row {0}: add a Card Break above this link to name the group it belongs to.").format(row.idx)
				)

	def _require_a_target(self) -> None:
		for row in self.items or []:
			if row.type != "Link":
				continue
			if row.link_type == "URL":
				if not row.url:
					frappe.throw(_("Row {0}: a URL link needs a URL.").format(row.idx))
			elif not row.link_to:
				frappe.throw(_("Row {0}: choose what {1} this link opens.").format(row.idx, row.link_type or _("record")))
