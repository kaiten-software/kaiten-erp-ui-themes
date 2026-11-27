"""Write the Jewellery menu again.

The first install already ran. This one picks up the counter order,
Diamond on the manufacturing list, and the links taken off the menu.
"""

import frappe


def execute():
	from kaiten_erp_ui_themes.api import install_preset

	frappe.set_user("Administrator")
	install_preset("jewellery", profile="Jewellery", overwrite=1)
