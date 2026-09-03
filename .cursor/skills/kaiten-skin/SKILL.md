---
name: kaiten-skin
description: Create or edit a Kaiten desk skin for Frappe/ERPNext, usually from a reference screenshot or design. Use when the user supplies a UI screenshot and asks for a new theme, or asks to add, rename, retune or remove a skin in the kaiten_erp_ui_themes app.
disable-model-invocation: true
---

# Building a Kaiten skin

A **skin** is a look (Aurora, Nimbus, …). It is independent of **appearance**
(automatic / light / dark), which stays Frappe's. Never couple the two.

A skin is one stylesheet of token overrides layered on `kaiten.css`. You do not
fork or edit `kaiten.css` to add a skin.

## Architecture

`kaiten.css` is the base layer. Every rule in it is scoped `.aurora-on …`
(specificity 0-1-0). A skin file scopes every rule
`.aurora-on[data-kaiten-skin="<id>"] …` (0-2-0), so it wins on the cascade with
no `!important`.

| State | `html` attributes |
| --- | --- |
| Default (stock Frappe) | neither class nor attribute |
| A skin | `class="aurora-on" data-kaiten-skin="<id>"` |
| Light/dark | `data-theme-mode` + `data-theme`, set by Frappe |

`.aurora-on` is a legacy class name kept because 369 rules depend on it. Read it
as "a Kaiten skin is active". Do not rename it.

## Workflow

```
- [ ] 1. Read the reference and extract the design contract
- [ ] 2. Create kaiten-<id>.css
- [ ] 3. Register the skin in kaiten.js and hooks.py
- [ ] 4. Verify every skin x light/dark
- [ ] 5. Bump ASSET_VERSION
```

### 1. Extract the design contract

Read the screenshot and write down, before any CSS:

- **Page backdrop** — flat colour, or a gradient/mesh?
- **Card surface** — colour, corner radius in px, border vs shadow-only?
- **Shadow character** — tight and dark, or wide and diffuse?
- **Accent** — the one hue used for primary actions and selection.
- **Status colours** — the pills/badges (success, warning, info).
- **Ink** — heading colour and secondary text colour.
- **Chroma of the neutrals** — are the grays pure, or tinted toward the accent?
- **Density** — padding inside cards and rows.
- **Motion** — does the design imply calm or energetic?

State these as a short list in your reply so the user can correct you before
you build. Getting the backdrop and radius wrong is the expensive mistake.

### 2. Create the stylesheet

`kaiten_erp_ui_themes/public/css/kaiten-<id>.css`. Start from the token block
below — overriding tokens gets ~80% of the look, because `kaiten.css` draws
almost everything from them.

```css
/* Every rule carries the attribute; nothing here may leak into other skins. */
.aurora-on[data-kaiten-skin="<id>"] {
	/* Palette */
	--aur-accent: #6366f1;
	--aur-grad: linear-gradient(...);      /* headline fills, active pills */
	--aur-grad-cool: linear-gradient(...); /* secondary fills */
	--aur-grad-soft: linear-gradient(...); /* hover washes */

	/* Backdrop mesh — set all four to transparent for a flat page */
	--aur-mesh-a: ...; --aur-mesh-b: ...; --aur-mesh-c: ...; --aur-mesh-d: ...;

	/* Surfaces */
	--aur-surface: #fff;    /* bar, panel, popovers */
	--aur-surface-2: ...;   /* inset areas */
	--aur-sheet: #fff;      /* list sheet, grid header */
	--aur-row-tint: ...;    /* per-row tint; also set on :nth-child/:hover */

	/* Lines and ink */
	--aur-line: ...; --aur-line-strong: ...;
	--aur-ink: ...; --aur-ink-soft: ...;

	/* Depth */
	--aur-shadow-sm: ...; --aur-shadow: ...; --aur-shadow-lg: ...;
	--aur-glow: ...;

	/* Geometry */
	--aur-r-sm: 10px; --aur-r: 14px; --aur-r-lg: 18px; --aur-r-xl: 24px;

	/* Motion */
	--aur-fast: .18s; --aur-mid: .32s; --aur-slow: .55s;
}
```

Then override the Frappe v17 remap if the neutrals differ. `kaiten.css` tints
the whole `--gray-*` ramp toward the accent; a low-chroma design must flatten it:

```css
.aurora-on[data-kaiten-skin="<id>"]:not([data-theme="dark"]) {
	--gray-50: #f8f9fb;  /* … through --gray-950 */
}
```

Give dark mode its own block:

```css
.aurora-on[data-kaiten-skin="<id>"][data-theme="dark"] { … }
```

**Page paint** is gated on the theme, so set it explicitly:

```css
.aurora-on[data-kaiten-skin="<id>"] { background: #f4f5f7; }
```

#### Things that are not tokens

These are drawn in `kaiten.css` and need real rules to change:

| Feature | Where | To neutralise |
| --- | --- | --- |
| Animated mesh | `body::before` | `background: none; animation: none;` |
| Per-item hue cycling | `--cyc-h` on rows, sidebar, dock, form sections | set one fixed hue, or override the rules that read it |
| Card top stripe | `.widget::before`, `.frappe-card::before`, `.form-section::before` | `background-image: none` or a flat colour |
| Dock conic wash | `.dock::after` | `content: none` |
| Gradient wordmark | `.title-container .header-title` | flat `color`, `-webkit-text-fill-color: currentColor` |

The stripe pseudo-elements cover the whole card (`inset: 0`, `border-radius:
inherit`) and paint the bar as a background stripe so it clips to the curve.
Keep that structure — override `background-image`, never `position` or `inset`.

### 3. Register the skin

`public/js/kaiten.js` — add one entry to `SKINS`:

```js
{ id: "<id>", label: "<Label>", note: "<one short line>", swatch: "<css background>" }
```

`hooks.py` — append the file to `app_include_css` and bump `ASSET_VERSION`.

Nothing else needs touching. The appearance panel builds its cards from `SKINS`.

### 4. Verify

Assets are plain files, so the browser caches them hard. After every edit,
sync and shoot:

```bash
node .cursor/skills/kaiten-skin/scripts/shoot.mjs --skin <id>
```

The script signs in, switches skin and appearance, and writes screenshots for
the workspace, a list view, a form and the login page. Read them; do not assume.

Check each of these before declaring done:

- [ ] Workspace, list, form, report and the login page in the new skin
- [ ] The same in dark mode
- [ ] Aurora is visually unchanged (the skin leaked if it is not)
- [ ] Default is stock Frappe with only the Kaiten bar added
- [ ] Mega menu, pin shelves, dropdowns and modals still open and are not clipped

### 5. Bump the asset version

`ASSET_VERSION` in `hooks.py` is the only cache-buster. Skipping it means the
user sees the old file and reports the work as broken.

## Guardrails

- Never edit `kaiten.css` to serve one skin. If two skins need the same
  structural fix, it belongs in `kaiten.css` unscoped by attribute.
- Never use `!important`. If a rule loses, add the attribute selector to raise
  specificity instead.
- Never gate behaviour on the skin in JS. Skins are presentation only; every
  feature works identically in all of them.
- Keep the `aur-` class prefix. Renaming breaks the JS that queries it.
- `color-mix()` is used throughout for accent tinting. Pair it with a plain hex
  fallback on the preceding line, matching the existing style.

## Reference

- Token contract and worked example: [reference.md](reference.md)
