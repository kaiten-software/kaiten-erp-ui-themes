"""One row of a menu's contents.

Deliberately shaped like Frappe's own ``Workspace Link``: a flat table where a
``Card Break`` row opens a group and the ``Link`` rows after it belong to that
group. Child tables cannot nest, and this is the pattern the desk already uses
for the same problem, so the grid editor and its drag-reordering come free.
"""

from frappe.model.document import Document


class KaitenNavItem(Document):
	pass
