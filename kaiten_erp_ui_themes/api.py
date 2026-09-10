"""Data source for the Kaiten top mega menu.

Everything returned here is already filtered against the calling user's read
permissions, so the client can render it directly. Create permissions are left
to the client, which already has ``frappe.boot.user.can_create``.

Two axes run through this file and never meet. *Content* is what the menu
carries: either the site's own Workspaces (Default) or a named content profile
assembled from Kaiten Nav Menu records. *Style* is how the menu is painted, and
lives entirely in the client's skin layer — nothing here has an opinion about
it. Picking a profile therefore cannot change the look, and picking a look
cannot change the links.
"""

import json
import os
import re

import frappe
from frappe import _

CACHE_TTL = 300

# No module is hidden. Core carries User, Role, Role Profile, User Permission and
# most of what administering a site actually means, so holding it back left the
# menu unable to reach work people do every day — and it disagreed with the
# awesomebar, which lists whatever you may read whichever module it lives in.
# Read permission is the only gate here, and a reader who may not open a doctype
# never learns it exists. Sites wanting a shorter list should say so in role
# permissions, where it will hold everywhere rather than in this menu alone.

# Doctypes also surfaced under "Tools", as a shortcut to what administering a
# site usually means. They keep their place under their own module as well.
TOOL_GROUPS = [
	(
		"Administration",
		[
			"User",
			"Role",
			"Role Profile",
			"User Group",
			"User Type",
			"User Permission",
			"System Settings",
			"Session Default Settings",
		],
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


def _readable_doctypes(names: list | None = None) -> set:
	"""Names of every doctype the current user may read.

	An empty result means exactly that, and is filtered on. Reading it as "no
	filtering available" would show the whole menu to a user who may read none of
	it, so if the fast path is unavailable each doctype is asked individually
	instead.
	"""
	try:
		from frappe.permissions import get_doctypes_with_read

		return set(get_doctypes_with_read())
	except Exception:
		return {name for name in (names or []) if frappe.has_permission(name, "read")}


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
		# No ignore_permissions here: this only runs if the desk's own role-aware
		# helper is unavailable, and it must not become the looser path.
		pages = frappe.get_all(
			"Workspace",
			fields=["name", "title", "module", "icon", "public", "parent_page"],
			limit_page_length=0,
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
		if row.name not in readable:
			continue

		module = row.module or "Other"
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
		if row.ref_doctype not in readable:
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
			if doctype not in readable:
				continue

			items.append({"name": doctype, "label": _(doctype), "single": bool(row.issingle)})

		if items:
			groups.append({"label": _(label), "items": items})

	return groups


def _default_company() -> str:
	try:
		company = frappe.defaults.get_user_default("Company")
		if company:
			return str(company).strip()
	except Exception:
		pass
	try:
		company = (frappe.defaults.get_defaults() or {}).get("company")
		if company:
			return str(company).strip()
	except Exception:
		pass
	return ""


def _company_logo(company: str) -> str:
	if not company:
		return ""
	try:
		if not frappe.db.exists("DocType", "Company"):
			return ""
		logo = frappe.db.get_value("Company", company, "company_logo")
		return str(logo or "").strip()
	except Exception:
		return ""


def _app_logo() -> str:
	try:
		from frappe.core.doctype.navbar_settings.navbar_settings import get_app_logo

		return str(get_app_logo() or "").strip()
	except Exception:
		return ""


def _wordmark_fallback() -> str:
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


def resolve_company_brand() -> dict:
	"""Desk pill: default Company name + its logo, then the app wordmark/logo."""
	company = _default_company()
	name = company or _wordmark_fallback()
	logo = _company_logo(company) or _app_logo()
	return {"name": name, "logo": logo, "company": company}


def resolve_brand() -> str:
	"""Site-specific wordmark: Company first, then App Name / Kaiten."""
	return resolve_company_brand()["name"]


@frappe.whitelist(allow_guest=True)
def get_brand() -> dict:
	info = resolve_company_brand()
	return {"brand": info["name"], "logo": info["logo"]}


@frappe.whitelist()
def get_menu(refresh: int | str = 0, profile: str | None = None) -> dict:
	"""Return the full, permission-filtered menu tree for the current user.

	``profile`` is the chosen content: empty or "default" derives the menu from
	the site's own Workspaces, and the name of an Active Custom Menu Config
	assembles it from that profile's Kaiten Nav Menu records instead. Either way
	the answer says nothing about appearance — the client's skin layer owns that
	and reads none of this.
	"""
	# The bar is a desk feature, and nothing here is meant for a signed-out
	# visitor. Answering at all would only tell them what the site contains.
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	# An unknown or switched-off profile quietly falls back to Default rather
	# than leaving someone with an empty menu. Default itself is checked first,
	# so the common request costs no extra query.
	profile = (profile or "").strip()
	if profile == DEFAULT_CONTENT or (profile and profile not in _active_menu_configs()):
		profile = ""

	slug = profile or DEFAULT_CONTENT
	cache_key = f"kaiten_erp_ui_themes_menu::{frappe.session.user}::{slug}"

	if not frappe.utils.cint(refresh):
		cached = frappe.cache().get_value(cache_key)
		if cached:
			return cached

	payload = _config_payload(profile) if profile else _auto_payload()
	payload["user"] = frappe.session.user
	payload["profile"] = slug

	frappe.cache().set_value(cache_key, payload, expires_in_sec=CACHE_TTL)
	return payload


def _auto_payload() -> dict:
	"""Default content: the site as it is, grouped the way the desk groups it."""
	rows = _doctype_rows()
	readable = _readable_doctypes([row.name for row in rows])

	return {
		"source": "auto",
		"workspaces": _workspaces(),
		"modules": _modules(rows, readable),
		"reports": _reports(readable),
		"tools": _tools(rows, readable),
	}


def _config_payload(profile: str) -> dict:
	"""A named profile's content, or Default's if the profile resolves to nothing.

	The fallback matters: a profile written for a jewellery site and imported
	onto a plain ERPNext one would otherwise leave the menu blank.
	"""
	menus = _config_menus(_readable_doctypes(), profile)
	if not menus:
		return _auto_payload()

	# The client shapes its own tabs, the same way it does for Default content,
	# so the whole profile travels as one list of menus rather than four
	# pre-sliced ones that could drift apart.
	return {"source": "config", "menus": menus}


# --------------------------------------------------------------------------
# Menu content — the "what" axis
#
# A site can describe its own menu in Kaiten Nav Menu records instead of taking
# the one derived from Workspaces. That is what lets one business read
# "Purchase / Sales / Operations" while another reads "Buying / Selling", and
# what lets eight HR workspaces collapse into a single HRMS menu.
#
# Those records are grouped by Custom Menu Config, and a config is what the user
# picks under Menu content: Default, HRMS, Jewellery. It decides content and
# nothing else. No value below reaches the skin, the tone or the density, so
# switching profile leaves the look exactly where it was — which is the whole
# point of keeping the two apart.
#
# The configuration only ever says what a menu *could* contain. Every link still
# passes the same permission and existence checks as the automatic menu, so a
# nav record cannot hand a user something they may not open.
# --------------------------------------------------------------------------

NAV_DOCTYPE = "Kaiten Nav Menu"
CONFIG_DOCTYPE = "Custom Menu Config"

# What the client sends for "this site's own Workspaces". Reserved, so no
# profile can be picked in a way that shadows it.
DEFAULT_CONTENT = "default"

# The doctype names sections the way a person would; the client groups them by
# the same three kinds the automatic menu produces. Kept explicit in both
# directions so neither side drifts into a spelling the other drops on the floor.
SECTION_TO_KIND = {"Main": "operate", "Reports": "report", "Setup": "setup"}
KIND_TO_SECTION = {"operate": "Main", "report": "Reports", "setup": "Setup"}

# Card titles that mean "configure this module" rather than "work in it", so
# setup links can be held back the way ERP menus traditionally do.
SETUP_TITLES = ("setting", "setup", "configuration", "master")


def _country() -> str:
	try:
		return str(frappe.db.get_single_value("Global Defaults", "country") or "")
	except Exception:
		return ""


def _active_menu_configs() -> set:
	"""Names of every Custom Menu Config marked Active.

	An empty result means no profile is switched on, so every user stays on
	Default content. Older sites without the doctype are treated the same way.
	"""
	try:
		return set(
			frappe.get_all(
				CONFIG_DOCTYPE,
				filters={"status": "Active"},
				pluck="name",
				ignore_permissions=True,
			)
		)
	except Exception:
		return set()


def _report_meta(names: set) -> dict:
	"""Route ingredients for a batch of reports, skipping disabled ones."""
	if not names:
		return {}

	rows = frappe.get_all(
		"Report",
		filters={"name": ("in", list(names)), "disabled": 0},
		fields=["name", "report_type", "ref_doctype"],
		limit_page_length=0,
		ignore_permissions=True,
	)
	return {
		row.name: {"ref": row.ref_doctype, "query": row.report_type != "Report Builder"}
		for row in rows
	}


def _existing(doctype: str, names: set) -> set:
	if not names:
		return set()

	return {
		row.name
		for row in frappe.get_all(
			doctype,
			filters={"name": ("in", list(names))},
			fields=["name"],
			limit_page_length=0,
			ignore_permissions=True,
		)
	}


def _single_doctypes(names: set) -> set:
	"""Which of the doctypes a profile names are Singles.

	A configured link says only which doctype it opens, but a Single has no list
	to open, so the route has to differ. Nothing else about the doctype matters
	here: a profile decides its own grouping and wording.
	"""
	if not names:
		return set()

	return {
		row.name
		for row in frappe.get_all(
			"DocType",
			filters={"name": ("in", list(names)), "issingle": 1},
			fields=["name"],
			limit_page_length=0,
			ignore_permissions=True,
		)
	}


def _item_kind(row) -> str:
	"""Which bucket a configured link belongs in.

	Section is the override: Reports and Setup always win. A Main row still
	follows the thing it points at — a Report is a report, a *Settings document
	is setup — so a preset that stored everything as Main still splits the way
	the automatic menu does.
	"""
	section = row.section or "Main"
	if section in SECTION_TO_KIND and section != "Main":
		return SECTION_TO_KIND[section]

	if row.link_type == "Report":
		return "report"

	if (row.label or "").endswith("Settings"):
		return "setup"

	return "operate"


def _config_route(row: dict, reports: dict) -> list | None:
	kind = row.get("link_type")
	target = row.get("link_to")

	if kind == "URL" or not target:
		return None

	if kind == "DocType":
		return ["List", target]
	if kind == "Page":
		return [target]
	if kind == "Dashboard":
		return ["dashboard-view", target]
	if kind == "Workspace":
		try:
			return [frappe.router.slug(target)]
		except Exception:
			return [target.lower().replace(" ", "-")]
	if kind == "Report":
		meta = reports.get(target) or _report_meta({target}).get(target)
		if not meta:
			return None
		if meta["query"]:
			return ["query-report", target]
		return ["List", meta["ref"], "Report", target] if meta["ref"] else ["query-report", target]

	return None


def _config_usable(row: dict, readable: set, reports: dict, pages: set, dashboards: set, spaces: set, country: str) -> bool:
	if row.get("hidden"):
		return False

	only_for = (row.get("only_for") or "").strip()
	if only_for and country and only_for != country:
		return False

	# A link whose dependency is not readable points at nothing useful.
	for dep in (row.get("dependencies") or "").split(","):
		dep = dep.strip()
		if dep and dep not in readable:
			return False

	kind = row.get("link_type")
	target = row.get("link_to")

	if kind == "URL":
		return bool((row.get("url") or "").strip())
	if kind == "DocType":
		return target in readable
	if kind == "Page":
		return target in pages
	if kind == "Dashboard":
		return target in dashboards
	if kind == "Workspace":
		return target in spaces
	if kind == "Report":
		meta = reports.get(target)
		if not meta:
			return False
		return meta["ref"] in readable if meta["ref"] else True

	return False


def _overview_payload(menu, columns, reports: dict, pages: set, dashboards: set, spaces: set) -> dict | None:
	"""A real desk route for the menu's own name, or nothing."""
	kind, target = menu.overview_link_type, menu.overview_link_to
	if kind and target:
		exists = True
		if kind == "Page":
			exists = target in pages
		elif kind == "Dashboard":
			exists = target in dashboards
		elif kind == "Workspace":
			exists = target in spaces
		elif kind == "Report":
			exists = target in reports

		route = _config_route({"link_type": kind, "link_to": target}, reports) if exists else None
		if route:
			return {"type": kind, "to": target, "route": route}

	for card in columns:
		for item in card.get("items") or []:
			if item.get("route"):
				return {"type": item.get("type"), "to": item.get("to"), "route": item["route"]}
	return None


def _config_menus(readable: set, profile: str | None = None, all_menus: bool = False) -> list:
	"""Menus assembled from Kaiten Nav Menu records, for one content profile."""
	menus = frappe.get_all(
		NAV_DOCTYPE,
		filters={"enabled": 1},
		fields=["name", "title", "icon", "sequence", "overview_link_type", "overview_link_to", "menu_config"],
		order_by="sequence asc, title asc",
		limit_page_length=0,
		ignore_permissions=True,
	)
	if not menus:
		return []

	# A profile carries its own menus plus the untagged ones, which are global by
	# definition — that is what an empty Menu Config means. A menu tagged to a
	# switched-off config is hidden everywhere. ``all_menus`` skips the split for
	# callers that need the whole configured set, like drift detection.
	if not all_menus:
		profile = (profile or "").strip()
		active = _active_menu_configs()
		menus = [
			menu
			for menu in menus
			if not menu.menu_config or (menu.menu_config == profile and profile in active)
		]
		if not menus:
			return []

	names = [menu.name for menu in menus]

	# Roles are per menu, so one query covers the lot rather than one per menu.
	gates: dict[str, set] = {}
	for row in frappe.get_all(
		"Has Role",
		filters={"parent": ("in", names), "parenttype": NAV_DOCTYPE},
		fields=["parent", "role"],
		limit_page_length=0,
		ignore_permissions=True,
	):
		gates.setdefault(row.parent, set()).add(row.role)

	mine = set(frappe.get_roles())

	rows = frappe.get_all(
		"Kaiten Nav Item",
		filters={"parent": ("in", names), "parenttype": NAV_DOCTYPE},
		fields=[
			"parent",
			"type",
			"label",
			"icon",
			"section",
			"hidden",
			"link_type",
			"link_to",
			"url",
			"dependencies",
			"only_for",
			"idx",
		],
		order_by="parent asc, idx asc",
		limit_page_length=0,
		ignore_permissions=True,
	)

	report_names = {r.link_to for r in rows if r.link_type == "Report" and r.link_to}
	page_names = {r.link_to for r in rows if r.link_type == "Page" and r.link_to}
	dash_names = {r.link_to for r in rows if r.link_type == "Dashboard" and r.link_to}
	space_names = {r.link_to for r in rows if r.link_type == "Workspace" and r.link_to}
	doctype_names = {r.link_to for r in rows if r.link_type == "DocType" and r.link_to}

	for menu in menus:
		kind, target = menu.overview_link_type, menu.overview_link_to
		if not target:
			continue
		if kind == "Report":
			report_names.add(target)
		elif kind == "Page":
			page_names.add(target)
		elif kind == "Dashboard":
			dash_names.add(target)
		elif kind == "Workspace":
			space_names.add(target)

	reports = _report_meta(report_names)
	pages = _existing("Page", page_names)
	dashboards = _existing("Dashboard", dash_names)
	spaces = _existing("Workspace", space_names)
	singles = _single_doctypes(doctype_names)
	country = _country()

	grouped: dict[str, list] = {}
	for row in rows:
		cards = grouped.setdefault(row.parent, [])

		if row.type == "Card Break":
			cards.append({"title": _(row.label or ""), "items": []})
			continue

		if not _config_usable(row, readable, reports, pages, dashboards, spaces, country):
			continue

		route = _config_route(row, reports)
		if route is None and row.link_type != "URL":
			continue

		if not cards:
			# validate() rejects this, but an older record could predate the rule.
			cards.append({"title": "", "items": []})

		item = {
			"label": _(row.label or row.link_to or ""),
			"type": row.link_type,
			"to": row.link_to,
			"route": route,
			"icon": row.icon,
			"kind": _item_kind(row),
		}

		if row.link_type == "URL":
			item["url"] = (row.url or "").strip()
		elif row.link_type == "DocType" and row.link_to in singles:
			item["single"] = True

		cards[-1]["items"].append(item)

	built = []
	for menu in menus:
		wanted = gates.get(menu.name) or set()
		if wanted and not (wanted & mine):
			continue

		columns = [card for card in grouped.get(menu.name) or [] if card["items"]]
		if not columns:
			continue

		built.append(
			{
				"name": menu.name,
				"label": _(menu.title),
				"icon": menu.icon,
				"columns": columns,
				"overview": _overview_payload(menu, columns, reports, pages, dashboards, spaces),
			}
		)

	return built


@frappe.whitelist()
def get_menu_configs() -> list:
	"""Active content profiles the user may switch the menu to.

	The client shows these beside a built-in "Default", so the menu can be
	narrowed to one business's wording without touching anyone else's — and
	without touching the theme.
	"""
	if frappe.session.user == "Guest":
		return []

	try:
		rows = frappe.get_all(
			CONFIG_DOCTYPE,
			filters={"status": "Active"},
			fields=["name", "domain_name", "use_case"],
			order_by="domain_name asc",
			ignore_permissions=True,
		)
	except Exception:
		return []

	return [
		{"name": row.name, "label": row.domain_name or row.name, "note": row.use_case or ""}
		for row in rows
	]


def clear_menu_cache() -> None:
	"""Drop every user's cached menu, since the configuration is shared."""
	frappe.cache().delete_keys("kaiten_erp_ui_themes_menu::")
	frappe.cache().delete_keys("kaiten_erp_ui_themes_shell_nav::")



def _nav_is_configured() -> bool:
	try:
		return bool(frappe.db.exists(NAV_DOCTYPE, {"enabled": 1}))
	except Exception:
		return False


@frappe.whitelist()
def get_shell_nav(refresh: int | str = 0, profile: str | None = None) -> dict:
	"""Top-level menus for the module-nav sidebar, each with its own columns."""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	profile = (profile or "").strip()
	if profile == DEFAULT_CONTENT or (profile and profile not in _active_menu_configs()):
		profile = ""

	slug = profile or DEFAULT_CONTENT
	cache_key = f"kaiten_erp_ui_themes_shell_nav::{frappe.session.user}::{slug}"

	if not frappe.utils.cint(refresh):
		cached = frappe.cache().get_value(cache_key)
		if cached:
			return cached

	readable = _readable_doctypes()
	if _nav_is_configured():
		menus = _config_menus(readable, profile)
		if menus:
			payload = {"user": frappe.session.user, "menus": menus, "source": "config", "profile": slug}
			frappe.cache().set_value(cache_key, payload, expires_in_sec=CACHE_TTL)
			return payload

	payload = {
		"user": frappe.session.user,
		"menus": _workspace_menus(readable),
		"source": "auto",
		"profile": slug,
	}
	frappe.cache().set_value(cache_key, payload, expires_in_sec=CACHE_TTL)
	return payload

# --------------------------------------------------------------------------
# Bootstrapping and drift
#
# Nobody is going to hand-type several hundred links, so a profile's first draft
# is written from the menu the site already has. After that the job is
# rearranging rather than typing: merge menus, rename them into the words the
# business uses, drop what nobody opens.
#
# The cost of a hand-built menu is that it stops following the site. A new
# doctype or workspace joins Default content on its own and a profile never, so
# nav_drift reports what has appeared since.
# --------------------------------------------------------------------------


def _link_kind(row: dict, card: str) -> str:
	if row.get("link_type") == "Report" or row.get("is_query_report"):
		return "report"

	title = (card or "").lower()
	label = (row.get("label") or "").lower()
	if any(word in title for word in SETUP_TITLES) or label.endswith("settings"):
		return "setup"

	return "operate"


def _link_route(row: dict) -> list | None:
	"""The desk route for one workspace link, or None if it cannot be reached."""
	kind = row.get("link_type")
	target = row.get("link_to")
	if not target:
		return None

	if kind == "DocType":
		return ["List", target]
	if kind == "Page":
		return [target]
	if kind == "Report":
		if row.get("is_query_report"):
			return ["query-report", target]
		ref = row.get("report_ref_doctype")
		return ["List", ref, "Report", target] if ref else ["query-report", target]

	return None


def _usable_link(row: dict, readable: set, reports: set, pages: set, country: str) -> bool:
	if row.get("hidden"):
		return False

	only_for = (row.get("only_for") or "").strip()
	if only_for and country and only_for != country:
		return False

	# A link whose dependency is not installed points at nothing. Frappe hides
	# these on the workspace itself, so a generated menu has to as well.
	for dep in (row.get("dependencies") or "").split(","):
		dep = dep.strip()
		if dep and dep not in readable:
			return False

	kind = row.get("link_type")
	target = row.get("link_to")

	if kind == "DocType":
		return target in readable
	if kind == "Report":
		if target not in reports:
			return False
		ref = row.get("report_ref_doctype")
		return ref in readable if ref else True
	if kind == "Page":
		return target in pages

	return False


def _workspace_links(names: list, readable: set) -> dict:
	"""Every permitted link of every named workspace, grouped into its cards."""
	if not names:
		return {}

	rows = frappe.get_all(
		"Workspace Link",
		filters={"parent": ("in", names), "parenttype": "Workspace"},
		fields=[
			"parent",
			"type",
			"label",
			"icon",
			"hidden",
			"link_type",
			"link_to",
			"dependencies",
			"only_for",
			"is_query_report",
			"report_ref_doctype",
			"idx",
		],
		order_by="parent asc, idx asc",
		limit_page_length=0,
		ignore_permissions=True,
	)
	if not rows:
		return {}

	reports = _existing_reports({row.link_to for row in rows if row.link_type == "Report" and row.link_to})
	pages = _existing("Page", {row.link_to for row in rows if row.link_type == "Page" and row.link_to})
	country = _country()

	grouped: dict[str, list] = {}
	for row in rows:
		cards = grouped.setdefault(row.parent, [])

		# A run of links before any Card Break belongs to the workspace itself,
		# which is how ERPNext's own workspaces open.
		if row.type == "Card Break":
			cards.append({"title": _(row.label or ""), "items": []})
			continue

		if not _usable_link(row, readable, reports, pages, country):
			continue

		route = _link_route(row)
		if not route:
			continue

		if not cards:
			cards.append({"title": "", "items": []})

		cards[-1]["items"].append(
			{
				"label": _(row.label or row.link_to),
				"type": row.link_type,
				"to": row.link_to,
				"route": route,
				"kind": _link_kind(row, cards[-1]["title"]),
			}
		)

	# Card breaks whose links were all filtered out would render as empty columns.
	return {name: [card for card in cards if card["items"]] for name, cards in grouped.items()}


def _existing_reports(names: set) -> set:
	if not names:
		return set()

	return {
		row.name
		for row in frappe.get_all(
			"Report",
			filters={"name": ("in", list(names)), "disabled": 0},
			fields=["name"],
			limit_page_length=0,
			ignore_permissions=True,
		)
	}


def _workspace_menus(readable: set) -> list:
	"""The site's Workspaces as menus with columns, ready to write into records."""
	pages = _workspaces()

	by_parent: dict[str, list] = {}
	for page in pages:
		by_parent.setdefault(page["parent"], []).append(page)

	order = {page["name"]: index for index, page in enumerate(pages)}
	links = _workspace_links([page["name"] for page in pages], readable)

	menus = []
	for page in by_parent.get("", []):
		children = sorted(by_parent.get(page["name"], []), key=lambda child: order.get(child["name"], 0))

		columns = list(links.get(page["name"]) or [])
		# A parent whose own links are thin still has to open onto something, so
		# each child workspace contributes its cards under the child's name.
		for child in children:
			for card in links.get(child["name"]) or []:
				columns.append({"title": card["title"] or child["label"], "items": card["items"]})

		if not columns:
			continue

		menus.append(
			{
				"name": page["name"],
				"label": page["label"],
				"icon": page["icon"],
				"columns": columns,
			}
		)

	return menus


def _nav_item_row(item: dict) -> dict:
	"""The fields a generated Nav Item needs, whatever the source row looked like."""
	route = item.get("route") or []
	kind = item.get("type") or "DocType"

	row = {
		"type": "Link",
		"label": item.get("label") or "",
		"link_type": kind,
		"link_to": item.get("to") or "",
		"section": KIND_TO_SECTION.get(item.get("kind"), "Main"),
	}

	# A workspace-derived report route already resolved which flavour it is; the
	# doctype only stores the name, so nothing else needs carrying over.
	if kind == "Report" and route and route[0] == "List":
		row["link_to"] = route[3] if len(route) > 3 else row["link_to"]

	return row


def _ensure_config(domain: str, use_case: str) -> str:
	"""Find or create the content profile a draft is being written into.

	Everything generated lands inside a named, Active profile. Leaving it
	untagged would make it global, which would fold a whole second copy of the
	site's menu into every other profile.
	"""
	domain = (domain or "").strip()
	if not domain:
		frappe.throw(_("Name the content profile this menu belongs to."))
	if domain.lower() == DEFAULT_CONTENT:
		frappe.throw(_("\"Default\" is the site's own Workspaces. Choose another name."))

	existing = frappe.get_all(CONFIG_DOCTYPE, filters={"domain_name": domain}, pluck="name", ignore_permissions=True)
	if existing:
		return existing[0]

	doc = frappe.new_doc(CONFIG_DOCTYPE)
	doc.domain_name = domain
	doc.use_case = (use_case or "").strip() or _("General")
	doc.status = "Active"
	doc.insert(ignore_permissions=True)
	return doc.name


def _replace_nav_menus(overwrite: int, config: str) -> int:
	"""Drop one profile's Kaiten Nav Menus so a rewrite can start clean.

	Scoped to the profile: rewriting HRMS must not touch Jewellery.

	``delete_doc`` enqueues a cleanup job per record, and replacing a whole menu
	would enqueue dozens. These records have no dependents, so a scoped table
	delete is the same outcome without touching the queue.
	"""
	existing = frappe.get_all(NAV_DOCTYPE, filters={"menu_config": config}, pluck="name", ignore_permissions=True)
	if not existing:
		return 0
	if not overwrite:
		frappe.throw(_("{0} menus already exist in this profile. Pass overwrite to replace them.").format(len(existing)))

	frappe.db.delete("Kaiten Nav Item", {"parent": ("in", existing), "parenttype": NAV_DOCTYPE})
	frappe.db.delete("Has Role", {"parent": ("in", existing), "parenttype": NAV_DOCTYPE})
	frappe.db.delete(NAV_DOCTYPE, {"name": ("in", existing)})
	return len(existing)


@frappe.whitelist()
def generate_nav_from_workspaces(profile: str, use_case: str | None = None, overwrite: int | str = 0) -> dict:
	"""Write the site's Workspace menu into one profile's records, to edit by hand."""
	if not frappe.has_permission(NAV_DOCTYPE, "create"):
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	config = _ensure_config(profile, use_case)
	replaced = _replace_nav_menus(frappe.utils.cint(overwrite), config)
	made = 0

	for index, menu in enumerate(_workspace_menus(_readable_doctypes())):
		doc = frappe.new_doc(NAV_DOCTYPE)
		doc.title = menu["label"]
		doc.icon = menu.get("icon") or ""
		doc.sequence = (index + 1) * 10
		doc.enabled = 1
		doc.menu_config = config
		doc.overview_link_type = "Workspace"
		doc.overview_link_to = menu["name"]

		for column in menu.get("columns") or []:
			doc.append("items", {"type": "Card Break", "label": column.get("title") or menu["label"]})
			for item in column.get("items") or []:
				doc.append("items", _nav_item_row(item))

		doc.insert(ignore_permissions=True)
		made += 1

	clear_menu_cache()
	return {"profile": config, "menus": made, "replaced": replaced}


@frappe.whitelist()
def nav_drift(profile: str | None = None) -> dict:
	"""Links the site offers that a profile does not carry.

	This is the safety net for the one thing a hand-built menu gives up: it does
	not notice when the site grows.
	"""
	profile = (profile or "").strip()
	menus = _config_menus(_readable_doctypes(), profile)
	if not menus:
		return {"configured": False, "missing": []}

	readable = _readable_doctypes()

	held = set()
	for menu in menus:
		for column in menu["columns"]:
			for item in column["items"]:
				if item.get("to"):
					held.add((item.get("type"), item["to"]))

	missing = []
	for menu in _workspace_menus(readable):
		for column in menu.get("columns") or []:
			for item in column.get("items") or []:
				key = (item.get("type"), item.get("to"))
				if item.get("to") and key not in held:
					missing.append(
						{
							"label": item.get("label"),
							"type": item.get("type"),
							"to": item.get("to"),
							"workspace": menu.get("label"),
						}
					)

	return {"configured": True, "missing": missing}


# --------------------------------------------------------------------------
# Presets
#
# A menu built for one trade is worth reusing across every site in that trade,
# so a shaped profile ships as JSON beside the app and installs in one call.
# This is the third starting point, between "leave it on Default" and "arrange
# 34 generated menus by hand".
#
# A preset is a starting point, never a constraint: it writes ordinary records
# that are then edited like any other. Links naming something the site does not
# have are skipped, so a jewellery preset on a plain ERPNext site simply lands
# thinner rather than broken.
# --------------------------------------------------------------------------


def _preset_dir() -> str:
	return os.path.join(os.path.dirname(os.path.abspath(__file__)), "presets")


@frappe.whitelist()
def list_presets() -> list:
	"""Presets shipped with the app, with a rough size for each."""
	folder = _preset_dir()
	if not os.path.isdir(folder):
		return []

	found = []
	for filename in sorted(os.listdir(folder)):
		if not filename.endswith(".json"):
			continue

		try:
			with open(os.path.join(folder, filename), encoding="utf-8") as handle:
				data = json.load(handle)
		except Exception:
			continue

		menus = data.get("menus") or []
		found.append(
			{
				"name": filename[:-5],
				"label": data.get("label") or filename[:-5].title(),
				"use_case": data.get("use_case") or "",
				"menus": len(menus),
				"links": sum(1 for menu in menus for row in menu.get("items") or [] if row.get("type") == "Link"),
			}
		)

	return found


def _preset_link_exists(row: dict, seen: dict) -> bool:
	"""Whether the thing a preset row points at is on this site at all."""
	kind = row.get("link_type")
	target = row.get("link_to")

	if kind == "URL":
		return bool(row.get("url"))
	if not target:
		return False

	if kind not in ("DocType", "Report", "Page", "Dashboard", "Workspace"):
		return False

	key = (kind, target)
	if key not in seen:
		seen[key] = bool(frappe.db.exists(kind, target))
	return seen[key]


@frappe.whitelist()
def install_preset(name: str, profile: str | None = None, overwrite: int | str = 0) -> dict:
	"""Write a shipped preset into one content profile's Kaiten Nav Menu records."""
	if not frappe.has_permission(NAV_DOCTYPE, "create"):
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	# The name reaches the filesystem, so it may only be a bare stem.
	if not re.fullmatch(r"[a-z0-9_-]+", name or ""):
		frappe.throw(_("Unknown preset."))

	path = os.path.join(_preset_dir(), f"{name}.json")
	if not os.path.isfile(path):
		frappe.throw(_("Unknown preset."))

	with open(path, encoding="utf-8") as handle:
		data = json.load(handle)

	config = _ensure_config(profile or data.get("label") or name.title(), data.get("use_case"))
	replaced = _replace_nav_menus(frappe.utils.cint(overwrite), config)

	seen: dict = {}
	made = 0
	skipped = 0

	for menu in data.get("menus") or []:
		doc = frappe.new_doc(NAV_DOCTYPE)
		doc.title = menu.get("title")
		doc.icon = menu.get("icon") or ""
		doc.sequence = menu.get("sequence") or 0
		doc.enabled = 1
		doc.menu_config = config

		if menu.get("overview_link_to") and _preset_link_exists(
			{"link_type": menu.get("overview_link_type"), "link_to": menu.get("overview_link_to")}, seen
		):
			doc.overview_link_type = menu.get("overview_link_type")
			doc.overview_link_to = menu.get("overview_link_to")

		# Groups whose every link was skipped would render as empty pills, so a
		# Card Break is only kept once something lands under it.
		pending = None
		for row in menu.get("items") or []:
			if row.get("type") == "Card Break":
				pending = row
				continue

			if not _preset_link_exists(row, seen):
				skipped += 1
				continue

			if pending:
				doc.append("items", {"type": "Card Break", "label": pending.get("label")})
				pending = None

			doc.append(
				"items",
				{
					"type": "Link",
					"label": row.get("label"),
					"icon": row.get("icon") or "",
					"section": row.get("section") or "Main",
					"link_type": row.get("link_type"),
					"link_to": row.get("link_to") or "",
					"url": row.get("url") or "",
				},
			)

		if not doc.items:
			continue

		doc.insert(ignore_permissions=True)
		made += 1

	clear_menu_cache()
	return {"profile": config, "menus": made, "skipped": skipped, "replaced": replaced}


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


# --------------------------------------------------------------------------
# Preferences
#
# Pins, shelves, recents and appearance choices are held in localStorage so the
# bar can paint before any round trip. That alone is tied to one browser on one
# machine, so this is the durable copy, keyed to the user. Whoever wrote last
# wins, decided by a client clock the caller sends along.
# --------------------------------------------------------------------------

PREF_DOCTYPE = "Kaiten UI Preference"

# Enough for a long pin list and history without letting a client post anything
# it likes into the database.
PREF_LIMIT = 400_000


@frappe.whitelist()
def get_prefs() -> dict:
	"""This user's stored menu state, or empty when nothing is saved yet."""
	if frappe.session.user == "Guest":
		return {}

	row = frappe.db.get_value(
		PREF_DOCTYPE,
		{"user": frappe.session.user},
		["rev", "payload"],
		as_dict=True,
	)
	if not row:
		return {}

	return {"rev": row.get("rev") or "0", "payload": row.get("payload") or ""}


@frappe.whitelist()
def set_prefs(payload: str, rev: str = "0") -> dict:
	"""Store this user's menu state, keeping whichever revision is newer."""
	if frappe.session.user == "Guest":
		frappe.throw(_("Not permitted"), frappe.PermissionError)

	payload = str(payload or "")
	if len(payload) > PREF_LIMIT:
		frappe.throw(_("Preferences are too large to store."))

	# Reject anything that is not the JSON object the client is meant to send,
	# so a bad write cannot poison the next read for that user.
	try:
		parsed = frappe.parse_json(payload)
	except Exception:
		frappe.throw(_("Preferences must be valid JSON."))

	if not isinstance(parsed, dict):
		frappe.throw(_("Preferences must be a JSON object."))

	name = frappe.db.get_value(PREF_DOCTYPE, {"user": frappe.session.user}, "name")

	if name:
		doc = frappe.get_doc(PREF_DOCTYPE, name)
	else:
		doc = frappe.new_doc(PREF_DOCTYPE)
		doc.user = frappe.session.user

	doc.rev = str(rev or "0")
	doc.payload = payload
	doc.save(ignore_permissions=True)

	return {"rev": doc.rev}


# --------------------------------------------------------------------------
# Rate ticker
#
# Jewellery desks show the latest submitted metal rates under the bar. Sites
# without Daily Metal Rate Sheet get an empty payload and the client hides
# the strip — style never depends on this existing.
# --------------------------------------------------------------------------

RATE_DOCTYPE = "Daily Metal Rate Sheet"
RATE_ITEM_DOCTYPE = "Daily Metal Rate Sheet Item"
RATE_CACHE_TTL = 60


def _empty_ticker() -> dict:
	return {"sheet": None, "rate_date": None, "items": []}


@frappe.whitelist()
def get_rate_ticker(refresh: int | str = 0) -> dict:
	"""The latest submitted metal rates, or empty when there is no feed."""
	if frappe.session.user == "Guest":
		return _empty_ticker()

	key = "kaiten_rate_ticker"
	if not frappe.utils.cint(refresh):
		cached = frappe.cache().get_value(key)
		if cached is not None:
			return cached

	payload = _build_rate_ticker()
	frappe.cache().set_value(key, payload, expires_in_sec=RATE_CACHE_TTL)
	return payload


def _build_rate_ticker() -> dict:
	if not frappe.db.exists("DocType", RATE_DOCTYPE):
		return _empty_ticker()

	sheets = frappe.get_all(
		RATE_DOCTYPE,
		filters={"docstatus": 1},
		fields=["name", "rate_date"],
		order_by="rate_date desc, creation desc",
		limit_page_length=1,
		ignore_permissions=True,
	)
	if not sheets:
		return _empty_ticker()

	sheet = sheets[0]

	rows = frappe.get_all(
		RATE_ITEM_DOCTYPE,
		filters={"parent": sheet.name, "parenttype": RATE_DOCTYPE},
		fields=["metal_purity", "rate_per_10_gram", "last_rate_per_10_gram"],
		order_by="idx asc",
		ignore_permissions=True,
	)

	items = []
	for row in rows:
		rate = frappe.utils.flt(row.get("rate_per_10_gram"))
		if rate <= 0:
			continue

		last = frappe.utils.flt(row.get("last_rate_per_10_gram"))
		items.append(
			{
				"label": row.get("metal_purity"),
				"rate": rate,
				"change": (rate - last) if last else 0,
			}
		)

	return {
		"sheet": sheet.name,
		"rate_date": str(sheet.rate_date) if sheet.rate_date else None,
		"items": items,
	}
