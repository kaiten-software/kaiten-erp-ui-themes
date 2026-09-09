// Kaiten Nav Menu — form helpers.
//
// The icon fields (this menu's own, and every row in the Items grid) are plain
// names resolved against the desk's icon sprite at render time. Left as a bare
// text box a user has no idea what to type, so both fields are turned into a
// searchable list of the names the shell actually knows how to draw, and the
// menu's own field gets a live preview beside it.

frappe.provide("kaiten_erp_ui_themes");

// Names that exist in the desk sprite and the shell already draws — the same
// set its icon guesser falls back to — so anything picked here renders.
kaiten_erp_ui_themes.NAV_ICONS = [
	"activity", "arrow-left-right", "award", "badge-check", "banknote", "barcode",
	"bell", "book-open", "bookmark", "boxes", "briefcase", "building", "building-2",
	"calendar", "calendar-days", "chart-column", "chart-line", "chart-pie",
	"circle-dollar-sign", "clipboard-list", "clock", "cloud", "coins", "compass",
	"contact", "credit-card", "crown", "database", "earth", "factory", "file-spreadsheet",
	"file-text", "files", "flag", "flame", "folder", "folder-kanban", "gauge", "gem",
	"gift", "globe", "grid-3x3", "hammer", "hand-coins", "handshake", "headset", "heart",
	"history", "landmark", "layers", "leaf", "lightbulb", "list-checks", "lock", "mail",
	"map-pin", "message-square", "moon", "package", "percent", "phone", "phone-call",
	"piggy-bank", "plug", "plus", "printer", "puzzle", "receipt", "receipt-text", "repeat",
	"rocket", "ruler", "scroll-text", "settings", "settings-2", "shield", "shopping-cart",
	"split", "star", "store", "sun", "tag", "tags", "target", "ticket", "truck", "user",
	"user-check", "users", "wallet", "warehouse", "webhook", "workflow", "wrench", "zap",
];

// A small sprite preview next to the menu's own icon field, redrawn as the
// value changes so the picked name is confirmed by its glyph, not just text.
function paintIconPreview(frm) {
	var field = frm.fields_dict && frm.fields_dict.icon;
	if (!field || !field.$wrapper) return;

	var name = (frm.doc.icon || "").trim();
	var $wrap = field.$wrapper;
	var $prev = $wrap.find(".kaiten-icon-preview");
	if (!$prev.length) {
		$prev = $('<span class="kaiten-icon-preview" style="display:inline-flex;align-items:center;gap:6px;margin-top:6px;color:var(--text-muted);font-size:12px;"></span>');
		$wrap.append($prev);
	}

	if (!name) {
		$prev.empty();
		return;
	}

	var svg = "";
	try {
		svg = frappe.utils.icon(name, "md");
	} catch (e) {
		svg = "";
	}
	var known = kaiten_erp_ui_themes.NAV_ICONS.indexOf(name) !== -1;
	$prev.html(
		(svg || "") +
			'<span>' +
			(known ? frappe.utils.escape_html(name) : frappe.utils.escape_html(name) + " " + __("(unknown — will be guessed)")) +
			"</span>"
	);
}

// The Title field is first and required, so a fresh form autofocuses it and
// Frappe scrolls the content pane to bring it up — which parks it under the
// sticky page head and reads as the page jumping upward. Nudging the scroller
// back to the top once the focus has settled keeps the first field in view.
function keepTopInView(frm) {
	if (!frm.is_new()) return;
	var pane = document.querySelector(".main-section");
	if (!pane) return;

	// The autofocus scroll lands a beat after render, later than a fixed timer
	// reliably catches, so the top is held for a short window instead. The
	// moment the user scrolls, touches or types, the pin lets go — this is only
	// meant to swallow the involuntary jump, never to fight a real intent.
	var until = Date.now() + 1200;
	var released = false;
	var events = ["wheel", "touchstart", "keydown", "mousedown"];

	var release = function () {
		if (released) return;
		released = true;
		events.forEach(function (type) {
			document.removeEventListener(type, release, true);
		});
	};
	events.forEach(function (type) {
		document.addEventListener(type, release, true);
	});

	var pin = function () {
		if (released || Date.now() > until) {
			release();
			return;
		}
		if (pane.scrollTop) pane.scrollTop = 0;
		requestAnimationFrame(pin);
	};
	requestAnimationFrame(pin);
}

frappe.ui.form.on("Kaiten Nav Menu", {
	refresh: function (frm) {
		paintIconPreview(frm);
		keepTopInView(frm);
	},

	onload_post_render: function (frm) {
		keepTopInView(frm);
	},

	icon: function (frm) {
		paintIconPreview(frm);
	},
});
