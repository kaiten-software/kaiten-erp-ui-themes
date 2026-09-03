"""Data source for the Kaiten top mega menu.

Everything returned here is already filtered against the calling user's read
permissions, so the client can render it directly. Create permissions are left
to the client, which already has ``frappe.boot.user.can_create``.
"""

import frappe
from frappe import _

CACHE_TTL = 300

# Modules that only ever contain plumbing, never anything worth clicking.
HIDDEN_MODULES = {"Core", "Custom", "Event Streaming", "Social"}

# Doctypes surfaced under "Tools", regardless of the module they live in.
TOOL_GROUPS = [
	(
		"Administration",
		["User", "Role", "Role Profile", "User Permission", "System Settings", "Session Default Settings"],
	),
	(
		"Customisation",
		["Custom Field", "Property Setter", "Client Script", "Server Script", "Workflow", "Workflow State", "Workflow Action"],
	),
	(
		"Data",
		["Data Import", "Data Export", "Bulk Update", "Deleted Document", "Document Naming Rule", "Rename Tool"],
	),
	(
		"Integrations",
		["Webhook", "Connected App", "OAuth Client", "Social Login Key", "Google Settings", "Dropbox Settings"],
	),
	(
		"Email",
		["Email Account", "Email Domain", "Notification", "Email Template", "Newsletter", "Email Group", "Email Queue"],
	),
	(
		"Printing",
		["Print Format", "Print Settings", "Print Style", "Letter Head", "Print Heading"],
	),
	(
		"Monitoring",
		["Error Log", "Scheduled Job Type", "Scheduled Job Log", "Activity Log", "Access Log", "Route History"],
	),
	(
		"Website",
		["Web Page", "Website Settings", "Website Theme", "Blog Post", "Web Form", "Portal Settings"],
	),
]


def _readable_doctypes() -> set:
	"""Names of every doctype the current user may read, or an empty set."""
	try:
		from frappe.permissions import get_doctypes_with_read

		return set(get_doctypes_with_read())
	except Exception:
		return set()


def _doctype_rows() -> list:
	fields = ["name", "module", "issingle"]
	meta = frappe.get_meta("DocType")
	for field in ("icon", "color", "is_virtual"):
		if meta.has_field(field):
			fields.append(field)

	return frappe.get_all(
		"DocType",
		filters={"istable": 0},
		fields=fields,
		limit_page_length=0,
		order_by="module asc, name asc",
		ignore_permissions=True,
	)


def _workspaces() -> list:
	"""Workspace entries, from the same source the stock sidebar uses."""
	try:
		from frappe.desk.desktop import get_workspace_sidebar_items

		pages = get_workspace_sidebar_items().get("pages") or []
	except Exception:
		pages = frappe.get_all(
			"Workspace",
			fields=["name", "title", "module", "icon", "public", "parent_page"],
			limit_page_length=0,
			ignore_permissions=True,
		)

	items = []
	for page in pages:
		title = page.get("title") or page.get("label") or page.get("name")
		items.append(
			{
				"name": page.get("name"),
				"label": _(title),
				"icon": page.get("icon"),
				"module": page.get("module") or "Workspaces",
				"parent": page.get("parent_page") or "",
				"public": bool(page.get("public")),
			}
		)
	return items


def _modules(rows: list, readable: set) -> list:
	module_meta = {
		row.name: row
		for row in frappe.get_all(
			"Module Def",
			fields=["name", "module_name", "app_name"],
			limit_page_length=0,
			ignore_permissions=True,
		)
	}

	grouped = {}
	for row in rows:
		if row.get("is_virtual"):
			continue
		if readable and row.name not in readable:
			continue

		module = row.module or "Other"
		if module in HIDDEN_MODULES:
			continue

		grouped.setdefault(module, []).append(
			{
				"name": row.name,
				"label": _(row.name),
				"icon": row.get("icon"),
				"color": row.get("color"),
				"single": bool(row.issingle),
			}
		)

	modules = []
	for module, doctypes in grouped.items():
		info = module_meta.get(module) or {}
		modules.append(
			{
				"module": module,
				"label": _(info.get("module_name") or module),
				"app": info.get("app_name") or "frappe",
				"doctypes": sorted(doctypes, key=lambda d: d["label"]),
			}
		)

	return sorted(modules, key=lambda m: m["label"])


def _reports(readable: set) -> list:
	rows = frappe.get_all(
		"Report",
		filters={"disabled": 0},
		fields=["name", "ref_doctype", "report_type", "module"],
		limit_page_length=0,
		order_by="name asc",
		ignore_permissions=True,
	)

	reports = []
	for row in rows:
		if not row.ref_doctype:
			continue
		if readable and row.ref_doctype not in readable:
			continue

		reports.append(
			{
				"name": row.name,
				"label": _(row.name),
				"doctype": row.ref_doctype,
				"type": row.report_type or "Report Builder",
				"module": row.module or "Other",
			}
		)
	return reports


def _tools(rows: list, readable: set) -> list:
	by_name = {row.name: row for row in rows}

	groups = []
	for label, doctypes in TOOL_GROUPS:
		items = []
		for doctype in doctypes:
			row = by_name.get(doctype)
			if not row:
				continue
			if readable and doctype not in readable:
				continue

			items.append({"name": doctype, "label": _(doctype), "single": bool(row.issingle)})

		if items:
			groups.append({"label": _(label), "items": items})

	return groups


def resolve_brand() -> str:
	"""Site-specific wordmark, or Kaiten when none is configured."""
	configured = frappe.conf.get("kaiten_brand")
	if configured:
		name = str(configured).strip()
		if name:
			return name

	try:
		name = str(frappe.db.get_single_value("Website Settings", "app_name") or "").strip()
		if name:
			return name
	except Exception:
		pass

	return "Kaiten"


@frappe.whitelist(allow_guest=True)
def get_brand() -> dict:
	return {"brand": resolve_brand()}


@frappe.whitelist()
def get_menu(refresh: int | str = 0) -> dict:
	"""Return the full, permission-filtered menu tree for the current user."""
	cache_key = f"kaiten_erp_ui_themes_menu::{frappe.session.user}"

	if not frappe.utils.cint(refresh):
		cached = frappe.cache().get_value(cache_key)
		if cached:
			return cached

	rows = _doctype_rows()
	readable = _readable_doctypes()

	payload = {
		"user": frappe.session.user,
		"workspaces": _workspaces(),
		"modules": _modules(rows, readable),
		"reports": _reports(readable),
		"tools": _tools(rows, readable),
	}

	frappe.cache().set_value(cache_key, payload, expires_in_sec=CACHE_TTL)
	return payload


@frappe.whitelist()
def get_titles(refs: str | list) -> dict:
	"""Titles for a batch of documents, keyed as ``doctype:name``.

	History and pins are recorded by route, which carries the name rather than
	the title the desk puts in its breadcrumb. Entries stored before their
	document was loaded, or in an earlier session, are relabelled from this.
	Anything the caller may not read is simply left out.
	"""
	if isinstance(refs, str):
		refs = frappe.parse_json(refs)

	wanted: dict[str, set] = {}
	for ref in (refs or [])[:80]:
		if isinstance(ref, (list, tuple)) and len(ref) == 2 and ref[0] and ref[1]:
			wanted.setdefault(str(ref[0]), set()).add(str(ref[1]))

	titles = {}
	for doctype, names in wanted.items():
		try:
			meta = frappe.get_meta(doctype)
		except Exception:
			continue

		field = meta.title_field
		if not field or field == "name":
			continue

		if not frappe.has_permission(doctype, "read"):
			continue

		try:
			rows = frappe.get_all(
				doctype,
				filters={"name": ("in", list(names))},
				fields=["name", field],
				limit_page_length=0,
			)
		except Exception:
			continue

		for row in rows:
			title = str(row.get(field) or "").strip()
			if title and title != row.get("name"):
				titles[f"{doctype}:{row['name']}"] = title

	return titles
