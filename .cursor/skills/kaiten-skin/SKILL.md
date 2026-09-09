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
| Aurora | `class="aurora-on"`, no skin attribute — it is the base layer |
| Another skin | `class="aurora-on" data-kaiten-skin="<id>"` |
| Colour tone | `data-aur-accent="<tone>"`, or `custom:<id>` with the stops set inline |
| Light/dark | `data-theme-mode` + `data-theme`, set the way Frappe's own switcher does |
| Density | `data-aur-density="cozy" \| "compact"`, one setting for every skin |

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

#### Tones

A skin that offers colour choices declares one block per tone, and each tone
sets the accent, the three gradients and the four mesh colours:

```css
.aurora-on[data-kaiten-skin="<id>"][data-aur-accent="<tone>"] { … }
```

Repeat one tone's values in the skin's own block as the fallback: the stored
tone may belong to another skin, and a skin has to look finished regardless.

A tone the user mixes arrives as **inline** custom properties on `html`, which
beat every block here. So anything derived from the palette — a page wash, a
tinted rail — must read `--aur-accent` or the mesh tokens rather than a variable
only your presets define, or a mixed tone will leave it behind.

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

The hue cycles are set by `:nth-child()` rules that already carry your
specificity, so a plain attribute selector only ties with them. Repeat the class
to win the tie without depending on file order:

```css
.aurora-on.aurora-on[data-kaiten-skin="<id>"] .list-row-container { --cyc-h: 210; }
```

#### Density is not yours

`data-aur-density="compact"` is a preference that applies to every skin, and its
block in `kaiten.css` is written `.aurora-on.aurora-on[data-aur-density="compact"]`
so it outranks a skin's token block whatever the file order. It remaps Frappe's
own spacing variables (`--padding-*`, `--margin-*`, `--input-height`,
`--btn-height`, `--page-head-height`) and the radius scales, then tightens the
places that hard-code their spacing.

So express your geometry through the tokens. A skin that hard-codes `padding`
on a field, a row or a section is either overridden there and inconsistent with
the rest of the desk, or it wins and compact does nothing where it matters.
Reach for a real rule only for something density has no opinion about, and keep
it off the properties above.

### 3. Register the skin

`public/js/kaiten.js` — add one entry to `SKINS`, and a tone list if the skin
offers colours:

```js
{ id: "<id>", label: "<Label>", note: "<one short line>", swatch: "<css background>", tones: <TONES> }
```

Each tone is `{ id, label, swatch }`; the values behind it live in the skin's
stylesheet. `tones: []` hides the colour row for that skin.

`hooks.py` — append the file to the `app_include_css` list, after `kaiten.css`
and after every other skin, then bump `ASSET_VERSION`.

Nothing else needs touching. The panel builds its cards from `SKINS`, remembers
a tone per skin, and appends the user's mixed palettes to every tone list.

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
- [ ] Every tone the skin offers, and one mixed in the panel
- [ ] Compact density: a form, a list and a child table stay legible and nothing
      overlaps or clips
- [ ] Aurora is visually unchanged (the skin leaked if it is not)
- [ ] Default is stock Frappe with only the Kaiten bar added
- [ ] Mega menu, pin shelves, dropdowns and modals still open and are not clipped
- [ ] The panel stays open while theme, colour, density and appearance are changed

Drive the panel rather than seeding `localStorage`: preferences are pulled from
the server on boot and the later revision wins, so a seeded key is overwritten
before the first paint you would have captured.

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
