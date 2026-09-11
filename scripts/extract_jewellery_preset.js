/* One-off: turn mahalaxmi_theme's navigation.js into a Kaiten nav preset.
 *
 * The menu that app renders is a plain data structure plus a route table, so
 * the faithful way to port it is to evaluate those two files and walk the
 * result — not to retype four hundred labels and hope.
 *
 * Run from the bench root:
 *   node apps/kaiten_erp_ui_themes/scripts/extract_jewellery_preset.js
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = "/home/satveer-gurjar/frappe-bench/apps/mahalaxmi_theme/mahalaxmi_theme/public/js/nav";
const OUT = path.join(
	"/home/satveer-gurjar/frappe-bench/apps/kaiten_erp_ui_themes/kaiten_erp_ui_themes",
	"presets/jewellery.json"
);

// frappe.provide is the only desk API these files touch at load time.
const sandbox = { window: {}, document: undefined };
sandbox.mahalaxmi = {};
sandbox.frappe = {
	provide(namespace) {
		let cursor = sandbox;
		for (const part of namespace.split(".")) {
			cursor[part] = cursor[part] || {};
			cursor = cursor[part];
		}
	},
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const file of ["navigation.js", "route_resolver.js"]) {
	vm.runInContext(fs.readFileSync(path.join(SRC, file), "utf8"), sandbox, { filename: file });
}

const menus = sandbox.mahalaxmi.nav.mainNavMenus;
const routes = sandbox.mahalaxmi.nav.ROUTE_MAP;
const menuIcons = sandbox.mahalaxmi.nav.MENU_ICONS || {};
const itemIcons = sandbox.mahalaxmi.nav.ITEM_ICONS || {};

if (!Array.isArray(menus)) throw new Error("mainNavMenus did not evaluate to an array");

/* The route table speaks in its own shapes; the doctype stores a link type and
   a target. Anything without a resolvable target is dropped rather than written
   as a link that goes nowhere. */
function target(href) {
	const hit = routes[href];
	if (!hit) return null;

	switch (hit.type) {
		case "list":
		case "tree":
			return { link_type: "DocType", link_to: hit.doctype };
		case "form":
			return { link_type: "DocType", link_to: hit.doctype };
		case "report":
			return { link_type: "Report", link_to: hit.report || hit.name };
		case "page":
			return { link_type: "Page", link_to: hit.page || hit.name };
		case "dashboard":
			return { link_type: "Dashboard", link_to: hit.dashboard || hit.name };
		case "kanban":
			return { link_type: "DocType", link_to: hit.doctype };
		case "url":
			return { link_type: "URL", url: hit.path || hit.url || hit.href };
		default:
			return null;
	}
}

function iconFor(href) {
	const parts = String(href || "").replace(/^\//, "").split("/");
	const last = parts[parts.length - 1] || "";
	const pair = parts.length >= 2 ? `${parts[parts.length - 2]}/${last}` : last;
	return itemIcons[pair] || itemIcons[last] || "";
}

const SETUP_LABELS = new Set([
	"Branch Settings",
	"User Management",
	"User Roles",
	"Jewelers ERP Settings",
	"Metal Purity",
	"Item Variety",
	"Manufacturing Process",
	"Manufacturing Stage",
	"Diamond Stone",
	"Gem Lot",
	"Gem Colour",
	"Gem Shape",
	"Gem Size",
	"Gem Clarity",
	"Gem Origin",
	"Chart of Accounts",
	"Mode of Payment",
	"Bank Account",
	"Cost Center",
	"Fiscal Year",
	"GST Settings",
	"HSN Code",
	"Print Formats",
	"Refinery Master",
	"POS Profile",
	"Department",
	"Designation",
	"Employee Grade",
	"Employment Type",
	"Branch",
	"HR Settings",
	"Job Applicant Source",
	"Interview Type",
	"Leave Type",
	"Leave Period",
	"Leave Policy",
	"Leave Block List",
	"Holiday List",
	"Holiday List Assignment",
	"Salary Component",
	"Salary Structure",
	"Payroll Period",
	"Payroll Settings",
	"Incentive Scheme",
	"Income Tax Slab",
	"Tax Exemption Category",
	"Gratuity Rule",
	"Shift Type",
	"Shift Location",
	"Shift Schedule",
	"Roster Template",
	"Week Off Policy",
	"Overtime Type",
	"Late Penalty Policy",
	"Expense Claim Type",
	"Purpose of Travel",
	"Driver",
	"Vehicle",
	"Onboarding Template",
	"Separation Template",
	"Employee Skill Map",
	"Grievance Type",
	"Training Program",
	"Training Event",
	"Training Feedback",
	"Training Result",
	"Job Opening Template",
	"Appointment Letter Template",
	"Job Offer Term Template",
	"Employee Group",
	"Line Group",
	"Metric",
	"Group Metric",
	"Template",
]);

function sectionFor(entry, column, menu, bucket) {
	if (bucket === "reports") return "Reports";
	if (bucket === "setup") return "Setup";

	const href = String(entry.href || "");
	if (/\/reports\//.test(href) || /\/stock\/(ledger|valuation|ageing|analytics)/.test(href)) {
		return "Reports";
	}
	if (/report/i.test(column.title || "") || menu.sidebarContext === "reports") {
		return "Reports";
	}

	// The Masters menu is already masters. Tagging every row Setup would
	// draw a heading with nothing above it.
	if (menu.sidebarContext === "masters") return "Main";

	if (/^Setup/i.test(column.title || "")) return "Setup";
	if (SETUP_LABELS.has(entry.label) || /Settings$/.test(entry.label || "")) return "Setup";
	return "Main";
}

const preset = { label: "Jewellery", menus: [] };
const missing = new Set();
let links = 0;

menus.forEach((menu, index) => {
	const out = {
		title: menu.label,
		icon: menuIcons[menu.label] || "",
		sequence: (index + 1) * 10,
		items: [],
	};

	const overview = target(menu.href);
	if (overview && overview.link_type !== "URL") {
		out.overview_link_type = overview.link_type;
		out.overview_link_to = overview.link_to;
	}

	(menu.columns || []).forEach((column) => {
		const rows = [];

		// A column can carry three buckets; each becomes a section inside the
		// one group, which is how the original renders its subheads too.
		for (const bucket of ["items", "reports", "setup"]) {
			(column[bucket] || []).forEach((entry) => {
				const spec = target(entry.href);
				if (!spec) {
					missing.add(entry.href);
					return;
				}

				rows.push(
					Object.assign(
						{
							type: "Link",
							label: entry.label,
							section: sectionFor(entry, column, menu, bucket),
							icon: iconFor(entry.href),
						},
						spec
					)
				);
				links += 1;
			});
		}

		if (!rows.length) return;

		out.items.push({ type: "Card Break", label: column.title });
		out.items.push(...rows);
	});

	if (out.items.length) preset.menus.push(out);
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(preset, null, "\t") + "\n");

console.log(`menus: ${preset.menus.length}`);
console.log(`links: ${links}`);
console.log(`titles: ${preset.menus.map((m) => m.title).join(", ")}`);
if (missing.size) {
	console.log(`\nunresolved hrefs (${missing.size}):`);
	[...missing].sort().forEach((href) => console.log("  " + href));
}
console.log(`\nwrote ${OUT}`);
