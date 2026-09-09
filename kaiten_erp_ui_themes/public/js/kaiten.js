/* =========================================================================
   Kaiten ERP UI Themes — sticky mega menu + desk micro-interactions
   -------------------------------------------------------------------------
   Builds a command bar under the stock navbar exposing every workspace,
   doctype, report and admin tool the user can reach, replaces the native
   select popup with a styled listbox, and layers hover, click and scroll
   motion onto the desk.

   Icons come from the Lucide sprite Frappe already inlines into the page, so
   every entry gets a relevant glyph without shipping any assets.
   ========================================================================= */

(function () {
	if (window.__kaitenUI) return;
	window.__kaitenUI = true;

	var KEY = {
		enabled: "kaiten_ui_enabled",
		skin: "kaiten_ui_skin",
		accent: "kaiten_ui_accent",
		skinAccent: "kaiten_ui_skin_accent",
		palettes: "kaiten_ui_palettes",
		density: "kaiten_ui_density",
		densityRev: "kaiten_ui_density_rev",
		pins: "kaiten_ui_pins",
		pinGroups: "kaiten_ui_pin_groups",
		recent: "kaiten_ui_recent",
		layout: "kaiten_ui_layout",
		shell: "kaiten_ui_shell",
		pages: "kaiten_ui_pages",
		content: "kaiten_ui_content",
		navView: "kaiten_ui_nav_view",
		navSide: "kaiten_ui_nav_side",
		rev: "kaiten_ui_rev",
	};

	// Everything worth carrying between machines. Anything not listed here stays
	// local to the browser it was set in.
	var SYNC_KEYS = ["pins", "pinGroups", "recent", "palettes"];
	var SYNC_FLAGS = ["accent", "content", "density", "enabled", "layout", "navSide", "navView", "pages", "shell", "skin"];
	// Keyed objects rather than lists: which tone each skin was last left on.
	var SYNC_MAPS = ["skinAccent"];

	// "split" keeps the master rail beside the entries; "columns" drops the rail
	// and lays every group out at once, the way classic ERP top menus do.
	var LAYOUTS = [
		{ id: "split", icon: "panel-left", label: "Split", title: "Groups on the left, entries on the right" },
		{ id: "columns", icon: "layout-grid", label: "Columns", title: "Every group side by side" },
	];

	/* The shell is a different axis from the skin, and the two must not be
	   confused: a skin repaints what is on screen, a shell decides what is on
	   screen. "command" is the bar this app started with. "module" is the
	   arrangement most ERP users already know — one menu per workspace across
	   the top, each opening columns of entries, with a sidebar scoped to
	   whichever module is open. Every feature works in both. */
	var SHELLS = [
		{
			id: "command",
			label: "Command bar",
			note: "Tabs, mega menu, jump to anything",
		},
		{
			id: "module",
			label: "Module nav",
			note: "ERP menus on top, sidebar per module",
		},
	];

	/* How the Module nav opens a top module. "dropdown" is the compact menu that
	   drops under the clicked module. "grid" is the launcher the command bar
	   uses — every module listed down the left, the chosen module's entries laid
	   out as an icon grid on the right — so the same module content can be shown
	   either way. Only the Module nav reads this; the command bar has its own. */
	var NAV_VIEWS = [
		{ id: "dropdown", label: "Dropdown", note: "Menu drops under the module" },
		{ id: "grid", label: "Workspace grid", note: "Modules left, entries as a grid" },
	];

	/* A colour wash cannot tell these two apart. The card has to show the
	   skeleton: command is a strip and tabs; module is a bar and a rail. */
	function shellPreview(id) {
		if (id === "module") {
			return make("span", { class: "aur-shell-preview aur-shell-preview-module" }, [
				make("span", { class: "aur-shell-bar" }),
				make("span", { class: "aur-shell-body" }, [
					make("span", { class: "aur-shell-rail" }),
					make("span", { class: "aur-shell-page" }),
				]),
			]);
		}

		return make("span", { class: "aur-shell-preview aur-shell-preview-command" }, [
			make("span", { class: "aur-shell-bar" }),
			make("span", { class: "aur-shell-tabs" }, [
				make("span", { class: "aur-shell-tab" }),
				make("span", { class: "aur-shell-tab" }),
				make("span", { class: "aur-shell-tab" }),
			]),
			make("span", { class: "aur-shell-page" }),
		]);
	}

	/* Whether the desk's own field and list styling is left as Frappe draws it,
	   or replaced with the denser boxed treatment. Independent of both the skin
	   and the shell, because it is a different question. */
	var PAGE_STYLES = [
		{ id: "standard", label: "Standard", note: "Frappe's own forms and lists" },
		{ id: "custom", label: "Custom", note: "Boxed sections, tighter fields" },
	];

	// Always present, never deleted: anything pinned without an answer lands here.
	var DEFAULT_PIN_GROUP = { id: "default", label: "Pinned", icon: "star", hue: 42 };

	// Its own drag type, so filing a pin and reordering shelves never collide.
	var SHELF_MIME = "application/x-kaiten-shelf";

	// Offered for shelves; anything missing from the desk's sprite is dropped.
	var SHELF_ICONS = [
		"folder", "star", "bookmark", "heart", "flag", "target", "rocket", "zap",
		"sun", "moon", "cloud", "flame", "leaf", "gem", "crown", "award",
		"briefcase", "building-2", "factory", "store", "truck", "package",
		"users", "user-check", "handshake", "phone", "mail", "calendar",
		"clipboard-list", "file-text", "receipt", "wallet", "credit-card", "coins",
		"chart-line", "chart-pie", "activity", "gauge", "settings-2", "wrench",
		"shield", "lock", "globe", "map-pin", "compass", "lightbulb",
	];

	// Tones offered inside a skin. The stylesheets hold the real values, keyed
	// [data-aur-accent]; these entries only name them and draw the swatch.
	var AURORA_TONES = [
		{ id: "aurora", label: "Aurora", swatch: "linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)" },
		{ id: "sunset", label: "Sunset", swatch: "linear-gradient(135deg,#f43f5e,#fb7185,#f59e0b)" },
		{ id: "ocean", label: "Ocean", swatch: "linear-gradient(135deg,#06b6d4,#0ea5e9,#6366f1)" },
		{ id: "forest", label: "Forest", swatch: "linear-gradient(135deg,#10b981,#34d399,#84cc16)" },
		{ id: "grape", label: "Grape", swatch: "linear-gradient(135deg,#a855f7,#d946ef,#ec4899)" },
	];

	var LUMEN_TONES = [
		{ id: "lilac", label: "Lilac", swatch: "linear-gradient(135deg,#8b7cf7,#a78bfa,#c4b5fd)" },
		{ id: "honey", label: "Honey", swatch: "linear-gradient(135deg,#f59e0b,#fbbf24,#fde68a)" },
		{ id: "mint", label: "Mint", swatch: "linear-gradient(135deg,#10b981,#34d399,#a7f3d0)" },
		{ id: "sky", label: "Sky", swatch: "linear-gradient(135deg,#0ea5e9,#38bdf8,#bae6fd)" },
		{ id: "blush", label: "Blush", swatch: "linear-gradient(135deg,#f43f5e,#fb7185,#fecdd3)" },
	];

	/* Atlas is the flat, classic-ERP look: one solid accent per tone rather than
	   a gradient, so the swatch is a single colour. The stylesheet paints the
	   bar and rail in that accent's darkest step and keeps everything else
	   near-neutral, which is why the tones only need to name a hue. */
	var ATLAS_TONES = [
		{ id: "navy", label: "Navy", swatch: "#1e293b" },
		{ id: "teal", label: "Teal", swatch: "#0f766e" },
		{ id: "indigo", label: "Indigo", swatch: "#3730a3" },
		{ id: "slate", label: "Slate", swatch: "#334155" },
		{ id: "plum", label: "Plum", swatch: "#6d28d9" },
	];

	/* Liquid is frosted glass on a cool mist wash: translucent surfaces and
	   soft cool tones rather than Lumen's opaque white or Atlas's flat ERP. */
	var LIQUID_TONES = [
		{ id: "mist", label: "Mist", swatch: "linear-gradient(135deg,#38bdf8,#0ea5e9,#67e8f9)" },
		{ id: "aqua", label: "Aqua", swatch: "linear-gradient(135deg,#2dd4bf,#14b8a6,#5eead4)" },
		{ id: "glacier", label: "Glacier", swatch: "linear-gradient(135deg,#60a5fa,#3b82f6,#93c5fd)" },
		{ id: "pearl", label: "Pearl", swatch: "linear-gradient(135deg,#94a3b8,#64748b,#cbd5e1)" },
		{ id: "tide", label: "Tide", swatch: "linear-gradient(135deg,#22d3ee,#0891b2,#67e8f9)" },
	];

	/* A skin is a look, and nothing more: one stylesheet of token overrides
	   layered on kaiten.css, picked with data-kaiten-skin. It is independent of
	   the light/dark appearance, which stays Frappe's. "default" carries no
	   stylesheet — it is the stock desk with only the Kaiten bar added — so
	   choosing it switches the theme off rather than layering anything. */
	var SKINS = [
		{
			id: "default",
			label: "Default",
			note: "Stock Frappe desk",
			swatch: "linear-gradient(135deg,#ffffff 0%,#ffffff 48%,#e2e8f0 52%,#cbd5e1 100%)",
			tones: [],
		},
		{
			id: "aurora",
			label: "Aurora",
			note: "Colour at rest, animated mesh",
			swatch: "linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899,#f59e0b)",
			tones: AURORA_TONES,
		},
		{
			id: "lumen",
			label: "Lumen",
			note: "Soft light, gradient wash, pill controls",
			swatch: "linear-gradient(135deg,#ede9fe 0%,#c4b5fd 38%,#fbcfe8 68%,#fde68a 100%)",
			tones: LUMEN_TONES,
		},
		{
			id: "atlas",
			label: "Atlas",
			note: "Flat ERP bar, plain surfaces, square corners",
			swatch: "linear-gradient(135deg,#334155 0%,#334155 55%,#1e293b 100%)",
			tones: ATLAS_TONES,
		},
		{
			id: "liquid",
			label: "Liquid",
			note: "Minimal frosted glass, cool mist wash",
			swatch: "linear-gradient(135deg,#e0f2fe 0%,#7dd3fc 40%,#67e8f9 70%,#a5f3fc 100%)",
			tones: LIQUID_TONES,
		},
	];

	/* Frappe's three appearances. Its own name for the third is "automatic",
	   which is what has to be stored; "System" is what it is called on screen. */
	var APPEARANCES = [
		{ id: "light", label: "Light", glyph: "\u2600", next: "dark" },
		{ id: "dark", label: "Dark", glyph: "\u263D", next: "automatic" },
		{ id: "automatic", label: "System", glyph: "\u25D1", next: "light" },
	];

	/* Normal is stock Frappe air. Cozy trims a little. Compact is the tight
	   field stack the jewellery desk asks for. v1 used "cozy" for stock, so
	   that stored value is rewritten to normal once. */
	var DENSITIES = [
		{ id: "normal", label: "Normal" },
		{ id: "cozy", label: "Cozy" },
		{ id: "compact", label: "Compact" },
	];

	// A tone the user mixed themselves is stored as one of these and referenced
	// as "custom:<id>", so it can sit beside the built-in swatches.
	var CUSTOM_PREFIX = "custom:";

	var TABS = [
		{ id: "pinned", label: "Pinned", icon: "star" },
		{ id: "workspaces", label: "Workspaces", icon: "layers" },
		{ id: "modules", label: "Modules", icon: "grid-3x3" },
		{ id: "create", label: "Create", icon: "plus" },
		{ id: "insights", label: "Insights", icon: "chart-column" },
		{ id: "tools", label: "Tools", icon: "settings" },
		{ id: "recent", label: "Recent", icon: "history" },
	];

	/* Most specific first — the first match wins. */
	var ICON_RULES = [
		[/invoice|billing/, "receipt-text"],
		[/credit note|debit note|refund/, "receipt"],
		[/payment|remittance/, "hand-coins"],
		[/journal|ledger|gl entry/, "book-open"],
		[/budget/, "piggy-bank"],
		[/tax|gst|hsn|tds|tcs|cess/, "percent"],
		[/currency|exchange|pricing|price list|discount/, "circle-dollar-sign"],
		[/bank|chart of accounts|accounting|account/, "landmark"],
		[/cash|cheque|banknote/, "banknote"],
		[/fiscal year|period|closing|opening/, "calendar-days"],
		[/cost center|dimension|allocation/, "split"],
		[/subscription|recurring|auto repeat/, "repeat"],
		[/loyalty|coupon|promotion|gift|reward/, "gift"],
		[/warehouse/, "warehouse"],
		[/stock|inventory|bin|reposting|reconcil/, "boxes"],
		[/item|product|material|bundle/, "package"],
		[/delivery|shipment|shipping|dispatch|packing/, "truck"],
		[/purchase|supplier|vendor|procurement|rfq|request for quotation/, "shopping-cart"],
		[/sales|selling|quotation|pos /, "store"],
		[/customer|client|party/, "users"],
		[/lead|opportunity|campaign|prospect|deal/, "target"],
		[/contact|salutation/, "contact"],
		[/address|territory|country|region|geo|location/, "map-pin"],
		[/attendance|shift|checkin|check-in/, "clock"],
		[/leave|holiday/, "calendar"],
		[/salary|payroll|gratuity|payslip|compensation/, "banknote"],
		[/appraisal|performance|goal|award|kra/, "award"],
		[/job|recruit|applicant|interview|offer|onboarding/, "briefcase"],
		[/employee|staff|human resource|training/, "users"],
		[/asset|equipment|depreciation/, "building-2"],
		[/maintenance|repair|servic/, "wrench"],
		[/project/, "folder-kanban"],
		[/task|todo|to do|checklist/, "list-checks"],
		[/timesheet|time log|duration/, "clock"],
		[/manufactur|work order|bom|production|operation|workstation|routing|job card/, "factory"],
		[/quality|inspection|review/, "badge-check"],
		[/dashboard|chart|graph/, "chart-pie"],
		[/report|statement|analytic|summary|register/, "chart-column"],
		[/share|equity|shareholder|dividend/, "chart-line"],
		[/setting|config|preference|default/, "settings"],
		[/role|permission|access|security/, "shield"],
		[/user|profile|session/, "user"],
		[/email|newsletter|mail|inbox/, "mail"],
		[/notification|alert|reminder/, "bell"],
		[/print|letter head|format|stationery/, "printer"],
		[/website|web page|web form|blog|portal|homepage|seo/, "globe"],
		[/attachment|folder|version/, "files"],
		[/log|error|exception|trace/, "activity"],
		[/scheduled|cron|queue|background|history/, "history"],
		[/workflow|approval|transition/, "workflow"],
		[/webhook|api|integration|connected app|oauth|token|social login/, "webhook"],
		[/import|export|migration|spreadsheet|csv/, "file-spreadsheet"],
		[/naming|series|sequence|abbreviation/, "tag"],
		[/company|organisation|organization|branch|department|division/, "building"],
		[/uom|unit|measure|weight|dimension/, "ruler"],
		[/serial|batch|barcode|scan/, "barcode"],
		[/terms|condition|agreement|contract|policy/, "scroll-text"],
		[/template|letter/, "files"],
		[/support|issue|ticket|warranty|complaint/, "ticket"],
		[/call|telephony|phone|voice/, "phone-call"],
		[/comment|communication|message|chat|thread/, "message-square"],
		[/vehicle|transport|logistic|route/, "truck"],
		[/transaction|transfer|bulk|entry/, "arrow-left-right"],
		[/type|category|group|class|tag/, "tags"],
		[/tool|utility|bench/, "hammer"],
		[/file|document|note/, "file-text"],
	];

	var MODULE_ICONS = {
		Accounts: "landmark",
		Assets: "building-2",
		Automation: "workflow",
		"Bulk Transaction": "layers",
		Buying: "shopping-cart",
		Communication: "message-square",
		Contacts: "contact",
		CRM: "target",
		Core: "database",
		Custom: "puzzle",
		Desk: "layers",
		EDI: "arrow-left-right",
		Email: "mail",
		"ERPNext Integrations": "plug",
		Geo: "earth",
		"GST India": "percent",
		HR: "users",
		Integrations: "plug",
		Maintenance: "wrench",
		Manufacturing: "factory",
		Payroll: "banknote",
		Portal: "globe",
		Printing: "printer",
		Projects: "folder-kanban",
		Quality: "badge-check",
		Regional: "map-pin",
		Selling: "store",
		Setup: "settings",
		Social: "users",
		Stock: "boxes",
		Subcontracting: "factory",
		Subscription: "repeat",
		Support: "headset",
		Telephony: "phone-call",
		Utilities: "wrench",
		Website: "globe",
		Workflow: "workflow",
	};

	var MAX_RECENT = 24;
	var SMALL_GROUP = 10;

	var root = document.documentElement;
	var el = {};
	// Accounts alone carries 91 doctypes, so the columns layout shows a group's
	// first few entries and keeps the rest behind a count. The classification is
	// what that layout is for; the full list is a click away.
	var COLUMN_PEEK = 8;

	// Narrowest a lane may be before the panel drops one. Below roughly this,
	// entry labels start truncating into "Account..." and stop being readable.
	var LANE_WIDTH = 250;

	// Named for the keyboard in front of the reader, not for the one this was
	// written on: an Apple keyboard has no key labelled Alt.
	var IS_MAC = /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || "");
	var ALT_LABEL = IS_MAC ? "\u2325" : "Alt";
	var META_LABEL = IS_MAC ? "\u2318" : "Ctrl+";

	var state = {
		tabs: {},
		activeTab: null,
		index: [],
		cursor: -1,
		searching: false,
		groups: [],
		activeKey: null,
		megaQuery: "",
		openCols: {},
		hints: null,
		hintPrefix: "",
	};
	var hover = { timer: null, tabTimer: null, vx: 0, x: 0, t: 0 };

	/* ---------------------------------------------------------------------
	   Storage
	   ------------------------------------------------------------------ */

	function read(key, fallback) {
		try {
			var raw = localStorage.getItem(key);
			var value = raw ? JSON.parse(raw) : fallback;
			return Array.isArray(fallback) && !Array.isArray(value) ? fallback : value;
		} catch (e) {
			return fallback;
		}
	}

	function write(key, value) {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (e) {}

		// The single choke point for pins, shelves and history, so the server copy
		// follows along without every caller having to remember to ask.
		if (SYNC_KEYS.concat(SYNC_MAPS).some(function (name) { return KEY[name] === key; })) schedulePush();
	}

	function adopt(from, to) {
		try {
			if (localStorage.getItem(to) != null) return;
			var value = localStorage.getItem(from);
			if (value != null) localStorage.setItem(to, value);
		} catch (e) {}
	}

	function adoptLegacy() {
		adopt("aurora_ui_enabled", KEY.enabled);
		adopt("aurora_ui_skin", KEY.skin);
		adopt("aurora_ui_accent", KEY.accent);
		adopt("aurora_ui_skin_accent", KEY.skinAccent);
		adopt("aurora_ui_palettes", KEY.palettes);
		adopt("aurora_ui_density", KEY.density);
		adopt("aurora_ui_pins", KEY.pins);
		adopt("aurora_ui_pin_groups", KEY.pinGroups);
		adopt("aurora_ui_recent", KEY.recent);
		adopt("aurora_ui_layout", KEY.layout);
		adopt("aurora:accent", KEY.accent);
	}

	function adoptDensityV3() {
		try {
			if (localStorage.getItem(KEY.densityRev) === "3") return false;
			var stored = localStorage.getItem(KEY.density);
			if (stored === "cozy") localStorage.setItem(KEY.density, "normal");
			localStorage.setItem(KEY.densityRev, "3");
			return stored === "cozy";
		} catch (e) {
			return false;
		}
	}

	/* ---------------------------------------------------------------------
	   Helpers
	   ------------------------------------------------------------------ */

	function make(tag, attrs, kids) {
		var node = document.createElement(tag);
		attrs = attrs || {};
		Object.keys(attrs).forEach(function (key) {
			if (key === "class") node.className = attrs[key];
			else if (key === "text") node.textContent = attrs[key];
			else if (key === "style") node.style.cssText = attrs[key];
			else if (key.indexOf("--") === 0) node.style.setProperty(key, attrs[key]);
			else node.setAttribute(key, attrs[key]);
		});
		(kids || []).forEach(function (kid) {
			if (kid) node.appendChild(kid);
		});
		return node;
	}

	function hue(text) {
		var sum = 0;
		text = String(text || "");
		for (var i = 0; i < text.length; i++) sum = (sum * 31 + text.charCodeAt(i)) % 100000;
		return sum % 360;
	}

	function titleize(text) {
		return String(text || "")
			.replace(/[-_]/g, " ")
			.replace(/\b\w/g, function (c) {
				return c.toUpperCase();
			});
	}

	function slugify(name) {
		try {
			if (window.frappe && frappe.router && frappe.router.slug) return frappe.router.slug(name);
		} catch (e) {}
		return String(name).toLowerCase().replace(/ /g, "-");
	}

	function canCreate(doctype) {
		try {
			return (frappe.boot.user.can_create || []).indexOf(doctype) !== -1;
		} catch (e) {
			return false;
		}
	}

	function canWrite(doctype) {
		try {
			return (frappe.boot.user.can_write || []).indexOf(doctype) !== -1;
		} catch (e) {
			return false;
		}
	}

	function clamp(value, min, max) {
		return Math.min(Math.max(value, min), Math.max(min, max));
	}

	/* ---------------------------------------------------------------------
	   Icons — resolved against the sprite already on the page
	   ------------------------------------------------------------------ */

	var iconCache = {};

	function spriteHas(name) {
		if (!name) return false;
		if (!(name in iconCache)) iconCache[name] = !!document.getElementById("icon-" + name);
		return iconCache[name];
	}

	function guessIcon(label, context) {
		var text = (String(label || "") + " " + String(context || "")).toLowerCase();
		for (var i = 0; i < ICON_RULES.length; i++) {
			if (ICON_RULES[i][0].test(text)) return ICON_RULES[i][1];
		}
		return "file-text";
	}

	function resolveIcon(preferred, label, context) {
		if (spriteHas(preferred)) return preferred;
		var guess = guessIcon(label, context);
		return spriteHas(guess) ? guess : "file-text";
	}

	function plural(count, one, many) {
		return count === 1 ? one : many;
	}

	/* Anything that throws work away asks first. The desk's own confirm is used
	   where it exists so the question looks like every other question the desk
	   asks; the browser's is only there so a missing dialog cannot turn a
	   guarded action into an unguarded one. */
	function askFirst(question, run) {
		try {
			if (window.frappe && frappe.confirm) {
				frappe.confirm(question, run);
				return;
			}
		} catch (e) {}
		if (window.confirm(question)) run();
	}

	function footKey(keys, label) {
		return make("span", { class: "aur-foot-key" }, [
			make("kbd", { text: keys }),
			make("span", { text: label }),
		]);
	}

	function iconNode(name, extraClass) {
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("class", "aur-glyph" + (extraClass ? " " + extraClass : ""));
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("aria-hidden", "true");

		var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
		use.setAttribute("href", "#icon-" + name);
		svg.appendChild(use);
		return svg;
	}

	/* ---------------------------------------------------------------------
	   Routing
	   ------------------------------------------------------------------ */

	function prefix() {
		return location.pathname.split("/")[1] === "desk" ? "/desk" : "/app";
	}

	function hrefFor(desc) {
		var route = desc.route || [];
		if (desc.act === "url") return desc.url || "#";
		if (desc.act === "new") return prefix() + "/" + slugify(desc.doctype) + "/new";
		if (!route.length || !route[0]) return "#";
		if (route[0] === "List") return prefix() + "/" + slugify(route[1]);
		if (route[0] === "Form") return prefix() + "/" + slugify(route[1]) + "/" + encodeURIComponent(route[2]);
		if (route[0] === "query-report") return prefix() + "/query-report/" + encodeURIComponent(route[1]);
		return prefix() + "/" + route.map(slugify).join("/");
	}

	function hasRoute(item) {
		return Boolean(item && item.route && item.route.length && item.route[0]);
	}

	function runItem(desc) {
		if (!desc) return;

		// An external link leaves the desk, so it opens beside it rather than
		// replacing the app the user is working in.
		if (desc.act === "url") {
			if (desc.url) window.open(desc.url, "_blank", "noopener");
			closeMega();
			return;
		}

		if (desc.act === "route" && !hasRoute(desc)) return;

		try {
			if (desc.act === "new") frappe.new_doc(desc.doctype);
			else frappe.set_route.apply(frappe, desc.route);
		} catch (e) {
			var href = hrefFor(desc);
			if (href && href !== "#") window.location.href = href;
		}
		closeMega();
	}

	function doctypeItem(dt, module) {
		return {
			id: "list:" + dt.name,
			label: dt.label,
			sub: dt.single ? "Settings" : "List",
			hue: hue(dt.name),
			icon: resolveIcon(dt.icon, dt.label, module),
			search: dt.label + " " + dt.name,
			act: "route",
			route: dt.single ? ["Form", dt.name, dt.name] : ["List", dt.name],
			extra: !dt.single && canCreate(dt.name) ? { label: "New", act: "new", doctype: dt.name } : null,
		};
	}

	/* ---------------------------------------------------------------------
	   Pins and recents
	   ------------------------------------------------------------------ */

	function pins() {
		return read(KEY.pins, []);
	}

	function isPinned(id) {
		return pins().some(function (item) {
			return item.id === id;
		});
	}

	function strip(item) {
		return {
			id: item.id,
			label: item.label,
			sub: item.sub,
			hue: item.hue,
			icon: item.icon,
			act: item.act,
			route: item.route,
			doctype: item.doctype,
		};
	}

	/* ---------------------------------------------------------------------
	   Pin groups — user-made shelves inside the Pinned tab
	   ------------------------------------------------------------------ */

	var MAX_SHELF_DEPTH = 1;

	/* Shelves are stored flat with a parent reference; this is the one place
	   that turns them into display order. Rebuilding the tree and walking it
	   guarantees a child always follows its parent, whatever order the entries
	   happen to be saved in. A parent that no longer exists, or nesting deeper
	   than the limit, drops the shelf back to the root. */
	function normalizeShelves(list) {
		var seen = {};
		var clean = (list || []).filter(function (group) {
			if (!group || !group.id || group.id === DEFAULT_PIN_GROUP.id || seen[group.id]) return false;
			seen[group.id] = true;
			return true;
		});

		var children = {};
		clean.forEach(function (group) {
			var parent = group.parent && seen[group.parent] && group.parent !== group.id ? group.parent : "";
			(children[parent] = children[parent] || []).push(group);
		});

		var out = [];
		var walk = function (parent, depth) {
			(children[parent] || []).forEach(function (group) {
				var copy = Object.assign({}, group);
				copy.parent = depth ? parent : "";
				copy.depth = depth;
				out.push(copy);

				// Anything below the limit is promoted rather than dropped.
				if (depth + 1 > MAX_SHELF_DEPTH) walk(group.id, depth);
				else walk(group.id, depth + 1);
			});
		};

		walk("", 0);
		return out;
	}

	function customPinGroups() {
		return normalizeShelves(read(KEY.pinGroups, []));
	}

	function pinGroups() {
		return [Object.assign({ depth: 0 }, DEFAULT_PIN_GROUP)].concat(customPinGroups());
	}

	function shelfIndex(list, id) {
		for (var i = 0; i < list.length; i++) {
			if (list[i].id === id) return i;
		}
		return -1;
	}

	/* A shelf and everything nested under it move as one block. */
	function subtreeLength(list, at) {
		var depth = list[at].depth;
		var end = at + 1;
		while (end < list.length && list[end].depth > depth) end += 1;
		return end - at;
	}

	/* Nesting works like an outliner: a shelf tucks under the nearest row above
	   it that sits at its own level. */
	function indentTarget(list, at) {
		if (at < 1) return null;

		var self = list[at];
		for (var i = at - 1; i >= 0; i--) {
			if (list[i].depth === self.depth) return list[i];
			if (list[i].depth < self.depth) break;
		}
		return null;
	}

	// How many levels the subtree adds below its own row.
	function subtreeHeight(list, at) {
		var span = subtreeLength(list, at);
		var height = 0;
		for (var i = at; i < at + span; i++) height = Math.max(height, list[i].depth - list[at].depth);
		return height;
	}

	function canIndent(id) {
		var list = customPinGroups();
		var at = shelfIndex(list, id);
		if (at < 0) return false;

		var parent = indentTarget(list, at);
		if (!parent) return false;

		// Nothing carried along may end up deeper than the limit allows.
		return parent.depth + 1 + subtreeHeight(list, at) <= MAX_SHELF_DEPTH;
	}

	function indentShelf(id) {
		if (!canIndent(id)) return;

		var list = customPinGroups();
		var at = shelfIndex(list, id);
		list[at].parent = indentTarget(list, at).id;
		write(KEY.pinGroups, list);
	}

	function outdentShelf(id) {
		var list = customPinGroups();
		var at = shelfIndex(list, id);
		if (at < 0 || !list[at].parent) return;

		var parent = list[shelfIndex(list, list[at].parent)];
		list[at].parent = parent ? parent.parent || "" : "";
		write(KEY.pinGroups, list);
	}

	/* Dropping a shelf makes it a sibling of the row it was dropped on, and its
	   own nesting is left to the indent controls. Reordering and re-parenting
	   in one gesture is guesswork; this way the result is always the one the
	   drop marker showed. */
	function moveShelf(id, targetId, after) {
		var list = customPinGroups();
		var from = shelfIndex(list, id);
		var to = shelfIndex(list, targetId);
		if (from < 0 || to < 0 || from === to) return;

		var span = subtreeLength(list, from);
		if (to >= from && to < from + span) return;

		var target = list[to];
		var block = list.splice(from, span);
		var shift = target.depth - block[0].depth;

		block.forEach(function (group) {
			group.depth += shift;
		});
		block[0].parent = target.parent || "";

		var at = shelfIndex(list, targetId);
		list.splice(after ? at + subtreeLength(list, at) : at, 0, ...block);

		write(KEY.pinGroups, list);
	}

	function setShelfIcon(id, icon) {
		write(
			KEY.pinGroups,
			customPinGroups().map(function (group) {
				if (group.id !== id) return group;
				var copy = Object.assign({}, group);
				copy.icon = icon;
				return copy;
			})
		);
	}

	function groupExists(id) {
		return pinGroups().some(function (group) {
			return group.id === id;
		});
	}

	function createPinGroup(label) {
		label = String(label || "").trim();
		if (!label) return null;

		var list = customPinGroups();
		var id = "g" + Date.now().toString(36);
		// Spread new shelves around the hue wheel so they are told apart at a glance.
		var group = { id: id, label: label.slice(0, 32), icon: "folder", hue: (list.length * 47 + 190) % 360, parent: "" };

		list.push(group);
		write(KEY.pinGroups, list.slice(0, 24));
		return group;
	}

	function renamePinGroup(id, label) {
		label = String(label || "").trim();
		if (!label) return;

		write(
			KEY.pinGroups,
			customPinGroups().map(function (group) {
				if (group.id !== id) return group;
				var copy = Object.assign({}, group);
				copy.label = label.slice(0, 32);
				return copy;
			})
		);
	}

	/* Deleting a shelf must never lose what is on it: its pins fall back to the
	   default group, and any shelf nested under it is promoted rather than
	   taken down with it. */
	function deletePinGroup(id) {
		var list = customPinGroups();
		var doomed = list[shelfIndex(list, id)];

		write(
			KEY.pinGroups,
			list
				.filter(function (group) {
					return group.id !== id;
				})
				.map(function (group) {
					if (group.parent !== id) return group;
					var copy = Object.assign({}, group);
					copy.parent = doomed ? doomed.parent || "" : "";
					return copy;
				})
		);

		write(
			KEY.pins,
			pins().map(function (item) {
				if ((item.group || DEFAULT_PIN_GROUP.id) !== id) return item;
				var copy = Object.assign({}, item);
				copy.group = DEFAULT_PIN_GROUP.id;
				return copy;
			})
		);
	}

	var PIN_LIMIT = 60;

	function pinIndex(list, id) {
		for (var i = 0; i < list.length; i++) {
			if (list[i].id === id) return i;
		}
		return -1;
	}

	/* Filing a pin sends it to the end of its new shelf, which is where the
	   drop marker sat when it was let go. */
	function movePin(itemId, groupId) {
		if (!groupExists(groupId)) return;

		var list = pins();
		var at = pinIndex(list, itemId);
		if (at < 0) return;

		var moved = Object.assign({}, list[at]);
		moved.group = groupId;
		list.splice(at, 1);

		// Sit behind the last entry already on that shelf, not at the very end
		// of every shelf's worth of pins.
		var insert = list.length;
		for (var i = list.length - 1; i >= 0; i--) {
			if ((list[i].group || DEFAULT_PIN_GROUP.id) === groupId) {
				insert = i + 1;
				break;
			}
		}

		list.splice(insert, 0, moved);
		write(KEY.pins, list);
	}

	/* Dropping one pin onto another both files it on that shelf and places it
	   exactly where the marker showed. */
	function reorderPin(itemId, targetId, after) {
		if (itemId === targetId) return;

		var list = pins();
		var from = pinIndex(list, itemId);
		if (from < 0) return;

		var moved = Object.assign({}, list[from]);
		list.splice(from, 1);

		var to = pinIndex(list, targetId);
		if (to < 0) return;

		moved.group = list[to].group || DEFAULT_PIN_GROUP.id;
		list.splice(after ? to + 1 : to, 0, moved);
		write(KEY.pins, list);
	}

	function togglePin(item, anchor) {
		var before = pins();
		var list = before.filter(function (entry) {
			return entry.id !== item.id;
		});
		var added = list.length === before.length;

		if (added) {
			var entry = strip(item);
			entry.group = DEFAULT_PIN_GROUP.id;
			// New pins join the end of the shelf, so nothing already placed shifts.
			list.push(entry);
		}

		// Over the cap the oldest pin gives way, never the one just added.
		write(KEY.pins, list.slice(Math.max(0, list.length - PIN_LIMIT)));
		setCounts();
		syncPinButton();
		paintPinStars();

		// Offer the shelves, but only ever as an offer: ignoring the popover
		// leaves the pin where it already is, in the default group.
		if (added && anchor && customPinGroups().length) openPinPicker(anchor, entry.id);
		else if (megaOpen() && state.activeTab === "pinned" && !state.searching) renderGroups("pinned");
	}

	/* The desk routes by name but shows the document's title in its breadcrumb,
	   so a recent entry would otherwise read as an id. The loaded document
	   carries the title; one that has never been saved carries nothing worth
	   showing, and is better described by its doctype. */
	function docInfo(doctype, name) {
		var out = { title: "", fresh: /^new-[a-z0-9-]+$/i.test(name) };

		try {
			var doc = window.locals && locals[doctype] ? locals[doctype][name] : null;
			if (!doc) return out;

			out.fresh = !!doc.__islocal;
			if (out.fresh) return out;

			var meta = frappe.get_meta ? frappe.get_meta(doctype) : null;
			var field = meta && meta.title_field;
			var title = String((field && doc[field]) || doc.title || "").trim();
			if (title && title !== name) out.title = title;
		} catch (e) {}

		return out;
	}

	/* One comparable address per page, so the same destination reached by
	   different spellings lands on one string. A workspace is the reason this
	   exists: the desk hands it over as ["Workspaces", "Recruitment"] while the
	   menu carries it as ["recruitment"], and both have to read as the same
	   place or the star cannot tell it is already pinned. */
	function routeAddress(route) {
		var parts = (route || []).map(String);
		if (!parts.length) return "";
		var head = parts[0];

		if (head === "Form" && parts[2]) return "form/" + slugify(parts[1]) + "/" + parts[2];

		// A report with a reference doctype is addressed through that doctype's
		// list — ["List", "Sales Invoice", "Report", "Gross Profit"] — so it has
		// to be read as the report it is, not as the list it borrows.
		if (head === "List" && parts[2] === "Report" && parts[3]) return "report/" + slugify(parts[3]);
		if (head === "List" && parts[1]) return "list/" + slugify(parts[1]);
		if (head === "Tree" && parts[1]) return "tree/" + slugify(parts[1]);
		if (head === "query-report" && parts[1]) return "report/" + slugify(parts[1]);
		if ((head === "dashboard-view" || head === "Dashboard") && parts[1]) return "dash/" + slugify(parts[1]);
		if (head === "Workspaces" && parts[1]) return "ws/" + slugify(parts[1]);
		if (parts.length === 1) return "ws/" + slugify(head);
		return parts.map(slugify).join("/");
	}

	/* Pins are stored under an id, so the id has to be the same whichever way a
	   page was pinned. The menu model is what names things, so it answers first
	   and the star only invents an id for an address no menu carries. */
	function menuItemForRoute(route) {
		var want = routeAddress(route);
		if (!want) return null;

		var found = null;
		function consider(item) {
			if (found || !item || !item.id) return;
			if (routeAddress(item.route) === want) found = item;
		}

		var tabs = state.tabs || {};
		Object.keys(tabs).forEach(function (tabId) {
			(tabs[tabId] || []).forEach(function (group) {
				(group.items || []).forEach(consider);
			});
		});

		// The module shell draws from its own model, and under a content profile
		// that model is the only place a hand-written entry exists at all. Its
		// ids are what its own stars use, so they have to win here too.
		(nav.menus || []).forEach(function (menu) {
			if (menu.overview) consider(menu.overview);
			(menu.columns || []).forEach(function (column) {
				(column.items || []).forEach(consider);
			});
		});

		return found;
	}

	function describeRoute(route) {
		if (!route || !route.length) return null;
		var head = route[0];

		if (head === "Form" && route[2]) {
			var doctype = route[1];
			var name = route[2];
			var info = docInfo(doctype, name);

			return {
				id: "form:" + doctype + ":" + name,
				label: info.fresh ? "New " + doctype : info.title || name,
				// The id still earns its place underneath, just quietly.
				sub: info.fresh ? doctype : info.title ? doctype + " \u00b7 " + name : doctype,
				hue: hue(doctype),
				icon: resolveIcon(null, doctype),
				act: "route",
				route: ["Form", doctype, name],
			};
		}
		var known = menuItemForRoute(route);
		if (known) {
			return {
				id: known.id,
				label: known.label,
				sub: known.sub,
				hue: known.hue,
				icon: known.icon,
				act: "route",
				route: known.route,
			};
		}

		if (head === "List" && route[1]) {
			return {
				id: "list:" + route[1],
				label: route[1],
				sub: "List",
				hue: hue(route[1]),
				icon: resolveIcon(null, route[1]),
				act: "route",
				route: ["List", route[1]],
			};
		}
		if (head === "query-report" && route[1]) {
			return {
				id: "report:" + route[1],
				label: route[1],
				sub: "Report",
				hue: hue(route[1]),
				icon: "chart-column",
				act: "route",
				route: ["query-report", route[1]],
			};
		}
		if (head === "Tree" && route[1]) {
			return {
				id: "tree:" + route[1],
				label: route[1],
				sub: "Tree",
				hue: hue(route[1]),
				icon: resolveIcon(null, route[1]),
				act: "route",
				route: ["Tree", route[1]],
			};
		}

		// A dashboard and a workspace both used to fall through to null, which
		// left the star inert on two of the desk's most visited pages. The
		// prefixes match the ones the menu builds, so a page pinned from either
		// side is the same pin.
		if ((head === "dashboard-view" || head === "Dashboard") && route[1]) {
			return {
				id: "dashboard:" + route[1],
				label: titleize(route[1]),
				sub: "Dashboard",
				hue: hue(route[1]),
				icon: resolveIcon(null, "Dashboard", "report"),
				act: "route",
				route: ["dashboard-view", route[1]],
			};
		}
		if (head === "Workspaces" && route[1]) {
			return {
				id: "ws:" + route[1],
				label: titleize(route[1]),
				sub: "Workspace",
				hue: hue(route[1]),
				icon: resolveIcon(null, titleize(route[1])),
				act: "route",
				route: [slugify(route[1])],
			};
		}
		if (route.length === 1) {
			return {
				id: "ws:" + head,
				label: titleize(head),
				sub: "Workspace",
				hue: hue(head),
				icon: resolveIcon(null, titleize(head)),
				act: "route",
				route: [head],
			};
		}
		return null;
	}

	function currentDesc() {
		try {
			return describeRoute(frappe.get_route());
		} catch (e) {
			return null;
		}
	}

	function noteRoute() {
		var desc = currentDesc();
		syncPinButton();
		syncNavToRoute();
		if (!desc) return;

		var list = read(KEY.recent, []).filter(function (item) {
			return item.id !== desc.id;
		});
		list.unshift(desc);
		write(KEY.recent, list.slice(0, MAX_RECENT));

		// The badge counts what is in storage, so it has to be refreshed on the
		// way past or it only catches up on the next reload.
		setCounts();
		if (megaOpen() && state.activeTab === "recent" && !state.searching) renderGroups("recent");

		// The route changes before the document arrives, so the title is not
		// knowable yet. Look again once it has had time to load.
		setTimeout(refineRecent, 700);
		setTimeout(refineRecent, 2200);
		setTimeout(settleFormChrome, 80);
		setTimeout(settleFormChrome, 400);
	}

	/* Frappe's tab click does scrollIntoView against --navbar-height. With a
	   two-row bar that number is short, so the new pane lands under the title
	   and the first fields read as fragments floating in the tab strip. */
	function settleFormChrome() {
		var scroller = document.querySelector(".main-section");
		if (!scroller) return;

		measureChrome();

		var pane = document.querySelector(".tab-pane.active") || document.querySelector(".form-page");
		if (!pane) return;

		var first = null;
		var sections = pane.querySelectorAll(".form-section");
		for (var i = 0; i < sections.length; i++) {
			var section = sections[i];
			if (section.classList.contains("hide-control") || section.classList.contains("empty-section")) continue;
			if (!section.offsetHeight) continue;
			first = section;
			break;
		}
		if (!first) return;

		var cover = chromeBottom();
		var head = null;
		var heads = document.querySelectorAll(".page-head");
		for (var h = 0; h < heads.length; h++) {
			if (heads[h].offsetHeight) {
				head = heads[h];
				break;
			}
		}
		if (head) cover = Math.max(cover, head.getBoundingClientRect().bottom);

		var tabs = document.querySelector(".form-tabs-list");
		if (tabs && tabs.offsetHeight) cover = Math.max(cover, tabs.getBoundingClientRect().bottom);

		var gap = Math.round(cover + 8 - first.getBoundingClientRect().top);
		if (gap > 1) scroller.scrollTop += gap;
	}

	function bindFormTabs() {
		document.addEventListener(
			"click",
			function (event) {
				var tab = event.target && event.target.closest && event.target.closest(".form-tabs .nav-link");
				if (!tab) return;
				setTimeout(settleFormChrome, 30);
				setTimeout(settleFormChrome, 200);
			},
			true
		);
	}

	function formRef(item) {
		var id = String((item && item.id) || "");
		if (id.indexOf("form:") !== 0) return null;

		var parts = id.split(":");
		var doctype = parts[1];
		var name = parts.slice(2).join(":");
		return doctype && name ? [doctype, name] : null;
	}

	/* Entries stored before their document loaded, or in an earlier session,
	   are still labelled with an id. One round trip relabels the lot. */
	function backfillTitles() {
		var lists = [KEY.recent, KEY.pins];
		var refs = [];

		lists.forEach(function (key) {
			read(key, []).forEach(function (item) {
				var ref = formRef(item);
				if (ref && item.label === ref[1]) refs.push(ref);
			});
		});

		if (!refs.length) return;

		frappe
			.xcall("kaiten_erp_ui_themes.api.get_titles", { refs: JSON.stringify(refs) })
			.then(function (titles) {
				if (!titles) return;

				lists.forEach(function (key) {
					var changed = false;

					var next = read(key, []).map(function (item) {
						var ref = formRef(item);
						if (!ref || item.label !== ref[1]) return item;

						var title = titles[ref[0] + ":" + ref[1]];
						if (!title) return item;

						changed = true;
						var copy = Object.assign({}, item);
						copy.label = title;
						copy.sub = ref[0] + " \u00b7 " + ref[1];
						return copy;
					});

					if (changed) write(key, next);
				});

				if (megaOpen() && !state.searching) renderGroups(state.activeTab || "workspaces");
			})
			.catch(function () {});
	}

	/* Upgrade the newest entry in place once its document is available, so an
	   id recorded on arrival turns into the title the desk itself shows. */
	function refineRecent() {
		var desc = currentDesc();
		if (!desc) return;

		var list = read(KEY.recent, []);
		if (!list.length || list[0].id !== desc.id) return;
		if (list[0].label === desc.label && list[0].sub === desc.sub) return;

		list[0] = desc;
		write(KEY.recent, list);
		syncPinButton();
		if (megaOpen() && state.activeTab === "recent" && !state.searching) renderGroups("recent");
	}

	function trackRoutes() {
		try {
			if (frappe.router && frappe.router.on) frappe.router.on("change", noteRoute);
		} catch (e) {}

		var last = "";
		setInterval(function () {
			var now = location.pathname + location.hash;
			if (now === last) return;
			last = now;
			noteRoute();
		}, 1200);

		noteRoute();
	}

	function syncPinButton() {
		if (!el.pinBtn) return;
		var desc = currentDesc();
		var on = desc && isPinned(desc.id);
		el.pinBtn.classList.toggle("aur-pinned", !!on);
		el.pinBtn.setAttribute("title", on ? "Unpin this page" : "Pin this page");
	}

	/* ---------------------------------------------------------------------
	   Menu model
	   ------------------------------------------------------------------ */

	function buildWorkspaces(menu) {
		var pages = menu.workspaces || [];
		if (!pages.length) return [];

		var byParent = {};
		pages.forEach(function (page) {
			(byParent[page.parent || ""] = byParent[page.parent || ""] || []).push(page);
		});

		function itemFor(page) {
			return {
				id: "ws:" + page.name,
				label: page.label,
				sub: page.public ? "Public workspace" : "Private workspace",
				hue: hue(page.name),
				icon: resolveIcon(page.icon, page.label, page.module),
				search: page.label + " " + page.name + " " + (page.module || ""),
				act: "route",
				route: [slugify(page.name)],
			};
		}

		var groups = [{ key: "__all", label: "All workspaces", icon: "layers", hue: 245, items: pages.map(itemFor) }];

		(byParent[""] || []).forEach(function (parent) {
			groups.push({
				key: parent.name,
				label: parent.label,
				hue: hue(parent.name),
				icon: resolveIcon(parent.icon, parent.label, parent.module),
				items: [parent].concat(byParent[parent.name] || []).map(itemFor),
			});
		});

		return groups;
	}

	function moduleGroup(mod, items) {
		return {
			key: mod.module,
			label: mod.label,
			hue: hue(mod.module),
			icon: resolveIcon(MODULE_ICONS[mod.module], mod.label),
			items: items,
		};
	}

	function buildModules(menu) {
		return (menu.modules || []).map(function (mod) {
			return moduleGroup(
				mod,
				mod.doctypes.map(function (dt) {
					return doctypeItem(dt, mod.label);
				})
			);
		});
	}

	function buildCreate(menu) {
		var groups = [];
		(menu.modules || []).forEach(function (mod) {
			var items = mod.doctypes
				.filter(function (dt) {
					return !dt.single && canCreate(dt.name);
				})
				.map(function (dt) {
					return {
						id: "new:" + dt.name,
						label: dt.label,
						sub: "New " + dt.label,
						hue: hue(dt.name),
						icon: resolveIcon(dt.icon, dt.label, mod.label),
						search: dt.label + " " + dt.name,
						act: "new",
						doctype: dt.name,
						extra: { label: "List", act: "route", route: ["List", dt.name] },
					};
				});

			if (items.length) groups.push(moduleGroup(mod, items));
		});
		return groups;
	}

	function buildInsights(menu) {
		var byModule = {};
		(menu.reports || []).forEach(function (report) {
			(byModule[report.module] = byModule[report.module] || []).push(report);
		});

		return Object.keys(byModule)
			.sort()
			.map(function (module) {
				return {
					key: module,
					label: module,
					hue: hue(module),
					icon: resolveIcon(MODULE_ICONS[module], module),
					items: byModule[module].map(function (report) {
						return {
							id: "report:" + report.name,
							label: report.label,
							sub: report.type + " \u00b7 " + report.doctype,
							hue: hue(report.name),
							icon: resolveIcon(null, report.label, "report"),
							search: report.label + " " + report.doctype + " " + report.type,
							act: "route",
							route:
								report.type === "Report Builder"
									? ["List", report.doctype, "Report", report.name]
									: ["query-report", report.name],
						};
					}),
				};
			});
	}

	function buildTools(menu) {
		return (menu.tools || []).map(function (group) {
			return {
				key: group.label,
				label: group.label,
				hue: hue(group.label),
				icon: resolveIcon(null, group.label),
				items: group.items.map(function (dt) {
					return doctypeItem(dt, group.label);
				}),
			};
		});
	}

	function buildModel(menu) {
		state.tabs = {
			workspaces: buildWorkspaces(menu),
			modules: buildModules(menu),
			create: buildCreate(menu),
			insights: buildInsights(menu),
			tools: buildTools(menu),
		};

		state.index = [];
		["workspaces", "modules", "create", "insights", "tools"].forEach(function (tabId) {
			var tab = TABS.filter(function (entry) {
				return entry.id === tabId;
			})[0];

			(state.tabs[tabId] || []).forEach(function (group) {
				if (group.key === "__all") return;
				group.items.forEach(function (item) {
					var copy = Object.assign({}, item);
					copy.sub = tab.label + " \u00b7 " + group.label;
					copy.search = (item.search + " " + group.label).toLowerCase();
					state.index.push(copy);
				});
			});
		});
	}

	function groupsFor(tabId) {
		if (tabId === "pinned") {
			var all = pins();
			return pinGroups().map(function (group) {
				return {
					key: "pin:" + group.id,
					label: group.label,
					// A saved icon can outlive the sprite, so it is resolved rather than trusted.
					icon: resolveIcon(group.icon, group.label, "folder"),
					hue: group.hue,
					pinGroup: group.id,
					depth: group.depth || 0,
					items: all.filter(function (item) {
						return (item.group || DEFAULT_PIN_GROUP.id) === group.id;
					}),
				};
			});
		}
		if (tabId === "recent")
			return [{ key: "__recent", label: "Recently visited", icon: "history", hue: 200, items: read(KEY.recent, []) }];
		if (tabId === "shellnav") return shellNavGroups();
		return state.tabs[tabId] || [];
	}

	/* The Module nav's own content, reshaped into the exact group/item model the
	   mega menu draws: every configured module becomes a group down the rail,
	   its entries the grid on the right. Because it is the same model, the tiles,
	   the "New" chip, the keyboard and the filter all come for free — the grid
	   view is the command menu wearing the module content. */
	function shellNavItem(item) {
		var copy = Object.assign({}, item);
		copy.search = (item.label + " " + (item.sub || "")).toLowerCase();

		// A list entry earns the same New chip it has in the command menu, so
		// the two are indistinguishable. The doctype is the tail of the id.
		if (!copy.extra && typeof copy.id === "string" && copy.id.indexOf("list:") === 0) {
			var doctype = copy.id.slice("list:".length);
			if (canCreate(doctype)) copy.extra = { label: "New", act: "new", doctype: doctype };
		}
		return copy;
	}

	function shellNavGroups() {
		return (nav.menus || []).map(function (menu) {
			// The flat list still backs search, the count and keyboard walking;
			// the sections carry the same rows grouped by their Card Break area
			// and then by Main/Reports/Setup, so the detail panel can print the
			// headings a client set instead of one undifferentiated grid.
			var items = [];

			var landing = menuLanding(menu);
			var landingItem = landing ? shellNavItem(landing) : null;
			if (landingItem) items.push(landingItem);

			// Areas are only worth naming when there is more than one. A single
			// untitled area is just "the module", so it stays a plain list —
			// the standard behaviour for a menu whose author set no groups.
			var showArea = (menu.columns || []).length > 1;

			var sections = [];
			(menu.columns || []).forEach(function (column) {
				var mixed = areaIsMixed(column.items);
				var subs = [];
				eachKind(column.items, mixed, function (bucket, rows, heading) {
					var built = rows.map(shellNavItem);
					built.forEach(function (row) {
						items.push(row);
					});
					subs.push({ heading: heading || "", rows: built });
				});
				if (!subs.length) return;
				var title = showArea && column.title !== menu.label ? column.title : "";
				sections.push({ title: title || "", subs: subs });
			});

			return {
				key: menu.name,
				label: menu.label,
				icon: menu.icon,
				hue: menu.hue,
				items: items,
				landing: landingItem,
				sections: sections,
			};
		});
	}

	/* ---------------------------------------------------------------------
	   Rendering
	   ------------------------------------------------------------------ */

	function renderItem(item, i, options) {
		options = options || {};
		var actions = make("div", { class: "aur-item-actions" });

		if (item.extra) {
			var chip = make("button", { class: "aur-chip", type: "button", title: item.extra.label, text: item.extra.label });
			chip.addEventListener("click", function (event) {
				event.preventDefault();
				event.stopPropagation();
				runItem(item.extra);
			});
			actions.appendChild(chip);
		}

		var star = make("button", {
			class: "aur-star" + (isPinned(item.id) ? " aur-pinned" : ""),
			type: "button",
			title: "Pin to the Pinned tab",
			text: "\u2605",
		});
		star.addEventListener("click", function (event) {
			event.preventDefault();
			event.stopPropagation();
			togglePin(item, star);
			star.classList.toggle("aur-pinned", isPinned(item.id));
		});
		actions.appendChild(star);

		var parts = [
			make("div", { class: "aur-item-icon" }, [iconNode(item.icon || "file-text")]),
			make("div", { class: "aur-item-text" }, [
				make("div", { class: "aur-item-label", text: item.label }),
				make("div", { class: "aur-item-sub", text: item.sub || "" }),
			]),
			actions,
		];

		if (options.drag) parts.unshift(make("span", { class: "aur-grip", title: "Drag onto a shelf", text: "\u2059" }));

		var node = make(
			"a",
			{
				class: "aur-item aur-stagger" + (options.drag ? " aur-draggable" : ""),
				href: hrefFor(item),
				title: item.sub ? item.label + " \u2014 " + item.sub : item.label,
				"--h": String(item.hue),
				"--i": String(i),
			},
			parts
		);

		if (options.drag) {
			node.setAttribute("draggable", "true");
			node.addEventListener("dragstart", function (event) {
				event.dataTransfer.setData("text/plain", item.id);
				event.dataTransfer.effectAllowed = "move";
				node.classList.add("aur-dragging");
			});
			node.addEventListener("dragend", function () {
				node.classList.remove("aur-dragging");
			});

			/* Entries reorder against each other. The grid flows left to right,
			   so which side of the target the pointer is on decides whether the
			   entry lands before or after it. */
			var side = function (event) {
				var box = node.getBoundingClientRect();
				return event.clientX > box.left + box.width / 2;
			};

			var clearMark = function () {
				node.classList.remove("aur-item-before", "aur-item-after");
			};

			node.addEventListener("dragover", function (event) {
				if (Array.prototype.indexOf.call(event.dataTransfer.types || [], SHELF_MIME) !== -1) return;
				event.preventDefault();
				event.stopPropagation();
				event.dataTransfer.dropEffect = "move";

				var after = side(event);
				node.classList.toggle("aur-item-after", after);
				node.classList.toggle("aur-item-before", !after);
			});

			node.addEventListener("dragleave", clearMark);

			node.addEventListener("drop", function (event) {
				event.preventDefault();
				event.stopPropagation();

				var after = side(event);
				clearMark();

				var dragged = event.dataTransfer.getData("text/plain");
				if (!dragged || dragged === item.id) return;

				reorderPin(dragged, item.id, after);
				refreshShelves(options.groupKey);
			});
		}

		node.addEventListener("click", function (event) {
			// Let the browser handle modified clicks so Cmd/Ctrl/middle click
			// opens the entry in a new tab like any other link.
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
			event.preventDefault();
			runItem(item);
		});

		return node;
	}

	function alignBody(count) {
		el.body.style.paddingTop = "";
		var node = state.activeNode;
		if (!node || count > SMALL_GROUP) return;

		var panel = el.mega.getBoundingClientRect();
		var row = node.getBoundingClientRect();
		var content = el.body.scrollHeight;
		var offset = row.top - panel.top - 16;

		// Drop the short list down beside the row that opened it, but never so
		// far that it runs off the bottom of the panel.
		el.body.style.paddingTop = Math.round(clamp(offset, 16, panel.height - content - 20)) + "px";
	}

	function renderItems(title, items, options) {
		options = options || {};
		el.body.innerHTML = "";

		var head = make("div", { class: "aur-mega-title", text: title });
		if (options.action) {
			var chip = make("button", { class: "aur-chip", type: "button", text: options.action.label });
			chip.addEventListener("click", options.action.run);
			head.appendChild(chip);
		}
		el.body.appendChild(head);

		if (!items.length) {
			el.body.appendChild(make("div", { class: "aur-empty", text: options.empty || "Nothing here you have access to." }));
			return;
		}

		// Module content arrives grouped: the landing tile first, then each
		// Card Break area under its own heading, and Reports/Setup under theirs
		// inside it. A search flattens back to one grid — the matches are the
		// point then, not the shape they came from.
		if (options.sections && options.sections.length) {
			var seq = 0;

			if (options.landing) {
				var lead = make("div", { class: "aur-grid" });
				lead.appendChild(renderItem(options.landing, seq++, options));
				el.body.appendChild(lead);
			}

			options.sections.forEach(function (section) {
				if (section.title) {
					el.body.appendChild(make("div", { class: "aur-mega-area", text: section.title }));
				}
				section.subs.forEach(function (sub) {
					if (sub.heading) {
						el.body.appendChild(make("div", { class: "aur-mega-sub", text: sub.heading }));
					}
					var subGrid = make("div", { class: "aur-grid" });
					sub.rows.forEach(function (row) {
						subGrid.appendChild(renderItem(row, seq++, options));
					});
					el.body.appendChild(subGrid);
				});
			});

			el.body.scrollTop = 0;
			alignBody(items.length);
			armCursor();
			return;
		}

		var grid = make("div", { class: "aur-grid" });
		items.slice(0, 300).forEach(function (item, i) {
			grid.appendChild(renderItem(item, i, options));
		});

		// Dropping on the empty space past the last entry sends it to the end,
		// which is otherwise an awkward target to hit.
		if (options.drag && options.pinGroup) {
			grid.addEventListener("dragover", function (event) {
				event.preventDefault();
				event.dataTransfer.dropEffect = "move";
				grid.classList.add("aur-grid-drop");
			});
			grid.addEventListener("dragleave", function () {
				grid.classList.remove("aur-grid-drop");
			});
			grid.addEventListener("drop", function (event) {
				event.preventDefault();
				grid.classList.remove("aur-grid-drop");

				var dragged = event.dataTransfer.getData("text/plain");
				if (!dragged) return;

				movePin(dragged, options.pinGroup);
				refreshShelves(options.groupKey);
			});
		}

		el.body.appendChild(grid);
		el.body.scrollTop = 0;
		alignBody(items.length);
		armCursor();
	}

	function selectGroup(tabId, key) {
		var groups = state.groups || [];

		groups.forEach(function (group) {
			if (group.node) group.node.classList.toggle("aur-active", group.key === key);
		});

		var active = groups.filter(function (group) {
			return group.key === key;
		})[0];
		if (!active) return;

		state.activeNode = active.node;
		state.activeKey = active.key;

		var options = {};
		if (tabId === "pinned") {
			options.drag = true;
			options.pinGroup = active.pinGroup;
			options.groupKey = active.key;
			options.empty =
				active.pinGroup === DEFAULT_PIN_GROUP.id
					? "Nothing pinned yet. Hover any item and click its star, or use the star in the bar."
					: "Empty shelf. Drag entries onto it from the list on the left.";

			if (active.items.length) {
				options.action = {
					label: "Clear",
					run: function () {
						askFirst(
							"Remove all " + active.items.length + " pinned " + plural(active.items.length, "entry", "entries") +
								" from " + active.label + "? The pages themselves are untouched.",
							function () {
								write(
									KEY.pins,
									pins().filter(function (item) {
										return (item.group || DEFAULT_PIN_GROUP.id) !== active.pinGroup;
									})
								);
								setCounts();
								syncPinButton();
								paintPinStars();
								renderGroups("pinned");
							}
						);
					},
				};
			}
		} else if (tabId === "recent") {
			options.empty = "No history yet. Open a few pages and they will show up here.";
			if (active.items.length) {
				options.action = {
					label: "Clear",
					run: function () {
						askFirst(
							"Clear all " + active.items.length + " recently visited " +
								plural(active.items.length, "page", "pages") + "? This cannot be undone.",
							function () {
								write(KEY.recent, []);
								setCounts();
								renderGroups("recent");
							}
						);
					},
				};
			}
		}

		// Module menus carry area/section structure. Show it at rest; a live
		// filter falls back to the flat grid the matches read best in.
		if (active.sections && active.sections.length && !String(state.megaQuery || "").trim()) {
			options.sections = active.sections;
			options.landing = active.landing;
		}

		renderItems(active.label, active.items, options);
	}

	/* Narrow a tab's groups to a query without flattening them. A group whose
	   own name matches keeps all of its children, so searching for a module
	   still shows everything inside it; otherwise only matching children
	   survive, and a group left with none is dropped. */
	function filterGroups(groups, query) {
		var needle = String(query || "").trim().toLowerCase();
		if (!needle) return groups;

		var terms = needle.split(/\s+/);
		var hit = function (text) {
			return terms.every(function (term) {
				return text.indexOf(term) !== -1;
			});
		};

		var kept = [];
		groups.forEach(function (group) {
			var items = hit(String(group.label || "").toLowerCase())
				? group.items
				: (group.items || []).filter(function (item) {
						return hit(String(item.search || item.label || "").toLowerCase());
				  });

			if (items.length) {
				var copy = Object.assign({}, group);
				copy.items = items;
				kept.push(copy);
			}
		});

		return kept;
	}

	function clearMegaFilter() {
		state.megaQuery = "";
		if (el.megaSearch) el.megaSearch.value = "";
		renderGroups(state.activeTab || "workspaces");
		if (el.megaSearch) el.megaSearch.focus();
	}

	/* The filter survives a tab change, so the panel has to say so: without a
	   standing notice a tab narrowed by an earlier search just looks empty. */
	function updateFilterBar(query, groups) {
		if (!el.filterBar) return;

		var needle = String(query || "").trim();
		// Runs on every render, so it is the one place that catches typing, tab
		// changes, clearing and reopening alike.
		if (el.megaClear) el.megaClear.hidden = !needle;

		el.filterBar.classList.toggle("aur-on", !!needle);
		if (!needle) return;

		var items = 0;
		var shown = 0;
		groups.forEach(function (group) {
			if (group.key === "__all") return;
			items += (group.items || []).length;
			shown += 1;
		});

		var plural = function (n, one, many) {
			return n + " " + (n === 1 ? one : many);
		};

		el.filterText.textContent = items
			? "Filtered by \u201c" +
			  needle +
			  "\u201d \u00b7 " +
			  plural(items, "match", "matches") +
			  " in " +
			  plural(shown, "group", "groups")
			: "Filtered by \u201c" + needle + "\u201d \u00b7 nothing in this tab";
	}

	/* ---------------------------------------------------------------------
	   Layout

	   Two ways to read the same tree. Split is the master/detail rail; columns
	   opens every group at once for people who would rather scan than click.
	   ------------------------------------------------------------------ */

	function currentLayout() {
		return localStorage.getItem(KEY.layout) === "columns" ? "columns" : "split";
	}

	function applyLayout() {
		var layout = currentLayout();
		if (el.mega) el.mega.setAttribute("data-layout", layout);
		Object.keys(el.layoutBtns || {}).forEach(function (id) {
			el.layoutBtns[id].classList.toggle("aur-on", id === layout);
			el.layoutBtns[id].setAttribute("aria-pressed", id === layout ? "true" : "false");
		});
	}

	function setLayout(id) {
		localStorage.setItem(KEY.layout, id === "columns" ? "columns" : "split");
		applyLayout();
		renderGroups(state.activeTab || "workspaces");
		if (megaOpen()) positionMega();
		schedulePush();
	}

	function renderColumns(tabId, groups) {
		el.groups.innerHTML = "";
		el.body.innerHTML = "";
		el.body.style.paddingTop = "";
		state.activeNode = null;

		var query = String(state.megaQuery || "").trim();

		if (!groups.length) {
			el.body.appendChild(
				make("div", {
					class: "aur-empty",
					text: query ? 'Nothing in this tab matches "' + query + '".' : "Nothing here you have access to.",
				})
			);
			armCursor();
			return;
		}

		/* "All workspaces" earns its place in the split rail, where only one group
		   shows at a time. Here every group is already on screen, so it is the
		   same list over again — and the longest one at that. */
		var shown = groups.filter(function (group) {
			return group.key !== "__all";
		});
		if (!shown.length) shown = groups;

		var flow = make("div", { class: "aur-mega-flow" });
		el.body.appendChild(flow);

		/* Lanes are built here rather than left to CSS columns. Column boxes
		   reflow every group whenever one of them changes height, so opening a
		   long module used to shuffle the whole panel and lose the reader's place.
		   A lane is an ordinary stack: opening a group inside one pushes down what
		   sits below it and leaves the other lanes where they are. */
		var lanes = [];
		var built = [];

		shown.forEach(function (group) {
			var options = {};
			if (tabId === "pinned") {
				options.drag = true;
				options.pinGroup = group.pinGroup;
				options.groupKey = group.key;
			}

			var items = group.items || [];
			// A filtered view is small, and the matches are the whole point, so
			// nothing is held back while a search is in force.
			var expanded = Boolean(query) || Boolean(state.openCols[group.key]);
			var visible = expanded ? items.slice(0, 300) : items.slice(0, COLUMN_PEEK);

			var grid = make("div", { class: "aur-grid" });
			visible.forEach(function (item, i) {
				grid.appendChild(renderItem(item, i, options));
			});

			var head = make("div", { class: "aur-col-head" }, [
				iconNode(group.icon || "layers", "aur-group-icon"),
				make("span", { class: "aur-col-label", text: group.label }),
				make("span", { class: "aur-group-count", text: String(items.length) }),
			]);

			// A workspace with no children is its own heading. Printing the name
			// twice, once as a label and once as the only row beneath it, wastes
			// half the panel on repetition.
			var echo =
				items.length === 1 &&
				String(items[0].label || "")
					.trim()
					.toLowerCase() ===
					String(group.label || "")
						.trim()
						.toLowerCase();

			var column = make(
				"div",
				{ class: echo ? "aur-col aur-col-lone" : "aur-col", "--h": String(group.hue == null ? 250 : group.hue) },
				echo ? [grid] : [head, grid]
			);
			if (group.depth) column.style.setProperty("--d", String(group.depth));

			/* Opening and closing edits this one column in place. Re-rendering the
			   panel for it would blank and rebuild every group, which reads as a
			   flicker and a reload. */
			var toggle = null;

			var label = function () {
				var open = grid.children.length >= items.length;
				toggle.textContent = open ? "Show less" : "+" + (items.length - grid.children.length) + " more";
				toggle.classList.toggle("aur-col-open", open);
			};

			var flip = function (event) {
				event.stopPropagation();
				if (grid.children.length >= items.length) {
					while (grid.children.length > COLUMN_PEEK) grid.removeChild(grid.lastChild);
					delete state.openCols[group.key];
				} else {
					var from = grid.children.length;
					items.slice(from, 300).forEach(function (item, i) {
						// The stagger counts from the first new row, so entry ninety
						// does not wait out a second and a quarter of delay.
						grid.appendChild(renderItem(item, Math.min(i, 12), options));
					});
					state.openCols[group.key] = true;
				}
				label();
			};

			if (items.length > COLUMN_PEEK && !query) {
				toggle = make("button", { class: "aur-col-more", type: "button" });
				toggle.addEventListener("click", flip);
				column.appendChild(toggle);
				label();
			}

			// Dropping anywhere in a shelf's column files the pin there, which is
			// the whole point of showing every shelf at once.
			if (options.drag && options.pinGroup) {
				column.addEventListener("dragover", function (event) {
					event.preventDefault();
					event.dataTransfer.dropEffect = "move";
					column.classList.add("aur-col-drop");
				});
				column.addEventListener("dragleave", function () {
					column.classList.remove("aur-col-drop");
				});
				column.addEventListener("drop", function (event) {
					event.preventDefault();
					column.classList.remove("aur-col-drop");
					var dragged = event.dataTransfer.getData("text/plain");
					if (!dragged) return;
					movePin(dragged, options.pinGroup);
					renderGroups("pinned");
				});
			}

			// A heading plus its rows, which is close enough to a height for
			// deciding where one lane should end and the next begin.
			built.push({ node: column, weight: (echo ? 0 : 1) + visible.length + (toggle ? 1 : 0) });
		});

		var width = el.body.clientWidth || el.mega.clientWidth || 1100;
		var laneCount = Math.max(1, Math.min(6, Math.floor(width / LANE_WIDTH)));

		var remaining = built.reduce(function (sum, entry) {
			return sum + entry.weight;
		}, 0);
		var lanesLeft = laneCount;
		var target = remaining / lanesLeft;
		var used = 0;
		var lane = null;

		built.forEach(function (entry) {
			// Groups keep their order and fill one lane at a time, so the reading
			// order stays alphabetical down a lane and then on to the next.
			if (!lane || (lanesLeft > 1 && used && used + entry.weight / 2 > target)) {
				if (lane) {
					remaining -= used;
					lanesLeft -= 1;
					target = remaining / Math.max(1, lanesLeft);
					used = 0;
				}
				lane = make("div", { class: "aur-lane" });
				lanes.push(lane);
				flow.appendChild(lane);
			}

			lane.appendChild(entry.node);
			used += entry.weight;
		});

		armCursor();
	}

	function renderGroups(tabId) {
		var query = state.megaQuery || "";
		var groups = filterGroups(groupsFor(tabId), query);
		state.groups = groups;
		updateFilterBar(query, groups);

		if (currentLayout() === "columns") {
			renderColumns(tabId, groups);
			return;
		}

		el.groups.innerHTML = "";
		if (tabId === "pinned" && !query) el.groups.appendChild(shelfManageBar());

		groups.forEach(function (group) {
			var button = make("button", { class: "aur-group", type: "button", "--h": String(group.hue) }, [
				iconNode(group.icon || "layers", "aur-group-icon"),
				make("span", { text: group.label }),
				make("span", { class: "aur-group-count", text: String(group.items.length) }),
			]);

			// Hover intent: a short delay, stretched while the pointer is moving
			// right, so crossing other rows on the way to the items does not keep
			// swapping the panel underneath the cursor.
			button.addEventListener("mouseenter", function () {
				clearTimeout(hover.timer);
				var delay = hover.vx > 0.28 ? 450 : 170;
				hover.timer = setTimeout(function () {
					selectGroup(tabId, group.key);
				}, delay);
			});

			button.addEventListener("click", function () {
				clearTimeout(hover.timer);
				selectGroup(tabId, group.key);
			});

			group.node = button;
			el.groups.appendChild(tabId === "pinned" ? pinShelfRow(button, group) : button);
		});

		if (tabId === "pinned" && !query) el.groups.appendChild(newShelfRow());

		if (groups.length) selectGroup(tabId, groups[0].key);
		else if (query)
			renderItems("No match", [], { empty: 'Nothing in this tab matches "' + query.trim() + '".' });
		else renderItems("Nothing available", []);
	}

	/* ---------------------------------------------------------------------
	   The shelf rail inside the Pinned tab
	   ------------------------------------------------------------------ */

	/* One editor serves both renaming and creating: it swaps the row for a
	   field, and rebuilds the rail either way once it is done with. */
	function editShelfName(host, value, commit) {
		var settled = false;
		var input = make("input", { class: "aur-shelf-input", type: "text", placeholder: "Shelf name", maxlength: "32" });
		input.value = value || "";

		var finish = function (save) {
			if (settled) return;
			settled = true;
			if (save) commit(input.value);
			setCounts();
			renderGroups("pinned");
		};

		// The menu filters on any printable key, which would eat this field.
		input.addEventListener("keydown", function (event) {
			event.stopPropagation();
			if (event.key === "Enter") {
				event.preventDefault();
				finish(true);
			} else if (event.key === "Escape") {
				event.preventDefault();
				finish(false);
			}
		});
		input.addEventListener("blur", function () {
			finish(true);
		});

		host.innerHTML = "";
		host.appendChild(input);
		input.focus();
		input.select();
	}

	function shelfTool(glyph, title, run, extraClass) {
		var button = make("button", { class: "aur-shelf-tool" + (extraClass ? " " + extraClass : ""), type: "button", title: title }, [
			iconNode(glyph),
		]);
		button.addEventListener("click", function (event) {
			event.preventDefault();
			event.stopPropagation();
			run(button);
		});
		return button;
	}

	function refreshShelves(selectKey) {
		setCounts();
		renderGroups("pinned");
		if (selectKey) selectGroup("pinned", selectKey);
	}

	/* Editing lives behind a mode rather than on hover. The tools used to share
	   the row with the shelf itself, so reaching for a shelf kept landing on
	   rename or delete. */
	function shelfManageBar() {
		var bar = make("div", { class: "aur-shelf-bar" + (state.manageShelves ? " aur-on" : "") });
		bar.appendChild(make("span", { class: "aur-shelf-bar-label", text: state.manageShelves ? "Arranging shelves" : "Shelves" }));

		var toggle = make("button", { class: "aur-shelf-manage", type: "button" }, [
			iconNode(state.manageShelves ? "check" : "settings-2"),
			make("span", { text: state.manageShelves ? "Done" : "Edit" }),
		]);
		toggle.addEventListener("click", function (event) {
			event.stopPropagation();
			state.manageShelves = !state.manageShelves;
			renderGroups("pinned");
		});

		bar.appendChild(toggle);
		return bar;
	}

	function shelfEditTools(row, group) {
		var tools = make("div", { class: "aur-shelf-tools" });

		tools.appendChild(
			shelfTool("smile", "Change icon", function (self) {
				openIconPicker(self, group);
			})
		);

		tools.appendChild(
			shelfTool("pencil", "Rename shelf", function () {
				editShelfName(row, group.label, function (name) {
					renamePinGroup(group.pinGroup, name);
				});
			})
		);

		if (group.depth > 0) {
			tools.appendChild(
				shelfTool("chevron-left", "Move out one level", function () {
					outdentShelf(group.pinGroup);
					refreshShelves();
				})
			);
		} else if (canIndent(group.pinGroup)) {
			tools.appendChild(
				shelfTool("chevron-right", "Nest under the shelf above", function () {
					indentShelf(group.pinGroup);
					refreshShelves();
				})
			);
		}

		tools.appendChild(
			shelfTool(
				"trash-2",
				"Delete shelf",
				function (self) {
					confirmDeleteShelf(self, group);
				},
				"aur-shelf-danger"
			)
		);

		return tools;
	}

	function pinShelfRow(button, group) {
		var custom = group.pinGroup !== DEFAULT_PIN_GROUP.id;
		var managing = state.manageShelves && custom;

		var row = make("div", {
			class: "aur-shelf-row" + (managing ? " aur-managing" : "") + (group.depth ? " aur-nested" : ""),
			"--d": String(group.depth || 0),
		});

		if (managing) {
			var grip = make("span", { class: "aur-shelf-grip", title: "Drag to reorder", text: "\u2059" });
			grip.setAttribute("draggable", "true");
			grip.addEventListener("dragstart", function (event) {
				event.dataTransfer.setData(SHELF_MIME, group.pinGroup);
				event.dataTransfer.setData("text/plain", "");
				event.dataTransfer.effectAllowed = "move";
				row.classList.add("aur-dragging");
			});
			grip.addEventListener("dragend", function () {
				row.classList.remove("aur-dragging");
			});
			row.appendChild(grip);
		}

		row.appendChild(button);
		if (managing) row.appendChild(shelfEditTools(row, group));

		/* Two kinds of payload land here: a pinned entry being filed, or a
		   shelf being reordered. They are told apart by the drag's own type. */
		var isShelfDrag = function (event) {
			return Array.prototype.indexOf.call(event.dataTransfer.types || [], SHELF_MIME) !== -1;
		};

		row.addEventListener("dragover", function (event) {
			event.preventDefault();
			event.dataTransfer.dropEffect = "move";

			if (isShelfDrag(event)) {
				if (!custom) return;
				var box = row.getBoundingClientRect();
				var after = event.clientY > box.top + box.height / 2;
				row.classList.toggle("aur-drop-above", !after);
				row.classList.toggle("aur-drop-below", after);
			} else {
				row.classList.add("aur-drop");
			}
		});

		var clearDrop = function () {
			row.classList.remove("aur-drop", "aur-drop-above", "aur-drop-below");
		};
		row.addEventListener("dragleave", clearDrop);

		row.addEventListener("drop", function (event) {
			event.preventDefault();
			var box = row.getBoundingClientRect();
			var after = event.clientY > box.top + box.height / 2;
			clearDrop();

			var shelfId = event.dataTransfer.getData(SHELF_MIME);
			if (shelfId) {
				if (!custom) return;
				moveShelf(shelfId, group.pinGroup, after);
				refreshShelves();
				return;
			}

			var itemId = event.dataTransfer.getData("text/plain");
			if (!itemId) return;

			movePin(itemId, group.pinGroup);
			refreshShelves("pin:" + group.pinGroup);
		});

		return row;
	}

	function newShelfRow() {
		var row = make("div", { class: "aur-shelf-row aur-shelf-new" });
		var button = make("button", { class: "aur-shelf-add", type: "button" }, [
			iconNode("plus"),
			make("span", { text: "New shelf" }),
		]);

		button.addEventListener("click", function () {
			editShelfName(row, "", createPinGroup);
		});

		row.appendChild(button);
		return row;
	}

	/* A shelf can hold work worth keeping, and its children come with it, so
	   this states the consequence before it happens. */
	function confirmDeleteShelf(anchor, group) {
		closePop();

		var list = customPinGroups();
		var at = shelfIndex(list, group.pinGroup);
		var nested = at < 0 ? 0 : subtreeLength(list, at) - 1;

		var consequence = [];
		if (group.items.length) consequence.push(group.items.length + (group.items.length === 1 ? " pin moves" : " pins move") + " back to Pinned");
		if (nested) consequence.push(nested + (nested === 1 ? " nested shelf moves" : " nested shelves move") + " up a level");

		var cancel = make("button", { class: "aur-confirm-btn", type: "button", text: "Cancel" });
		cancel.addEventListener("click", function (event) {
			event.stopPropagation();
			closePop();
		});

		var confirm = make("button", { class: "aur-confirm-btn aur-confirm-danger", type: "button", text: "Delete shelf" });
		confirm.addEventListener("click", function (event) {
			event.stopPropagation();
			deletePinGroup(group.pinGroup);
			closePop();
			refreshShelves();
		});

		var pop = make("div", { class: "aur-pop aur-confirm-pop" }, [
			make("div", { class: "aur-confirm-title", text: "Delete \u201c" + group.label + "\u201d?" }),
			make("div", {
				class: "aur-confirm-body",
				text: consequence.length ? consequence.join(", and ") + "." : "This shelf is empty.",
			}),
			make("div", { class: "aur-confirm-row" }, [cancel, confirm]),
		]);

		el.pop = pop;
		document.body.appendChild(pop);

		var rect = anchor.getBoundingClientRect();
		pop.style.top = Math.round(rect.bottom + 8) + "px";
		pop.style.left = Math.round(clamp(rect.left - 150, 10, window.innerWidth - 280)) + "px";

		closeOnOutsideClick();
	}

	function openIconPicker(anchor, group) {
		closePop();

		var grid = make("div", { class: "aur-icon-grid" });
		SHELF_ICONS.filter(spriteHas).forEach(function (name) {
			var cell = make("button", {
				class: "aur-icon-cell" + (group.icon === name ? " aur-on" : ""),
				type: "button",
				title: name.replace(/-/g, " "),
			}, [iconNode(name)]);

			cell.addEventListener("click", function (event) {
				event.stopPropagation();
				setShelfIcon(group.pinGroup, name);
				closePop();
				refreshShelves();
			});
			grid.appendChild(cell);
		});

		var pop = make("div", { class: "aur-pop aur-icon-pop" }, [make("div", { class: "aur-pop-label", text: "Shelf icon" }), grid]);

		el.pop = pop;
		document.body.appendChild(pop);

		var rect = anchor.getBoundingClientRect();
		pop.style.top = Math.round(rect.bottom + 8) + "px";
		pop.style.left = Math.round(clamp(rect.left - 110, 10, window.innerWidth - 280)) + "px";

		closeOnOutsideClick();
	}

	/* Offered, never demanded: it closes itself, and whatever it was offered
	   for is already pinned to the default shelf by then. */
	function openPinPicker(anchor, itemId) {
		closePop();

		var pop = make("div", { class: "aur-pop aur-pin-pop" }, [make("div", { class: "aur-pop-label", text: "Move to shelf" })]);

		pinGroups().forEach(function (group) {
			var choice = make("button", { class: "aur-pin-choice", type: "button" }, [
				iconNode(group.icon || "star"),
				make("span", { text: group.label }),
			]);
			choice.addEventListener("click", function (event) {
				event.stopPropagation();
				movePin(itemId, group.id);
				closePop();
				setCounts();
				if (megaOpen() && state.activeTab === "pinned" && !state.searching) renderGroups("pinned");
			});
			pop.appendChild(choice);
		});

		pop.appendChild(make("div", { class: "aur-pin-hint", text: "Ignore this and it stays in Pinned." }));

		el.pop = pop;
		document.body.appendChild(pop);

		var rect = anchor.getBoundingClientRect();
		pop.style.top = Math.round(rect.bottom + 8) + "px";
		pop.style.left = Math.round(clamp(rect.left - 100, 10, window.innerWidth - 240)) + "px";

		state.pinPopTimer = setTimeout(closePop, 4500);

		closeOnOutsideClick();
	}

	function renderSearch(query) {
		var needle = query.trim().toLowerCase();
		if (!needle) {
			state.searching = false;
			openTab(state.activeTab || "workspaces");
			return;
		}

		state.searching = true;
		state.cursor = -1;
		state.activeNode = null;

		var terms = needle.split(/\s+/);
		var hits = state.index
			.filter(function (item) {
				return terms.every(function (term) {
					return item.search.indexOf(term) !== -1;
				});
			})
			.slice(0, 120);

		el.groups.innerHTML = "";
		el.groups.appendChild(
			make("div", { class: "aur-mega-title", text: hits.length + " match" + (hits.length === 1 ? "" : "es") })
		);

		renderItems('Results for "' + query.trim() + '"', hits, { empty: "No match. Try fewer words." });
		openMega();
	}

	/* ---------------------------------------------------------------------
	   Mega panel
	   ------------------------------------------------------------------ */

	function positionMega() {
		if (!el.bar || !el.mega) return;

		var rect = el.bar.getBoundingClientRect();
		var top = Math.round(rect.bottom + 6);

		el.mega.style.top = top + "px";
		el.mega.style.left = Math.round(rect.left + 8) + "px";
		el.mega.style.width = Math.max(320, Math.round(rect.width - 16)) + "px";

		// A max-height in viewport units takes no account of how far down the
		// panel starts, so it could hang past the bottom of the screen with the
		// overflow unreachable: the panel is fixed, so the page will not scroll
		// to it and the inner columns believe they have room to spare.
		el.mega.style.maxHeight = Math.max(240, window.innerHeight - top - 16) + "px";
	}

	function megaOpen() {
		return el.mega && el.mega.classList.contains("aur-visible");
	}

	/* The scrim starts below the bar rather than covering it. Dimming the bar
	   hid the very thing that says which menu is open, and starting the scrim
	   lower is safe regardless of what stacking contexts the desk creates
	   around the bar. */
	function positionScrim() {
		if (!el.scrim || !el.bar) return;
		el.scrim.style.top = Math.max(0, Math.round(el.bar.getBoundingClientRect().bottom)) + "px";
	}

	function openMega() {
		el.mega.classList.add("aur-visible");
		positionMega();
		if (el.bar) el.bar.classList.add("aur-bar-lifted");

		if (!el.scrim) {
			el.scrim = make("div", { class: "aur-scrim" });
			el.scrim.addEventListener("click", closeMega);
			document.body.appendChild(el.scrim);
		}

		positionScrim();

		/* The keyboard needs somewhere to live while the panel is open. Focus
		   rests in the filter field and the selection is painted onto a row, so
		   typing and the arrows are both live from the moment it appears. */
		if (el.megaSearch) el.megaSearch.focus({ preventScroll: true });
	}

	function closeMega() {
		if (!el.mega) return;
		clearTimeout(hover.timer);
		clearTimeout(hover.tabTimer);
		hideHints();
		setCursor(null);
		el.mega.classList.remove("aur-visible");
		if (el.bar) el.bar.classList.remove("aur-bar-lifted");
		state.searching = false;
		state.cursor = -1;
		state.megaQuery = "";
		state.manageShelves = false;
		state.openCols = {};
		if (el.megaSearch) el.megaSearch.value = "";
		if (el.filterBar) el.filterBar.classList.remove("aur-on");

		Object.keys(el.tabNodes || {}).forEach(function (id) {
			el.tabNodes[id].classList.remove("aur-open");
		});

		if (el.scrim) {
			el.scrim.remove();
			el.scrim = null;
		}
		if (el.navBtns) paintNavActive();
	}

	function openTab(tabId) {
		if (state.activeTab !== tabId) state.openCols = {};
		state.activeTab = tabId;
		state.searching = false;

		Object.keys(el.tabNodes).forEach(function (id) {
			el.tabNodes[id].classList.toggle("aur-open", id === tabId);
		});

		renderGroups(tabId);
		openMega();
	}

	function toggleTab(tabId) {
		if (megaOpen() && state.activeTab === tabId && !state.searching) closeMega();
		else openTab(tabId);
	}

	/* ---------------------------------------------------------------------
	   Keyboard
	   ------------------------------------------------------------------ */

	/* Focus stays in the filter field for as long as the panel is open and the
	   selection is drawn on a row instead of being held by it. That is what lets
	   typing and the arrows work at the same moment without a mode to switch
	   between: the letters still narrow the list while the arrows walk it. The
	   field carries aria-activedescendant, which is how a screen reader is told
	   which row is current. */

	var rowSeq = 0;

	// Rows the keyboard can land on. "+N more" counts as one: arriving at the
	// foot of a capped group and pressing Enter is how the rest of it opens.
	function navRows() {
		if (!el.body) return [];
		return Array.prototype.slice.call(el.body.querySelectorAll(".aur-item, .aur-col-more"));
	}

	function cursorRow() {
		return el.body ? el.body.querySelector(".aur-cursor") : null;
	}

	function setCursor(row, scroll) {
		var previous = cursorRow();
		if (previous) previous.classList.remove("aur-cursor");

		if (!row) {
			if (el.megaSearch) el.megaSearch.removeAttribute("aria-activedescendant");
			return;
		}

		if (!row.id) row.id = "aur-row-" + ++rowSeq;
		row.classList.add("aur-cursor");
		if (el.megaSearch) el.megaSearch.setAttribute("aria-activedescendant", row.id);
		if (scroll !== false) row.scrollIntoView({ block: "nearest", inline: "nearest" });
	}

	/* Every render ends here, so the first row is always armed: Enter has an
	   obvious target from the moment the panel opens, and the panel reads as
	   ready for the keyboard rather than waiting to be aimed at. */
	function armCursor() {
		setCursor(navRows()[0] || null, false);
		if (state.hints) paintHints();
	}

	/* Both layouts are two-dimensional and ragged — a filled grid in one, lanes
	   of unequal height in the other — so a direction key cannot be index
	   arithmetic over the DOM. Take the nearest row that genuinely lies the way
	   the key points, preferring the ones squarely in line with this one. */
	function stepCursor(dir) {
		var rows = navRows();
		if (!rows.length) return;

		var current = cursorRow();
		if (!current) return setCursor(rows[0]);

		var from = current.getBoundingClientRect();
		var cx = from.left + from.width / 2;
		var cy = from.top + from.height / 2;

		var best = null;
		var bestScore = Infinity;

		rows.forEach(function (row) {
			if (row === current) return;

			var box = row.getBoundingClientRect();
			var dx = box.left + box.width / 2 - cx;
			var dy = box.top + box.height / 2 - cy;

			var along = dir === "down" ? dy : dir === "up" ? -dy : dir === "right" ? dx : -dx;
			if (along < 4) return;

			// Drift sideways costs more than distance travelled, which keeps a
			// run of Down presses inside one column instead of wandering.
			var across = dir === "up" || dir === "down" ? Math.abs(dx) : Math.abs(dy);
			var score = along + across * 2.6;
			if (score < bestScore) {
				bestScore = score;
				best = row;
			}
		});

		/* Nothing that way. Running off the side of a row continues along the
		   reading order, which is what the eye does anyway; running off the top
		   or bottom stays put rather than jumping the width of the panel. */
		if (!best && (dir === "left" || dir === "right")) {
			best = rows[rows.indexOf(current) + (dir === "right" ? 1 : -1)];
		}

		if (best) setCursor(best);
	}

	/* Tab moves by subject rather than by control while the panel is open: one
	   press per group, which is the unit both layouts are organised around. */
	function stepGroup(delta) {
		if (currentLayout() === "columns") {
			var cols = Array.prototype.slice.call(el.body.querySelectorAll(".aur-col"));
			if (!cols.length) return;

			var current = cursorRow();
			var owner = current && current.closest ? current.closest(".aur-col") : null;
			var at = owner ? cols.indexOf(owner) : -1;
			var next = cols[(at + delta + cols.length) % cols.length] || cols[0];

			// Bring the heading into view as well, so the group being entered
			// announces itself instead of the cursor arriving somewhere unnamed.
			var head = next.querySelector(".aur-col-head");
			if (head) head.scrollIntoView({ block: "nearest" });
			setCursor(next.querySelector(".aur-item, .aur-col-more"));
			return;
		}

		var groups = state.groups || [];
		if (groups.length < 2) return;

		var keys = groups.map(function (group) {
			return group.key;
		});
		var index = keys.indexOf(state.activeKey);
		if (index < 0) index = 0;

		selectGroup(state.activeTab, keys[(index + delta + keys.length) % keys.length]);
		if (state.activeNode) state.activeNode.scrollIntoView({ block: "nearest" });
	}

	// A whole subject at a time, and the standing filter is deliberately kept:
	// clicking a tab already behaves that way.
	function stepTab(delta) {
		var ids = Object.keys(el.tabNodes || {});
		if (ids.length < 2) return;

		var index = ids.indexOf(state.activeTab);
		if (index < 0) index = 0;
		openTab(ids[(index + delta + ids.length) % ids.length]);
	}

	// A screenful, then land on whatever is now at the top edge.
	function pageCursor(delta) {
		if (!el.body) return;
		el.body.scrollTop += delta * Math.max(120, el.body.clientHeight * 0.85);

		var frame = el.body.getBoundingClientRect();
		var landed = null;
		navRows().some(function (row) {
			var box = row.getBoundingClientRect();
			if (box.bottom > frame.top + 4 && box.top < frame.bottom - 4) {
				landed = row;
				return delta > 0;
			}
			return false;
		});

		// Scrolled to, not merely marked: the row at the edge is usually half cut
		// off by the jump, and a selection you cannot fully see is no selection.
		if (landed) setCursor(landed);
	}

	function openCursor(newTab) {
		var row = cursorRow();
		if (!row) return;

		if (newTab) {
			var href = row.getAttribute("href");
			if (href) {
				openInNewTab(href);
				return;
			}
		}
		row.click();
	}

	/* Prefer window.open so we keep a handle and can move the user to the new
	   tab. noopener would null that handle, so opener is cleared by hand instead.
	   An in-DOM link is the fallback when the browser blocks the popup. */
	function openInNewTab(href) {
		var abs = new URL(href, window.location.origin).href;
		var win = window.open(abs, "_blank");
		if (win) {
			try {
				win.opener = null;
			} catch (e) {}
			try {
				win.focus();
			} catch (e) {}
			return;
		}

		var a = document.createElement("a");
		a.href = abs;
		a.target = "_blank";
		a.rel = "noopener noreferrer";
		document.body.appendChild(a);
		a.click();
		a.remove();
	}

	/* ---------------------------------------------------------------------
	   Tap-Alt shortcuts
	   ---------------------------------------------------------------------
	   Bare letters have to go on filtering: Modules alone carries over five
	   hundred entries and narrowing is the only way through a list that long. So
	   the direct shortcuts sit on Alt, where this theme already keeps Alt+1..9
	   for pinned entries.

	   Tap Alt once — the badges stay. Press the letter(s) shown. Tap Alt again
	   or Esc to put them away. Holding Alt while pressing a letter still works;
	   releasing Alt no longer clears the badges (that used to look broken).

	   The letters come from the rows' own names, so S really is Sales Invoice.
	   Rows sharing an initial take a second letter from their next word, giving
	   SI for Sales Invoice against SO for Sales Order. A row whose initial is
	   unique keeps the bare letter, and since no other row can then begin with
	   it, nothing is ever ambiguous. Only rows on screen are lettered, so the
	   alphabet never runs out however long the list underneath is.
	   ------------------------------------------------------------------ */

	var HINT_POOL = "asdfghjklqwertyuiopzxcvbnm".split("");

	function plainLetters(text) {
		return String(text || "")
			.toLowerCase()
			.replace(/[^a-z ]+/g, " ")
			.replace(/\s+/g, " ")
			.trim();
	}

	function rowLabel(row) {
		var label = row.querySelector(".aur-item-label");
		return plainLetters(label ? label.textContent : row.textContent);
	}

	// Second characters worth remembering: the initials of the following words
	// first, then the row's own remaining letters, then whatever is still free.
	function tiebreaks(text) {
		var words = text.split(" ").filter(Boolean);
		var initials = words.slice(1).map(function (word) {
			return word.charAt(0);
		});
		return initials.concat(text.replace(/ /g, "").split(""), HINT_POOL);
	}

	function assignHints(rows) {
		var byInitial = {};
		var order = [];

		rows.forEach(function (row) {
			var text = rowLabel(row);
			var initial = text.charAt(0);
			if (!/^[a-z]$/.test(initial)) initial = "";
			if (!byInitial[initial]) {
				byInitial[initial] = [];
				order.push(initial);
			}
			byInitial[initial].push({ row: row, text: text });
		});

		var taken = {};
		var map = [];
		var spare = [];

		// Singles first: that is what guarantees a bare letter is never also the
		// start of a longer one.
		order.forEach(function (initial) {
			if (!initial || byInitial[initial].length !== 1) return;
			taken[initial] = true;
			map.push({ row: byInitial[initial][0].row, hint: initial });
		});

		order.forEach(function (initial) {
			var group = byInitial[initial];
			if (!initial || group.length < 2) return;

			// Spoken for as a prefix now, so the fallback below cannot hand the
			// bare letter to some other row.
			taken[initial] = true;

			var used = {};
			group.forEach(function (entry) {
				var pick = null;
				tiebreaks(entry.text).some(function (candidate) {
					if (!/^[a-z]$/.test(candidate) || used[candidate]) return false;
					pick = candidate;
					return true;
				});

				if (!pick) return spare.push(entry);
				used[pick] = true;
				map.push({ row: entry.row, hint: initial + pick });
			});
		});

		// Rows that could not use their own name: no letters in it, or an
		// initial with nothing left to pair it with.
		(byInitial[""] || []).concat(spare).forEach(function (entry) {
			var free = null;
			HINT_POOL.some(function (candidate) {
				if (taken[candidate]) return false;
				free = candidate;
				return true;
			});
			if (!free) return;
			taken[free] = true;
			map.push({ row: entry.row, hint: free });
		});

		return map;
	}

	function onScreen(row) {
		var frame = el.body.getBoundingClientRect();
		var box = row.getBoundingClientRect();
		return box.bottom > frame.top + 2 && box.top < frame.bottom - 2;
	}

	function clearHints() {
		(state.hints || []).forEach(function (entry) {
			if (entry.badge && entry.badge.parentNode) entry.badge.parentNode.removeChild(entry.badge);
			entry.row.classList.remove("aur-hinted", "aur-hint-dim");
		});
		state.hints = null;
	}

	function paintPrefix() {
		var prefix = state.hintPrefix || "";

		(state.hints || []).forEach(function (entry) {
			var match = !prefix || entry.hint.indexOf(prefix) === 0;
			entry.row.classList.toggle("aur-hint-dim", !match);
			// Once a prefix is down, the badge shows only what is left to press.
			entry.badge.textContent = (match ? entry.hint.slice(prefix.length) : entry.hint).toUpperCase();
			entry.badge.classList.toggle("aur-hint-live", !!prefix && match);
		});

		if (el.footLive) el.footLive.textContent = prefix ? prefix.toUpperCase() + "\u2026" : "";
	}

	function paintHints() {
		clearHints();
		if (!megaOpen() || !el.body) return;

		var rows = navRows().filter(onScreen);
		if (!rows.length) return;

		state.hints = assignHints(rows);
		state.hints.forEach(function (entry) {
			entry.badge = make("span", { class: "aur-hint", "aria-hidden": "true" });
			entry.row.appendChild(entry.badge);
			entry.row.classList.add("aur-hinted");
		});

		paintPrefix();
	}

	function showHints() {
		if (state.hints || !megaOpen()) return;
		state.hintPrefix = "";
		paintHints();
		if (el.mega) el.mega.classList.add("aur-hints-on");
	}

	function hideHints() {
		state.hintPrefix = "";
		clearHints();
		if (el.mega) el.mega.classList.remove("aur-hints-on");
		if (el.footLive) el.footLive.textContent = "";
	}

	/* The physical key, not the character: on macOS Alt is Option, so Option+A
	   arrives as "å" and event.key cannot be matched against a badge. */
	function codeLetter(event) {
		return /^Key[A-Z]$/.test(event.code || "") ? event.code.charAt(3).toLowerCase() : "";
	}

	function codeDigit(event) {
		return /^Digit[1-9]$/.test(event.code || "") ? event.code.charAt(5) : "";
	}

	function fireHint(letter) {
		var wanted = state.hintPrefix + letter;

		var exact = (state.hints || []).filter(function (entry) {
			return entry.hint === wanted;
		})[0];
		if (exact) {
			var row = exact.row;
			hideHints();
			row.click();
			return true;
		}

		// Not a whole label yet, but the start of one: hold the prefix and let
		// the badges narrow to the rows still in play.
		var deeper = (state.hints || []).some(function (entry) {
			return entry.hint.indexOf(wanted) === 0;
		});
		if (deeper) {
			state.hintPrefix = wanted;
			paintPrefix();
			return true;
		}

		return false;
	}

	// The badges stay after Alt is released (sticky). A key that answers to
	// nothing is the sign that the reader has moved on, so it puts them away
	// and types instead of vanishing.
	function typeIntoFilter(letter) {
		if (!el.megaSearch) return;
		el.megaSearch.focus();
		el.megaSearch.value += letter;
		el.megaSearch.dispatchEvent(new Event("input", { bubbles: true }));
	}

	function bindKeys() {
		document.addEventListener("keydown", function (event) {
			var tag = (event.target.tagName || "").toLowerCase();
			var typing = tag === "input" || tag === "textarea" || tag === "select" || event.target.isContentEditable;

			// Alt+1..9 jumps straight to a pinned entry. Read off the physical
			// key, because macOS turns Option+1 into "\u00a1".
			if (event.altKey && codeDigit(event)) {
				var pinned = pins()[Number(codeDigit(event)) - 1];
				if (pinned) {
					event.preventDefault();
					runItem(pinned);
				}
				return;
			}

			// Cmd/Ctrl+K belongs to the desk's own awesomebar. Bare / and
			// Cmd/Ctrl+/ open this menu immediately so there is something to
			// type into, rather than waiting for the first character of a jump.
			if (((event.metaKey || event.ctrlKey) && event.key === "/") || (event.key === "/" && !typing)) {
				event.preventDefault();
				openQuickMenu();
				return;
			}

			/* Bubble phase, and deliberately no stopPropagation: the desk's own
			   dialogs, grid cells and quick entry must keep seeing Escape. Only
			   this theme's overlays are closed here, and the palette is closed
			   in one press instead of two only when nothing of ours was open. */
			if (event.key === "Escape") {
				var closed = false;
				// The shortcut badges come off first: they are an overlay on the
				// panel, so dismissing them should not take the panel with them.
				if (state.hints) {
					hideHints();
					return;
				}
				if (el.selectPop) {
					closeSelect();
					closed = true;
				}
				if (nav.drop) {
					closeNavDrop();
					closed = true;
				}
				if (el.pop) {
					closePop();
					closed = true;
				}
				if (megaOpen()) {
					closeMega();
					closed = true;
				}

				if (!closed) {
					try {
						var bar = window.frappe && frappe.app && frappe.app.awesome_bar;
						if (bar && bar.is_open && bar.is_open()) bar.close();
					} catch (e) {}
				}
				return;
			}

			if (!megaOpen()) return;

			/* The panel's own field holds focus while it is open, so "typing" is
			   true for nearly every key that reaches here. What must be left
			   alone is any other field — a shelf being renamed — where the
			   arrows and Tab have to keep their ordinary meaning. */
			var mine = !typing || event.target === el.megaSearch || event.target === el.search;
			if (!mine) return;

			/* Tap Alt once: badges stay until a letter fires, Esc, or Alt again.
			   Holding Alt while typing a letter also works, but releasing Alt no
			   longer puts the badges away — that was the trap that made them look
			   broken on a Mac keyboard. */
			if (event.key === "Alt" && !event.repeat) {
				event.preventDefault();
				if (state.hints) hideHints();
				else showHints();
				return;
			}

			if (state.hints || event.altKey) {
				var letter = codeLetter(event);
				if (letter) {
					// Always swallowed, or macOS would post a diacritic into the
					// filter field behind the badges.
					event.preventDefault();
					if (!state.hints) showHints();
					if (!fireHint(letter)) {
						hideHints();
						typeIntoFilter(letter);
					}
					return;
				}
			}

			// Typing straight into an open menu filters it, without having to aim
			// for the field first.
			if (
				!typing &&
				el.megaSearch &&
				event.key.length === 1 &&
				!event.metaKey &&
				!event.ctrlKey &&
				!event.altKey
			) {
				el.megaSearch.focus();
				return;
			}

			// Ctrl/Cmd with a horizontal arrow changes the whole subject, so the
			// plain arrows are free to walk the rows.
			if ((event.metaKey || event.ctrlKey) && (event.key === "ArrowRight" || event.key === "ArrowLeft")) {
				event.preventDefault();
				stepTab(event.key === "ArrowRight" ? 1 : -1);
				return;
			}

			var DIRS = { ArrowDown: "down", ArrowUp: "up", ArrowRight: "right", ArrowLeft: "left" };
			if (DIRS[event.key]) {
				/* Horizontal keys are shared with the caret, or a typo in the
				   filter could not be reached without the mouse. The caret gets
				   them while it still has somewhere to go; at either end of the
				   text they pass to the rows. */
				if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
					var field = event.target === el.megaSearch ? el.megaSearch : null;
					var at = field ? field.selectionStart : null;
					var spread = field && field.selectionStart !== field.selectionEnd;
					if (field && (spread || (event.key === "ArrowLeft" ? at > 0 : at < field.value.length))) return;
				}

				event.preventDefault();
				stepCursor(DIRS[event.key]);
				return;
			}

			if (event.key === "Tab") {
				event.preventDefault();
				stepGroup(event.shiftKey ? -1 : 1);
				return;
			}

			if (event.key === "Home" || event.key === "End") {
				var rows = navRows();
				if (!rows.length) return;
				event.preventDefault();
				setCursor(event.key === "Home" ? rows[0] : rows[rows.length - 1]);
				return;
			}

			if (event.key === "PageDown" || event.key === "PageUp") {
				event.preventDefault();
				pageCursor(event.key === "PageDown" ? 1 : -1);
				return;
			}

			if (event.key === "Enter" || event.code === "Enter" || event.key === "NumpadEnter") {
				event.preventDefault();
				// Stop other desk handlers from eating Cmd/Ctrl+Enter (which is
				// otherwise a common "submit" chord) before we open the new tab.
				if (event.metaKey || event.ctrlKey) event.stopPropagation();
				openCursor(event.metaKey || event.ctrlKey);
			}
		}, true);

		// Alt+Tab out of the window leaves no keyup behind.
		window.addEventListener("blur", function () {
			if (state.hints) hideHints();
		});
	}

	/* Open the mega menu ready for typing. Used by / so the panel is on screen
	   before the first character of the filter, not after it. */
	function openQuickMenu() {
		if (!megaOpen()) openTab(state.activeTab || "workspaces");
		if (el.megaSearch) {
			el.megaSearch.focus();
			el.megaSearch.select();
		}
	}

	/* ---------------------------------------------------------------------
	   Settings popover
	   ------------------------------------------------------------------ */

	function closePop() {
		clearTimeout(state.pinPopTimer);
		el.popPlace = null;
		el.paintAppearanceSeg = null;
		if (el.pop) {
			el.pop.remove();
			el.pop = null;
		}
	}

	/* Which control the panel hangs from, as something that survives the bar
	   being rebuilt. Every shell carries the same theme button and the same
	   brand pill, so the class is enough to find the new one. */
	var SETTINGS_ANCHORS = [".aur-theme-btn", ".knav-brand", ".aur-brand"];

	function anchorKey(node) {
		if (!node || !node.classList) return "";
		for (var i = 0; i < SETTINGS_ANCHORS.length; i += 1) {
			if (node.classList.contains(SETTINGS_ANCHORS[i].slice(1))) return SETTINGS_ANCHORS[i];
		}
		return "";
	}

	function settingsAnchor(prefer) {
		var order = prefer ? [prefer].concat(SETTINGS_ANCHORS) : SETTINGS_ANCHORS;
		for (var i = 0; i < order.length; i += 1) {
			var found = document.querySelector(order[i]);
			if (found) return found;
		}
		return null;
	}

	function reopenSettings() {
		/* Switching shell rebuilds the bar and its settings button, which closes
		   any open panel. When the switch came from inside the panel, open a
		   fresh one so the choices never disappear mid-change — and open it on
		   the same control it was hanging from. Reaching for the brand pill
		   instead threw the panel from the right of the bar to the left on every
		   content switch, which reads as the panel running away from the cursor.

		   Deferred a tick so the click that triggered the switch finishes
		   bubbling first: the old outside-click listener then sees the panel
		   already gone and retires itself, rather than shutting the freshly
		   opened one. */
		var want = state.popAnchor;
		setTimeout(function () {
			if (el.pop) return;
			var anchor = settingsAnchor(want);
			if (anchor) openSettings(anchor);
		}, 0);
	}

	/* Every popover closes when a click lands outside it, and contains() alone
	   cannot tell where a click landed: a handler that redraws its own section —
	   a theme card, a colour swatch — detaches the very node that was clicked
	   before this listener runs, which read as a click on the outside world and
	   shut the panel on the first choice made in it. The event path is fixed at
	   dispatch, so it still remembers the panel the click came from. */
	function closeOnOutsideClick() {
		setTimeout(function () {
			document.addEventListener("click", function once(event) {
				if (!el.pop) return document.removeEventListener("click", once);

				var path = typeof event.composedPath === "function" ? event.composedPath() : [];
				if (path.indexOf(el.pop) >= 0 || el.pop.contains(event.target)) return;

				closePop();
				document.removeEventListener("click", once);
			});
		}, 0);
	}

	/* All three appearances on screen at once, one click each: no modal, and no
	   cycling through a state you did not want to stop on. */
	function appearanceSeg() {
		var seg = make("div", { class: "aur-seg aur-appearance-seg", role: "radiogroup", "aria-label": "Appearance" });
		var buttons = {};

		el.paintAppearanceSeg = function () {
			var current = currentAppearance();
			APPEARANCES.forEach(function (item) {
				var on = item.id === current;
				buttons[item.id].classList.toggle("aur-on", on);
				buttons[item.id].setAttribute("aria-checked", on ? "true" : "false");
			});
		};

		APPEARANCES.forEach(function (item) {
			var button = make("button", { type: "button", role: "radio", title: item.label }, [
				make("span", { class: "aur-appearance-glyph", text: item.glyph }),
				make("span", { text: item.label }),
			]);
			button.addEventListener("click", function () {
				if (item.id !== currentAppearance()) setAppearance(item.id);
			});
			buttons[item.id] = button;
			seg.appendChild(button);
		});

		el.paintAppearanceSeg();
		return seg;
	}

	function openSettings(anchor) {
		if (el.pop) return closePop();
		state.popAnchor = anchorKey(anchor) || state.popAnchor;

		// The tone row belongs to the chosen theme, so both are rebuilt together
		// and the row simply disappears for a theme that offers no tones.
		var tones = make("div", { class: "aur-swatches" });
		var toneLabel = make("div", { class: "aur-pop-label", text: "Colour" });
		var toneRow = make("div", { class: "aur-pop-row" }, [tones]);
		var editor = make("div", { class: "aur-mixer" });
		var skins = make("div", { class: "aur-skins" });

		var density = make("div", { class: "aur-seg" });
		var densityLabel = make("div", { class: "aur-pop-label", text: "Density" });
		var densityRow = make("div", { class: "aur-pop-row" }, [density]);

		var renderTones = function () {
			var offered = tonesFor(currentSkin());
			var active = currentAccent();

			toneLabel.hidden = toneRow.hidden = !offered.length;
			tones.innerHTML = "";
			if (!offered.length) return;

			offered.forEach(function (tone) {
				var dot = make("button", {
					class: "aur-swatch" + (active === tone.id ? " aur-on" : "") + (tone.custom ? " aur-swatch-own" : ""),
					type: "button",
					title: tone.custom ? tone.label + " — right-click to remove" : tone.label,
					style: "background:" + tone.swatch,
				});
				dot.addEventListener("click", function () {
					setAccent(tone.id);
					renderTones();
				});
				if (tone.custom) {
					dot.addEventListener("contextmenu", function (event) {
						event.preventDefault();
						removePalette(tone.id);
						renderTones();
					});
				}
				tones.appendChild(dot);
			});

			var add = make("button", { class: "aur-swatch aur-swatch-add", type: "button", title: "Mix a colour", text: "+" });
			add.addEventListener("click", function () {
				editor.classList.toggle("aur-open");
			});
			tones.appendChild(add);
		};

		var renderSkins = function () {
			var active = currentSkin();
			skins.innerHTML = "";

			SKINS.forEach(function (skin) {
				var card = make("button", { class: "aur-skin" + (active === skin.id ? " aur-on" : ""), type: "button", title: skin.note }, [
					make("span", { class: "aur-skin-swatch", style: "background:" + skin.swatch }),
					make("span", { class: "aur-skin-name", text: skin.label }),
					make("span", { class: "aur-skin-note", text: skin.note }),
				]);
				card.addEventListener("click", function () {
					setSkin(skin.id);
					renderSkins();
					renderTones();
				});
				skins.appendChild(card);
			});
		};

		// Three stops, because that is what --aur-grad reads: the middle one is
		// also the flat accent used for focus rings and primary fills.
		var seeds = ["#8b7cf7", "#a78bfa", "#fde68a"];
		var pickers = seeds.map(function (seed) {
			return make("input", { class: "aur-mixer-dot", type: "color", value: seed, "aria-label": "Gradient colour" });
		});
		var name = make("input", { class: "aur-mixer-name", type: "text", placeholder: "Name this colour", maxlength: "24" });
		var save = make("button", { class: "aur-mixer-save", type: "button", text: "Add to palette" });

		save.addEventListener("click", function () {
			var stops = pickers.map(function (picker) {
				return picker.value;
			});
			setAccent(addPalette(stops, name.value.trim() || "Custom"));
			name.value = "";
			editor.classList.remove("aur-open");
			renderTones();
		});

		editor.appendChild(make("div", { class: "aur-mixer-dots" }, pickers));
		editor.appendChild(make("div", { class: "aur-mixer-foot" }, [name, save]));

		renderSkins();
		renderTones();

		DENSITIES.forEach(function (option) {
			var button = make("button", { class: currentDensity() === option.id ? "aur-on" : "", type: "button", text: option.label });
			button.addEventListener("click", function () {
				setDensity(option.id);
				Array.prototype.forEach.call(density.children, function (node) {
					node.classList.remove("aur-on");
				});
				button.classList.add("aur-on");
			});
			density.appendChild(button);
		});

		/* The look of a module view: "Standard" opens a module as a dropdown,
		   "Workspace grid" as the launcher. This is offered only for a custom
		   content profile — the default bar and the command bar don't use it — so
		   the label and row are hidden until such a profile is chosen. */
		var lookSeg = make("div", { class: "aur-seg" });
		function renderLookSeg() {
			lookSeg.textContent = "";
			NAV_VIEWS.forEach(function (option) {
				var label = option.id === "dropdown" ? "Standard" : "Workspace grid";
				var button = make("button", {
					class: currentNavView() === option.id ? "aur-on" : "",
					type: "button",
					title: option.note,
					text: label,
				});
				button.addEventListener("click", function () {
					setNavView(option.id);
					Array.prototype.forEach.call(lookSeg.children, function (node) {
						node.classList.remove("aur-on");
					});
					button.classList.add("aur-on");
				});
				lookSeg.appendChild(button);
			});
		}
		renderLookSeg();
		var lookLabel = make("div", { class: "aur-pop-label", text: "Look" });
		var lookRow = make("div", { class: "aur-pop-row" }, [lookSeg]);

		var refresh = make("div", { class: "aur-seg" });
		var refreshBtn = make("button", { type: "button", text: "Rebuild menu cache" });
		refreshBtn.addEventListener("click", function () {
			loadMenu(1);
			loadShellNav(1);
			closePop();
		});
		refresh.appendChild(refreshBtn);

		// Only someone who can edit the records is shown the way into them.
		var customise = null;
		if (canWrite("Kaiten Nav Menu")) {
			customise = make("div", { class: "aur-seg" });
			var customiseBtn = make("button", {
				type: "button",
				title: "Build the bar for this business: rename menus, regroup links, set who sees what",
				text: "Customise menu\u2026",
			});
			customiseBtn.addEventListener("click", function () {
				closePop();
				openNavBuilder();
			});
			customise.appendChild(customiseBtn);
		}

		// Content is *what* the bar shows, offered as cards the way the shells
		// were: "Command bar", the default "Module nav" (every unconfigured menu),
		// and one card per Active profile (that profile's menus only). Painted
		// from the cached list first, then refreshed once the server answers.
		var contentCards = make("div", { class: "aur-shells aur-content-cards" });

		function currentContentCard() {
			if (currentShell() === "command") return "command";
			return currentContent();
		}

		function isCustomContent() {
			return currentShell() === "module" && currentContent() !== "standard";
		}

		function updateLook() {
			// The look (Standard vs Workspace grid) belongs to any Kaiten-menu
			// content — Module nav and every custom profile alike — so it shows
			// for the whole module shell and hides only for the command bar.
			var show = currentShell() === "module";
			lookLabel.style.display = show ? "" : "none";
			lookRow.style.display = show ? "" : "none";
			renderLookSeg();
		}

		function selectContentCard(id) {
			if (id === currentContentCard()) return;
			var wasOpen = Boolean(el.pop);
			if (id === "command") {
				// Content only: keep Theme, Colour, Look, density as they are.
				setShell("command");
				if (wasOpen) reopenSettings();
				return;
			}
			// Module nav or a named profile — swap which menus load, never the
			// paint. Look (Standard / Workspace grid) stays on KEY.navView.
			localStorage.setItem(KEY.content, id);
			schedulePush();
			if (currentShell() !== "module") {
				setShell("module");
				if (wasOpen) reopenSettings();
				return;
			}
			applyPrefs();
			loadShellNav(1);
			renderContentCards();
			updateLook();
		}

		function renderContentCards() {
			contentCards.textContent = "";
			var options = [
				{ name: "command", label: "Command bar", note: "Tabs, mega menu, jump", shell: "command" },
				{ name: "standard", label: "Module nav", note: "Default menus", shell: "module" },
			];
			contentConfigs.forEach(function (config) {
				options.push({ name: config.name, label: config.label, note: "Custom profile", shell: "module" });
			});
			var current = currentContentCard();
			options.forEach(function (option) {
				var card = make(
					"button",
					{ class: "aur-skin aur-shell" + (option.name === current ? " aur-on" : ""), type: "button", title: option.note },
					[
						shellPreview(option.shell),
						make("span", { class: "aur-skin-name", text: option.label }),
						make("span", { class: "aur-skin-note", text: option.note }),
					]
				);
				card.addEventListener("click", function () {
					selectContentCard(option.name);
				});
				contentCards.appendChild(card);
			});
		}
		renderContentCards();
		updateLook();
		loadMenuConfigs(function () {
			if (el.pop) {
				renderContentCards();
				updateLook();
			}
		});

		el.pop = make("div", { class: "aur-pop" }, [
			make("div", { class: "aur-pop-label", text: "Appearance" }),
			make("div", { class: "aur-pop-row" }, [appearanceSeg()]),

			// Content is *what* the bar shows: the command bar, the default module
			// nav, or one of the Active custom profiles.
			make("div", { class: "aur-pop-label", text: "Content" }),
			make("div", { class: "aur-pop-row" }, [contentCards]),

			// Theme is *how* it is painted: the colour skins carried from before.
			make("div", { class: "aur-pop-label", text: "Theme" }),
			make("div", { class: "aur-pop-row" }, [skins]),
			toneLabel,
			toneRow,
			editor,

			// Look sits directly below the theme and only for a custom profile —
			// updateLook() hides it otherwise.
			lookLabel,
			lookRow,

			densityLabel,
			densityRow,

			// Editing and cache actions live at the foot, out of the way of the
			// everyday content and theme choices above.
			make("div", { class: "aur-pop-label", text: "Menu" }),
			make("div", { class: "aur-pop-row" }, [refresh]),
			customise ? make("div", { class: "aur-pop-row" }, [customise]) : null,
		].filter(Boolean));

		document.body.appendChild(el.pop);

		/* This panel is where the theme, the colour and the density are changed,
		   and each of those resizes the document — which used to close it after
		   a single click. It follows its anchor instead, so a look can be tried
		   on, adjusted and compared without reopening anything. */
		el.popPlace = function () {
			// Switching between two profiles of the same shell redraws the bar
			// without closing the panel, which leaves this holding a node that is
			// no longer in the document — and a detached node measures as zero,
			// which would slide the panel into the top-left corner on the next
			// resize. Take the replacement instead.
			if (!anchor.isConnected) {
				var again = settingsAnchor(state.popAnchor);
				if (!again) return;
				anchor = again;
			}
			var box = anchor.getBoundingClientRect();
			if (isNarrow()) {
				el.pop.classList.add("is-sheet");
				el.pop.style.top = Math.max(Math.round(box.bottom) + 8, chromeBottom() + 8) + "px";
				el.pop.style.left = "8px";
				el.pop.style.right = "8px";
				el.pop.style.width = "auto";
				el.pop.style.maxHeight = Math.max(220, window.innerHeight - chromeBottom() - 24) + "px";
				return;
			}
			el.pop.classList.remove("is-sheet");
			el.pop.style.right = "";
			el.pop.style.width = "";
			var width = el.pop.offsetWidth || 300;
			var top = Math.round(box.bottom + 8);
			el.pop.style.top = top + "px";
			el.pop.style.left = Math.round(clamp(box.right - width, 10, window.innerWidth - width - 10)) + "px";
			// The panel now carries content, look, theme and more, so on a short
			// screen it would run off the bottom. Cap it to the space below the
			// bar and let it scroll rather than hide its last rows.
			el.pop.style.maxHeight = Math.max(220, window.innerHeight - top - 12) + "px";
			el.pop.style.overflowY = "auto";
		};
		el.popPlace();

		closeOnOutsideClick();
	}

	/* ---------------------------------------------------------------------
	   Escaping clipped ancestors

	   Suggestion lists are positioned inside the field that owns them, so a
	   scrolling dialog body, a child table or a list header cuts them off.
	   Frappe has plenty of those. Rather than chase each container, an open
	   list is re-anchored to the viewport, which no ancestor can clip.
	   ------------------------------------------------------------------ */

	var POPUP_SELECTOR = [
		".awesomplete > ul:not([hidden])",
		"ul.aur-unclipped:not([hidden])",
		".datepicker.active",
		".autocomplete-results:not([hidden])",
	].join(", ");

	function clippedBy(node) {
		var parent = node.parentElement;
		while (parent && parent !== document.body) {
			var style = getComputedStyle(parent);
			if (style.overflow !== "visible" || style.overflowX !== "visible" || style.overflowY !== "visible") return true;
			parent = parent.parentElement;
		}
		return false;
	}

	function anchorOf(list) {
		var host = list._aurHome || list.parentElement;
		if (!host) return null;
		return host.querySelector("input, textarea, .control-input") || host;
	}

	/* The command palette owns the only awesomplete that is already a floating
	   overlay: nothing clips it, so it never needs rescuing. Re-anchoring it
	   painted a second list beside the palette, because the modal carries a
	   transform mid-animation and the offset maths below reads it wrong. */
	function isCommandPalette(list) {
		var host = list._aurHome || list.parentElement;
		return Boolean(host && host.querySelector && host.querySelector("#navbar-search"));
	}

	function keepListFocus(event) {
		event.preventDefault();
	}

	function reclip(list) {
		if (!list.dataset.aurUnclipped) return;
		list.removeEventListener("mousedown", keepListFocus, true);
		var home = list._aurHome;
		var next = list._aurNext;
		if (home && home.isConnected) {
			if (next && next.parentNode === home) home.insertBefore(list, next);
			else home.appendChild(list);
		}
		delete list.dataset.aurUnclipped;
		delete list._aurHome;
		delete list._aurNext;
		delete list._aurAnchor;
		list.classList.remove("aur-unclipped");
		["position", "width", "minWidth", "maxHeight", "left", "top", "bottom", "right", "zIndex", "overflowY", "background", "backgroundColor"].forEach(function (prop) {
			list.style[prop] = "";
		});
	}

	function popoverFill() {
		// Hard hex only. Theme tokens in v17 dark are the same as the page
		// and the grid editor, which is why "Insert Below" showed through
		// a list that thought it had a background.
		return root.getAttribute("data-theme") === "dark" ? "#252838" : "#ffffff";
	}

	function paintPopover(node) {
		var fill = popoverFill();
		if (!node || !node.style) return;
		node.style.setProperty("background", fill, "important");
		node.style.setProperty("background-color", fill, "important");
		node.style.setProperty("opacity", "1", "important");
	}

	/* Stock Desk: max-height min(60vh, 300px), open below the field, overlap
	   whatever is under it. Do not shrink to the footer gap — that is why
	   Link To in a grid editor only showed three rows. */
	function stockListHeight() {
		return Math.round(Math.min(window.innerHeight * 0.6, 300));
	}

	function placeStockList(node, rect, opts) {
		opts = opts || {};
		var minWidth = opts.minWidth || 250;
		var cap = stockListHeight();
		var width = Math.max(Math.round(rect.width), minWidth);
		var left = Math.round(rect.left);
		if (left + width > window.innerWidth - 8) {
			left = Math.max(8, window.innerWidth - width - 8);
		}

		// Width first, then measure: how tall the content is depends on how
		// wide it may wrap.
		node.style.position = "fixed";
		node.style.zIndex = "2000";
		node.style.width = width + "px";
		node.style.minWidth = minWidth + "px";
		node.style.bottom = "auto";
		node.style.right = "auto";
		node.style.left = left + "px";

		/* Flip on what the list actually needs, not on the 300px cap. A field
		   near the bottom with two rows in it (a link with no matches, showing
		   only "Create a new ..." ) has room below and must open there; sizing
		   the decision on the cap is what threw that popup up over the form. */
		if (!opts.skipHeight) node.style.maxHeight = "";
		var natural = Math.max(node.scrollHeight || 0, node.offsetHeight || 0, 40);
		var wanted = opts.skipHeight ? natural : Math.min(cap, natural);

		var below = window.innerHeight - rect.bottom - 8;
		var above = rect.top - 8;
		var flip = below < wanted && above > below;
		var room = flip ? above : below;
		var height = Math.min(wanted, Math.max(room, Math.min(wanted, 180)));

		if (!opts.skipHeight) {
			node.style.maxHeight = height + "px";
			node.style.overflowY = natural > height ? "auto" : "hidden";
		}
		node.style.top = flip
			? Math.round(Math.max(8, rect.top - height - 4)) + "px"
			: Math.round(rect.bottom + 2) + "px";
	}

	function unclip(list) {
		if (list.hidden || getComputedStyle(list).display === "none") return;

		if (isCommandPalette(list)) {
			reclip(list);
			return;
		}

		if (!list.querySelector("li, [role='option'], .datepicker--cell, .datepicker--content")) {
			if (list.dataset.aurUnclipped) reclip(list);
			return;
		}

		var anchor = list._aurAnchor || anchorOf(list);
		if (!anchor) return;

		if (!list.dataset.aurUnclipped) {
			// Date pickers already paint themselves; only rescue them when a
			// parent clips. Link lists always leave the field — stock paint
			// dies the moment the ul is not a child of .awesomplete, and
			// Default-skin --bg-color is the same token as the page.
			if (list.classList.contains("datepicker") && !clippedBy(list)) return;
			list._aurHome = list.parentElement;
			list._aurNext = list.nextSibling;
			list._aurAnchor = anchor;
			list.addEventListener("mousedown", keepListFocus, true);
			if (!list._aurWheelStop) {
				list._aurWheelStop = function (event) {
					event.stopPropagation();
				};
				list.addEventListener("wheel", list._aurWheelStop, { passive: true });
			}
			document.body.appendChild(list);
			list.dataset.aurUnclipped = "1";
			list.classList.add("aur-unclipped");
		}

		// Enter can leave a previous copy of the same field parked on body.
		document.querySelectorAll(".aur-unclipped").forEach(function (other) {
			if (other === list) return;
			if (other._aurAnchor === anchor) {
				other.hidden = true;
				reclip(other);
			}
		});
		if (el.selectPop) closeSelect();

		paintPopover(list);

		var rect = anchor.getBoundingClientRect();
		if (!rect.width && !rect.height) return;

		placeStockList(list, rect, {
			minWidth: 250,
			skipHeight: list.classList.contains("datepicker"),
		});
	}

	function watchPopups() {
		var sweep = function () {
			// A list that has closed keeps its fixed coordinates otherwise, and
			// reappears in last-time's position before the next sweep moves it.
			document.querySelectorAll("ul.aur-unclipped[hidden], .autocomplete-results[hidden].aur-unclipped, .datepicker.aur-unclipped:not(.active)").forEach(reclip);
			document.querySelectorAll(POPUP_SELECTOR).forEach(unclip);
		};

		["focusin", "input", "keyup", "click"].forEach(function (type) {
			document.addEventListener(type, sweep, true);
		});
		document.addEventListener("scroll", sweep, true);
		window.addEventListener("resize", sweep);

		document.addEventListener(
			"mousedown",
			function (event) {
				document.querySelectorAll(".aur-unclipped").forEach(function (list) {
					if (list.contains(event.target)) return;
					var anchor = list._aurAnchor;
					if (anchor && (anchor === event.target || (anchor.contains && anchor.contains(event.target)))) return;
					list.hidden = true;
					reclip(list);
				});
			},
			true
		);

		// childList: Awesomplete can empty the ul without toggling hidden,
		// which left a tall blank box on the body after a field switch.
		new MutationObserver(sweep).observe(document.body, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ["hidden", "class", "aria-expanded"],
		});
	}

	/* ---------------------------------------------------------------------
	   Native select replacement
	   ------------------------------------------------------------------ */

	function closeSelect() {
		if (el.selectPop) {
			el.selectPop.remove();
			el.selectPop = null;
		}
	}

	function openSelect(select) {
		if (el.selectPop && el.selectPop._aurSelect === select) return;
		closeSelect();

		var options = Array.prototype.slice.call(select.options);
		var pop = make("div", { class: "aur-select-pop" });
		pop._aurSelect = select;
		paintPopover(pop);

		if (!options.length) pop.appendChild(make("div", { class: "aur-select-empty", text: "No options" }));

		options.forEach(function (option) {
			var row = make("div", { class: "aur-select-opt" + (option.selected ? " aur-selected" : "") }, [
				make("span", { class: "aur-select-dot" }),
				make("span", { text: option.textContent.trim() || "\u2014" }),
			]);

			row.addEventListener("click", function () {
				select.value = option.value;
				select.dispatchEvent(new Event("input", { bubbles: true }));
				select.dispatchEvent(new Event("change", { bubbles: true }));
				closeSelect();
			});

			pop.appendChild(row);
		});

		document.body.appendChild(pop);

		placeStockList(pop, select.getBoundingClientRect(), { minWidth: 190 });

		// Wheel must stay on this list. If it reaches the dialog/page scroller,
		// the capture scroll listener used to tear the pop down mid-gesture.
		pop.addEventListener(
			"wheel",
			function (event) {
				event.stopPropagation();
			},
			{ passive: true }
		);

		el.selectPop = pop;
		var selected = pop.querySelector(".aur-selected");
		if (selected) {
			selected.classList.add("aur-cursor");
			selected.scrollIntoView({ block: "nearest" });
		}
	}

	function selectOptions() {
		return el.selectPop ? el.selectPop.querySelectorAll(".aur-select-opt") : [];
	}

	function moveSelectCursor(delta) {
		var opts = selectOptions();
		if (!opts.length) return;
		var i = 0;
		for (; i < opts.length; i++) if (opts[i].classList.contains("aur-cursor")) break;
		if (i >= opts.length) {
			for (i = 0; i < opts.length; i++) if (opts[i].classList.contains("aur-selected")) break;
		}
		if (i >= opts.length) i = 0;
		else i = (i + delta + opts.length) % opts.length;
		Array.prototype.forEach.call(opts, function (row) {
			row.classList.remove("aur-cursor");
		});
		opts[i].classList.add("aur-cursor");
		opts[i].scrollIntoView({ block: "nearest" });
	}

	function commitSelectCursor() {
		if (!el.selectPop) return false;
		var row = el.selectPop.querySelector(".aur-cursor") || el.selectPop.querySelector(".aur-selected");
		if (!row) return false;
		row.click();
		return true;
	}

	function onPageScroll(event) {
		if (!el.selectPop) return;
		var target = event.target;
		if (target === el.selectPop) return;
		if (target && target.closest && target.closest(".aur-select-pop")) return;
		closeSelect();
	}

	function skinSelects() {
		document.addEventListener(
			"mousedown",
			function (event) {
				var select = event.target.closest ? event.target.closest("select") : null;

				if (!select) {
					if (el.selectPop && !event.target.closest(".aur-select-pop")) closeSelect();
					return;
				}

				if (select.multiple || select.disabled || select.size > 1 || select.closest(".aur-native")) return;

				// Suppress the OS popup and drive the value from our own listbox.
				event.preventDefault();
				select.focus();
				openSelect(select);
			},
			true
		);

		document.addEventListener("scroll", onPageScroll, true);
		window.addEventListener("resize", closeSelect);

		// mousedown only covers the mouse. Enter / Space / arrows open the
		// native OS list as well, which is the doubled "Approve / Revise" menu.
		document.addEventListener(
			"keydown",
			function (event) {
				var target = event.target;
				var select = target && target.closest ? target.closest("select") : null;
				var key = event.key;
				var popOpen = Boolean(el.selectPop);

				if (popOpen && (key === "Escape" || key === "Tab")) {
					closeSelect();
					return;
				}

				if (popOpen && (key === "ArrowDown" || key === "ArrowUp")) {
					event.preventDefault();
					moveSelectCursor(key === "ArrowDown" ? 1 : -1);
					return;
				}

				if (popOpen && (key === "Enter" || key === " " || key === "Spacebar")) {
					event.preventDefault();
					if (!commitSelectCursor()) closeSelect();
					return;
				}

				if (!select || select.multiple || select.disabled || select.size > 1 || select.closest(".aur-native")) return;

				if (key === "Enter" || key === " " || key === "Spacebar" || key === "ArrowDown" || key === "ArrowUp" || key === "F4") {
					event.preventDefault();
					openSelect(select);
					if (key === "ArrowUp") moveSelectCursor(-1);
					if (key === "ArrowDown" || key === "F4") moveSelectCursor(0);
				}
			},
			true
		);
	}

	/* ---------------------------------------------------------------------
	   Bar
	   ------------------------------------------------------------------ */

	/* Brand, jump-search and the right-hand tools are the same chrome in both
	   shells. Content only swaps the middle slot (command tabs vs module
	   menus). Building them once is what keeps the two bars from drifting. */
	function brandInfo() {
		try {
			var info = window.frappe && frappe.boot && frappe.boot.kaiten_company;
			if (info && info.name) {
				return { name: String(info.name), logo: String(info.logo || "") };
			}
		} catch (e) {}
		var name = brandName();
		try {
			var company = companyName();
			if (company) name = company;
		} catch (e) {}
		var logo = "";
		try {
			logo = (window.frappe && frappe.boot && frappe.boot.app_logo_url) || "";
		} catch (e) {}
		return { name: name, logo: logo };
	}

	function buildSharedBrand() {
		var info = brandInfo();
		var mark = info.logo
			? make("img", { class: "aur-brand-logo", src: info.logo, alt: "" })
			: make("span", { class: "aur-brand-dot" });
		if (info.logo) {
			mark.addEventListener("error", function () {
				if (mark.parentNode) mark.replaceWith(make("span", { class: "aur-brand-dot" }));
			});
		}
		/* The company mark reads as the way home, and on a site that has a Kaiten
		   Home that is what it does. Where there is no such page it stays the
		   handle for the appearance panel rather than pointing at nothing — the
		   ◕ button in the bar opens that panel either way, so nothing is lost
		   when the mark is spent on the more obvious errand. */
		var home = kaitenHomeAvailable();
		var brand = make(
			"button",
			{
				class: "aur-brand",
				type: "button",
				title: info.name + (home ? " \u2014 home" : " \u2014 theme and appearance"),
			},
			[mark, make("span", { class: "aur-brand-label", text: info.name })]
		);
		brand.addEventListener("click", function (event) {
			event.stopPropagation();
			if (kaitenHomeAvailable()) goKaitenHome();
			else openSettings(brand);
		});
		return brand;
	}

	function buildSharedSearch() {
		el.search = make("input", {
			class: "aur-search",
			type: "search",
			placeholder: "Jump to anything",
			"aria-label": "Search the desk",
		});
		el.search.addEventListener("input", function () {
			renderSearch(el.search.value);
		});
		el.search.addEventListener("focus", function () {
			if (el.search.value.trim()) renderSearch(el.search.value);
		});
		return make("div", { class: "aur-search-wrap" }, [
			make("span", { class: "aur-search-icon", text: "\u2315" }),
			el.search,
			make("span", { class: "aur-search-kbd", text: "/" }),
		]);
	}

	function buildSharedTools() {
		el.pinBtn = make("button", { class: "aur-icon-btn", type: "button", title: "Pin this page", text: "\u2605" });
		el.pinBtn.addEventListener("click", function (event) {
			event.stopPropagation();
			var desc = currentDesc();
			if (desc) togglePin(desc, el.pinBtn);
		});

		// Named, because the panel it opens has to find it again after a content
		// switch rebuilds the bar — see settingsAnchor().
		var paletteBtn = make("button", {
			class: "aur-icon-btn aur-theme-btn",
			type: "button",
			title: "Theme, colour and density",
			text: "\u25D5",
		});
		paletteBtn.addEventListener("click", function (event) {
			event.stopPropagation();
			openSettings(paletteBtn);
		});

		var themeBtn = make("button", { class: "aur-icon-btn aur-appearance knav-appearance", type: "button" });
		el.paintThemeBtn = function () {
			var meta = appearanceMeta(currentAppearance());
			themeBtn.textContent = meta.glyph;
			themeBtn.setAttribute("title", meta.label + " \u2014 click for " + appearanceMeta(meta.next).label.toLowerCase());
		};
		themeBtn.addEventListener("click", function (event) {
			event.stopPropagation();
			setAppearance(nextAppearance());
		});
		el.paintThemeBtn();

		var fullBtn = make("button", { class: "aur-icon-btn aur-fullscreen", type: "button", title: "Toggle fullscreen", text: "\u26F6" });
		fullBtn.addEventListener("click", toggleFullscreen);

		return {
			searchWrap: buildSharedSearch(),
			pinBtn: el.pinBtn,
			paletteBtn: paletteBtn,
			themeBtn: themeBtn,
			fullBtn: fullBtn,
			notifBtn: makeNotifBtn(),
			userBtn: makeUserBtn(),
		};
	}

	function buildBar(anchor) {
		var brand = buildSharedBrand();
		var nav = make("nav", { class: "aur-nav" });
		el.tabNodes = {};

		TABS.forEach(function (tab) {
			var node = make("button", { class: "aur-tab", type: "button", "data-tab": tab.id }, [
				iconNode(tab.icon, "aur-tab-glyph"),
				make("span", { text: tab.label }),
				make("span", { class: "aur-tab-count", text: "\u2026" }),
			]);
			node.addEventListener("click", function () {
				toggleTab(tab.id);
			});

			// Once the panel is open, sweeping the bar swaps what is underneath,
			// so you can read across Workspaces, Modules, Create and the rest
			// without clicking each one. Any standing filter is kept, because
			// only closing the panel clears it.
			node.addEventListener("mouseenter", function () {
				if (!megaOpen()) return;
				clearTimeout(hover.tabTimer);
				hover.tabTimer = setTimeout(function () {
					if (state.activeTab !== tab.id || state.searching) openTab(tab.id);
				}, 90);
			});

			node.addEventListener("mouseleave", function () {
				clearTimeout(hover.tabTimer);
			});

			el.tabNodes[tab.id] = node;
			nav.appendChild(node);
		});

		var tools = buildSharedTools();

		el.bar = make("div", { class: "aur-bar" }, [
			make("div", { class: "aur-bar-progress" }),
			make("div", { class: "aur-bar-inner" }, [
				brand,
				nav,
				make("div", { class: "aur-bar-right" }, [
					tools.searchWrap,
					tools.pinBtn,
					tools.paletteBtn,
					tools.themeBtn,
					tools.fullBtn,
					tools.notifBtn,
					tools.userBtn,
				].filter(Boolean)),
			]),
		]);

		mountBar(anchor);
	}

	/* The mega panel is chrome both shells share: each positions it under its
	   own bar, so it is built once and knows nothing about which bar that is. */
	function buildMega() {
		el.groups = make("div", { class: "aur-mega-groups" });
		el.body = make("div", { class: "aur-mega-body" });

		// Only what is on screen carries a letter, so scrolling has to hand them
		// out again. One pass per frame, since this rides a scroll event.
		var relettering = false;
		el.body.addEventListener("scroll", function () {
			if (!state.hints || relettering) return;
			relettering = true;
			requestAnimationFrame(function () {
				relettering = false;
				if (state.hints) paintHints();
			});
		});

		el.megaSearch = make("input", {
			class: "aur-mega-input",
			type: "search",
			placeholder: "Filter this menu\u2026",
			"aria-label": "Filter the open menu",
		});
		el.megaSearch.addEventListener("input", function () {
			state.megaQuery = el.megaSearch.value;
			renderGroups(state.activeTab || "workspaces");
		});

		/* Two different jobs, so two controls. This one empties the filter and
		   only shows while there is something to empty; sitting there permanently
		   at the end of the strip it looked like the panel's close button, and did
		   nothing at all when the box was already empty. */
		el.megaClear = make("button", {
			class: "aur-mega-clear",
			type: "button",
			title: "Clear the filter",
			"aria-label": "Clear the filter",
			text: "\u00d7",
		});
		el.megaClear.addEventListener("click", clearMegaFilter);
		el.megaClear.hidden = true;

		// Dismissing the panel, which every other affordance already does.
		var megaClose = make("button", {
			class: "aur-mega-close",
			type: "button",
			title: "Close menu (Esc)",
			"aria-label": "Close menu",
			text: "\u00d7",
		});
		megaClose.addEventListener("click", function (event) {
			event.stopPropagation();
			closeMega();
		});

		// Layout switch, right where the eye already is for the filter.
		el.layoutBtns = {};
		var layoutSeg = make("div", { class: "aur-layout-seg", role: "group", "aria-label": "Menu layout" });
		LAYOUTS.forEach(function (opt) {
			var button = make(
				"button",
				{ class: "aur-layout-btn", type: "button", "data-layout": opt.id, title: opt.title, "aria-label": opt.title },
				[iconNode(resolveIcon(opt.icon, opt.label, "layout"), "aur-glyph")]
			);
			button.addEventListener("click", function (event) {
				event.stopPropagation();
				setLayout(opt.id);
			});
			el.layoutBtns[opt.id] = button;
			layoutSeg.appendChild(button);
		});

		el.filterText = make("span", { class: "aur-filter-text" });
		var filterClear = make("button", { class: "aur-filter-clear", type: "button", text: "Clear filter" });
		filterClear.addEventListener("click", clearMegaFilter);

		el.filterBar = make("div", { class: "aur-filter-bar" }, [
			iconNode(resolveIcon("funnel", "filter", ""), "aur-filter-icon"),
			el.filterText,
			filterClear,
		]);

		/* None of the keyboard is worth having if it has to be discovered by
		   accident, so the panel says what it answers to along its own foot. */
		el.footLive = make("span", { class: "aur-foot-live" });
		el.foot = make("div", { class: "aur-mega-foot" }, [
			footKey("\u2191\u2193\u2190\u2192", "move"),
			footKey("Tab", "group"),
			footKey(ALT_LABEL, "then letter"),
			footKey("\u21b5", "open"),
			footKey(META_LABEL + "\u21b5", "new tab"),
			footKey("Esc", "close"),
			el.footLive,
		]);

		el.mega = make("div", { class: "aur-mega" }, [
			make("div", { class: "aur-mega-search" }, [
				layoutSeg,
				iconNode("search", "aur-mega-search-icon"),
				el.megaSearch,
				el.megaClear,
				megaClose,
			]),
			el.filterBar,
			make("div", { class: "aur-mega-cols" }, [el.groups, el.body]),
			el.foot,
		]);

		applyLayout();

		// Pointer velocity feeds the hover-intent delay.
		el.groups.addEventListener("mousemove", function (event) {
			var now = performance.now();
			var dt = now - hover.t;
			if (dt > 0 && dt < 200) hover.vx = (event.clientX - hover.x) / dt;
			hover.x = event.clientX;
			hover.t = now;
		});
		el.groups.addEventListener("mouseleave", function () {
			clearTimeout(hover.timer);
		});

		// The panel lives on <body> so no ancestor can clip or re-stack it.
		document.body.appendChild(el.mega);
	}

	/* v17 puts the content in .main-section (no navbar); older desks have a
	   navbar to sit under. Either way the bar spans the content column. */
	function mountBar(anchor) {
		if (anchor.classList.contains("main-section")) anchor.insertBefore(el.bar, anchor.firstChild);
		else anchor.insertAdjacentElement("afterend", el.bar);

		document.documentElement.classList.add("kaiten-bar-on");
	}

	/* Everything the desk sticks below the page head — the form tab strip, a
	   list's heading row, the form rail — is positioned off a token that only
	   matches the head on a stock desk. The stylesheet works off the real
	   height instead, and this is where that height comes from. A head can wrap
	   onto a second row when the window narrows or a document grows another
	   action, so it is measured rather than assumed. */
	function measureChrome() {
		var root = document.documentElement;

		// The desk keeps one .page-head per visited route and hides all but the
		// current one, so the first match is not necessarily the live one.
		var head = null;
		var heads = document.querySelectorAll(".page-head");
		for (var i = 0; i < heads.length; i++) {
			if (heads[i].offsetHeight) {
				head = heads[i];
				break;
			}
		}

		setPx(root, "--kpage-head-h", head && head.offsetHeight);

		var tabs = document.querySelector(".form-tabs-list");
		setPx(root, "--kform-tabs-h", tabs && tabs.offsetHeight);
	}

	/* Writing an unchanged value still costs a style recalculation, and this
	   runs on a timer. */
	function setPx(node, name, value) {
		var next = value ? Math.round(value) + "px" : "";
		if (node.style.getPropertyValue(name) === next) return;
		if (next) node.style.setProperty(name, next);
		else node.style.removeProperty(name);
	}

	function trackChrome() {
		measureChrome();
		// Routes, saves and permission banners all resize the head without any
		// event worth listening for, so it is re-read on a slow tick.
		setInterval(measureChrome, 600);
	}

	function bindChromeResize() {
		window.addEventListener("resize", function () {
			measureChrome();
			applySideCollapsed();
			fitNavMenus();
			placeNavDrop();
			// A popover that knows how to place itself is repositioned; the rest
			// are transient and closing them is the honest answer.
			if (el.popPlace) el.popPlace();
			else closePop();

			if (!megaOpen()) return;

			positionMega();

			// Lane count comes from the panel width, so a resize has to redeal the
			// groups. Only worth doing when the count actually changes.
			if (currentLayout() === "columns" && state.activeTab) {
				var width = el.body.clientWidth || el.mega.clientWidth || 1100;
				var lanes = Math.max(1, Math.min(6, Math.floor(width / LANE_WIDTH)));
				if (lanes !== el.body.querySelectorAll(".aur-lane").length) renderGroups(state.activeTab);
			}
		});
	}

	function setCounts() {
		if (!el.tabNodes) return;

		TABS.forEach(function (tab) {
			// The module-nav shell registers only the two tabs it surfaces, so a
			// missing node means that shell simply does not show this count.
			var host = el.tabNodes[tab.id];
			if (!host) return;

			var groups = groupsFor(tab.id);
			var total = 0;

			if (tab.id === "workspaces" && groups.length) {
				total = (groups[0].items || []).length;
			} else {
				groups.forEach(function (group) {
					if (group.key !== "__all") total += group.items.length;
				});
			}

			var node = host.querySelector(".aur-tab-count");
			if (node) node.textContent = String(total);
		});
	}

	/* ---------------------------------------------------------------------
	   Preferences
	   ------------------------------------------------------------------ */

	function brandName() {
		try {
			if (window.frappe && frappe.boot && frappe.boot.kaiten_brand) {
				return frappe.boot.kaiten_brand;
			}
		} catch (e) {}
		return "Kaiten";
	}

	function skinById(id) {
		for (var i = 0; i < SKINS.length; i++) {
			if (SKINS[i].id === id) return SKINS[i];
		}
		return null;
	}

	/* The theme used to be a bare on/off flag. "off" is now the default skin, so
	   an old browser that switched it off keeps that look under the new name. */
	function currentSkin() {
		var stored = localStorage.getItem(KEY.skin);
		if (stored && skinById(stored)) return stored;
		return localStorage.getItem(KEY.enabled) === "0" ? "default" : "aurora";
	}

	/* Presets first, then anything the user mixed. Custom entries are returned in
	   the same shape as a preset — prefixed id, ready-made swatch — so the panel
	   and every lookup below can treat the two alike. */
	function tonesFor(skin) {
		var entry = skinById(skin);
		if (!entry || !entry.tones.length) return [];

		return entry.tones.concat(
			palettes().map(function (item) {
				return {
					id: CUSTOM_PREFIX + item.id,
					label: item.label || "Custom",
					swatch: "linear-gradient(135deg," + item.stops.join(",") + ")",
					custom: true,
				};
			})
		);
	}

	function palettes() {
		return read(KEY.palettes, []).filter(function (item) {
			return item && item.id && Array.isArray(item.stops) && item.stops.length;
		});
	}

	function paletteById(id) {
		var wanted = String(id).slice(CUSTOM_PREFIX.length);
		return (
			palettes().filter(function (item) {
				return item.id === wanted;
			})[0] || null
		);
	}

	/* One tone is remembered per skin, so moving between them does not lose the
	   choice. The flat accent key is still written, because it is what older
	   copies of this script and the login page read. */
	function currentAccent() {
		var skin = currentSkin();
		var offered = tonesFor(skin);
		if (!offered.length) return localStorage.getItem(KEY.accent) || "aurora";

		var remembered = read(KEY.skinAccent, {}) || {};
		var known = function (id) {
			return Boolean(
				id &&
					offered.some(function (tone) {
						return tone.id === id;
					})
			);
		};

		if (known(remembered[skin])) return remembered[skin];
		if (known(localStorage.getItem(KEY.accent))) return localStorage.getItem(KEY.accent);
		return offered[0].id;
	}

	function currentDensity() {
		var stored = localStorage.getItem(KEY.density);
		if (stored === "comfortable") return "normal";
		for (var i = 0; i < DENSITIES.length; i++) {
			if (DENSITIES[i].id === stored) return stored;
		}
		return "cozy";
	}

	function knownId(list, id) {
		for (var i = 0; i < list.length; i++) {
			if (list[i].id === id) return true;
		}
		return false;
	}

	function currentShell() {
		var stored = localStorage.getItem(KEY.shell);
		return knownId(SHELLS, stored) ? stored : "command";
	}

	function currentPages() {
		var stored = localStorage.getItem(KEY.pages);
		return knownId(PAGE_STYLES, stored) ? stored : "standard";
	}

	function currentNavView() {
		var stored = localStorage.getItem(KEY.navView);
		return knownId(NAV_VIEWS, stored) ? stored : "dropdown";
	}

	// The Active content profiles offered next to "Standard", filled in from the
	// server. Kept here so the settings panel can paint the picker before the
	// round trip returns and refresh it once it does.
	var contentConfigs = [];

	function currentContent() {
		return localStorage.getItem(KEY.content) || "standard";
	}

	function loadMenuConfigs(done) {
		if (!window.frappe || !frappe.xcall) return;
		frappe
			.xcall("kaiten_erp_ui_themes.api.get_menu_configs")
			.then(function (rows) {
				contentConfigs = Array.isArray(rows) ? rows : [];
				if (typeof done === "function") done();
			})
			.catch(function () {
				contentConfigs = [];
			});
	}

	function setNavView(id) {
		if (!knownId(NAV_VIEWS, id) || id === currentNavView()) return;
		localStorage.setItem(KEY.navView, id);
		applyPrefs();
		schedulePush();
		// An open menu was drawn in the old presentation, so drop it; the next
		// click rebuilds it in the chosen one.
		closeNavDrop();
		// The sidebar is laid out differently per look — flat list for Standard,
		// area pills for the grid — so redraw it to match the new choice.
		renderSide();
	}

	function setShell(id) {
		if (!knownId(SHELLS, id) || id === currentShell()) return;
		localStorage.setItem(KEY.shell, id);
		applyPrefs();
		schedulePush();
		remountShell();
	}

	function setPages(id) {
		if (!knownId(PAGE_STYLES, id)) return;
		localStorage.setItem(KEY.pages, id);
		applyPrefs();
		schedulePush();
	}

	/* A mixed tone has no stylesheet to live in, so its stops are written onto
	   the root element as the same custom properties a preset would set. */
	var CUSTOM_PROPS = [
		"--aur-accent",
		"--aur-grad",
		"--aur-grad-cool",
		"--aur-grad-soft",
		"--aur-mesh-a",
		"--aur-mesh-b",
		"--aur-mesh-c",
		"--aur-mesh-d",
	];

	function paintCustom(palette) {
		CUSTOM_PROPS.forEach(function (prop) {
			root.style.removeProperty(prop);
		});
		if (!palette) return;

		var stops = palette.stops.slice(0, 3);
		while (stops.length < 3) stops.push(stops[stops.length - 1]);
		var wash = function (colour, pct) {
			return "color-mix(in oklab, " + colour + " " + pct + "%, transparent)";
		};

		root.style.setProperty("--aur-accent", stops[1]);
		root.style.setProperty("--aur-grad", "linear-gradient(135deg," + stops.join(",") + ")");
		root.style.setProperty("--aur-grad-cool", "linear-gradient(135deg," + stops[0] + "," + stops[2] + ")");
		root.style.setProperty("--aur-grad-soft", "linear-gradient(135deg," + wash(stops[0], 16) + "," + wash(stops[2], 12) + ")");
		root.style.setProperty("--aur-mesh-a", wash(stops[0], 26));
		root.style.setProperty("--aur-mesh-b", wash(stops[1], 22));
		root.style.setProperty("--aur-mesh-c", wash(stops[2], 20));
		root.style.setProperty("--aur-mesh-d", wash(stops[1], 14));
	}

	function applyPrefs() {
		var skin = currentSkin();
		var accent = currentAccent();

		root.classList.toggle("aurora-on", skin !== "default");
		if (skin === "default") root.removeAttribute("data-kaiten-skin");
		else root.setAttribute("data-kaiten-skin", skin);

		root.setAttribute("data-aur-accent", accent);
		root.setAttribute("data-aur-density", currentDensity());
		root.setAttribute("data-kaiten-shell", currentShell());
		root.setAttribute("data-kaiten-nav-view", currentNavView());
		root.setAttribute("data-kaiten-pages", currentPages());
		paintCustom(accent.indexOf(CUSTOM_PREFIX) === 0 ? paletteById(accent) : null);
	}

	function setSkin(id) {
		if (!skinById(id)) return;
		localStorage.setItem(KEY.skin, id);
		localStorage.setItem(KEY.enabled, id === "default" ? "0" : "1");
		applyPrefs();
		schedulePush();
	}

	function setAccent(id) {
		var map = read(KEY.skinAccent, {}) || {};
		map[currentSkin()] = id;
		write(KEY.skinAccent, map);
		localStorage.setItem(KEY.accent, id);
		applyPrefs();
		schedulePush();
	}

	function setDensity(id) {
		if (id !== "normal" && id !== "cozy" && id !== "compact") return;
		localStorage.setItem(KEY.density, id);
		applyPrefs();
		schedulePush();
	}

	function addPalette(stops, label) {
		var list = palettes();
		var entry = { id: "p" + Date.now().toString(36), label: label || "Custom", stops: stops };
		list.push(entry);
		write(KEY.palettes, list);
		return CUSTOM_PREFIX + entry.id;
	}

	function removePalette(id) {
		var wanted = String(id).indexOf(CUSTOM_PREFIX) === 0 ? String(id).slice(CUSTOM_PREFIX.length) : String(id);
		write(
			KEY.palettes,
			palettes().filter(function (item) {
				return item.id !== wanted;
			})
		);

		// Nothing to paint with any more: fall back to the skin's first preset.
		if (currentAccent() === CUSTOM_PREFIX + wanted) {
			var offered = tonesFor(currentSkin());
			setAccent(offered.length ? offered[0].id : "aurora");
		} else {
			applyPrefs();
		}
	}

	/* Appearance is Frappe's, not ours: data-theme-mode holds the choice and
	   data-theme the resolved value. Both are set the way its own switcher does,
	   then the choice is saved against the user so a reload keeps it. */
	function currentAppearance() {
		return root.getAttribute("data-theme-mode") || "light";
	}

	function setAppearance(mode) {
		root.setAttribute("data-theme-mode", mode);

		try {
			if (mode === "automatic") frappe.ui.set_theme();
			else frappe.ui.set_theme(mode);
		} catch (e) {
			var resolved = mode;
			if (mode === "automatic") {
				resolved = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
			}
			root.setAttribute("data-theme", resolved);
		}

		try {
			frappe.xcall("frappe.core.doctype.user.user.switch_theme", {
				theme: mode.charAt(0).toUpperCase() + mode.slice(1),
			});
		} catch (e) {}

		// The bar shortcut and the panel show the same state, and either can be
		// the one that changed it, so both are repainted from here.
		if (el.paintThemeBtn) el.paintThemeBtn();
		if (el.paintAppearanceSeg) el.paintAppearanceSeg();
	}

	function nextAppearance() {
		var current = currentAppearance();
		for (var i = 0; i < APPEARANCES.length; i++) {
			if (APPEARANCES[i].id === current) return APPEARANCES[i].next;
		}
		return "dark";
	}

	function appearanceMeta(id) {
		return (
			APPEARANCES.filter(function (item) {
				return item.id === id;
			})[0] || APPEARANCES[0]
		);
	}

	function toggleFullscreen() {
		if (document.fullscreenElement) document.exitFullscreen();
		else document.documentElement.requestFullscreen();
	}

	function userLabel() {
		try {
			if (frappe.get_fullname) return frappe.get_fullname() || "Account";
			return (frappe.boot.user && frappe.boot.user.full_name) || (frappe.session && frappe.session.user) || "Account";
		} catch (e) {
			return "Account";
		}
	}

	function userInitials(name) {
		var parts = String(name || "")
			.trim()
			.split(/\s+/)
			.filter(Boolean);
		if (!parts.length) return "U";
		if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
		return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
	}

	function paintUserBtn(btn) {
		var label = userLabel();
		btn.setAttribute("title", label);
		btn.setAttribute("aria-label", label + " — account menu");
		btn.textContent = "";
		try {
			if (typeof frappe.avatar === "function" && frappe.session && frappe.session.user) {
				var wrap = document.createElement("span");
				wrap.className = "aur-user-face";
				wrap.innerHTML = frappe.avatar(frappe.session.user, "avatar-small");
				if (wrap.querySelector(".avatar")) {
					btn.appendChild(wrap);
					return;
				}
			}
		} catch (e) {}
		btn.appendChild(make("span", { class: "aur-user-initials", text: userInitials(label) }));
	}

	function runSafe(fn) {
		return function () {
			try {
				fn();
			} catch (e) {
				console.warn("kaiten user menu", e);
			}
		};
	}

	/* Mirrors frappe.app.sidebar.create_user_menu so Profile / Theme / About /
	   Logout stay the site's Navbar Settings list, not a second invented menu. */
	function notificationsEnabled() {
		try {
			return Boolean(frappe.boot && frappe.boot.desk_settings && frappe.boot.desk_settings.notifications);
		} catch (e) {
			return false;
		}
	}

	function ensureStockNotifications() {
		try {
			if (frappe.app && frappe.app.sidebar && !frappe.app.sidebar.notifications) {
				frappe.app.sidebar.setup_notifications();
			}
		} catch (e) {}
	}

	function stockNotifDropdown() {
		ensureStockNotifications();
		var $dd = $(".body-sidebar .dropdown-notifications").has(".notifications-list");
		if (!$dd.length) $dd = $(".dropdown-notifications").has(".notifications-list").first();
		if (!$dd.length) return $();
		// header.navbar and the collapsed sidebar are display:none on this desk —
		// a position:fixed child inside them never paints. Park the panel on body.
		if ($dd.parent()[0] !== document.body) {
			$dd.appendTo(document.body);
			$dd.addClass("kaiten-notif-float");
		}
		return $dd;
	}

	function placeNotifPanel($dd, anchor) {
		var list = $dd.find(".notifications-list").get(0);
		if (!list || !anchor) return;
		var box = anchor.getBoundingClientRect();
		var width = list.offsetWidth || 360;
		var left = Math.round(clamp(box.right - width, 10, window.innerWidth - width - 10));
		var top = Math.round(box.bottom + 8);
		list.style.setProperty("position", "fixed", "important");
		list.style.setProperty("top", top + "px", "important");
		list.style.setProperty("left", left + "px", "important");
		list.style.setProperty("right", "auto", "important");
	}

	function toggleStockNotifications(anchor) {
		try {
			var $dropdown = stockNotifDropdown();
			if (!$dropdown.length) return;
			$dropdown.toggleClass("hidden");
			if (!$dropdown.hasClass("hidden")) {
				$dropdown.trigger("show.bs.dropdown");
				placeNotifPanel($dropdown, anchor);
			}
			$(".dropdown-background-tasks").addClass("hidden");
		} catch (e) {
			console.warn("kaiten notifications", e);
		}
	}

	function makeNotifBtn() {
		if (!notificationsEnabled()) return null;
		var btn = make("button", {
			class: "aur-icon-btn aur-notif-btn sidebar-notification notifications-icon",
			type: "button",
			title: "Notifications",
			"aria-label": "Notifications",
		});
		btn.appendChild(iconNode("bell", ""));
		var badge = make("span", { class: "notification-count hidden" });
		btn.appendChild(badge);
		try {
			var unread = Number((frappe.boot && frappe.boot.notification_unread_count) || 0);
			if (unread > 0) {
				badge.textContent = unread > 99 ? "99+" : String(unread);
				badge.classList.remove("hidden");
			}
		} catch (e) {}
		btn.addEventListener("click", function (event) {
			event.preventDefault();
			event.stopPropagation();
			toggleStockNotifications(btn);
		});
		return btn;
	}

	/* Same account menu as the stock sidebar avatar (Settings, Navbar Settings
	   items, Logout). Own class so kaiten_hrms does not steal the click. The
	   stock menu is not always built yet, so attaching is retried for a while. */
	function makeUserBtn() {
		var btn = make("button", {
			class: "aur-user-btn",
			type: "button",
			title: "Account",
			"aria-label": "Account menu",
			"aria-haspopup": "menu",
		});
		paintUserBtn(btn);

		if (!attachStockUserMenu(btn)) {
			var tries = 0;
			var poll = setInterval(function () {
				tries += 1;
				if (attachStockUserMenu(btn) || tries > 40) clearInterval(poll);
			}, 250);
		}

		return btn;
	}

	function goStandardDesk() {
		try {
			if (typeof kaiten_desk !== "undefined" && kaiten_desk.goStandard) {
				kaiten_desk.goStandard();
				return;
			}
		} catch (e) {}
		window.location.assign("/desk");
	}

	/* kaiten_hrms boot always sets kaiten_desk when that app is installed.
	   Theme stays optional — no Kaiten Home items without it. */
	function kaitenHrmsPresent() {
		try {
			return Boolean(frappe.boot && frappe.boot.kaiten_desk);
		} catch (e) {
			return false;
		}
	}

	function kaitenMenuPortals() {
		try {
			var boot = (frappe.boot && frappe.boot.kaiten_desk) || {};
			return Array.isArray(boot.menu_portals) ? boot.menu_portals : [];
		} catch (e) {
			return [];
		}
	}

	/* Kaiten Home is another app's page, so the theme cannot assume it. Both the
	   desk-side helper and the boot payload are written by the app that owns it,
	   and either one being present means the page is there to open. */
	function kaitenHomeAvailable() {
		try {
			if (typeof kaiten_desk !== "undefined" && kaiten_desk) return true;
		} catch (e) {}
		try {
			return Boolean(window.frappe && frappe.boot && frappe.boot.kaiten_desk);
		} catch (e) {}
		return false;
	}

	/* Home as it was left. Choosing an area again is its own errand, and the
	   navbar keeps an entry for it. */
	function goKaitenHome() {
		try {
			if (typeof kaiten_desk !== "undefined" && kaiten_desk.showKaitenHome) {
				kaiten_desk.showKaitenHome();
				return;
			}
		} catch (e) {}
		window.location.assign("/desk/kaiten-home");
	}

	function goKaitenChooseArea() {
		try {
			if (typeof kaiten_desk !== "undefined") {
				kaiten_desk.clearArea();
				if (kaiten_desk.showKaitenHome) {
					kaiten_desk.showKaitenHome();
					return;
				}
			}
		} catch (e) {}
		window.location.assign("/desk/kaiten-home");
	}

	function goKaitenPortal(portal) {
		try {
			if (typeof kaiten_desk !== "undefined" && kaiten_desk.setDeskArea) {
				kaiten_desk.setDeskArea(portal, false);
				return;
			}
		} catch (e) {}
		try {
			sessionStorage.setItem("kaiten_home_portal:" + (frappe.session.user || ""), portal);
		} catch (e2) {}
		window.location.assign("/desk/kaiten-home");
	}

	function kaitenHomeMenuHead() {
		var portals = kaitenMenuPortals();
		var items = [
			{
				name: "kaiten-choose-area",
				label: __("Home (choose area)"),
				icon: "home",
				onClick: runSafe(goKaitenChooseArea),
			},
			{
				name: "kaiten-all-modules",
				label: __("All Modules"),
				icon: "grid",
				onClick: runSafe(goStandardDesk),
			},
		];
		if (portals.indexOf("jewellery") >= 0) {
			items.push({
				name: "kaiten-jewellery",
				label: __("Kaiten Home — Jewellery"),
				icon: "star",
				onClick: runSafe(function () {
					goKaitenPortal("jewellery");
				}),
			});
		}
		if (portals.indexOf("hr") >= 0) {
			items.push({
				name: "kaiten-hr",
				label: __("Kaiten Home — HR"),
				icon: "users",
				onClick: runSafe(function () {
					goKaitenPortal("hr");
				}),
			});
		}
		items.push({ is_divider: true });
		return items;
	}

	function extraHas(extras, needle) {
		return extras.some(function (item) {
			var hay = String(item.item_label || item.label || "") + " " + String(item.action || "");
			return hay.toLowerCase().indexOf(needle) >= 0;
		});
	}

	function stockUserMenuItems() {
		var extras = [];
		try {
			extras = (frappe.boot.navbar_settings && frappe.boot.navbar_settings.settings_dropdown) || [];
		} catch (e) {
			extras = [];
		}

		var classic = [];
		if (!extraHas(extras, "profile")) {
			classic.push({
				name: "edit-profile",
				label: __("Edit Profile"),
				icon: "edit",
				onClick: runSafe(function () {
					if (frappe.ui.toolbar && frappe.ui.toolbar.route_to_user) frappe.ui.toolbar.route_to_user();
					else frappe.set_route("Form", "User", frappe.session.user);
				}),
			});
		}
		if (!extraHas(extras, "theme")) {
			classic.push({
				name: "toggle-theme",
				label: __("Toggle Theme"),
				icon: "moon",
				onClick: runSafe(function () {
					setAppearance(nextAppearance());
				}),
			});
		}
		if (!extraHas(extras, "about")) {
			classic.push({
				name: "about",
				label: __("About"),
				icon: "info",
				onClick: runSafe(function () {
					frappe.ui.toolbar.show_about();
				}),
			});
		}

		var head = [];
		if (kaitenHrmsPresent()) {
			head = kaitenHomeMenuHead();
		} else if (!extraHas(extras, "home") && !extraHas(extras, "desk")) {
			head.push({
				name: "home",
				label: __("Home"),
				icon: "home",
				onClick: runSafe(goStandardDesk),
			});
		}

		return head
			.concat([
				{
					name: "settings",
					label: __("Settings"),
					icon: "settings",
					onClick: runSafe(function () {
						frappe
							.require("user_settings_dialog.bundle.js")
							.then(function () {
								frappe.ui.show_user_settings("profile");
							})
							.catch(function () {
								if (frappe.ui.toolbar && frappe.ui.toolbar.route_to_user) frappe.ui.toolbar.route_to_user();
							});
					}),
				},
				{
					name: "workspace-selector",
					label: __("Manage Dock"),
					icon: "monitor",
					onClick: runSafe(function () {
						new frappe.ui.DockManager();
					}),
				},
				{
					name: "reload",
					label: __("Reload"),
					icon: "rotate-ccw",
					onClick: runSafe(function () {
						frappe.ui.toolbar.clear_cache();
					}),
				},
			])
			.concat(classic)
			.concat(
				extras.map(function (item) {
					return Object.assign({}, item, { label: item.item_label || item.label });
				})
			)
			.concat([
				{ is_divider: true },
				{
					name: "logout",
					label: __("Logout"),
					icon: "log-out",
					onClick: runSafe(function () {
						frappe.app.logout();
					}),
				},
			]);
	}

	function attachStockUserMenu(btn) {
		if (!btn || btn.dataset.aurUserMenu === "1") return true;
		if (!window.frappe || !frappe.ui || !frappe.ui.create_menu || !window.$) return false;

		frappe.ui.create_menu({
			parent: $(btn),
			open_on_top: false,
			open_on_left: true,
			menu_items: stockUserMenuItems(),
			onShow: function () {
				btn.classList.add("aur-user-open");
				try {
					closePop();
				} catch (e) {}
				requestAnimationFrame(function () {
					var menu = document.querySelector(".frappe-menu.context-menu");
					if (!menu || menu.style.display === "none") return;
					var box = btn.getBoundingClientRect();
					var width = menu.offsetWidth || 200;
					var height = menu.offsetHeight || 160;
					var left = Math.round(clamp(box.right - width, 10, window.innerWidth - width - 10));
					var top = Math.round(box.bottom + 6);
					if (top + height > window.innerHeight - 10) top = Math.max(10, Math.round(box.top - height - 6));
					menu.style.left = left + "px";
					menu.style.top = top + "px";
				});
			},
			onHide: function () {
				btn.classList.remove("aur-user-open");
			},
			onItemClick: function () {
				btn.classList.remove("aur-user-open");
			},
		});
		btn.dataset.aurUserMenu = "1";
		return true;
	}

	/* ---------------------------------------------------------------------
	   Motion
	   ------------------------------------------------------------------ */

	function bindRipple() {
		document.addEventListener(
			"click",
			function (event) {
				var target = event.target.closest(".btn, .es-button, .aur-item, .aur-tab, .aur-icon-btn, .dock-item");
				if (!target) return;
				// Nested v17 menus live inside the button. A blend ripple on
				// that parent paints through the open list.
				if (
					target.matches(".dropdown-toggle, [data-toggle='dropdown']") ||
					target.querySelector(":scope > .dropdown-menu")
				) {
					return;
				}

				var rect = target.getBoundingClientRect();
				var size = Math.max(rect.width, rect.height);
				var ripple = make("span", { class: "aur-ripple" });
				ripple.style.width = ripple.style.height = size + "px";
				ripple.style.left = event.clientX - rect.left - size / 2 + "px";
				ripple.style.top = event.clientY - rect.top - size / 2 + "px";

				if (getComputedStyle(target).position === "static") target.style.position = "relative";
				target.appendChild(ripple);
				setTimeout(function () {
					ripple.remove();
				}, 640);
			},
			true
		);
	}

	function bindCursorGlow() {
		var pending = false;
		var last = null;

		document.addEventListener("mousemove", function (event) {
			last = event;
			if (pending) return;
			pending = true;

			requestAnimationFrame(function () {
				pending = false;
				if (!last || !last.target.closest) return;

				var target = last.target.closest(".widget, .frappe-card, .aur-item");
				if (!target) return;

				var rect = target.getBoundingClientRect();
				target.style.setProperty("--mx", ((last.clientX - rect.left) / rect.width) * 100 + "%");
				target.style.setProperty("--my", ((last.clientY - rect.top) / rect.height) * 100 + "%");
			});
		});
	}

	function scrollMetrics(target) {
		var doc = document.documentElement;
		var isPage = !target || target === document || target === window || target === doc || target === document.body;

		if (isPage) return { top: window.scrollY || doc.scrollTop || 0, max: doc.scrollHeight - window.innerHeight };
		return { top: target.scrollTop, max: target.scrollHeight - target.clientHeight };
	}

	function bindScroll() {
		var pending = false;
		var target = null;

		function update() {
			pending = false;
			var metrics = scrollMetrics(target);
			var ratio = metrics.max > 0 ? Math.min(1, Math.max(0, metrics.top / metrics.max)) : 0;

			root.style.setProperty("--aur-scroll", ratio.toFixed(4));
			if (el.bar) el.bar.classList.toggle("aur-bar-stuck", metrics.top > 8);
		}

		// Capture phase, because the desk scrolls an inner container rather than
		// the window and scroll events do not bubble.
		document.addEventListener(
			"scroll",
			function (event) {
				// The mega panel and its lists scroll independently of the page.
				if (event.target && event.target.closest && event.target.closest(".aur-mega")) return;

				target = event.target;
				if (pending) return;
				pending = true;
				requestAnimationFrame(update);
			},
			{ passive: true, capture: true }
		);

		update();
	}

	function bindReveal() {
		if (!("IntersectionObserver" in window)) return;

		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) return;
					entry.target.classList.add("aur-in");
					observer.unobserve(entry.target);
				});
			},
			{ rootMargin: "0px 0px -40px 0px", threshold: 0.04 }
		);

		function arm() {
			Array.prototype.forEach.call(
				document.querySelectorAll(".widget:not(.aur-reveal), .form-section:not(.aur-reveal)"),
				function (node) {
					// Anything already on screen is painted as-is. Only content the
					// user has to scroll to gets the entrance.
					if (node.getBoundingClientRect().top < window.innerHeight - 40) {
						node.classList.add("aur-reveal", "aur-in");
						return;
					}

					node.classList.add("aur-reveal");
					observer.observe(node);
				}
			);

			// Safety net: never leave anything permanently invisible.
			setTimeout(function () {
				Array.prototype.forEach.call(document.querySelectorAll(".aur-reveal:not(.aur-in)"), function (node) {
					node.classList.add("aur-in");
				});
			}, 900);
		}

		var timer = null;
		new MutationObserver(function () {
			clearTimeout(timer);
			timer = setTimeout(arm, 180);
		}).observe(document.body, { childList: true, subtree: true });

		arm();
	}

	/* ---------------------------------------------------------------------
	   Module-nav shell
	   ---------------------------------------------------------------------
	   The arrangement most ERP users already know: one menu per top-level
	   workspace across the top, each opening columns of entries, and a sidebar
	   scoped to whichever module the current page belongs to.

	   None of it is invented. A Workspace's own links table is already a run of
	   rows where a "Card Break" starts a titled group and the rows after it
	   belong to it, which is exactly the column shape this shell needs — so the
	   bar is a reading of the desk's own structure and comes out right on any
	   app rather than only the one it was designed against.

	   Pinned, Recent, search, notifications and the account menu are the same
	   implementations the command bar uses, opened from the same panel. A shell
	   decides what is on screen; it does not fork behaviour.
	   ------------------------------------------------------------------ */

	var nav = {
		menus: [],
		byKey: {},
		active: "",
		// Which area of each menu the rail is showing, remembered per menu so
		// stepping back into a module returns to where you were in it.
		area: {},
		source: "auto",
		overflow: [],
		drop: null,
		dropFor: "",
		dropBtn: null,
		// Phone drawer is session-only. The desktop collapse flag is a
		// preference; folding the rail on a 390px screen is not.
		drawerOpen: false,
	};

	function isNarrow() {
		return window.matchMedia("(max-width: 767px)").matches;
	}

	function applyNarrow() {
		root.classList.toggle("kaiten-narrow", isNarrow());
	}

	var NAV_KEY_PREFIX = { Report: "rep:", Page: "page:", Dashboard: "dash:", Workspace: "ws:" };
	var NAV_ID_PREFIX = { Report: "report:", Page: "page:", Dashboard: "dashboard:", Workspace: "ws:" };
	var NAV_SUB = { Report: "Report", Page: "Page", Dashboard: "Dashboard", Workspace: "Workspace", URL: "Link" };

	function navTargetKey(type, target) {
		if (type === "Workspace") return "ws:" + slugify(target);
		return (NAV_KEY_PREFIX[type] || "dt:") + target;
	}

	function itemMatchesRoute(item, here) {
		if (!item) return false;
		if (item.key && here && item.key === here) return true;
		if (item.key && here && slugify(item.key) === slugify(here)) return true;

		var itemTail = item.key ? item.key.split(":").slice(1).join(":") : "";
		var hereTail = here ? String(here).split(":").slice(1).join(":") : "";
		if (itemTail && hereTail && slugify(itemTail) === slugify(hereTail)) return true;

		var mine = (item.route || []).map(String);
		if (!mine.length) return false;

		var now = [];
		try {
			now = (frappe.get_route() || []).map(String);
		} catch (e) {}
		if (!now.length) return false;

		// A one-element route is the whole address — a Page or workspace slug —
		// so the head is all there is to compare.
		if (mine.length === 1 || now.length === 1) {
			return mine.length === now.length && slugify(mine[0]) === slugify(now[0]);
		}

		// Anything longer names its target after the head, and the head alone is
		// shared by every entry of that kind: matching on it would mark every
		// list in the sidebar active the moment any list was open.
		return slugify(mine[0]) === slugify(now[0]) && slugify(mine[1]) === slugify(now[1]);
	}

	function itemKind(entry) {
		if (entry.kind === "report" || entry.kind === "setup") return entry.kind;
		if (entry.type === "Report") return "report";
		if (/Settings$/.test(entry.label || "")) return "setup";
		return entry.kind || "operate";
	}

	function areaIsMixed(items) {
		var seen = {};
		(items || []).forEach(function (item) {
			seen[item.kind || "operate"] = true;
		});
		return Object.keys(seen).length > 1;
	}

	function eachKind(items, mixed, write) {
		[
			{ kind: "operate", label: "" },
			{ kind: "report", label: "Reports" },
			{ kind: "setup", label: "Setup" },
		].forEach(function (bucket) {
			var rows = (items || []).filter(function (item) {
				return (item.kind || "operate") === bucket.kind;
			});
			if (!rows.length) return;
			write(bucket, rows, mixed && bucket.label);
		});
	}

	function navItem(entry) {
		var kind = itemKind(entry);

		// An external link has no route and no place on screen to be "current",
		// so it carries a url instead of a key and opens in its own tab.
		if (entry.type === "URL") {
			return {
				id: "url:" + entry.url,
				key: "",
				label: entry.label,
				sub: "Link",
				hue: hue(entry.url || entry.label),
				icon: resolveIcon(entry.icon, entry.label, "link"),
				act: "url",
				url: entry.url,
				kind: kind,
			};
		}

		return {
			id: (NAV_ID_PREFIX[entry.type] || "list:") + entry.to,
			key: navTargetKey(entry.type, entry.to),
			label: entry.label,
			sub: kind === "report" ? "Report" : NAV_SUB[entry.type] || "List",
			hue: hue(entry.to),
			icon: resolveIcon(entry.icon, entry.label, kind === "report" ? "report" : ""),
			act: "route",
			route: entry.route,
			kind: kind,
		};
	}

	/* Where the menu's own name points. A configured menu says so outright; a
	   workspace-derived one is named after the workspace it came from, so the
	   slug of that name is the answer. */
	function routeFromDeclared(declared) {
		if (!declared) return null;
		if (hasRoute(declared)) return declared.route;
		var type = declared.type;
		var to = declared.to;
		if (!to) return null;
		// Only targets the client can form without a server round-trip.
		if (type === "Workspace") return [slugify(to)];
		if (type === "DocType") return ["List", to];
		if (type === "Dashboard") return ["dashboard-view", to];
		return null;
	}

	/* The first place a module should open. Configured menus must not fall back
	   to their record name: after hash autoname that slug is not a Page. */
	function overviewItem(menu, declared) {
		var route = routeFromDeclared(declared);
		if (!route && nav.source === "auto" && menu.name) {
			route = [slugify(menu.name)];
		}
		if (!route) return null;

		var item = navItem({
			type: (declared && declared.type) || "Workspace",
			to: (declared && declared.to) || menu.name,
			label: menu.label + " overview",
			route: route,
			kind: "operate",
		});
		item.icon = menu.icon;
		return item;
	}

	/* Where a menu opens when its own name is clicked. Overview is optional:
	   a URL-only menu (every item an external link, no Overview Link To) has
	   none, and must still be openable rather than dead. */
	function menuLanding(menu) {
		if (!menu) return null;
		if (hasRoute(menu.overview)) return menu.overview;

		var found = null;
		(menu.columns || []).forEach(function (column) {
			(column.items || []).forEach(function (item) {
				if (found) return;
				if (hasRoute(item) || (item && item.act === "url" && item.url)) found = item;
			});
		});
		return found;
	}

	/* One index from every entry to the menu that holds it, so both the bar and
	   the sidebar can tell which module the current page belongs to. First
	   mention wins: a doctype reached from two modules belongs to the earlier,
	   which is the order the desk itself lists them in. */
	function buildNavModel(payload) {
		// Which mode produced this, so the builder can say so and the bar can
		// stay honest about whether it maintains itself.
		nav.source = payload.source || "auto";

		/* One malformed menu must not cost the site its whole bar. Each record
		   is built on its own, and a record that throws is dropped instead of
		   aborting the loop — the bar then renders every menu that is fine. */
		nav.menus = (payload.menus || [])
			.map(function (menu) {
				try {
					var built = {
						name: menu.name,
						label: menu.label,
						module: menu.module || "",
						slug: slugify(menu.name),
						icon: resolveIcon(menu.icon, menu.label, menu.module),
						hue: hue(menu.name),
						columns: (menu.columns || []).map(function (column) {
							return {
								title: column.title || menu.label,
								items: (column.items || []).map(navItem),
							};
						}),
					};
					// Optional by design: URL-only menus send overview: null.
					built.overview = overviewItem(built, menu.overview) || null;
					return built;
				} catch (e) {
					console.warn("Kaiten: skipped a nav menu that could not be built", menu && menu.name, e);
					return null;
				}
			})
			.filter(Boolean);

		nav.byKey = {};
		nav.menus.forEach(function (menu) {
			function remember(item) {
				if (!item || !item.key) return;
				if (!nav.byKey[item.key]) nav.byKey[item.key] = menu.name;
				// Pages are keyed as page:<Page.name> but the desk route is a
				// single slug. Index both so the sidebar can highlight them.
				if (item.key.indexOf("page:") === 0) {
					var raw = item.key.slice(5);
					var slug = slugify(raw);
					if (!nav.byKey["page:" + slug]) nav.byKey["page:" + slug] = menu.name;
					if (!nav.byKey["ws:" + slug]) nav.byKey["ws:" + slug] = menu.name;
					if (!nav.byKey["ws:" + raw]) nav.byKey["ws:" + raw] = menu.name;
				}
			}
			remember(menu.overview);
			menu.columns.forEach(function (column) {
				column.items.forEach(remember);
			});
		});
	}

	function menuByName(name) {
		for (var i = 0; i < nav.menus.length; i++) {
			if (nav.menus[i].name === name) return nav.menus[i];
		}
		return null;
	}

	/* Whatever is on screen, keyed the same way the entries are. */
	function routeTargetKey() {
		var route = [];
		try {
			route = frappe.get_route() || [];
		} catch (e) {}
		if (!route.length) return "";

		var head = String(route[0] || "");
		if (head === "query-report") return "rep:" + route[1];
		if (head === "List" && route[2] === "Report") return "rep:" + route[3];
		if (head === "List" || head === "Form" || head === "Tree" || head === "print") return "dt:" + route[1];
		if (head === "dashboard-view" || head === "Dashboard") return "dash:" + (route[1] || "");

		// A workspace arrives as ["Workspaces", "Buying"] even though its URL is
		// /desk/buying, so the name has to be read off the second element.
		if (head === "Workspaces") return "ws:" + slugify(route[1] || "");

		// Custom Page: ["gem-rate-approval"]. Nav keys are page:<Page.name>.
		var slug = slugify(head);
		var candidates = ["page:" + head, "page:" + slug, "ws:" + slug, "ws:" + head];
		for (var i = 0; i < candidates.length; i++) {
			if (nav.byKey && nav.byKey[candidates[i]]) return candidates[i];
		}

		if (nav.menus) {
			for (var m = 0; m < nav.menus.length; m++) {
				var menu = nav.menus[m];
				var pool = [];
				if (menu.overview) pool.push(menu.overview);
				(menu.columns || []).forEach(function (column) {
					(column.items || []).forEach(function (item) {
						pool.push(item);
					});
				});
				for (var j = 0; j < pool.length; j++) {
					var item = pool[j];
					if (!item || !item.key) continue;
					var first = item.route && item.route[0] ? String(item.route[0]) : "";
					if (first === head || slugify(first) === slug) return item.key;
				}
			}
		}

		return "ws:" + slug;
	}

	function activeMenuName() {
		var found = nav.byKey[routeTargetKey()];
		if (found) return found;

		// A page no menu claims — a dashboard, a custom page, a form of a
		// doctype nobody linked — must not blank the sidebar, so whichever
		// module was last in view stays put.
		return nav.active && menuByName(nav.active) ? nav.active : "";
	}

	function paintNavActive() {
		if (!el.navBtns) return;
		var active = activeMenuName();
		var openName = nav.dropFor || (moduleMegaOpen() ? state.activeKey : "");
		Object.keys(el.navBtns).forEach(function (name) {
			el.navBtns[name].classList.toggle("is-active", name === active);
			el.navBtns[name].classList.toggle("aur-open", Boolean(openName) && name === openName);
		});
	}

	/* ---- the dropdown ---- */

	function closeNavDrop() {
		if (nav.drop) {
			nav.drop.remove();
			nav.drop = null;
		}
		if (nav.dropBtn) nav.dropBtn.classList.remove("is-open", "aur-open");
		nav.dropBtn = null;
		nav.dropFor = "";
	}

	/* Anything that hangs below the chrome needs one answer for where the chrome
	   ends, and on a phone that is a two-row bar with a rate ticker under it —
	   not the height of whichever button was clicked. */
	function chromeBottom() {
		var bottom = 0;
		[el.navBar, el.bar, el.rateBar].forEach(function (node) {
			if (!node || !node.getBoundingClientRect) return;
			var box = node.getBoundingClientRect();
			if (box.height && box.bottom > bottom) bottom = box.bottom;
		});
		return Math.round(bottom);
	}

	function placeNavDrop() {
		if (!nav.drop || !nav.dropBtn || !el.navBar) return;

		var bar = el.navBar.getBoundingClientRect();

		if (isNarrow()) {
			var sheetTop = Math.max(Math.round(bar.bottom), chromeBottom());
			nav.drop.classList.add("is-sheet");
			nav.drop.style.top = sheetTop + "px";
			nav.drop.style.left = "0px";
			nav.drop.style.right = "0px";
			nav.drop.style.width = "100%";
			nav.drop.style.maxWidth = "100%";
			nav.drop.style.maxHeight = Math.max(200, window.innerHeight - sheetTop) + "px";
			return;
		}

		nav.drop.classList.remove("is-sheet");

		var box = nav.dropBtn.getBoundingClientRect();
		var width = nav.drop.offsetWidth || 520;
		nav.drop.style.right = "";
		nav.drop.style.width = "";
		nav.drop.style.maxWidth = "";
		nav.drop.style.top = Math.round(bar.bottom + 6) + "px";
		nav.drop.style.left = Math.round(clamp(box.left - 12, 10, Math.max(10, window.innerWidth - width - 10))) + "px";
		nav.drop.style.maxHeight = Math.max(220, window.innerHeight - bar.bottom - 24) + "px";
	}

	function pinStar(item, extraClass) {
		var star = make("button", {
			class: "knav-star" + (extraClass ? " " + extraClass : "") + (isPinned(item.id) ? " is-on" : ""),
			type: "button",
			title: "Pin this entry",
			"aria-label": "Pin " + item.label,
			"data-pin-id": item.id,
			text: "\u2605",
		});
		star.addEventListener("click", function (event) {
			event.preventDefault();
			event.stopPropagation();
			togglePin(item, star);
		});
		return star;
	}

	function paintPinStars() {
		Array.prototype.forEach.call(document.querySelectorAll("[data-pin-id]"), function (star) {
			star.classList.toggle("is-on", isPinned(star.getAttribute("data-pin-id")));
		});
	}

	function navLink(item) {
		var node = make("a", { class: "knav-link", href: hrefFor(item), title: item.label }, [
			iconNode(item.icon, "knav-link-glyph"),
			make("span", { class: "knav-link-label", text: item.label }),
			pinStar(item),
		]);

		node.addEventListener("click", function (event) {
			// Modified clicks stay the browser's, so an entry opens in a new tab
			// like any other link.
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
			event.preventDefault();
			closeNavDrop();
			runItem(item);
		});

		return node;
	}

	function openNavDrop(menu, btn) {
		closeNavDrop();
		closeMobileDrawer();
		if (!menu.columns.length) return;

		var cols = make("div", { class: "knav-drop-cols" });

		menu.columns.forEach(function (column, index) {
			var parts = [make("div", { class: "knav-col-title", text: column.title })];

			// The workspace itself is reachable from the menu that represents it,
			// which is where a user goes looking for the module's own dashboard.
			if (index === 0 && menu.name !== "__more") {
				var landing = menuLanding(menu);
				var already = landing && (column.items || []).some(function (item) {
					return (landing.id && item.id === landing.id) || (landing.key && item.key === landing.key);
				});
				if (landing && !already) parts.push(navLink(landing));
			}

			eachKind(column.items, areaIsMixed(column.items), function (bucket, rows, heading) {
				if (heading) parts.push(make("div", { class: "knav-sub", text: heading }));
				rows.forEach(function (item) {
					parts.push(navLink(item));
				});
			});

			cols.appendChild(make("div", { class: "knav-col" }, parts));
		});

		nav.drop = make("div", { class: "knav-drop" }, [cols]);
		document.body.appendChild(nav.drop);

		/* The lane count is set here rather than left to auto-fill, which cannot
		   work out a width for a panel that is itself sized to its contents: it
		   collapsed every menu to two narrow columns and made them scroll. */
		var lanes = Math.max(1, Math.min(menu.columns.length, 6, Math.floor((window.innerWidth - 40) / 212)));
		nav.drop.style.setProperty("--knav-cols", String(lanes));

		nav.dropFor = menu.name;
		nav.dropBtn = btn;
		btn.classList.add("is-open", "aur-open");
		placeNavDrop();
	}

	/* ---------------------------------------------------------------------
	   The workspace-grid presentation

	   The grid view is the command bar's mega menu, shown from the module bar
	   with the module content as its data (the "shellnav" source in groupsFor).
	   Reusing that panel is what makes the tiles, the "New" chip, the filter
	   and the whole keyboard match the command menu exactly, rather than a
	   look-alike built beside it.
	   ------------------------------------------------------------------ */

	function moduleMegaOpen() {
		return megaOpen() && state.activeTab === "shellnav";
	}

	function openModuleMega(menu, btn) {
		closeNavDrop();
		closeMobileDrawer();
		if (!nav.menus.length) return;

		// openTab renders the rail from groupsFor("shellnav"), opens the panel
		// under whichever bar is mounted and selects the first group; the
		// clicked module is then brought to the front.
		openTab("shellnav");
		if (menu && menuByName(menu.name)) selectGroup("shellnav", menu.name);
		paintNavActive();
	}

	/* The menu behind a button is looked up when it is opened rather than closed
	   over, because the overflow button's contents depend on how many of the
	   others currently fit. */
	function navMenuButton(name, label, icon, getMenu) {
		var btn = make("button", { class: "aur-tab knav-menu", type: "button", title: label }, [
			iconNode(icon, "aur-tab-glyph knav-menu-glyph"),
			make("span", { class: "knav-menu-label", text: label }),
		]);

		// The overflow button always drops a list — the mega already lists every
		// module in its rail, so routing __more through the mega would just select
		// the first module rather than showing the overflow set.
		var isOverflow = name === "__more";

		var open = function () {
			var menu = getMenu();
			if (!menu) return;
			if (!isOverflow && currentNavView() === "grid") openModuleMega(menu, btn);
			else openNavDrop(menu, btn);
		};

		btn.addEventListener("click", function (event) {
			event.stopPropagation();

			// In the grid the mega already lists every module down its rail, so a
			// top button re-focuses its module rather than opening a second
			// panel — and clicking the module already shown closes it.
			if (!isOverflow && currentNavView() === "grid" && moduleMegaOpen()) {
				var menu = getMenu();
				if (menu && state.activeKey === menu.name) return closeMega();
				if (menu) return selectGroup("shellnav", menu.name);
			}

			if (nav.dropFor === name) closeNavDrop();
			else open();
		});

		// Once one menu is open, sweeping the bar swaps what is underneath, the
		// way a desktop menu bar does. Nothing opens on hover from closed.
		btn.addEventListener("mouseenter", function () {
			if (isNarrow()) return;
			if (!isOverflow && currentNavView() === "grid" && moduleMegaOpen()) {
				var menu = getMenu();
				if (menu && state.activeKey !== menu.name) {
					selectGroup("shellnav", menu.name);
					paintNavActive();
				}
				return;
			}
			if (nav.drop && nav.dropFor !== name) open();
		});

		return btn;
	}

	/* Sites routinely carry forty-odd workspaces and a bar cannot show them all,
	   so whatever did not fit folds into one menu of plain workspace links. */
	function overflowMenu() {
		var menus = nav.overflow
			.map(menuByName)
			.filter(function (menu) {
				return Boolean(menu);
			});

		if (!menus.length) return null;

		var columns = [];
		var size = 12;

		for (var i = 0; i < menus.length; i += size) {
			columns.push({
				title: columns.length ? "\u00a0" : "More modules",
				items: menus.slice(i, i + size).map(menuLanding).filter(Boolean),
			});
		}

		return { name: "__more", label: "More", module: "", slug: "", columns: columns, overview: null };
	}

	function renderNavMenus() {
		if (!el.navMenus) return;

		el.navMenus.innerHTML = "";
		el.navBtns = {};
		nav.overflow = [];

		nav.menus.forEach(function (menu) {
			var btn = navMenuButton(menu.name, menu.label, menu.icon, function () {
				return menu;
			});
			el.navBtns[menu.name] = btn;
			el.navMenus.appendChild(btn);
		});

		var more = navMenuButton("__more", "More", resolveIcon("ellipsis", "more", ""), overflowMenu);
		more.classList.add("knav-more");
		el.navBtns.__more = more;
		el.navMenus.appendChild(more);

		fitNavMenus();
		paintNavActive();
	}

	/* How many menus the bar shows is a question about pixels, not a number
	   picked in advance: the labels are the site's own and a fixed count either
	   left the bar half empty or ran it off the edge, where the strip clips and
	   the rest vanished with nothing to say they were there. */
	function fitNavMenus() {
		if (!el.navMenus || !el.navBtns) return;

		var more = el.navBtns.__more;
		var entries = nav.menus
			.map(function (menu) {
				return { name: menu.name, node: el.navBtns[menu.name] };
			})
			.filter(function (entry) {
				return Boolean(entry.node);
			});

		// Measured with everything showing, or each pass would measure a bar the
		// previous pass had already trimmed and the strip would creep inward.
		entries.forEach(function (entry) {
			entry.node.hidden = false;
		});
		if (more) more.hidden = false;

		/* On a phone the strip is a row of its own and scrolls sideways, so
		   every module stays reachable by swiping and there is nothing for an
		   overflow menu to hold. */
		if (isNarrow()) {
			nav.overflow = [];
			if (more) more.hidden = true;
			return;
		}

		var available = el.navMenus.clientWidth;
		if (!available) return;

		entries.forEach(function (entry) {
			entry.width = entry.node.offsetWidth + 2;
		});

		var reserve = more ? more.offsetWidth + 2 : 0;
		var budget = available - reserve;

		/* The module you are in keeps its place whatever else fits. It carries
		   the "you are here" rule, and a site whose workspace order puts it late
		   would otherwise hide the one menu the user most needs to see. */
		var active = activeMenuName();
		var held = null;
		entries.forEach(function (entry) {
			if (entry.name === active) held = entry;
		});
		if (held) budget -= held.width;

		var used = 0;
		var overflow = [];

		entries.forEach(function (entry) {
			if (entry === held) return;

			// Once one has dropped out, the rest follow: keeping a later, shorter
			// label would reorder the bar against the desk's own sequence.
			if (overflow.length || used + entry.width > budget) {
				overflow.push(entry.name);
				entry.node.hidden = true;
				return;
			}

			used += entry.width;
		});

		nav.overflow = overflow;
		if (more) more.hidden = !overflow.length;
	}

	/* ---- the context sidebar ---- */

	function sideCollapsed() {
		return localStorage.getItem(KEY.navSide) === "1";
	}

	function applySideCollapsed() {
		applyNarrow();

		if (isNarrow()) {
			var open = !!nav.drawerOpen && root.classList.contains("kaiten-side-on");
			if (el.side) el.side.classList.toggle("is-collapsed", !open);
			root.classList.toggle("kaiten-side-collapsed", !open);
			root.classList.toggle("kaiten-drawer-open", open);
			if (el.sideScrim) el.sideScrim.hidden = !open;
			if (el.sideToggle) {
				el.sideToggle.hidden = !root.classList.contains("kaiten-side-on");
				el.sideToggle.setAttribute("aria-expanded", open ? "true" : "false");
			}
			return;
		}

		root.classList.remove("kaiten-drawer-open");
		if (el.sideScrim) el.sideScrim.hidden = true;
		if (el.sideToggle) el.sideToggle.hidden = true;

		var on = sideCollapsed();
		if (el.side) el.side.classList.toggle("is-collapsed", on);
		root.classList.toggle("kaiten-side-collapsed", on);
	}

	function setSideCollapsed(on) {
		if (isNarrow()) {
			nav.drawerOpen = !on;
			applySideCollapsed();
			return;
		}
		localStorage.setItem(KEY.navSide, on ? "1" : "0");
		applySideCollapsed();
		schedulePush();
	}

	function closeMobileDrawer() {
		if (!isNarrow() || !nav.drawerOpen) return;
		nav.drawerOpen = false;
		applySideCollapsed();
	}

	function sideLink(item, active) {
		// The same coloured tile the grid cards carry, so the rail and the
		// launcher read as one system. The hue rides on the row as --h, exactly
		// as it does on a mega item.
		var node = make(
			"a",
			{ class: "kside-item" + (active ? " is-active" : ""), href: hrefFor(item), title: item.label, "--h": String(item.hue) },
			[
				make("span", { class: "kside-item-icon" }, [iconNode(item.icon, "kside-item-glyph")]),
				make("span", { class: "kside-item-label", text: item.label }),
				pinStar(item),
			]
		);

		node.addEventListener("click", function (event) {
			if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
			event.preventDefault();
			closeMobileDrawer();
			runItem(item);
		});

		return node;
	}

	function buildSide() {
		el.sideIcon = make("span", { class: "kside-head-icon" });
		el.sideTitle = make("span", { class: "kside-title" });

		var head = make("button", { class: "kside-head", type: "button", title: "Open this module" }, [el.sideIcon, el.sideTitle]);
		el.sideHead = head;
		head.addEventListener("click", function () {
			var menu = menuByName(activeMenuName());
			var landing = menuLanding(menu);
			if (landing) runItem(landing);
		});

		var collapse = make("button", {
			class: "kside-collapse",
			type: "button",
			title: "Collapse sidebar",
			"aria-label": "Collapse sidebar",
			text: "\u2039",
		});
		collapse.addEventListener("click", function (event) {
			event.stopPropagation();
			setSideCollapsed(!sideCollapsed());
		});

		el.sidePin = make("span", { class: "kside-pin-slot" });
		el.sideBody = make("div", { class: "kside-body" });
		el.side = make("aside", { class: "kside", "aria-label": "Module navigation" }, [
			make("div", { class: "kside-top" }, [head, el.sidePin, collapse]),
			el.sideBody,
		]);

		el.sideScrim = make("button", {
			class: "kside-scrim",
			type: "button",
			hidden: "hidden",
			"aria-label": "Close module menu",
		});
		el.sideScrim.addEventListener("click", function () {
			closeMobileDrawer();
		});
		document.body.appendChild(el.sideScrim);

		mountSide();
		applySideCollapsed();
	}

	/* The desk's own sidebar sits in a flex row and reserves its width in flow.
	   Taking that slot means the page beside it needs no offset at all, which is
	   the difference between a rail that behaves and one that overlaps content
	   on every layout the desk has. Only if that row is missing does the panel
	   float, and then the offset is put back by hand. */
	function mountSide() {
		var host = document.querySelector(".body-sidebar-container");
		if (host && host.parentNode) {
			host.parentNode.insertBefore(el.side, host);
			return;
		}

		var body = document.getElementById("body");
		if (body && body.parentNode) {
			el.side.classList.add("kside-floating");
			body.classList.add("kside-pushed");
			body.parentNode.insertBefore(el.side, body);
			return;
		}

		el.side.classList.add("kside-floating");
		document.body.appendChild(el.side);
	}

	function renderSide() {
		if (!el.sideBody) return;

		var menu = menuByName(activeMenuName());
		root.classList.toggle("kaiten-side-on", Boolean(menu));

		if (!menu) {
			el.sideBody.innerHTML = "";
			el.sideTitle.textContent = "";
			el.sideIcon.textContent = "";
			if (el.sidePin) el.sidePin.innerHTML = "";
			nav.drawerOpen = false;
			applySideCollapsed();
			return;
		}

		// Named for the workspace it opens, which also keeps it distinct from the
		// group below that Frappe often gives the same name as the module.
		el.sideTitle.textContent = menu.label + " overview";
		if (el.sideHead) el.sideHead.style.setProperty("--h", String(menu.hue != null ? menu.hue : hue(menu.label)));
		el.sideIcon.textContent = "";
		el.sideIcon.appendChild(iconNode(menu.icon, "kside-head-glyph"));
		if (el.sidePin) {
			el.sidePin.innerHTML = "";
			if (menu.overview && hasRoute(menu.overview)) el.sidePin.appendChild(pinStar(menu.overview, "kside-head-star"));
		}

		var here = routeTargetKey();
		el.sideBody.innerHTML = "";

		// Standard look lays every area out in full, each under its own title —
		// the classic ERP sidebar — instead of the grid's pills-and-one-area.
		if (currentNavView() === "dropdown") {
			menu.columns.forEach(function (column) {
				el.sideBody.appendChild(make("div", { class: "kside-area", text: column.title }));
				eachKind(column.items, areaIsMixed(column.items), function (bucket, rows, heading) {
					if (heading) el.sideBody.appendChild(make("div", { class: "kside-sub", text: heading }));
					var list = make("div", { class: "kside-items" });
					rows.forEach(function (item) {
						list.appendChild(sideLink(item, itemMatchesRoute(item, here)));
					});
					el.sideBody.appendChild(list);
				});
			});
			paintNavActive();
			applySideCollapsed();
			return;
		}

		// One area at a time. A module here can carry eight groups of nine links,
		// and an accordion of all of them is a rail nobody reads to the bottom.
		// The pills name every area in two or three rows; the list below shows
		// only the one in hand.
		var holder = menu.columns.findIndex(function (column) {
			return column.items.some(function (item) {
				return itemMatchesRoute(item, here);
			});
		});

		/* Which area to show is a negotiation between the route and the user.
		   Landing on a page opens the area holding it, but browsing the pills
		   afterwards has to stick — so the pick is remembered against the route
		   it was made on, and only a move to a different page hands the choice
		   back to the route. */
		var picked = nav.area[menu.name];
		var chosen;
		if (picked && picked.route === here) chosen = picked.index;
		else if (holder > -1) chosen = holder;
		else if (picked) chosen = picked.index;
		else chosen = 0;

		if (chosen >= menu.columns.length) chosen = 0;
		nav.area[menu.name] = { index: chosen, route: here };

		if (menu.columns.length > 1) {
			var pills = make("div", { class: "kside-pills" });
			menu.columns.forEach(function (column, index) {
				var pill = make("button", {
					class: "kside-pill" + (index === chosen ? " is-on" : ""),
					type: "button",
					title: column.title + " \u2014 " + column.items.length + " page(s)",
					text: column.title,
					"--h": String(hue(column.title)),
				});
				pill.addEventListener("click", function () {
					nav.area[menu.name] = { index: index, route: routeTargetKey() };
					renderSide();
				});
				pills.appendChild(pill);
			});

			el.sideBody.appendChild(make("div", { class: "kside-label", text: "Areas" }));
			el.sideBody.appendChild(pills);
		}

		var column = menu.columns[chosen];
		if (!column) {
			paintNavActive();
			return;
		}

		el.sideBody.appendChild(make("div", { class: "kside-area", text: column.title }));

		// Reports and setup sit under their own headings, the way an ERP sidebar
		// separates what you work in from what you configure. A heading is only
		// drawn when the area is mixed — an all-reports menu does not need a
		// Reports line above every list.
		eachKind(column.items, areaIsMixed(column.items), function (bucket, rows, heading) {
			if (heading) el.sideBody.appendChild(make("div", { class: "kside-sub", text: heading }));

			var list = make("div", { class: "kside-items" });
			rows.forEach(function (item) {
				list.appendChild(sideLink(item, itemMatchesRoute(item, here)));
			});
			el.sideBody.appendChild(list);
		});

		paintNavActive();
		applySideCollapsed();
	}

	/* Called on every route change, in both shells: the command bar ignores it
	   because it has no sidebar to re-scope. */
	function syncNavToRoute() {
		if (!el.navMenus) return;

		var name = activeMenuName();
		if (name) nav.active = name;

		closeNavDrop();
		closeMobileDrawer();

		// The bar holds a place for whichever module is active, so which of the
		// others fit has to be settled again every time that changes — otherwise
		// navigating within the desk leaves the new module hidden behind More.
		fitNavMenus();
		renderSide();
	}

	/* ---- the bar ---- */

	function companyName() {
		try {
			var company = (frappe.boot && frappe.boot.sysdefaults && frappe.boot.sysdefaults.company) || "";
			return String(company).trim();
		} catch (e) {
			return "";
		}
	}

	function navTabBtn(id, label, icon) {
		var btn = make("button", { class: "aur-tab knav-tab", type: "button", title: label }, [
			iconNode(icon, "aur-tab-glyph knav-tab-glyph"),
			make("span", { class: "knav-tab-label", text: label }),
			make("span", { class: "aur-tab-count", text: "\u2026" }),
		]);

		btn.addEventListener("click", function (event) {
			event.stopPropagation();
			closeNavDrop();
			toggleTab(id);
		});

		el.tabNodes[id] = btn;
		return btn;
	}

	/* ---------------------------------------------------------------------
	   Nav builder
	   ---------------------------------------------------------------------
	   The bar can be described by Kaiten Nav Menu records instead of derived
	   from Workspaces. Editing those is ordinary desk work, so this does not
	   reimplement a form — it explains which mode the site is in, offers the
	   one action that is awkward from a list view (writing the first draft from
	   the menu that already exists), and hands over to the list.
	   ------------------------------------------------------------------ */

	function navBuilderLine(label, value) {
		return make("div", { class: "knb-line" }, [
			make("span", { class: "knb-line-label", text: label }),
			make("span", { class: "knb-line-value", text: value }),
		]);
	}

	function openNavBuilder() {
		if (!window.frappe || !frappe.ui || !frappe.ui.Dialog) {
			frappe.set_route("List", "Kaiten Nav Menu");
			return;
		}

		var configured = nav.source === "config";

		var dialog = new frappe.ui.Dialog({
			title: "Customise the menu",
			size: "large",
			fields: [{ fieldtype: "HTML", fieldname: "body" }],
		});

		var body = make("div", { class: "knb" });

		body.appendChild(
			make("p", {
				class: "knb-note",
				text: configured
					? "This site's bar is built from Kaiten Nav Menu records. Edit them to rename menus, regroup links, or limit a menu to certain roles."
					: "This site's bar is derived from its Workspaces, so it follows the site on its own. Write it into records to take control of the order, the wording and the grouping.",
			})
		);

		body.appendChild(
			make("div", { class: "knb-stats" }, [
				navBuilderLine("Source", configured ? "Kaiten Nav Menu records" : "Workspaces (automatic)"),
				navBuilderLine("Menus on the bar", String((nav.menus || []).length)),
				navBuilderLine(
					"Links you can reach",
					String(
						(nav.menus || []).reduce(function (sum, menu) {
							return (
								sum +
								menu.columns.reduce(function (inner, column) {
									return inner + column.items.length;
								}, 0)
							);
						}, 0)
					)
				),
			])
		);

		var actions = make("div", { class: "knb-actions" });

		var draft = make("button", {
			class: "btn btn-primary btn-sm",
			type: "button",
			text: configured ? "Rewrite from Workspaces" : "Write the first draft from Workspaces",
		});
		draft.addEventListener("click", function () {
			var warn = configured
				? "Replace every Kaiten Nav Menu record with a fresh copy of the Workspace menu? Any editing you have done is lost."
				: "Create one Kaiten Nav Menu record per Workspace menu, ready to edit?";

			frappe.confirm(warn, function () {
				draft.disabled = true;
				frappe
					.xcall("kaiten_erp_ui_themes.api.generate_nav_from_workspaces", { overwrite: 1 })
					.then(function (result) {
						frappe.show_alert({
							message: "Wrote " + result.menus + " menus. Edit them, then reload.",
							indicator: "green",
						});
						dialog.hide();
						loadShellNav(1);
					})
					.catch(function () {
						draft.disabled = false;
					});
			});
		});
		actions.appendChild(draft);

		var presets = make("div", { class: "knb-presets" });
		body.appendChild(
			make("p", {
				class: "knb-note knb-note-tight",
				text: "Or start from a trade preset. It writes the same records, already grouped the way that business talks.",
			})
		);
		body.appendChild(presets);

		frappe.xcall("kaiten_erp_ui_themes.api.list_presets").then(function (list) {
			(list || []).forEach(function (preset) {
				var btn = make("button", {
					class: "btn btn-default btn-sm",
					type: "button",
					text: "Use " + preset.label + " preset (" + preset.menus + " menus)",
				});
				btn.addEventListener("click", function () {
					frappe.confirm(
						"Replace the current bar with the " + preset.label + " preset? Any editing you have done is lost. Links this site does not have are skipped.",
						function () {
							btn.disabled = true;
							frappe
								.xcall("kaiten_erp_ui_themes.api.install_preset", { name: preset.name, overwrite: 1 })
								.then(function (result) {
									frappe.show_alert({
										message: "Installed " + result.menus + " menus" + (result.skipped ? " (" + result.skipped + " links this site does not have were skipped)" : "") + ".",
										indicator: "green",
									});
									dialog.hide();
									loadShellNav(1);
								})
								.catch(function () {
									btn.disabled = false;
								});
						}
					);
				});
				presets.appendChild(btn);
			});
		});

		var edit = make("button", { class: "btn btn-default btn-sm", type: "button", text: "Open the menu list" });
		edit.addEventListener("click", function () {
			dialog.hide();
			frappe.set_route("List", "Kaiten Nav Menu");
		});
		actions.appendChild(edit);

		if (configured) {
			// Drift is the one real cost of a hand-built bar, so it is one click
			// away rather than something to remember to look for.
			var check = make("button", { class: "btn btn-default btn-sm", type: "button", text: "Check for new links" });
			check.addEventListener("click", function () {
				check.disabled = true;
				frappe
					.xcall("kaiten_erp_ui_themes.api.nav_drift")
					.then(function (result) {
						check.disabled = false;
						var missing = result.missing || [];
						if (!missing.length) {
							frappe.show_alert({ message: "Nothing missing. The menu covers the whole site.", indicator: "green" });
							return;
						}
						frappe.msgprint({
							title: "Not on your bar yet",
							message:
								"<p>" +
								missing.length +
								" link(s) exist on this site but are not in your menu:</p><ul>" +
								missing
									.slice(0, 40)
									.map(function (row) {
										return "<li><b>" + frappe.utils.escape_html(row.label || row.to) + "</b> \u2014 " + frappe.utils.escape_html(row.workspace || "") + "</li>";
									})
									.join("") +
								"</ul>" +
								(missing.length > 40 ? "<p>\u2026and " + (missing.length - 40) + " more.</p>" : ""),
						});
					})
					.catch(function () {
						check.disabled = false;
					});
			});
			actions.appendChild(check);
		}

		body.appendChild(actions);
		dialog.fields_dict.body.$wrapper.append(body);
		dialog.show();
	}

	/* ---------------------------------------------------------------------
	   Rate ticker
	   ---------------------------------------------------------------------
	   A strip under the bar carrying the day's metal rates. It is optional in
	   the strictest sense: the feed is empty on any site without a rate
	   sheet, and an empty feed draws nothing and reserves no height, so this
	   costs a non-jewellery desk one cached call and no pixels.
	   ------------------------------------------------------------------ */

	// Rates move during the day but not by the second.
	var RATE_POLL_MS = 5 * 60 * 1000;

	function rateGlyphKind(label) {
		var text = String(label || "").toLowerCase();
		if (text.indexOf("gold") > -1) return "gold";
		if (text.indexOf("silver") > -1) return "silver";
		if (text.indexOf("platinum") > -1) return "platinum";
		return "neutral";
	}

	function rateMoney(value) {
		// The global format_currency returns plain text. frappe.format with a
		// Currency fieldtype wraps the number in a right-aligned div, which would
		// land in the strip as markup.
		//
		// Whole rupees only: a rate board is read at a glance, and eleven metals
		// each carrying ".00" costs a lot of strip for no information.
		try {
			return window.format_currency(value, frappe.boot.sysdefaults.currency, 0);
		} catch (e) {
			return String(Math.round(Number(value) || 0));
		}
	}

	function rateTick(item) {
		var change = Number(item.change) || 0;
		var dir = change > 0 ? "up" : change < 0 ? "down" : "flat";
		var arrow = change > 0 ? "\u25B2" : change < 0 ? "\u25BC" : "\u2014";

		var nodes = [
			make("span", { class: "krate-dot krate-" + rateGlyphKind(item.label) }),
			make("span", { class: "krate-metal", text: item.label || "" }),
			make("span", { class: "krate-value", text: rateMoney(item.rate) }),
		];

		// A flat row says so with a dash and no number: "+₹0" reads as a
		// measurement when it actually means nothing moved.
		nodes.push(
			make("span", { class: "krate-change krate-" + dir }, [
				make("span", { class: "krate-arrow", text: arrow }),
				change ? make("span", { text: rateMoney(Math.abs(change)) }) : null,
			].filter(Boolean))
		);

		return make("span", { class: "krate-tick" }, nodes);
	}

	function renderRates(payload) {
		if (!el.rateTrack) return;

		var items = (payload && payload.items) || [];
		el.rateTrack.textContent = "";

		if (!items.length) {
			root.classList.remove("kaiten-rate-on");
			return;
		}

		items.forEach(function (item) {
			el.rateTrack.appendChild(rateTick(item));
		});

		if (payload.rate_date) {
			el.rateBar.setAttribute("title", "Rates as of " + payload.rate_date);
		}

		root.classList.add("kaiten-rate-on");
	}

	function loadRates(refresh) {
		if (!window.frappe || !frappe.xcall) return;

		frappe
			.xcall("kaiten_erp_ui_themes.api.get_rate_ticker", refresh ? { refresh: 1 } : {})
			.then(renderRates)
			.catch(function () {
				// A missing feed is the normal case, not a fault worth logging.
				root.classList.remove("kaiten-rate-on");
			});
	}

	function buildRateBar() {
		el.rateTrack = make("div", { class: "krate-track" });
		el.rateBar = make("div", { class: "krate", role: "status", "aria-live": "polite" }, [
			make("span", { class: "krate-live" }, [
				make("span", { class: "krate-pulse" }),
				make("span", { text: "Live" }),
			]),
			make("div", { class: "krate-viewport" }, [el.rateTrack]),
		]);

		if (el.rateTimer) clearInterval(el.rateTimer);
		el.rateTimer = setInterval(function () {
			loadRates(1);
		}, RATE_POLL_MS);

		return el.rateBar;
	}

	function buildModuleNav(anchor) {
		var brand = buildSharedBrand();

		el.navMenus = make("nav", { class: "knav-menus aur-nav", "aria-label": "Modules" });

		el.sideToggle = make("button", {
			class: "knav-side-toggle",
			type: "button",
			hidden: "hidden",
			title: "Open module menu",
			"aria-label": "Open module menu",
			"aria-expanded": "false",
			text: "\u2630",
		});
		el.sideToggle.addEventListener("click", function (event) {
			event.stopPropagation();
			setSideCollapsed(nav.drawerOpen);
		});

		el.tabNodes = {};
		var pinnedBtn = navTabBtn("pinned", "Pinned", "star");
		var recentBtn = navTabBtn("recent", "Recent", "history");
		var tools = buildSharedTools();

		el.navBar = make("div", { class: "knav aur-bar" }, [
			make("div", { class: "aur-bar-progress" }),
			make("div", { class: "knav-inner aur-bar-inner" }, [
				el.sideToggle,
				brand,
				el.navMenus,
				make("div", { class: "knav-right aur-bar-right" }, [
					tools.searchWrap,
					pinnedBtn,
					recentBtn,
					tools.pinBtn,
					tools.paletteBtn,
					tools.themeBtn,
					tools.fullBtn,
					tools.notifBtn,
					tools.userBtn,
				].filter(Boolean)),
			]),
			buildRateBar(),
		]);

		el.bar = el.navBar;
		mountBar(anchor);
		root.classList.add("kaiten-nav-on");

		buildSide();
		renderNavMenus();
		renderSide();
		loadRates(0);
	}

	function loadShellNav(refresh) {
		if (!window.frappe || !frappe.xcall) return;

		var args = { profile: currentContent() };
		if (refresh) args.refresh = 1;

		frappe
			.xcall("kaiten_erp_ui_themes.api.get_shell_nav", args)
			.then(function (payload) {
				// The bar is drawn even if the model was only partly built, so
				// one bad record can never leave the site with no navigation.
				try {
					buildNavModel(payload);
				} catch (error) {
					console.warn("Kaiten: could not build the module menu model", error);
				}
				renderNavMenus();
				syncNavToRoute();
				renderSide();
			})
			.catch(function (error) {
				console.warn("Kaiten: could not load the module menu", error);
			});
	}

	/* ---------------------------------------------------------------------
	   Mounting a shell
	   ---------------------------------------------------------------------
	   The mega panel and the document-level listeners are built once. Only the
	   bar and the sidebar belong to a shell, so only those are torn down when
	   the choice changes — no reload, and no duplicated handlers.
	   ------------------------------------------------------------------ */

	function mountShell(anchor) {
		if (!el.mega) buildMega();

		if (currentShell() === "module") buildModuleNav(anchor);
		else buildBar(anchor);

		setCounts();
		syncPinButton();
	}

	function unmountShell() {
		closeNavDrop();
		closePop();
		closeMega();

		if (el.bar && el.bar.parentNode) el.bar.parentNode.removeChild(el.bar);
		if (el.side && el.side.parentNode) el.side.parentNode.removeChild(el.side);
		if (el.sideScrim && el.sideScrim.parentNode) el.sideScrim.parentNode.removeChild(el.sideScrim);

		var pushed = document.getElementById("body");
		if (pushed) pushed.classList.remove("kside-pushed");

		// The ticker polls on a timer of its own, which would otherwise outlive
		// the bar it belongs to and keep calling after a switch to command.
		if (el.rateTimer) clearInterval(el.rateTimer);
		el.rateTimer = null;
		el.rateBar = null;
		el.rateTrack = null;

		el.bar = null;
		el.navBar = null;
		el.navMenus = null;
		el.navBtns = null;
		el.side = null;
		el.sideScrim = null;
		el.sideToggle = null;
		el.sideBody = null;
		el.sideTitle = null;
		el.sideIcon = null;
		el.pinBtn = null;
		el.search = null;
		el.paintThemeBtn = null;
		el.tabNodes = {};

		root.classList.remove("kaiten-bar-on", "kaiten-nav-on", "kaiten-side-on", "kaiten-side-collapsed", "kaiten-rate-on", "kaiten-narrow", "kaiten-drawer-open");
	}

	function remountShell() {
		if (!el.anchor) return;
		unmountShell();
		mountShell(el.anchor);
		if (currentShell() === "module") loadShellNav(0);
	}

	function bindNavDismiss() {
		document.addEventListener("click", function (event) {
			if (!nav.drop) return;
			if (nav.drop.contains(event.target)) return;
			if (el.navMenus && el.navMenus.contains(event.target)) return;
			closeNavDrop();
		});
	}

	/* ---------------------------------------------------------------------
	   Boot
	   ------------------------------------------------------------------ */

	function loadMenu(refresh) {
		frappe
			.xcall("kaiten_erp_ui_themes.api.get_menu", refresh ? { refresh: 1 } : {})
			.then(function (menu) {
				buildModel(menu);
				setCounts();
				// The star reads its id off this model, so until the model is
				// here it can only guess at one. Ask it again now.
				syncPinButton();
				if (megaOpen() && state.activeTab) renderGroups(state.activeTab);
			})
			.catch(function (error) {
				console.error("Aurora UI: could not load the menu", error);
				Object.keys(el.tabNodes).forEach(function (id) {
					var node = el.tabNodes[id].querySelector(".aur-tab-count");
					if (node) node.textContent = "!";
				});
			});
	}

	/* ---------------------------------------------------------------------
	   Workspace sidebar
	   ---------------------------------------------------------------------
	   The desk gives top-level entries an icon but leaves nested ones as bare
	   text, which is what makes an expanded tree read as a wall of labels.
	   Each undressed row gets a glyph derived from its own name, plus a hue
	   the stylesheet uses to tint its chip.
	   ------------------------------------------------------------------ */

	var SIDE_HUES = [245, 285, 325, 8, 35, 165, 192, 212, 265, 305];

	function dressSidebar() {
		var items = document.querySelector(".body-sidebar .sidebar-items");
		if (!items) return;

		var rows = items.querySelectorAll(".sidebar-item-container");
		for (var i = 0; i < rows.length; i++) {
			var row = rows[i];
			if (row.dataset.aurDressed) continue;

			var anchor = row.querySelector(".standard-sidebar-item > .item-anchor");
			if (!anchor) continue;

			var name = row.getAttribute("item-name") || "";

			var slot = anchor.querySelector(".sidebar-item-icon");
			if (!slot) {
				slot = make("span", { class: "sidebar-item-icon aur-side-icon" });
				anchor.insertBefore(slot, anchor.firstChild);
			}

			// A workspace can name an icon the sprite does not carry, which
			// renders as an empty chip. Anything unresolvable is replaced.
			var use = slot.querySelector("use");
			var named = use ? String(use.getAttribute("href") || "").replace("#icon-", "") : "";

			if (!spriteHas(named)) {
				slot.textContent = "";
				slot.appendChild(iconNode(resolveIcon("", name, "doctype")));
			}

			// Inline, so it beats the nth-child wheel in the stylesheet and
			// stays stable as the tree expands and collapses.
			row.style.setProperty("--cyc-h", SIDE_HUES[i % SIDE_HUES.length]);
			row.style.setProperty("--aur-stagger", Math.min(i, 20) * 22 + "ms");
			row.dataset.aurDressed = "1";
		}
	}

	/* The collapse and expand handles carry an aria-label but no visible name and
	   no tooltip, so a chevron is all the user has to go on. This gives each one
	   the words the stylesheet shows on hover, and a native tooltip besides. */
	function dressToggles() {
		[
			[".body-sidebar .sidebar-toggle-btn", "Collapse sidebar"],
			[".dock .dock-toggle-btn", "Expand sidebar"],
		].forEach(function (pair) {
			var button = document.querySelector(pair[0]);
			if (!button || button.dataset.aurHint === pair[1]) return;
			button.dataset.aurHint = pair[1];
			button.setAttribute("title", pair[1]);
		});
	}

	function watchSidebar() {
		var pending = null;

		var queue = function () {
			if (pending) return;
			pending = requestAnimationFrame(function () {
				pending = null;
				dressSidebar();
				dressToggles();
			});
		};

		dressSidebar();
		dressToggles();
		new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
	}

	/* ---------------------------------------------------------------------
	   Carrying the menu between machines

	   localStorage paints the bar before any round trip, but it belongs to one
	   browser profile on one machine: a new laptop showed an empty Pinned tab.
	   The server holds the durable copy, and the later of the two revisions
	   wins. Pushes stay disabled until the first pull answers, so a fresh
	   browser cannot overwrite good data with its own emptiness.
	   ------------------------------------------------------------------ */

	var SYNC = { rev: 0, timer: null, applying: false, ready: false };

	function localRev() {
		return Number(localStorage.getItem(KEY.rev) || 0) || 0;
	}

	function snapshot() {
		var data = { pins: read(KEY.pins, []), pinGroups: read(KEY.pinGroups, []), recent: read(KEY.recent, []) };
		data.palettes = palettes();
		SYNC_MAPS.forEach(function (name) {
			data[name] = read(KEY[name], {}) || {};
		});
		SYNC_FLAGS.forEach(function (name) {
			var value = localStorage.getItem(KEY[name]);
			if (value != null) data[name] = value;
		});
		return data;
	}

	function pushPrefs() {
		if (!SYNC.ready || SYNC.applying) return;

		var rev = Date.now();
		var payload = JSON.stringify(snapshot());

		try {
			frappe
				.xcall("kaiten_erp_ui_themes.api.set_prefs", { payload: payload, rev: String(rev) })
				.then(function () {
					SYNC.rev = rev;
					localStorage.setItem(KEY.rev, String(rev));
				})
				.catch(function () {});
		} catch (e) {}
	}

	function schedulePush() {
		if (!SYNC.ready || SYNC.applying) return;
		clearTimeout(SYNC.timer);
		SYNC.timer = setTimeout(pushPrefs, 900);
	}

	function adoptPrefs(data, rev) {
		// The bar was already built from whatever this browser knew before the
		// server answered. If the answer names a different shell, the attribute
		// alone is not enough — the wrong bar is already on screen and has to be
		// swapped for the one the user actually chose elsewhere.
		var had = currentShell();

		// Writing through the normal helpers would schedule a push straight back,
		// so the flag keeps this one-way.
		SYNC.applying = true;
		try {
			SYNC_KEYS.forEach(function (name) {
				if (Array.isArray(data[name])) write(KEY[name], data[name]);
			});
			SYNC_MAPS.forEach(function (name) {
				var value = data[name];
				if (value && typeof value === "object" && !Array.isArray(value)) write(KEY[name], value);
			});
			SYNC_FLAGS.forEach(function (name) {
				if (typeof data[name] !== "string" || data[name] === "") return;
				var value = data[name];
				// v1 stored stock spacing as "cozy". After the rewrite that id
				// means the mid setting, so a stale server copy must not undo it.
				if (name === "density" && value === "cozy" && localStorage.getItem(KEY.densityRev) === "3" && localStorage.getItem(KEY.density) === "normal") {
					value = "normal";
				}
				localStorage.setItem(KEY[name], value);
			});
			localStorage.setItem(KEY.rev, String(rev));
			SYNC.rev = rev;
		} finally {
			SYNC.applying = false;
		}

		applyPrefs();
		applyLayout();

		// Remounting rebuilds the bar and refreshes the counts and pin state with
		// it, so the rest of this only applies when the shell stayed put.
		if (currentShell() !== had) {
			remountShell();
			return;
		}

		setCounts();
		syncPinButton();
		if (megaOpen()) renderGroups(state.activeTab || "workspaces");
	}

	function pullPrefs() {
		var request;
		try {
			request = frappe.xcall("kaiten_erp_ui_themes.api.get_prefs");
		} catch (e) {
			return;
		}

		request
			.then(function (remote) {
				var remoteRev = Number((remote && remote.rev) || 0) || 0;
				var mine = localRev();

				var parsed = null;
				if (remote && remote.payload) {
					try {
						parsed = JSON.parse(remote.payload);
					} catch (e) {
						parsed = null;
					}
				}

				if (parsed && remoteRev >= mine && remoteRev > 0) adoptPrefs(parsed, remoteRev);

				SYNC.ready = true;

				// Nothing stored yet, but this browser has history worth keeping:
				// seed the server so the next machine starts from it.
				var seed = !parsed && (pins().length || read(KEY.recent, []).length);
				if (seed || mine > remoteRev) pushPrefs();
			})
			.catch(function () {
				// Older site without the doctype, or simply offline. Staying not
				// ready keeps everything working locally and risks no clobbering.
			});
	}

	function boot() {
		var anchor = document.querySelector(".main-section") || document.querySelector("header.navbar");
		if (!anchor || !window.frappe || !frappe.xcall) return false;

		el.anchor = anchor;
		mountShell(anchor);
		trackChrome();
		bindFormTabs();
		bindChromeResize();
		bindNavDismiss();
		watchSidebar();
		bindKeys();
		bindRipple();
		bindCursorGlow();
		bindScroll();
		bindReveal();
		skinSelects();
		watchPopups();
		trackRoutes();
		pullPrefs();
		backfillTitles();
		loadMenu(0);
		if (currentShell() === "module") loadShellNav(0);
		return true;
	}

	adoptLegacy();
	if (adoptDensityV3()) {
		try {
			localStorage.setItem(KEY.rev, String((Number(localStorage.getItem(KEY.rev)) || 0) + 1));
		} catch (e) {}
	}
	applyPrefs();

	var attempts = 0;
	var poll = setInterval(function () {
		attempts += 1;
		if (boot() || attempts > 120) clearInterval(poll);
	}, 250);
})();
