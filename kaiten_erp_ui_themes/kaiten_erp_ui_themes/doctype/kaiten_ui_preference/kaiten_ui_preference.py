"""One row per user, holding that user's menu state as JSON.

Pins, shelves and appearance choices used to live only in localStorage, which is
tied to a single browser profile on a single machine. This is the durable copy.
"""

from frappe.model.document import Document


class KaitenUIPreference(Document):
	pass
