/**
 * Smoke test for the notification bell.
 *
 * Boots the real kaiten.js against a fake desk and checks two Frappe shapes:
 * the new side panel, and the old dropdown. Also checks the bar around the
 * bell still works, so this change does not leak into search, the menu, or
 * the badge.
 *
 * Run from this app: node kaiten_erp_ui_themes/tests/notification_panel_smoke.mjs
 * jsdom lives in this folder's node_modules (npm install).
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require("jsdom");

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const script = fs.readFileSync(path.join(appRoot, "public/js/kaiten.js"), "utf8");
const css = fs.readFileSync(path.join(appRoot, "public/css/kaiten.css"), "utf8");

const failures = [];

function check(name, ok, detail) {
	if (ok) {
		console.log("  ok  " + name);
		return;
	}
	console.log("  FAIL " + name + (detail ? " — " + detail : ""));
	failures.push(name);
}

function click(window, node) {
	node.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}

function jqueryFactory(window) {
	function wrap(nodes) {
		const list = nodes.filter(Boolean);
		const api = {
			jquery: "3",
			length: list.length,
			toArray() {
				return list.slice();
			},
			find(sel) {
				const found = [];
				list.forEach((node) => {
					if (node.querySelectorAll) found.push(...node.querySelectorAll(sel));
				});
				return wrap(found);
			},
			on() {
				return api;
			},
		};
		list.forEach((node, index) => {
			api[index] = node;
		});
		return api;
	}

	function $(input) {
		if (input && input.jquery) return input;
		if (typeof input === "string") return wrap([...window.document.querySelectorAll(input)]);
		if (input && input.nodeType) return wrap([input]);
		if (Array.isArray(input)) return wrap(input);
		return wrap([]);
	}

	return $;
}

function baseDesk(includeSidebar) {
	return `<!doctype html><html><body>
		<header class="navbar"></header>
		<div class="main-section"></div>
		${
			includeSidebar
				? `<div class="body-sidebar-container"><div class="body-sidebar"></div></div>`
				: ""
		}
	</body></html>`;
}

async function boot(html, installFrappe) {
	const pageErrors = [];
	let closed = false;
	const virtualConsole = new VirtualConsole();
	virtualConsole.on("jsdomError", (error) => {
		if (!closed) pageErrors.push(error && error.message ? error.message : String(error));
	});
	const dom = new JSDOM(html, {
		url: "http://desk.local/desk/home",
		runScripts: "outside-only",
		pretendToBeVisual: true,
		virtualConsole,
	});
	const { window } = dom;
	window.frappe = {
		xcall() {
			return Promise.resolve({});
		},
		session: { user: "alice@example.com" },
		boot: {
			desk_settings: { notifications: 1 },
			notification_unread_count: 2,
			sysdefaults: { currency: "INR" },
		},
		set_route() {},
	};
	window.matchMedia = function () {
		return {
			matches: false,
			addEventListener() {},
			removeEventListener() {},
			addListener() {},
			removeListener() {},
		};
	};
	window.jQuery = jqueryFactory(window);
	const record = {
		constructed: [],
		toggles: [],
		popoverToggles: 0,
		listeners: 0,
		replaced: false,
		panel: null,
		popoverTrigger: null,
	};
	installFrappe(window, record);
	window.eval(script);
	const started = Date.now();
	while (!window.document.querySelector(".aur-bell-btn")) {
		if (Date.now() - started > 3000) {
			throw new Error("desk bar did not boot");
		}
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
	return {
		window,
		record,
		pageErrors,
		close() {
			closed = true;
			window.close();
		},
	};
}

function installNewApi(window, record) {
	window.frappe.ui = {
		SidebarPanel: function SidebarPanel() {},
		Notifications: function Notifications(opts) {
			record.constructed.push(opts || {});
			record.listeners += 1;
			if (opts && opts.popover) {
				record.popoverTrigger = opts.wrapper && opts.wrapper.find
					? opts.wrapper.find(".desktop-notification-icon")[0]
					: null;
				this.popover = {
					is_open: false,
					toggle() {
						this.is_open = !this.is_open;
						record.popoverToggles += 1;
					},
					close() {
						this.is_open = false;
					},
				};
				return;
			}
			// Real Frappe removes the previous panel when a second one is built.
			if (record.panel && record.panel.$panel && record.panel.$panel[0] && record.panel.$panel[0].parentNode) {
				record.panel.$panel[0].remove();
				record.replaced = true;
			}
			const mount = window.document.querySelector(".body-sidebar-container");
			if (!mount) return;
			const panel = window.document.createElement("div");
			panel.className = "sidebar-panel sidebar-panel-notifications";
			panel.textContent = "All Events mention";
			mount.appendChild(panel);
			record.panel = { $panel: { 0: panel } };
		},
		sidebar_panels: {
			get(name) {
				return name === "notifications" ? record.panel : null;
			},
			toggle(name) {
				record.toggles.push(name);
			},
		},
	};
}

function installOldApi(window, record) {
	window.frappe.ui = {
		Notifications: function Notifications(opts) {
			record.constructed.push(opts || {});
		},
	};
}

function hidden(node) {
	return !node || node.classList.contains("hidden");
}

async function testNewPanelAlreadyThere() {
	console.log("\nNew Frappe, panel already on the page");
	const { window, record, pageErrors, close } = await boot(baseDesk(true), (win, rec) => {
		installNewApi(win, rec);
		const panel = win.document.createElement("div");
		panel.className = "sidebar-panel sidebar-panel-notifications";
		panel.textContent = "All Events mention";
		win.document.querySelector(".body-sidebar-container").appendChild(panel);
		rec.panel = { $panel: { 0: panel } };
		rec.listeners = 1;
	});
	const doc = window.document;
	const bell = doc.querySelector(".aur-bell-btn");
	const livePanel = doc.querySelector(".body-sidebar-container > .sidebar-panel-notifications");
	const beforeBar = doc.querySelectorAll(".aur-bar, .aur-search, .aur-brand").length;

	click(window, bell);
	check("opens the live panel", record.toggles.length === 1 && record.toggles[0] === "notifications");
	check("does not build a second panel", record.constructed.length === 0, "constructed " + record.constructed.length);
	check("does not delete the live panel", livePanel.isConnected && !record.replaced);
	check("does not add a second alert listener", record.listeners === 1);
	check("does not show the empty old box", !doc.querySelector(".aur-notify-host"));
	check("bell badge still shows the unread count", doc.querySelector(".notification-count").textContent === "2");

	click(window, bell);
	check("second click only toggles the same panel", record.toggles.length === 2 && record.constructed.length === 0);

	const side = doc.querySelector(".body-sidebar");
	const sideBell = doc.createElement("button");
	sideBell.className = "sidebar-notification";
	let nativeClicks = 0;
	sideBell.addEventListener("click", () => {
		nativeClicks += 1;
	});
	side.appendChild(sideBell);
	click(window, sideBell);
	check("sidebar bell opens the same panel once", record.toggles.length === 3);
	check("sidebar bell does not also fire Frappe's own click", nativeClicks === 0);

	const search = doc.querySelector(".aur-search");
	search.value = "gold";
	search.dispatchEvent(new window.Event("input", { bubbles: true }));
	click(window, search);
	check("search still accepts text", search.value === "gold");
	check("search click does not open notifications", record.toggles.length === 3);

	click(window, doc.querySelector(".sidebar-panel-notifications"));
	check("click inside the list does not toggle it shut", record.toggles.length === 3);
	check("bar is still on the page", doc.querySelectorAll(".aur-bar, .aur-search, .aur-brand").length === beforeBar);

	const user = doc.querySelector(".aur-user-btn");
	click(window, user);
	const item = [...doc.querySelectorAll(".aur-user-item")].find((node) =>
		/notifications/i.test(node.textContent || "")
	);
	check("account menu still lists Notifications", !!item);
	if (item) click(window, item);
	check("account menu uses the same panel", record.toggles.length === 4 && record.constructed.length === 0);
	check("desk boot did not throw", pageErrors.length === 0, pageErrors[0]);
	close();
}

async function testNewPanelCreatedOnce() {
	console.log("\nNew Frappe, desk has a sidebar slot but no panel yet");
	const { window, record, pageErrors, close } = await boot(baseDesk(true), installNewApi);
	click(window, window.document.querySelector(".aur-bell-btn"));
	check("creates one panel", record.constructed.length === 1 && !record.constructed[0].popover);
	check("then opens it", record.toggles.length === 1);
	click(window, window.document.querySelector(".aur-bell-btn"));
	check("does not create another panel on the next click", record.constructed.length === 1);
	check("second click toggles", record.toggles.length === 2);
	check("old box stays hidden", hidden(window.document.querySelector(".dropdown-notifications")));
	check("desk boot did not throw", pageErrors.length === 0, pageErrors[0]);
	close();
}

async function testPopoverWhenNoSlot() {
	console.log("\nNew Frappe, no sidebar slot");
	const { window, record, pageErrors, close } = await boot(baseDesk(false), installNewApi);
	const bell = window.document.querySelector(".aur-bell-btn");
	click(window, bell);
	check("does not build a detached side panel", record.panel === null && record.toggles.length === 0);
	check("opens one popover", record.constructed.length === 1 && record.constructed[0].popover === true);
	check("popover is tied to the real bell", record.popoverTrigger === bell);
	check("popover toggled once", record.popoverToggles === 1);
	check("only one alert listener", record.listeners === 1);
	click(window, bell);
	check("second click reuses the popover", record.constructed.length === 1 && record.popoverToggles === 2);
	check("empty old column is not shown", !window.document.querySelector(".aur-notify-host"));
	check("no invisible stand-in button", !window.document.querySelector(".aur-notify-popover-host"));
	check("desk boot did not throw", pageErrors.length === 0, pageErrors[0]);
	close();
}

async function testReusesDesktopPopover() {
	console.log("\nNew Frappe, desktop already has a popover");
	const { window, record, pageErrors, close } = await boot(baseDesk(false), (win, rec) => {
		installNewApi(win, rec);
		rec.listeners = 1;
		const pop = {
			is_open: false,
			toggle() {
				this.is_open = !this.is_open;
				rec.popoverToggles += 1;
			},
			close() {
				this.is_open = false;
			},
		};
		win.frappe.pages = { desktop: { desktop_page: { notifications: { popover: pop } } } };
		rec.desktopPopover = pop;
	});
	const bell = window.document.querySelector(".aur-bell-btn");
	click(window, bell);
	check("reuses Frappe's popover", record.popoverToggles === 1 && record.desktopPopover.is_open);
	check("does not build a second listener", record.constructed.length === 0 && record.listeners === 1);
	click(window, bell);
	check("second click closes that same popover", record.popoverToggles === 2 && !record.desktopPopover.is_open);
	check("desk boot did not throw", pageErrors.length === 0, pageErrors[0]);
	close();
}

async function testDetachedPanelDoesNotStack() {
	console.log("\nNew Frappe, panel is registered but not on the page");
	const { window, record, pageErrors, close } = await boot(baseDesk(true), (win, rec) => {
		installNewApi(win, rec);
		rec.listeners = 1;
		rec.panel = { $panel: { 0: win.document.createElement("div") } };
	});
	click(window, window.document.querySelector(".aur-bell-btn"));
	check("does not build a popover beside it", record.constructed.length === 0 && record.popoverToggles === 0);
	check("does not add a second alert listener", record.listeners === 1);
	check("desk boot did not throw", pageErrors.length === 0, pageErrors[0]);
	close();
}

async function testOldDropdown() {
	console.log("\nOld Frappe, no side panel");
	const { window, record, pageErrors, close } = await boot(baseDesk(true), installOldApi);
	const bell = window.document.querySelector(".aur-bell-btn");
	click(window, bell);
	const dropdown = window.document.querySelector(".dropdown-notifications");
	check("shows the old box", dropdown && !dropdown.classList.contains("hidden"));
	check("asks the old widget to fill it", record.constructed.length === 1 && record.constructed[0].full_height === true);
	check("does not invent a side panel", !window.document.querySelector(".sidebar-panel"));
	click(window, bell);
	check("second click closes the old box", dropdown.classList.contains("hidden"));
	check("does not build the widget again", record.constructed.length === 1);
	check("search is still there", window.document.querySelector(".aur-search").value === "");
	check("desk boot did not throw", pageErrors.length === 0, pageErrors[0]);
	close();
}

function testCssDoesNotHideThePanel() {
	console.log("\nTheme CSS");
	const hidesPanel = /\.sidebar-panel[^{]*\{[^}]*display\s*:\s*none/.test(css);
	check("theme does not hide .sidebar-panel", !hidesPanel);
	check("old box styles stay scoped to .aur-notify-host", css.includes(".aur-notify-host .notifications-list"));
}

await testNewPanelAlreadyThere();
await testNewPanelCreatedOnce();
await testPopoverWhenNoSlot();
await testReusesDesktopPopover();
await testDetachedPanelDoesNotStack();
await testOldDropdown();
testCssDoesNotHideThePanel();

if (failures.length) {
	console.error("\n" + failures.length + " check(s) failed");
	process.exit(1);
}
console.log("\nAll notification smoke checks passed");
