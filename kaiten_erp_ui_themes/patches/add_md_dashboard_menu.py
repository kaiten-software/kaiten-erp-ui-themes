"""Add the MD Dashboard to the Jewellery menu.

Earlier menu installs already ran, so this writes the menu once more.
"""

import frappe


def execute():
	from kaiten_erp_ui_themes.api import install_preset

	frappe.set_user("Administrator")
	install_preset("jewellery", profile="Jewellery", overwrite=1)
