"""A content profile: one named set of menus a user can switch the bar to.

This is the "what" axis only. Choosing a profile changes which links the menu
carries and never how it is painted — the theme, colour and density are a
separate axis that no code path here touches.

Only an Active profile is offered. Draft is somewhere to build one before
anybody sees it; Inactive hides it again without deleting the work.
"""

from frappe.model.document import Document


class CustomMenuConfig(Document):
	def on_update(self) -> None:
		self._forget_cached_menus()

	def on_trash(self) -> None:
		self._forget_cached_menus()

	@staticmethod
	def _forget_cached_menus() -> None:
		from kaiten_erp_ui_themes.api import clear_menu_cache

		clear_menu_cache()
