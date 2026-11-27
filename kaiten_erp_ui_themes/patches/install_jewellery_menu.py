"""Install the Jewellery menu preset once.

Migrate does not read presets by itself. This writes the shipped menu
into the Jewellery profile and leaves the HRMS profile alone.
"""

import frappe


def execute():
	from kaiten_erp_ui_themes.api import install_preset

	frappe.set_user("Administrator")
	install_preset("jewellery", profile="Jewellery", overwrite=1)
