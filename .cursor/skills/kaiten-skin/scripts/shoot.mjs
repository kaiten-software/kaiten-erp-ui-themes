#!/usr/bin/env node
/**
 * Screenshot a Kaiten skin across the routes that matter.
 *
 *   node shoot.mjs --skin nimbus [--appearance light|dark|automatic]
 *                  [--routes workspace,list,form,report,login]
 *
 * Requires puppeteer-core. See reference.md for the environment variables.
 */

import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import puppeteer from "puppeteer-core";

const arg = (name, fallback) => {
	const i = process.argv.indexOf(`--${name}`);
	return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const BASE = process.env.KAITEN_URL || "http://localhost:8080";
const USER = process.env.KAITEN_USER || "Administrator";
const PW = process.env.KAITEN_PW || "admin";
const OUT = process.env.KAITEN_OUT || "/tmp/kaiten-shots";

const SKIN = arg("skin", "aurora");
const APPEARANCE = arg("appearance", "light");
const ROUTES = arg("routes", "workspace,list,form,login").split(",");

const TARGETS = {
	workspace: "/app/home",
	list: "/app/email-template",
	form: "/app/user/Administrator",
	report: "/app/email-template/view/report",
	newdoc: "/app/sales-order/new",
	login: "/login",
};

function findChrome() {
	if (process.env.KAITEN_CHROME) return process.env.KAITEN_CHROME;
	const root = join(homedir(), ".cache/puppeteer/chrome-headless-shell");
	if (!existsSync(root)) throw new Error("No headless shell found; set KAITEN_CHROME.");
	for (const version of readdirSync(root).sort().reverse()) {
		const dir = join(root, version);
		for (const platform of readdirSync(dir)) {
			const bin = join(dir, platform, "chrome-headless-shell");
			if (existsSync(bin)) return bin;
		}
	}
	throw new Error("No headless shell binary found; set KAITEN_CHROME.");
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
	executablePath: findChrome(),
	args: ["--no-sandbox"],
	defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 2 },
});
const page = await browser.newPage();

// Seed the skin before the desk boots, so nothing is captured mid-repaint.
await page.evaluateOnNewDocument(
	(skin, appearance) => {
		try {
			localStorage.setItem("kaiten_ui_skin", skin);
			localStorage.setItem("aurora_ui_skin", skin);
			if (appearance !== "automatic") {
				document.documentElement.setAttribute("data-theme-mode", appearance);
				document.documentElement.setAttribute("data-theme", appearance);
			}
		} catch (e) {}
	},
	SKIN,
	APPEARANCE
);

await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
if (await page.$("#login_email")) {
	await page.type("#login_email", USER);
	await page.type("#login_password", PW);
	await Promise.all([
		page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
		page.click(".btn-login, button[type=submit]"),
	]);
}

for (const route of ROUTES) {
	const target = TARGETS[route];
	if (!target) {
		console.error(`unknown route: ${route}`);
		continue;
	}

	if (route === "login") {
		await page.goto(`${BASE}/?cmd=web_logout`, { waitUntil: "networkidle2" }).catch(() => {});
		await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
	} else {
		await page.goto(BASE + target, { waitUntil: "networkidle2" });
	}

	await wait(route === "login" ? 2500 : 6000);

	// Confirm the skin actually landed, so a stale cache cannot pass as a pass.
	const state = await page.evaluate(() => ({
		skin: document.documentElement.getAttribute("data-kaiten-skin"),
		on: document.documentElement.classList.contains("aurora-on"),
		theme: document.documentElement.getAttribute("data-theme"),
	}));

	const file = join(OUT, `${SKIN}-${APPEARANCE}-${route}.png`);
	await page.screenshot({ path: file });
	console.log(`${file}  skin=${state.skin || "default"} on=${state.on} theme=${state.theme}`);
}

await browser.close();
