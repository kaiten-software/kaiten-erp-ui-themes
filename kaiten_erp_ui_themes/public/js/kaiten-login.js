/* =========================================================================
   Kaiten ERP UI Themes — sign-in page
   -------------------------------------------------------------------------
   Loaded on every website page, but everything is behind a check for the
   login markup, so ordinary web pages pay nothing more than a querySelector.

   The accent chosen here is written to the same localStorage key the desk
   theme reads, so the choice survives the redirect after sign-in.
   ========================================================================= */

(function () {
	"use strict";

	var ACCENT_KEY = "kaiten_ui_accent";
	var THEME_KEY = "kaiten_ui_theme";

	var BRAND = "Kaiten";

	var ACCENTS = [
		{ id: "aurora", label: "Aurora", swatch: "linear-gradient(135deg,#6366f1,#ec4899)" },
		{ id: "sunset", label: "Sunset", swatch: "linear-gradient(135deg,#f97316,#a855f7)" },
		{ id: "ocean", label: "Ocean", swatch: "linear-gradient(135deg,#0ea5e9,#14b8a6)" },
		{ id: "forest", label: "Forest", swatch: "linear-gradient(135deg,#10b981,#84cc16)" },
		{ id: "grape", label: "Grape", swatch: "linear-gradient(135deg,#a855f7,#6366f1)" },
	];

	var TAGLINES = [
		"Your whole business, one keystroke away.",
		"Pin what you use. Forget the rest.",
		"Press ⌘K anywhere once you are in.",
	];

	function read(key, fallback) {
		try {
			var value = window.localStorage.getItem(key);
			return value === null ? fallback : value;
		} catch (err) {
			return fallback;
		}
	}

	function write(key, value) {
		try {
			window.localStorage.setItem(key, value);
		} catch (err) {
			/* private mode; the page still works, the choice just will not stick */
		}
	}

	function make(tag, cls, attrs) {
		var node = document.createElement(tag);
		if (cls) node.className = cls;
		Object.keys(attrs || {}).forEach(function (key) {
			if (key === "text") node.textContent = attrs[key];
			else if (key === "html") node.innerHTML = attrs[key];
			else if (key === "style") node.setAttribute("style", attrs[key]);
			else node.setAttribute(key, attrs[key]);
		});
		return node;
	}

	function svg(paths, extra) {
		return (
			'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
			'stroke-linecap="round" stroke-linejoin="round" ' +
			(extra || "") +
			">" +
			paths +
			"</svg>"
		);
	}

	var ICONS = {
		mail: svg('<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 7 9 6 9-6"/>'),
		lock: svg('<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
		user: svg('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),
		sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
		moon: svg('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>'),
		warn: svg('<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17.5v.01"/>'),
	};

	var root = document.documentElement;

	/* --------------------------------------------------------------------
	   Preferences
	   ------------------------------------------------------------------ */

	function applyPrefs() {
		root.setAttribute("data-aur-accent", read(ACCENT_KEY, "aurora"));
		var theme = read(THEME_KEY, "");
		if (theme === "dark") root.setAttribute("data-theme", "dark");
		else if (theme === "light") root.setAttribute("data-theme", "light");
	}

	function setAccent(id) {
		write(ACCENT_KEY, id);
		root.setAttribute("data-aur-accent", id);
		document.querySelectorAll(".aur-lg-swatch").forEach(function (node) {
			node.classList.toggle("aur-on", node.dataset.accent === id);
		});
	}

	function toggleTheme() {
		var dark = root.getAttribute("data-theme") === "dark";
		root.setAttribute("data-theme", dark ? "light" : "dark");
		write(THEME_KEY, dark ? "light" : "dark");
		paintThemeButton();
	}

	/* --------------------------------------------------------------------
	   Backdrop
	   ------------------------------------------------------------------ */

	function buildBackdrop() {
		var bg = make("div", "aur-lg-bg", { "aria-hidden": "true" });
		bg.appendChild(make("div", "aur-lg-orb aur-lg-orb-1"));
		bg.appendChild(make("div", "aur-lg-orb aur-lg-orb-2"));
		bg.appendChild(make("div", "aur-lg-orb aur-lg-orb-3"));
		bg.appendChild(make("div", "aur-lg-grid"));
		bg.appendChild(make("div", "aur-lg-veil"));

		for (var i = 0; i < 18; i++) {
			var delay = (Math.random() * 16).toFixed(2);
			var dur = (13 + Math.random() * 12).toFixed(2);
			bg.appendChild(
				make("div", "aur-lg-ember", {
					style:
						"left:" +
						(Math.random() * 100).toFixed(2) +
						"%;--dx:" +
						(Math.random() * 120 - 60).toFixed(0) +
						"px;animation-duration:" +
						dur +
						"s;animation-delay:-" +
						delay +
						"s;transform:scale(" +
						(0.5 + Math.random()).toFixed(2) +
						")",
				})
			);
		}

		document.body.appendChild(bg);
	}

	/* --------------------------------------------------------------------
	   Brand block and the rotating line
	   ------------------------------------------------------------------ */

	function markup() {
		var id = "aur-lg-grad-" + Math.random().toString(36).slice(2, 8);
		return (
			'<svg class="aur-lg-mark" viewBox="0 0 48 48" aria-hidden="true">' +
			'<defs><linearGradient id="' +
			id +
			'" x1="0" y1="0" x2="1" y2="1">' +
			'<stop offset="0" stop-color="var(--aur-lg-a)"/>' +
			'<stop offset=".5" stop-color="var(--aur-lg-b)"/>' +
			'<stop offset="1" stop-color="var(--aur-lg-c)"/>' +
			"</linearGradient></defs>" +
			'<rect x="1" y="1" width="46" height="46" rx="15" fill="url(#' +
			id +
			')"/>' +
			'<path d="M11 33c6.5-15 19.5-15 26 0" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".95"/>' +
			'<path d="M13 25c5.5-10 16.5-10 22 0" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" opacity=".55"/>' +
			'<circle cx="24" cy="14" r="2.7" fill="#fff"/>' +
			"</svg>"
		);
	}

	function greeting() {
		var hour = new Date().getHours();
		if (hour < 5) return "Still up?";
		if (hour < 12) return "Good morning";
		if (hour < 17) return "Good afternoon";
		if (hour < 21) return "Good evening";
		return "Working late";
	}

	function buildBrand(head) {
		if (head.querySelector(".aur-lg-brand")) return;

		var brand = make("div", "aur-lg-brand");
		brand.innerHTML = markup() + '<div><div class="aur-lg-word">' + BRAND + "</div></div>";
		head.insertBefore(brand, head.firstChild);

		var subtitle = head.querySelector(".page-card-subtitle");
		if (subtitle) subtitle.textContent = greeting() + ". Sign in to pick up where you left off.";

		var text = head.querySelector(".page-card-head-text") || head;
		if (!text.querySelector(".aur-lg-tag")) text.appendChild(make("span", "aur-lg-tag"));
	}

	function rotateTaglines() {
		var index = 0;

		function tick() {
			document.querySelectorAll(".aur-lg-tag").forEach(function (node) {
				node.innerHTML = "";
				node.appendChild(make("span", null, { text: TAGLINES[index] }));
			});
			index = (index + 1) % TAGLINES.length;
		}

		tick();
		setInterval(tick, 4200);
	}

	/* --------------------------------------------------------------------
	   Fields
	   ------------------------------------------------------------------ */

	function decorateFields(card) {
		var map = [
			["#login_email", ICONS.mail],
			["#login_password", ICONS.lock],
			["#signup_email", ICONS.mail],
			["#signup_fullname", ICONS.user],
			["#forgot_email", ICONS.mail],
			["#login_with_email_link_email", ICONS.mail],
		];

		map.forEach(function (pair) {
			var input = card.querySelector(pair[0]);
			if (!input) return;

			var wrap = input.parentElement;
			if (!wrap || wrap.querySelector(".aur-lg-icon")) return;

			if (getComputedStyle(wrap).position === "static") wrap.style.position = "relative";
			wrap.insertBefore(make("span", "aur-lg-icon", { html: pair[1] }), input);
		});

		var password = card.querySelector('input[type="password"]');
		if (password) bindCapsLock(password);
	}

	function bindCapsLock(input) {
		var group = input.closest(".form-group") || input.parentElement;
		var note = group.querySelector(".aur-lg-caps");

		if (!note) {
			note = make("p", "aur-lg-caps", { html: ICONS.warn + "<span>Caps Lock is on</span>" });
			note.querySelector("svg").setAttribute("width", "14");
			note.querySelector("svg").setAttribute("height", "14");
			group.appendChild(note);
		}

		function check(event) {
			if (typeof event.getModifierState !== "function") return;
			note.classList.toggle("aur-on", event.getModifierState("CapsLock"));
		}

		input.addEventListener("keydown", check);
		input.addEventListener("keyup", check);
		input.addEventListener("blur", function () {
			note.classList.remove("aur-on");
		});
	}

	/* --------------------------------------------------------------------
	   Pointer response — tilt, glow, ripple
	   ------------------------------------------------------------------ */

	function bindPointer() {
		var frame = null;

		document.addEventListener("pointermove", function (event) {
			if (frame) return;

			frame = requestAnimationFrame(function () {
				frame = null;

				document.querySelectorAll(".page-card").forEach(function (card) {
					var box = card.getBoundingClientRect();
					if (!box.width) return;

					var x = (event.clientX - box.left) / box.width;
					var y = (event.clientY - box.top) / box.height;

					card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
					card.style.setProperty("--my", (y * 100).toFixed(1) + "%");

					// Only tilt while the pointer is near the card, so the page
					// does not lurch when the cursor is off at the edge.
					var near = x > -0.35 && x < 1.35 && y > -0.35 && y < 1.35;
					var limit = near ? 5 : 0;

					card.style.setProperty("--ry", ((x - 0.5) * limit * 2).toFixed(2) + "deg");
					card.style.setProperty("--rx", ((0.5 - y) * limit * 2).toFixed(2) + "deg");
				});
			});
		});
	}

	function bindRipple() {
		document.addEventListener("pointerdown", function (event) {
			var target = event.target.closest(".page-card button, .page-card .es-button");
			if (!target) return;

			var box = target.getBoundingClientRect();
			var size = Math.max(box.width, box.height) * 2.2;

			var ripple = make("span", "aur-lg-ripple", {
				style:
					"width:" +
					size +
					"px;height:" +
					size +
					"px;left:" +
					(event.clientX - box.left) +
					"px;top:" +
					(event.clientY - box.top) +
					"px",
			});

			if (getComputedStyle(target).position === "static") target.style.position = "relative";
			target.appendChild(ripple);
			setTimeout(function () {
				ripple.remove();
			}, 620);
		});
	}

	/* --------------------------------------------------------------------
	   Footer strip
	   ------------------------------------------------------------------ */

	var themeBtn = null;

	function paintThemeButton() {
		if (!themeBtn) return;
		var dark = root.getAttribute("data-theme") === "dark";
		themeBtn.innerHTML = (dark ? ICONS.sun : ICONS.moon) + "<span>" + (dark ? "Light" : "Dark") + "</span>";
	}

	function buildFooter() {
		if (document.querySelector(".aur-lg-foot")) return;

		var foot = make("div", "aur-lg-foot");
		var swatches = make("div", "aur-lg-swatches", { role: "group", "aria-label": "Accent colour" });
		var current = read(ACCENT_KEY, "aurora");

		ACCENTS.forEach(function (accent) {
			var button = make("button", "aur-lg-swatch" + (accent.id === current ? " aur-on" : ""), {
				type: "button",
				title: accent.label,
				"aria-label": accent.label,
				style: "background:" + accent.swatch,
			});
			button.dataset.accent = accent.id;
			button.addEventListener("click", function () {
				setAccent(accent.id);
			});
			swatches.appendChild(button);
		});

		foot.appendChild(swatches);
		foot.appendChild(make("div", "aur-lg-sep"));

		themeBtn = make("button", "aur-lg-btn", { type: "button" });
		themeBtn.addEventListener("click", toggleTheme);
		paintThemeButton();
		foot.appendChild(themeBtn);

		foot.appendChild(make("div", "aur-lg-sep"));
		foot.appendChild(
			make("div", "aur-lg-hint", {
				html: 'Press <span class="aur-lg-kbd">Enter</span> to sign in',
			})
		);

		document.body.appendChild(foot);
	}

	/* --------------------------------------------------------------------
	   Boot
	   ------------------------------------------------------------------ */

	function decorate() {
		document.querySelectorAll(".page-card").forEach(function (card) {
			var head = card.querySelector(".page-card-head");
			if (head) buildBrand(head);
			decorateFields(card);
		});
	}

	function applyBrand(name) {
		if (!name) return;
		BRAND = name;
		document.querySelectorAll(".aur-lg-word").forEach(function (node) {
			node.textContent = BRAND;
		});
	}

	function loadBrand() {
		if (!(window.frappe && frappe.call)) return;
		frappe.call({
			method: "kaiten_erp_ui_themes.api.get_brand",
			callback: function (r) {
				if (r && r.message && r.message.brand) applyBrand(r.message.brand);
			},
		});
	}

	function boot() {
		if (!document.querySelector(".page-card")) return;

		applyPrefs();
		root.classList.add("aur-lg-on");

		buildBackdrop();
		decorate();
		loadBrand();
		rotateTaglines();
		buildFooter();
		bindPointer();
		bindRipple();

		// Frappe swaps between the sign-in, sign-up and forgot-password panels
		// by toggling classes, so newly revealed cards are decorated too. The
		// callback is coalesced because decorating is itself a mutation.
		var pending = null;
		var queue = function () {
			if (pending) return;
			pending = requestAnimationFrame(function () {
				pending = null;
				decorate();
			});
		};

		new MutationObserver(queue).observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["class"],
		});
	}

	// The accent and the scoping class have to land before first paint, or the
	// card is briefly drawn in stock colours.
	applyPrefs();
	if (document.querySelector(".page-card")) root.classList.add("aur-lg-on");

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
	else boot();
})();
