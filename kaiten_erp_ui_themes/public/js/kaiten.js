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
		pins: "kaiten_ui_pins",
		pinGroups: "kaiten_ui_pin_groups",
		recent: "kaiten_ui_recent",
		layout: "kaiten_ui_layout",
		content: "kaiten_ui_content",
		rev: "kaiten_ui_rev",
	};

	// Everything worth carrying between machines. Anything not listed here stays
	// local to the browser it was set in.
	var SYNC_KEYS = ["pins", "pinGroups", "recent", "palettes"];
	var SYNC_FLAGS = ["accent", "content", "density", "enabled", "layout", "skin"];
	// Keyed objects rather than lists: which tone each skin was last left on.
	var SYNC_MAPS = ["skinAccent"];

	/* Two axes run through this file and they must never be confused, because an
	   earlier version welded them together and picking a menu for HR silently
	   repainted the whole desk.

	   Content is *what* the menu carries. "default" derives it from the site's
	   own Workspaces; any other value names an Active Custom Menu Config, whose
	   Kaiten Nav Menu records supply the menus, groups and links instead. It is
	   read only by loadMenu and buildModel.

	   Style is *how* the menu is painted — the skin, its tone, the density. It is
	   read only by applyPrefs, which writes the data attributes the stylesheets
	   key off. Nothing in the content path appears there, and nothing in the
	   style path reaches the server, so each choice leaves the other alone. */
	var DEFAULT_CONTENT = "default";

	// "split" keeps the master rail beside the entries; "columns" drops the rail
	// and lays every group out at once, the way classic ERP top menus do.
	var LAYOUTS = [
		{ id: "split", icon: "panel-left", label: "Split", title: "Groups on the left, entries on the right" },
		{ id: "columns", icon: "layout-grid", label: "Columns", title: "Every group side by side" },
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

	var CAST_TONES = [
		{ id: "violet", label: "Violet", swatch: "linear-gradient(90deg,#5b2ef0,#7b5cff,#9b87ff)" },
		{ id: "indigo", label: "Indigo", swatch: "linear-gradient(90deg,#364fc7,#5c7cfa,#91a7ff)" },
		{ id: "coral", label: "Coral", swatch: "linear-gradient(90deg,#d9480f,#fd7e14,#ffa94d)" },
		{ id: "jade", label: "Jade", swatch: "linear-gradient(90deg,#099268,#20c997,#63e6be)" },
		{ id: "ink", label: "Ink", swatch: "linear-gradient(90deg,#212529,#495057,#868e96)" },
	];

	var HALO_TONES = [
		{ id: "violet", label: "Violet", swatch: "linear-gradient(135deg,#6d28d9,#7c3aed,#a78bfa)" },
		{ id: "azure", label: "Azure", swatch: "linear-gradient(135deg,#1d4ed8,#3b82f6,#93c5fd)" },
		{ id: "lime", label: "Lime", swatch: "linear-gradient(135deg,#4d7c0f,#84cc16,#bef264)" },
		{ id: "rose", label: "Rose", swatch: "linear-gradient(135deg,#be123c,#f43f5e,#fda4af)" },
		{ id: "orchid", label: "Orchid", swatch: "linear-gradient(135deg,#a21caf,#d946ef,#f0abfc)" },
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
			id: "cast",
			label: "Cast",
			note: "Milky flats, right angles, hard light",
			swatch: "linear-gradient(135deg,#6c42f5 0%,#6c42f5 42%,#ffffff 42%,#ffffff 100%)",
			tones: CAST_TONES,
		},
		{
			id: "halo",
			label: "Halo",
			note: "Futurist glass, soft float, inflated corners",
			swatch: "linear-gradient(135deg,#f5f6ff 0%,#c4b5fd 40%,#7c3aed 100%)",
			tones: HALO_TONES,
		},
	];

	/* Frappe's three appearances. Its own name for the third is "automatic",
	   which is what has to be stored; "System" is what it is called on screen. */
	var APPEARANCES = [
		{ id: "light", label: "Light", glyph: "\u2600", next: "dark" },
		{ id: "dark", label: "Dark", glyph: "\u263D", next: "automatic" },
		{ id: "automatic", label: "System", glyph: "\u25D1", next: "light" },
	];

	// A tone the user mixed themselves is stored as one of these and referenced
	// as "custom:<id>", so it can sit beside the built-in swatches.
	var CUSTOM_PREFIX = "custom:";

	/* Spacing of the desk — three steps from comfortable to tight. Independent
	   of the skin: every theme that offers density offers the same three. Older
	   prefs wrote "cozy" and "compact"; those land on Standard and Sleek. */
	var DENSITIES = [
		{ id: "standard", label: "Standard", note: "Comfortable spacing" },
		{ id: "dense", label: "Dense", note: "Less wasted space" },
		{ id: "sleek", label: "Sleek", note: "Tight and sharp" },
	];

	/* The two tabs that belong to the person rather than to the content. They
	   bracket the strip and survive a content switch, because a pin made under
	   one profile is still that user's pin under another. */
	var PINNED_TAB = { id: "pinned", label: "Pinned", icon: "star" };
	var RECENT_TAB = { id: "recent", label: "Recent", icon: "history" };

	/* The middle of the strip under Default content: generic ways into a site
	   nobody has described yet. A content profile replaces exactly these five
	   with its own menus, since a profile is that description. */
	var SITE_TABS = [
		{ id: "workspaces", label: "Workspaces", icon: "layers" },
		{ id: "modules", label: "Modules", icon: "grid-3x3" },
		{ id: "create", label: "Create", icon: "plus" },
		{ id: "insights", label: "Insights", icon: "chart-column" },
		{ id: "tools", label: "Tools", icon: "settings" },
	];

	function siteTabList() {
		return [PINNED_TAB].concat(SITE_TABS, [RECENT_TAB]);
	}

	// The strip as it stands. Read through tabs() everywhere, never as a
	// constant, because a content switch replaces the middle of it.
	function tabs() {
		return state.tabList;
	}

	function tabById(id) {
		var list = tabs();
		for (var i = 0; i < list.length; i++) {
			if (list[i].id === id) return list[i];
		}
		return null;
	}

	function isPersonalTab(id) {
		return id === PINNED_TAB.id || id === RECENT_TAB.id;
	}

	/* Where the menu opens, and the fallback wherever a tab id is missing. Under
	   Default that is Workspaces; under a profile it is that profile's first
	   menu, since Workspaces no longer exists. */
	function firstContentTab() {
		var list = tabs();
		for (var i = 0; i < list.length; i++) {
			if (!isPersonalTab(list[i].id)) return list[i].id;
		}
		return PINNED_TAB.id;
	}

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
		// Which content answered last: "auto" for the site's Workspaces, "config"
		// for a profile. A profile that resolves to nothing falls back to auto,
		// so this is the truth rather than what was asked for.
		source: "auto",
		// The strip's descriptors. Replaced wholesale when the content changes.
		tabList: siteTabList(),
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
		/* Which floor the arrows are on: "bar" = top tabs, "groups" = the left
		   rail, "items" = the rows. Down descends, Up and Left climb back, and
		   no end wraps — the bar is the ceiling and the last group a hard stop. */
		kbZone: "bar",
		pinCursor: null,
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
		// Only a configured link can be an outside address, and it is already an
		// href — there is no desk route to build.
		if (desc.act === "url") return desc.url || "#";
		if (desc.act === "new") return prefix() + "/" + slugify(desc.doctype) + "/new";
		if (route[0] === "List") return prefix() + "/" + slugify(route[1]);
		if (route[0] === "Form") return prefix() + "/" + slugify(route[1]) + "/" + encodeURIComponent(route[2]);
		if (route[0] === "query-report") return prefix() + "/query-report/" + encodeURIComponent(route[1]);
		return prefix() + "/" + route.map(slugify).join("/");
	}

	function runItem(desc) {
		if (!desc) return;

		if (desc.act === "url") {
			window.open(desc.url, "_blank", "noopener");
			closeMega();
			return;
		}

		try {
			if (desc.act === "new") frappe.new_doc(desc.doctype);
			else frappe.set_route.apply(frappe, desc.route);
		} catch (e) {
			window.location.href = hrefFor(desc);
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
			url: item.url,
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

				if (megaOpen() && !state.searching) renderGroups(state.activeTab || firstContentTab());
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

	/* ---------------------------------------------------------------------
	   Configured content
	   ---------------------------------------------------------------------
	   A content profile describes the menu itself, so its records map onto the
	   three levels the renderer already draws, one for one:

	     Kaiten Nav Menu   -> a tab on the strip        (Masters, Purchase, …)
	     Card Break        -> a group in the rail       (Schemes, Reports, …)
	     Kaiten Nav Item   -> a row under that group    (the leaves)

	   Which is why Workspaces, Modules, Create, Insights and Tools go away
	   under a profile: those five are what a site offers when nobody has said
	   what it should offer, and a profile is that saying. Pinned and Recent stay,
	   bracketing the profile's menus, because they belong to the user.

	   Everything below produces the shapes the renderer already draws, so a
	   profile cannot alter the layout, let alone the paint.
	   ------------------------------------------------------------------ */

	/* One configured link, in the shape a site-derived item takes.

	   The id scheme is deliberately the same — "list:Sales Order", not
	   "config:...". Pins and recents are keyed by id, so a link pinned under
	   Default content still matches the same link under HRMS rather than
	   quietly turning into a second entry. */
	function configItem(link, context) {
		var item = {
			label: link.label,
			// What the row opens, the same wording the site-derived rows use. The
			// card it sits under is already the group heading beside it, so
			// repeating it here would only say the same thing twice.
			sub: link.type || "",
			hue: hue(link.to || link.label),
			icon: resolveIcon(link.icon, link.label, context),
			search: link.label + " " + (link.to || ""),
			act: "route",
		};

		if (link.type === "URL") {
			item.id = "url:" + link.url;
			item.act = "url";
			item.url = link.url;
			item.sub = "Link";
			return item;
		}

		if (link.type === "DocType") {
			item.id = "list:" + link.to;
			item.sub = link.single ? "Settings" : "List";
			item.route = link.single ? ["Form", link.to, link.to] : ["List", link.to];
			item.extra = !link.single && canCreate(link.to) ? { label: "New", act: "new", doctype: link.to } : null;
			return item;
		}

		item.id = (link.type === "Report" ? "report:" : String(link.type).toLowerCase() + ":") + link.to;
		item.route = link.route || [];
		return item;
	}

	/* A menu's own name is a destination too — its overview — so it leads the
	   first group rather than being reachable only through the links below it. */
	function overviewItem(menu) {
		if (!menu.overview || !menu.overview.route) return null;

		return {
			id: "overview:" + menu.name,
			label: menu.label + " overview",
			sub: menu.overview.type || "Workspace",
			hue: hue(menu.name),
			icon: resolveIcon(menu.icon, menu.label),
			search: menu.label + " overview",
			act: "route",
			route: menu.overview.route,
		};
	}

	// A menu's tab id. Prefixed so it can never collide with a site tab or with
	// the personal two, whatever a menu happens to be called.
	function menuTabId(menu) {
		return "menu:" + menu.name;
	}

	/* One menu's rail: a group per Card Break, its rows the leaves filed under
	   it. A menu whose links all sit before any Card Break still opens onto
	   something, so an untitled group takes the menu's own name. */
	function configRail(menu) {
		var groups = [];

		(menu.columns || []).forEach(function (column, index) {
			var items = (column.items || []).map(function (link) {
				return configItem(link, menu.label);
			});
			if (!items.length) return;

			var label = column.title || menu.label;
			groups.push({
				key: menuTabId(menu) + "/" + index,
				label: label,
				hue: hue(label),
				icon: resolveIcon(null, label, menu.label),
				items: items,
			});
		});

		var overview = overviewItem(menu);
		if (overview && groups.length) groups[0].items.unshift(overview);

		return groups;
	}

	/* The profile's menus, as tabs, in the order the records give. A menu the
	   server sent has already lost every link its reader may not open, so
	   anything still standing here has something behind it. */
	function configTabs(menus) {
		return (menus || []).map(function (menu) {
			return {
				id: menuTabId(menu),
				label: menu.label,
				icon: resolveIcon(menu.icon, menu.label),
			};
		});
	}

	function buildModel(menu) {
		// Which content actually answered. A profile that resolved to nothing
		// falls back on the server, and the panel says so rather than lying.
		state.source = menu.source || "auto";

		var previous = tabs()
			.map(function (tab) {
				return tab.id;
			})
			.join("|");

		if (state.source === "config") {
			var menuTabs = configTabs(menu.menus);
			state.tabList = [PINNED_TAB].concat(menuTabs, [RECENT_TAB]);
			state.tabs = {};
			(menu.menus || []).forEach(function (entry) {
				state.tabs[menuTabId(entry)] = configRail(entry);
			});
		} else {
			state.tabList = siteTabList();
			state.tabs = {
				workspaces: buildWorkspaces(menu),
				modules: buildModules(menu),
				create: buildCreate(menu),
				insights: buildInsights(menu),
				tools: buildTools(menu),
			};
		}

		// The strip is built once at boot and only redrawn when the content
		// actually changes its shape, so a plain cache refresh costs nothing.
		var now = tabs()
			.map(function (tab) {
				return tab.id;
			})
			.join("|");
		if (now !== previous) paintTabs();

		state.index = [];
		tabs().forEach(function (tab) {
			if (isPersonalTab(tab.id)) return;

			(state.tabs[tab.id] || []).forEach(function (group) {
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
		return state.tabs[tabId] || [];
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
						write(
							KEY.pins,
							pins().filter(function (item) {
								return (item.group || DEFAULT_PIN_GROUP.id) !== active.pinGroup;
							})
						);
						setCounts();
						syncPinButton();
						renderGroups("pinned");
					},
				};
			}
		} else if (tabId === "recent") {
			options.empty = "No history yet. Open a few pages and they will show up here.";
			if (active.items.length) {
				options.action = {
					label: "Clear",
					run: function () {
						write(KEY.recent, []);
						setCounts();
						renderGroups("recent");
					},
				};
			}
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
		renderGroups(state.activeTab || firstContentTab());
		if (el.megaSearch) el.megaSearch.focus();
	}

	/* How many entries a tab still has under the standing filter. Used when the
	   open tab is empty so we can point at the tabs that do still match, instead
	   of looking like the thing does not exist. */
	function countFiltered(tabId, query) {
		var groups = filterGroups(groupsFor(tabId), query);
		if (tabId === "workspaces") {
			var all = groups.filter(function (group) {
				return group.key === "__all";
			})[0];
			return all ? all.items.length : 0;
		}
		var total = 0;
		groups.forEach(function (group) {
			if (group.key === "__all") return;
			total += (group.items || []).length;
		});
		return total;
	}

	function elsewhereHits(query, exceptTab) {
		var needle = String(query || "").trim();
		if (!needle) return [];
		return tabs()
			.filter(function (tab) {
				return tab.id !== exceptTab && !isPersonalTab(tab.id);
			})
			.map(function (tab) {
				return { id: tab.id, label: tab.label, count: countFiltered(tab.id, needle) };
			})
			.filter(function (hit) {
				return hit.count > 0;
			});
	}

	function renderElsewhere(query, exceptTab) {
		var hits = elsewhereHits(query, exceptTab);
		if (!hits.length || !el.body) return;

		var row = make("div", { class: "aur-elsewhere" }, [
			make("div", { class: "aur-elsewhere-label", text: "Found in other tabs" }),
		]);
		hits.forEach(function (hit) {
			var button = make("button", {
				class: "aur-elsewhere-chip",
				type: "button",
				text: hit.label + " \u00b7 " + hit.count,
			});
			button.addEventListener("click", function () {
				openTab(hit.id);
			});
			row.appendChild(button);
		});
		el.body.appendChild(row);
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

		if (items) {
			el.filterText.textContent =
				"Filtered by \u201c" +
				needle +
				"\u201d \u00b7 " +
				plural(items, "match", "matches") +
				" in " +
				plural(shown, "group", "groups");
			return;
		}

		var elsew = elsewhereHits(needle, state.activeTab);
		el.filterText.textContent = elsew.length
			? "Filtered by \u201c" +
			  needle +
			  "\u201d \u00b7 nothing here \u00b7 see " +
			  elsew
					.map(function (hit) {
						return hit.label;
					})
					.join(", ")
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
		renderGroups(state.activeTab || firstContentTab());
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
			if (query) renderElsewhere(query, tabId);
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
			paintKbZone();
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
		else if (query) {
			renderItems("No match", [], {
				empty: 'Nothing in this tab matches "' + query.trim() + '".',
			});
			renderElsewhere(query, tabId);
		} else renderItems("Nothing available", []);
		paintKbZone();
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
			openTab(state.activeTab || firstContentTab());
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
		var fresh = !el.mega.classList.contains("aur-visible");
		el.mega.classList.add("aur-visible");
		positionMega();
		if (el.bar) el.bar.classList.add("aur-bar-lifted");

		if (!el.scrim) {
			el.scrim = make("div", { class: "aur-scrim" });
			el.scrim.addEventListener("click", closeMega);
			document.body.appendChild(el.scrim);
		}

		positionScrim();

		/* A fresh open stands on the bar — that is where the click or the
		   shortcut just was, and every other floor is reached from it. Focus
		   still rests in the filter field and the selection is painted rather
		   than held, so typing and the arrows are both live at once. */
		if (fresh) state.kbZone = "bar";
		if (el.megaSearch) el.megaSearch.focus({ preventScroll: true });
		paintKbZone();
		if (fresh) armCursor();
	}

	function closeMega() {
		if (!el.mega) return;
		clearTimeout(hover.timer);
		clearTimeout(hover.tabTimer);
		hideHints();
		setCursor(null);
		state.kbZone = "bar";
		if (el.bar) el.bar.classList.remove("aur-kb-bar");
		el.mega.classList.remove("aur-visible", "aur-kb-bar", "aur-kb-groups", "aur-kb-items");
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
		paintKbZone();
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
	// foot of a capped group and pressing Enter is how the rest of it opens. So
	// do the "found in other tabs" chips, which are the only thing to go into
	// when the filter has emptied this tab.
	function navRows() {
		if (!el.body) return [];
		return Array.prototype.slice.call(el.body.querySelectorAll(".aur-item, .aur-col-more, .aur-elsewhere-chip"));
	}

	/* Every render ends by restoring the pinned keyboard cell, or by arming the
	   first row. The pin is how arrowing onto a tab or group survives the redraw
	   that opening that tab or group triggers. */
	function armCursor() {
		var pin = state.pinCursor;
		state.pinCursor = null;

		// Rebuilding the panel while it is shut must not paint a ring onto a bar
		// tab, which stays on screen after the menu itself has gone.
		if (!megaOpen()) return setCursor(null);

		/* Standing on the bar or the rail is a place of its own: a redraw must
		   leave you there rather than falling through to the first row, which
		   would highlight an item you never navigated to. */
		if (!pin && state.kbZone === "bar") pin = { kind: "tab", key: state.activeTab };
		if (!pin && state.kbZone === "groups" && state.activeKey) pin = { kind: "group", key: state.activeKey };

		if (pin && pin.kind === "tab" && el.tabNodes && el.tabNodes[pin.key]) {
			setCursor(el.tabNodes[pin.key], false);
			if (state.hints) paintHints();
			return;
		}
		if (pin && pin.kind === "group") {
			var match = (state.groups || []).filter(function (group) {
				return group.key === pin.key && group.node;
			})[0];
			if (match) {
				setCursor(match.node, false);
				if (state.hints) paintHints();
				return;
			}
		}

		setCursor(navRows()[0] || null, false);
		if (state.hints) paintHints();
	}

	function tabIds() {
		return tabs()
			.map(function (tab) {
				return tab.id;
			})
			.filter(function (id) {
				return el.tabNodes && el.tabNodes[id];
			});
	}

	/* Three floors, never one plane: the bar, the group rail, and the items.
	   A direction key is answered by the floor you are standing on, so Left and
	   Right along the bar only ever walk tabs — the panel below cannot catch
	   the cursor, and nothing down there lights up until you ask for it with
	   Down. */
	function groupCells() {
		if (currentLayout() === "columns") return [];
		return (state.groups || [])
			.map(function (group) {
				return group.node;
			})
			.filter(Boolean);
	}

	function paintKbZone() {
		var zone = state.kbZone || "items";
		Object.keys(el.tabNodes || {}).forEach(function (id) {
			el.tabNodes[id].classList.toggle("aur-kb", zone === "bar" && id === state.activeTab);
		});
		(state.groups || []).forEach(function (group) {
			if (group.node) group.node.classList.toggle("aur-kb", zone === "groups" && group.key === state.activeKey);
		});
		if (el.mega) {
			el.mega.classList.toggle("aur-kb-bar", zone === "bar");
			el.mega.classList.toggle("aur-kb-groups", zone === "groups");
			el.mega.classList.toggle("aur-kb-items", zone === "items");
		}
		if (el.bar) el.bar.classList.toggle("aur-kb-bar", zone === "bar");
	}

	function setKbZone(zone) {
		state.kbZone = zone;
		paintKbZone();
	}

	function cellKind(node) {
		if (!node) return "items";
		if (node.classList.contains("aur-tab")) return "bar";
		if (node.classList.contains("aur-group")) return "groups";
		return "items";
	}

	function setCursor(row, scroll) {
		document.querySelectorAll(".aur-cursor").forEach(function (node) {
			node.classList.remove("aur-cursor");
		});

		if (!row) {
			if (el.megaSearch) el.megaSearch.removeAttribute("aria-activedescendant");
			return;
		}

		if (!row.id) row.id = "aur-row-" + ++rowSeq;
		row.classList.add("aur-cursor");
		if (el.megaSearch) el.megaSearch.setAttribute("aria-activedescendant", row.id);
		setKbZone(cellKind(row));

		/* A tab is always brought into view, even on the silent restore after a
		   redraw: the strip scrolls, and a cursor sitting outside the frame is
		   the one thing worse than no cursor at all. */
		if (cellKind(row) === "bar") revealTab(row);
		else if (scroll !== false) row.scrollIntoView({ block: "nearest", inline: "nearest" });
	}

	function cursorCell() {
		return document.querySelector(".aur-tab.aur-cursor, .aur-group.aur-cursor, .aur-mega-body .aur-cursor");
	}

	function cursorRow() {
		return el.body
			? el.body.querySelector(".aur-item.aur-cursor, .aur-col-more.aur-cursor, .aur-elsewhere-chip.aur-cursor")
			: null;
	}

	function landOn(node) {
		if (!node) return false;

		if (node.classList.contains("aur-tab")) {
			var tabId = node.getAttribute("data-tab");
			state.pinCursor = { kind: "tab", key: tabId };
			if (tabId && tabId !== state.activeTab) openTab(tabId);
			else {
				state.pinCursor = null;
				setCursor(node);
			}
			return true;
		}

		if (node.classList.contains("aur-group")) {
			var group = (state.groups || []).filter(function (entry) {
				return entry.node === node;
			})[0];
			if (!group) return false;
			state.pinCursor = { kind: "group", key: group.key };
			if (group.key !== state.activeKey) selectGroup(state.activeTab, group.key);
			else {
				state.pinCursor = null;
				setCursor(node);
			}
			return true;
		}

		setCursor(node);
		return true;
	}

	/* Only the items are ragged enough to need geometry — a filled grid in one
	   layout, lanes of unequal height in the other — so a direction key there
	   cannot be index arithmetic over the DOM. Take the nearest row that
	   genuinely lies the way the key points, preferring rows squarely in line
	   with this one. Returns false at the edge, which is what lets the caller
	   hand the press on to the rail. */
	function stepItems(dir) {
		var rows = navRows();
		if (!rows.length) return false;

		var current = cursorRow();
		if (!current) {
			setCursor(rows[0]);
			return true;
		}

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

		if (!best) return false;
		setCursor(best);
		return true;
	}

	function toBar() {
		var node = el.tabNodes && el.tabNodes[state.activeTab];
		if (!node) return false;
		setCursor(node);
		return true;
	}

	/* The rail is where Down off the bar lands and where Left out of the items
	   comes back to, so it has to be reachable without disturbing what is on
	   show: only an untouched tab needs its first group choosing. */
	function enterRail() {
		var cells = groupCells();
		if (!cells.length) return false;

		var active = (state.groups || []).filter(function (group) {
			return group.key === state.activeKey && group.node;
		})[0];
		if (active) {
			setCursor(active.node);
			return true;
		}

		state.pinCursor = { kind: "group", key: state.groups[0].key };
		selectGroup(state.activeTab, state.groups[0].key);
		return true;
	}

	function enterItems() {
		var rows = navRows();
		if (!rows.length) return false;
		setCursor(rows[0]);
		return true;
	}

	function stepGroup(delta) {
		var cells = groupCells();
		if (!cells.length) return delta < 0 ? toBar() : false;

		var index = cells.indexOf(cursorCell());
		if (index < 0) return enterRail();

		var next = index + delta;
		// Off the top of the rail is the way back to the bar; off the bottom is
		// simply the end of the list.
		if (next < 0) return toBar();
		if (next >= cells.length) return false;
		return landOn(cells[next]);
	}

	function navKey(dir) {
		var zone = state.kbZone || "items";

		if (zone === "bar") {
			if (dir === "left") return stepTab(-1);
			if (dir === "right") return stepTab(1);
			if (dir === "down") return enterFromBar();
			return false;
		}

		if (zone === "groups") {
			if (dir === "up") return stepGroup(-1);
			if (dir === "down") return stepGroup(1);
			if (dir === "right") return enterItems();
			// The rail is already the leftmost column of the panel.
			return false;
		}

		if (stepItems(dir)) return true;
		if (dir === "left") return enterRail();
		// The column layout has no rail, so the bar is what lies above.
		if (dir === "up") return enterRail() || toBar();
		return false;
	}

	/* Tab walks the high-level bar in its own order — Pinned, Workspaces,
	   Modules, and so on — and stops at both ends rather than wrapping, so the
	   row has a felt beginning and end. Left and Right do the same while the
	   cursor is on the bar. */
	function stepTab(delta) {
		var ids = tabIds();
		if (ids.length < 2) return false;

		var index = ids.indexOf(state.activeTab);
		if (index < 0) index = 0;
		var next = index + delta;
		if (next < 0 || next >= ids.length) return false;

		// Pinned to the tab, or the redraw that opening it triggers would drop
		// the cursor onto the first item and light up a row nobody asked for.
		state.pinCursor = { kind: "tab", key: ids[next] };
		setKbZone("bar");
		openTab(ids[next]);

		// The redraw may have scrolled the strip for layout reasons, or left the
		// previous tab's ring peeking out of the fade. Re-assert the cursor and
		// snap the new tab fully into view once the open fill has settled.
		var node = el.tabNodes && el.tabNodes[ids[next]];
		if (node) {
			state.pinCursor = null;
			setKbZone("bar");
			setCursor(node);
		}
		return true;
	}

	function enterFromBar() {
		return enterRail() || enterItems();
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

			// Bar, rail, items: each answers the arrows in its own terms.
			var DIRS = { ArrowDown: "down", ArrowUp: "up", ArrowRight: "right", ArrowLeft: "left" };
			if (DIRS[event.key]) {
				event.preventDefault();
				navKey(DIRS[event.key]);
				return;
			}

			// Tab only walks the high-level bar (Pinned → Workspaces → …).
			if (event.key === "Tab") {
				event.preventDefault();
				stepTab(event.shiftKey ? -1 : 1);
				return;
			}

			if (event.key === "Home" || event.key === "End") {
				event.preventDefault();
				if (state.kbZone === "bar") {
					var ids = tabIds();
					if (!ids.length) return;
					var endId = event.key === "Home" ? ids[0] : ids[ids.length - 1];
					state.pinCursor = { kind: "tab", key: endId };
					setKbZone("bar");
					openTab(endId);
					if (el.tabNodes && el.tabNodes[endId]) {
						state.pinCursor = null;
						setKbZone("bar");
						setCursor(el.tabNodes[endId]);
					}
					return;
				}
				if (state.kbZone === "groups") {
					var railCells = groupCells();
					if (!railCells.length) return;
					landOn(event.key === "Home" ? railCells[0] : railCells[railCells.length - 1]);
					return;
				}
				var itemRows = navRows();
				if (!itemRows.length) return;
				setCursor(event.key === "Home" ? itemRows[0] : itemRows[itemRows.length - 1]);
				return;
			}

			if (event.key === "PageDown" || event.key === "PageUp") {
				event.preventDefault();
				if (state.kbZone !== "items") {
					state.pinCursor = null;
					setKbZone("items");
					armCursor();
				}
				pageCursor(event.key === "PageDown" ? 1 : -1);
				return;
			}

			if (event.key === "Enter" || event.code === "Enter" || event.key === "NumpadEnter") {
				event.preventDefault();
				if (event.metaKey || event.ctrlKey) event.stopPropagation();

				if (state.kbZone === "bar") {
					enterFromBar();
					return;
				}
				if (state.kbZone === "groups") {
					enterItems();
					return;
				}
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
		if (!megaOpen() || state.activeTab !== "pinned") openTab("pinned");
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

		// The tone row belongs to the chosen theme, so both are rebuilt together
		// and the row simply disappears for a theme that offers no tones.
		var tones = make("div", { class: "aur-swatches" });
		var toneLabel = make("div", { class: "aur-pop-label", text: "Colour" });
		var toneRow = make("div", { class: "aur-pop-row" }, [tones]);
		var editor = make("div", { class: "aur-mixer" });
		var skins = make("div", { class: "aur-skins" });

		// Density rides on the skin layer, and Default deliberately has none: it
		// is stock Frappe with only the bar added, spacing included.
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
			densityLabel.hidden = densityRow.hidden = active === "default";
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
			var button = make("button", {
				class: currentDensity() === option.id ? "aur-on" : "",
				type: "button",
				title: option.note,
				text: option.label,
			});
			button.addEventListener("click", function () {
				setDensity(option.id);
				Array.prototype.forEach.call(density.children, function (node) {
					node.classList.remove("aur-on");
				});
				button.classList.add("aur-on");
			});
			density.appendChild(button);
		});

		var refresh = make("div", { class: "aur-seg" });
		var refreshBtn = make("button", { type: "button", text: "Rebuild menu cache" });
		refreshBtn.addEventListener("click", function () {
			loadMenu(1);
			closePop();
		});
		refresh.appendChild(refreshBtn);

		// Only someone who may edit the records is shown the way into them.
		var customise = null;
		if (canWrite("Kaiten Nav Menu")) {
			customise = make("div", { class: "aur-seg" });
			var customiseBtn = make("button", {
				type: "button",
				title: "Build the menu for this business: rename menus, regroup links, set who sees what",
				text: "Customise menu\u2026",
			});
			customiseBtn.addEventListener("click", function () {
				closePop();
				openNavBuilder();
			});
			customise.appendChild(customiseBtn);
		}

		/* Content is *what* the menu carries: Default, meaning this site's own
		   Workspaces, or one of the Active content profiles. These are plain
		   cards with no preview of a look, because choosing one has no look to
		   preview — the Theme row below is untouched by anything here. */
		var contentCards = make("div", { class: "aur-contents" });

		function renderContentCards() {
			contentCards.textContent = "";

			var options = [{ name: DEFAULT_CONTENT, label: "Default", note: "This site's own Workspaces" }];
			contentConfigs.forEach(function (config) {
				options.push({ name: config.name, label: config.label, note: config.note || "Content profile" });
			});

			var current = currentContent();
			// A profile that no longer resolves has fallen back on the server, and
			// saying so beats showing a selected card that is not what is on screen.
			var fellBack = current !== DEFAULT_CONTENT && state.source !== "config";

			options.forEach(function (option) {
				var chosen = option.name === current;
				var card = make(
					"button",
					{
						class: "aur-content" + (chosen ? " aur-on" : ""),
						type: "button",
						title: chosen && fellBack ? option.label + " has no menus on this site, so Default is showing" : option.note,
					},
					[
						make("span", { class: "aur-content-name", text: option.label }),
						make("span", {
							class: "aur-content-note",
							text: chosen && fellBack ? "Empty here \u2014 showing Default" : option.note,
						}),
					]
				);
				card.addEventListener("click", function () {
					setContent(option.name);
					// The cards are the only thing that changes; the panel stays open
					// so a profile can be tried and reverted in one sitting.
					renderContentCards();
				});
				contentCards.appendChild(card);
			});
		}

		renderContentCards();
		loadMenuConfigs(function () {
			if (el.pop) renderContentCards();
		});

		el.pop = make(
			"div",
			{ class: "aur-pop" },
			[
				make("div", { class: "aur-pop-label", text: "Appearance" }),
				make("div", { class: "aur-pop-row" }, [appearanceSeg()]),

				// Content first, then style. They are separate questions and the
				// panel is the one place that has to make that obvious.
				make("div", { class: "aur-pop-label", text: "Menu content" }),
				make("div", { class: "aur-pop-row" }, [contentCards]),

				make("div", { class: "aur-pop-label", text: "Theme" }),
				make("div", { class: "aur-pop-row" }, [skins]),
				toneLabel,
				toneRow,
				editor,
				densityLabel,
				densityRow,

				make("div", { class: "aur-pop-label", text: "Menu" }),
				make("div", { class: "aur-pop-row" }, [refresh]),
				customise ? make("div", { class: "aur-pop-row" }, [customise]) : null,
			].filter(Boolean)
		);

		document.body.appendChild(el.pop);

		/* This panel is where the theme, the colour and the density are changed,
		   and each of those resizes the document — which used to close it after
		   a single click. It follows its anchor instead, so a look can be tried
		   on, adjusted and compared without reopening anything. */
		el.popPlace = function () {
			var box = anchor.getBoundingClientRect();
			var width = el.pop.offsetWidth || 300;
			el.pop.style.top = Math.round(box.bottom + 8) + "px";
			el.pop.style.left = Math.round(clamp(box.right - width, 10, window.innerWidth - width - 10)) + "px";
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

	var POPUP_SELECTOR = ".awesomplete > ul:not([hidden]), .datepicker.active, .autocomplete-results:not([hidden])";

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
		var host = list.parentElement;
		if (!host) return null;
		return host.querySelector("input, textarea, .control-input") || host;
	}

	/* The command palette owns the only awesomplete that is already a floating
	   overlay: nothing clips it, so it never needs rescuing. Re-anchoring it
	   painted a second list beside the palette, because the modal carries a
	   transform mid-animation and the offset maths below reads it wrong. */
	function isCommandPalette(list) {
		var host = list.parentElement;
		return Boolean(host && host.querySelector("#navbar-search"));
	}

	function reclip(list) {
		if (!list.dataset.aurUnclipped) return;
		delete list.dataset.aurUnclipped;
		list.classList.remove("aur-unclipped");
		["position", "width", "minWidth", "maxHeight", "left", "top", "bottom"].forEach(function (prop) {
			list.style[prop] = "";
		});
	}

	function unclip(list) {
		if (!list.offsetParent && getComputedStyle(list).display === "none") return;

		if (isCommandPalette(list)) {
			reclip(list);
			return;
		}

		var anchor = anchorOf(list);
		if (!anchor) return;

		if (!list.dataset.aurUnclipped) {
			if (!clippedBy(list)) return;
			list.dataset.aurUnclipped = "1";
			list.classList.add("aur-unclipped");
		}

		var rect = anchor.getBoundingClientRect();
		var below = window.innerHeight - rect.bottom - 12;
		var above = rect.top - 12;
		var flip = below < 190 && above > below;

		list.style.position = "fixed";
		list.style.width = Math.round(rect.width) + "px";
		list.style.minWidth = "0";
		list.style.maxHeight = Math.round(clamp(flip ? above : below, 140, 360)) + "px";
		list.style.bottom = "auto";

		/* Fixed is not always relative to the viewport: a transformed ancestor
		   (a dialog mid-animation, say) becomes the containing block instead.
		   Parking the list at 0,0 and reading back where that landed gives the
		   offset to work from, whatever the ancestor turns out to be. */
		list.style.left = "0px";
		list.style.top = "0px";
		var origin = list.getBoundingClientRect();

		var left = clamp(rect.left, 8, Math.max(8, window.innerWidth - rect.width - 8));
		var top = flip ? rect.top - 6 - Math.min(above, 360) : rect.bottom + 6;

		list.style.left = Math.round(left - origin.left) + "px";
		list.style.top = Math.round(top - origin.top) + "px";
	}

	function watchPopups() {
		var sweep = function () {
			// A list that has closed keeps its fixed coordinates otherwise, and
			// reappears in last-time's position before the next sweep moves it.
			document.querySelectorAll(".awesomplete > ul[hidden].aur-unclipped, .autocomplete-results[hidden].aur-unclipped").forEach(reclip);
			document.querySelectorAll(POPUP_SELECTOR).forEach(unclip);
		};

		["focusin", "input", "keyup", "click"].forEach(function (type) {
			document.addEventListener(type, sweep, true);
		});
		document.addEventListener("scroll", sweep, true);
		window.addEventListener("resize", sweep);

		// Awesomplete opens and closes by toggling hidden; the datepicker by class.
		new MutationObserver(sweep).observe(document.body, {
			subtree: true,
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
		closeSelect();

		var options = Array.prototype.slice.call(select.options);
		var pop = make("div", { class: "aur-select-pop" });

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

		var rect = select.getBoundingClientRect();
		var width = Math.max(rect.width, 190);
		pop.style.minWidth = Math.round(width) + "px";
		pop.style.left = Math.round(clamp(rect.left, 8, window.innerWidth - width - 8)) + "px";

		var below = window.innerHeight - rect.bottom;
		if (below < pop.offsetHeight + 16 && rect.top > below) {
			pop.style.top = Math.round(Math.max(8, rect.top - pop.offsetHeight - 6)) + "px";
		} else {
			pop.style.top = Math.round(rect.bottom + 6) + "px";
		}

		el.selectPop = pop;
		var selected = pop.querySelector(".aur-selected");
		if (selected) selected.scrollIntoView({ block: "nearest" });
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

		document.addEventListener("scroll", closeSelect, true);
		window.addEventListener("resize", closeSelect);
	}

	/* ---------------------------------------------------------------------
	   Bar
	   ---------------------------------------------------------------------
	   The tab strip runs out of room long before it runs out of tabs — a narrow
	   window, or a wide brand and search box, and Insights onward sit outside
	   it. Scrolling alone does not help, because a row cut off at the frame
	   reads as a row that has ended. So each end says what lies past it, and
	   arrowing along the strip brings the tab you land on into view.
	   ------------------------------------------------------------------ */

	function scrollNav(dir) {
		if (!el.nav) return;
		var step = Math.max(150, el.nav.clientWidth * 0.6);
		el.nav.scrollTo({ left: el.nav.scrollLeft + dir * step, behavior: "smooth" });
	}

	function navMore(side) {
		var button = make(
			"button",
			{
				class: "aur-nav-more aur-nav-more-" + side,
				type: "button",
				tabindex: "-1",
				"aria-label": side === "left" ? "Earlier tabs" : "More tabs",
				title: side === "left" ? "Earlier tabs" : "More tabs",
			},
			[iconNode("chevron-" + side, "aur-nav-more-glyph")]
		);
		button.addEventListener("click", function (event) {
			event.stopPropagation();
			scrollNav(side === "left" ? -1 : 1);
		});
		return button;
	}

	function paintNavOverflow() {
		if (!el.nav || !el.navWrap) return;
		var slack = el.nav.scrollWidth - el.nav.clientWidth;
		el.navWrap.classList.toggle("aur-more-left", el.nav.scrollLeft > 2);
		el.navWrap.classList.toggle("aur-more-right", slack > 2 && el.nav.scrollLeft < slack - 2);
	}

	/* Land a tab clear of both ends — the chevron, the fade, and a sliver of its
	   neighbour — so the keyboard ring is fully on screen and nothing behind it
	   still reads as selected. Instant, not smooth: a lagging scroll is what left
	   the previous tab's outline hanging while Pinned was still out of frame. */
	function revealTab(node) {
		if (!el.nav || !node || !el.nav.contains(node)) return;

		paintNavOverflow();

		var gutter = 32;
		var peek = 52;
		var leftEdge = el.navWrap && el.navWrap.classList.contains("aur-more-left") ? gutter : 8;
		var rightEdge = el.navWrap && el.navWrap.classList.contains("aur-more-right") ? gutter : 8;

		var navBox = el.nav.getBoundingClientRect();
		var tabBox = node.getBoundingClientRect();
		var delta = 0;

		if (tabBox.left < navBox.left + leftEdge) {
			delta = tabBox.left - (navBox.left + leftEdge) - peek;
		} else if (tabBox.right > navBox.right - rightEdge) {
			delta = tabBox.right - (navBox.right - rightEdge) + peek;
		}

		if (Math.abs(delta) < 1) {
			paintNavOverflow();
			return;
		}

		var max = Math.max(0, el.nav.scrollWidth - el.nav.clientWidth);
		var target = Math.max(0, Math.min(el.nav.scrollLeft + delta, max));
		el.nav.scrollLeft = target;
		paintNavOverflow();

		// Padding for a newly shown chevron can shift the tab again — one more
		// pass lands it clear once the gutters have settled.
		navBox = el.nav.getBoundingClientRect();
		tabBox = node.getBoundingClientRect();
		leftEdge = el.navWrap.classList.contains("aur-more-left") ? gutter : 8;
		rightEdge = el.navWrap.classList.contains("aur-more-right") ? gutter : 8;
		delta = 0;
		if (tabBox.left < navBox.left + leftEdge) delta = tabBox.left - (navBox.left + leftEdge) - 8;
		else if (tabBox.right > navBox.right - rightEdge) delta = tabBox.right - (navBox.right - rightEdge) + 8;
		if (Math.abs(delta) >= 1) {
			max = Math.max(0, el.nav.scrollWidth - el.nav.clientWidth);
			el.nav.scrollLeft = Math.max(0, Math.min(el.nav.scrollLeft + delta, max));
			paintNavOverflow();
		}
	}

	function buildBar(anchor) {
		/* Brand is Home — the desk page — not the theme panel. Theme lives on
		   the colourful control at the right of the bar. */
		var brand = make("button", { class: "aur-brand", type: "button", title: "Home" }, [
			make("span", { class: "aur-brand-dot" }),
			make("span", { text: brandName() }),
		]);
		brand.addEventListener("click", function (event) {
			event.stopPropagation();
			closeMega();
			if (window.frappe && typeof frappe.set_route === "function") frappe.set_route("home");
			else window.location.href = prefix() + "/home";
		});

		var nav = make("nav", { class: "aur-nav" });
		el.nav = nav;
		paintTabs();

		el.navWrap = make("div", { class: "aur-nav-wrap" }, [navMore("left"), nav, navMore("right")]);
		nav.addEventListener("scroll", paintNavOverflow);
		window.addEventListener("resize", paintNavOverflow);

		el.search = make("input", {
			class: "aur-search",
			type: "search",
			placeholder: "Search /",
			"aria-label": "Search the desk",
		});
		el.search.addEventListener("input", function () {
			renderSearch(el.search.value);
		});
		el.search.addEventListener("focus", function () {
			if (el.search.value.trim()) renderSearch(el.search.value);
		});

		/* The slash sits in the placeholder so the field can stay narrow —
		   a second "/" badge next to it was only eating bar space. */
		var searchWrap = make("div", { class: "aur-search-wrap" }, [
			make("span", { class: "aur-search-icon", text: "\u2315" }),
			el.search,
		]);

		el.pinBtn = make("button", { class: "aur-icon-btn", type: "button", title: "Pin this page", text: "\u2605" });
		el.pinBtn.addEventListener("click", function (event) {
			event.stopPropagation();
			var desc = currentDesc();
			if (!desc) return;
			togglePin(desc, el.pinBtn);
		});

		/* One colourful theme control. Light/dark stays inside the panel —
		   a second sun/moon button on the bar was noise next to this. */
		var paletteBtn = make("button", {
			class: "aur-icon-btn aur-theme-btn",
			type: "button",
			title: "Theme, colour and appearance",
			text: "\u25D5",
		});
		paletteBtn.addEventListener("click", function (event) {
			event.stopPropagation();
			openSettings(paletteBtn);
		});

		var fullBtn = make("button", { class: "aur-icon-btn", type: "button", title: "Toggle fullscreen", text: "\u26F6" });
		fullBtn.addEventListener("click", toggleFullscreen);

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
			renderGroups(state.activeTab || firstContentTab());
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
			footKey("\u2190\u2192", "tabs"),
			footKey("\u2193", "go in"),
			footKey("\u2191\u2193", "move"),
			footKey(ALT_LABEL, "then letter"),
			footKey("\u21b5", "open"),
			footKey(META_LABEL + "\u21b5", "new tab"),
			footKey("Esc", "close"),
			el.footLive,
		]);

		el.mega = make("div", { class: "aur-mega" }, [
			make("div", { class: "aur-mega-search" }, [
				iconNode("search", "aur-mega-search-icon"),
				el.megaSearch,
				el.megaClear,
				layoutSeg,
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

		el.bar = make("div", { class: "aur-bar" }, [
			make("div", { class: "aur-bar-progress" }),
			make("div", { class: "aur-bar-inner" }, [
				brand,
				el.navWrap,
				make("div", { class: "aur-bar-right" }, [searchWrap, el.pinBtn, paletteBtn, fullBtn]),
			]),
		]);

		// v17 puts the content in .main-section (no navbar); older desks have a
		// navbar to sit under. Either way the bar spans the content column.
		if (anchor.classList.contains("main-section")) anchor.insertBefore(el.bar, anchor.firstChild);
		else anchor.insertAdjacentElement("afterend", el.bar);

		// The panel lives on <body> so no ancestor can clip or re-stack it.
		document.body.appendChild(el.mega);

		paintNavOverflow();

		window.addEventListener("resize", function () {
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

	/* Draws the strip from whatever tabs() currently holds. Called once from
	   buildBar and again whenever a content switch changes the middle of it. */
	function paintTabs() {
		if (!el.nav) return;

		var wasOpen = state.activeTab;
		el.nav.textContent = "";
		el.tabNodes = {};

		tabs().forEach(function (tab) {
			var node = make("button", { class: "aur-tab", type: "button", "data-tab": tab.id }, [
				iconNode(tab.icon, "aur-tab-glyph"),
				make("span", { text: tab.label }),
				make("span", { class: "aur-tab-count", text: "\u2026" }),
			]);
			node.addEventListener("click", function () {
				toggleTab(tab.id);
			});

			// Once the panel is open, sweeping the bar swaps what is underneath,
			// so you can read across the whole strip without clicking each tab.
			// Any standing filter is kept, because only closing the panel clears it.
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
			el.nav.appendChild(node);
		});

		// The tab that was open may not exist in the new strip. Rather than leave
		// the panel showing a tab that is gone, move to the first menu of the
		// content that just arrived.
		if (wasOpen && !el.tabNodes[wasOpen]) {
			state.activeTab = firstContentTab();
			state.activeKey = null;
			if (megaOpen()) renderGroups(state.activeTab);
		}
		if (state.activeTab && el.tabNodes[state.activeTab]) {
			el.tabNodes[state.activeTab].classList.toggle("aur-open", megaOpen());
		}

		paintNavOverflow();
	}

	function setCounts() {
		if (!el.tabNodes) return;

		tabs().forEach(function (tab) {
			var groups = groupsFor(tab.id);
			var total = 0;

			if (tab.id === "workspaces" && groups.length) {
				total = (groups[0].items || []).length;
			} else {
				groups.forEach(function (group) {
					if (group.key !== "__all") total += group.items.length;
				});
			}

			var node = el.tabNodes[tab.id].querySelector(".aur-tab-count");
			if (node) node.textContent = String(total);
		});

		// Real counts are wider than the "…" they replace, so the strip may only
		// start overflowing once the menu has loaded.
		paintNavOverflow();
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

	function knownDensity(id) {
		return DENSITIES.some(function (option) {
			return option.id === id;
		});
	}

	function currentDensity() {
		var stored = localStorage.getItem(KEY.density);
		if (knownDensity(stored)) return stored;
		// Prefs written before the three-step scale.
		if (stored === "cozy" || stored === "normal") return "standard";
		if (stored === "compact") return "sleek";
		return "standard";
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

	/* The whole of the style axis. Deliberately says nothing about content: no
	   stylesheet may key off which menu profile is chosen, or the two would be
	   welded back together. */
	function applyPrefs() {
		var skin = currentSkin();
		var accent = currentAccent();

		root.classList.toggle("aurora-on", skin !== "default");
		if (skin === "default") root.removeAttribute("data-kaiten-skin");
		else root.setAttribute("data-kaiten-skin", skin);

		root.setAttribute("data-aur-accent", accent);
		root.setAttribute("data-aur-density", currentDensity());
		paintCustom(accent.indexOf(CUSTOM_PREFIX) === 0 ? paletteById(accent) : null);
	}

	/* ---------------------------------------------------------------------
	   The content axis
	   ---------------------------------------------------------------------
	   Everything here changes which links the menu carries. Note what is
	   missing: no call to applyPrefs, no data attribute, no class. Choosing HRMS
	   reloads the menu and nothing else, which is the invariant the earlier
	   version broke by carrying a shell along with every content card.
	   ------------------------------------------------------------------ */

	// Filled by the server. Cached here so the panel can paint the picker before
	// the round trip returns, and refresh it once it does.
	var contentConfigs = [];

	function currentContent() {
		return localStorage.getItem(KEY.content) || DEFAULT_CONTENT;
	}

	function contentLabel(id) {
		if (id === DEFAULT_CONTENT) return "Default";
		for (var i = 0; i < contentConfigs.length; i++) {
			if (contentConfigs[i].name === id) return contentConfigs[i].label;
		}
		return id;
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

	function setContent(id) {
		if (id === currentContent()) return;
		localStorage.setItem(KEY.content, id);
		schedulePush();
		loadMenu(1);
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
		if (!knownDensity(id) || id === currentDensity()) return;
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

		// The panel's appearance row shows the same state; light/dark no longer
		// has a separate button on the bar.
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

	/* ---------------------------------------------------------------------
	   Motion
	   ------------------------------------------------------------------ */

	function bindRipple() {
		document.addEventListener(
			"click",
			function (event) {
				var target = event.target.closest(".btn, .es-button, .aur-item, .aur-tab, .aur-icon-btn, .dock-item");
				if (!target) return;

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
	   Boot
	   ------------------------------------------------------------------ */

	/* ---------------------------------------------------------------------
	   Building a content profile
	   ---------------------------------------------------------------------
	   Nobody hand-types several hundred links, so a profile starts as a copy of
	   something: this site's Workspaces, or a preset shaped for a trade. From
	   there it is ordinary records to rename and regroup.
	   ------------------------------------------------------------------ */

	function builderLine(label, value) {
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

		var current = currentContent();
		var onProfile = current !== DEFAULT_CONTENT && state.source === "config";

		var dialog = new frappe.ui.Dialog({
			title: "Customise the menu",
			size: "large",
			fields: [
				{ fieldtype: "HTML", fieldname: "intro" },
				{
					fieldtype: "Data",
					fieldname: "profile",
					label: "Profile name",
					reqd: 1,
					default: onProfile ? contentLabel(current) : "",
					description: "The name this appears under in Menu content, such as HRMS or Jewellery.",
				},
				{
					fieldtype: "Data",
					fieldname: "use_case",
					label: "Use case",
					description: "What it is for — POS, HR, Operations. Shown as the card's second line.",
				},
				{ fieldtype: "HTML", fieldname: "body" },
			],
		});

		dialog.fields_dict.intro.$wrapper.append(
			'<p class="knb-note">A profile decides <b>what</b> the menu carries, and nothing else. ' +
				"The theme, colour and density are a separate choice and stay exactly as they are.</p>"
		);

		var body = make("div", { class: "knb" });

		body.appendChild(
			make("div", { class: "knb-stats" }, [
				builderLine("Showing", contentLabel(current) + (onProfile ? "" : " (the site's own Workspaces)")),
				builderLine("Menus on the bar", String((state.tabs.workspaces || []).length)),
				builderLine(
					"Links you can reach",
					String(
						(state.tabs.workspaces || []).reduce(function (sum, group) {
							return sum + group.items.length;
						}, 0)
					)
				),
			])
		);

		// Writing into a profile that already has menus replaces them, so the
		// warning has to name the profile rather than talk about "the menu".
		function build(action, args, describe, button) {
			var profile = (dialog.get_value("profile") || "").trim();
			if (!profile) {
				frappe.msgprint("Name the profile first.");
				return;
			}

			frappe.confirm(
				describe(profile) + " Any menus already in this profile are replaced; other profiles are untouched.",
				function () {
					button.disabled = true;
					args.profile = profile;
					args.use_case = (dialog.get_value("use_case") || "").trim();
					args.overwrite = 1;

					frappe
						.xcall("kaiten_erp_ui_themes.api." + action, args)
						.then(function (result) {
							frappe.show_alert({
								message:
									"Wrote " +
									result.menus +
									" menus into " +
									profile +
									(result.skipped ? " (" + result.skipped + " links this site does not have were skipped)" : "") +
									".",
								indicator: "green",
							});
							dialog.hide();
							// Land on what was just built rather than making the user go
							// and find it in the panel.
							loadMenuConfigs(function () {
								setContent(result.profile);
							});
						})
						.catch(function () {
							button.disabled = false;
						});
				}
			);
		}

		var actions = make("div", { class: "knb-actions" });

		var draft = make("button", { class: "btn btn-primary btn-sm", type: "button", text: "Copy this site's Workspaces" });
		draft.addEventListener("click", function () {
			build(
				"generate_nav_from_workspaces",
				{},
				function (profile) {
					return "Fill " + profile + " with a copy of the Workspace menu, ready to edit?";
				},
				draft
			);
		});
		actions.appendChild(draft);

		var edit = make("button", { class: "btn btn-default btn-sm", type: "button", text: "Open the menu list" });
		edit.addEventListener("click", function () {
			dialog.hide();
			frappe.set_route("List", "Kaiten Nav Menu");
		});
		actions.appendChild(edit);

		if (onProfile) {
			// Drift is the one real cost of a hand-built menu, so it is one click
			// away rather than something to remember to look for.
			var check = make("button", { class: "btn btn-default btn-sm", type: "button", text: "Check for new links" });
			check.addEventListener("click", function () {
				check.disabled = true;
				frappe
					.xcall("kaiten_erp_ui_themes.api.nav_drift", { profile: current })
					.then(function (result) {
						check.disabled = false;
						var missing = result.missing || [];
						if (!missing.length) {
							frappe.show_alert({ message: "Nothing missing. This profile covers the whole site.", indicator: "green" });
							return;
						}
						frappe.msgprint({
							title: "Not in this profile yet",
							message:
								"<p>" +
								missing.length +
								" link(s) exist on this site but are not in " +
								frappe.utils.escape_html(contentLabel(current)) +
								":</p><ul>" +
								missing
									.slice(0, 40)
									.map(function (row) {
										return (
											"<li><b>" +
											frappe.utils.escape_html(row.label || row.to) +
											"</b> \u2014 " +
											frappe.utils.escape_html(row.workspace || "") +
											"</li>"
										);
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

		var presets = make("div", { class: "knb-presets" });
		body.appendChild(presets);

		frappe.xcall("kaiten_erp_ui_themes.api.list_presets").then(function (list) {
			if (!list || !list.length) return;

			presets.appendChild(
				make("p", {
					class: "knb-note knb-note-tight",
					text: "Or start from a trade preset. It writes the same records, already grouped the way that business talks. Links this site does not have are skipped.",
				})
			);

			list.forEach(function (preset) {
				var button = make("button", {
					class: "btn btn-default btn-sm",
					type: "button",
					text: "Use the " + preset.label + " preset (" + preset.menus + " menus, " + preset.links + " links)",
				});
				button.addEventListener("click", function () {
					// The preset knows what it is called, so an untouched name field
					// fills itself in rather than blocking on a required field.
					if (!(dialog.get_value("profile") || "").trim()) dialog.set_value("profile", preset.label);
					if (preset.use_case && !(dialog.get_value("use_case") || "").trim()) dialog.set_value("use_case", preset.use_case);

					build(
						"install_preset",
						{ name: preset.name },
						function (profile) {
							return "Fill " + profile + " with the " + preset.label + " preset?";
						},
						button
					);
				});
				presets.appendChild(button);
			});
		});

		dialog.fields_dict.body.$wrapper.append(body);
		dialog.show();
	}

	function loadMenu(refresh) {
		var args = { profile: currentContent() };
		if (refresh) args.refresh = 1;

		frappe
			.xcall("kaiten_erp_ui_themes.api.get_menu", args)
			.then(function (menu) {
				buildModel(menu);
				setCounts();
				// A content switch replaces every group, so an open menu is redrawn
				// on the tab the user was already reading rather than closed.
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
		var wasContent = currentContent();

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
				if (typeof data[name] === "string" && data[name] !== "") localStorage.setItem(KEY[name], data[name]);
			});
			localStorage.setItem(KEY.rev, String(rev));
			SYNC.rev = rev;
		} finally {
			SYNC.applying = false;
		}

		applyPrefs();
		applyLayout();
		setCounts();
		syncPinButton();
		if (megaOpen()) renderGroups(state.activeTab || firstContentTab());

		// A different machine may have been left on another profile. The menu on
		// screen was built for the old one, so it has to be fetched again.
		if (currentContent() !== wasContent) loadMenu(0);
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

		buildBar(anchor);
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
		// Fetched up front so the settings panel names the chosen profile the
		// first time it opens, rather than showing a bare record id.
		loadMenuConfigs();
		return true;
	}

	adoptLegacy();
	applyPrefs();

	var attempts = 0;
	var poll = setInterval(function () {
		attempts += 1;
		if (boot() || attempts > 120) clearInterval(poll);
	}, 250);
})();
