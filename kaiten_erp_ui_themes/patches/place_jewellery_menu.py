"""Write the Jewellery menu in the placement order.

Earlier installs already ran. This one adds the factory and showroom
masters, the karigar and refinery lists, and the Setup bands.
"""

import frappe


def execute():
	from kaiten_erp_ui_themes.api import install_preset

	frappe.set_user("Administrator")
	install_preset("jewellery", profile="Jewellery", overwrite=1)
