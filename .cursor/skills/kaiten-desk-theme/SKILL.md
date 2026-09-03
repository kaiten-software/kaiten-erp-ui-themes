---
name: kaiten-desk-theme
description: Adds a new Frappe/ERPNext desk look to Kaiten ERP UI Themes from a screenshot or design brief. Use when the user asks to create a theme, add a look, freeze a current look, or turn a UI screenshot into a Kaiten theme.
---

# Kaiten desk theme

Two independent axes. Never collapse them into one switch.

| Axis | Storage | Values | What it does |
| --- | --- | --- | --- |
| **Look** | `kaiten_ui_look` | `default` · `aurora` · `halo` · *(new id)* | Visual skin. `default` is stock Frappe. |
| **Appearance** | `kaiten_ui_scheme` | `auto` · `light` · `dark` | Colour scheme. Works with any look. |

The mega menu, pins, search, and login chrome stay up for every look. Only page paint is gated on the look class.

## File map

App root: `kaiten_erp_ui_themes/`

| File | Role |
| --- | --- |
| `kaiten_erp_ui_themes/public/css/kaiten.css` | Frozen **Aurora** look (`.aurora-on`) plus unscoped bar/picker chrome |
| `kaiten_erp_ui_themes/public/css/kaiten-halo.css` | **Halo** overrides under `html.halo-on` |
| `kaiten_erp_ui_themes/public/css/kaiten-<id>.css` | New look: overrides only, scoped `html.<id>-on` |
| `kaiten_erp_ui_themes/public/js/kaiten.js` | `LOOKS`, `KEY.look`, `applyPrefs`, theme modal |
| `kaiten_erp_ui_themes/public/js/kaiten-login.js` | Same look + scheme keys |
| `kaiten_erp_ui_themes/hooks.py` | Append the new CSS; bump `ASSET_VERSION` |

## Add a look from a screenshot

Copy this checklist and track it:

```
- [ ] Read the screenshot; name the look (short, title case, one word)
- [ ] Add LOOKS entry + preview swatch in kaiten.js
- [ ] New CSS file scoped to html.<id>-on (overrides, do not fork kaiten.css)
- [ ] applyPrefs: aurora-on for aurora OR the new look (shared structure); <id>-on for the new look only
- [ ] Add a preview card in the Switch Theme modal
- [ ] Register CSS in hooks.py; bump ASSET_VERSION
- [ ] Dark overrides under html.<id>-on[data-theme="dark"]
- [ ] Do not change pin, search, shelf, or routing logic
```

### How Halo (and future looks) ride on Aurora

`applyPrefs` sets `aurora-on` for every painted look except `default`. That reuses Aurora’s structural polish (list sheet, form cards, popup unclip). The new stylesheet only restyles tokens and surfaces.

```javascript
root.classList.toggle("aurora-on", look !== "default");
root.classList.toggle("halo-on", look === "halo");
root.classList.toggle("<id>-on", look === "<id>");
```

Do **not** add `aurora-on` when look is `default`.

### What the new CSS should override

Write the smallest file that makes the screenshot true:

1. Page wash (`background`) and kill or soften `body::before` mesh
2. `--radius-*` / `--aur-r-*` and `--aur-shadow*`
3. `--gray-*` ramp (neutral vs accent-tinted)
4. Cards, list sheet, form sections, sidebar, dock, buttons, pills
5. Dark counterparts

Do not copy `kaiten.css`. Do not restyle `.aur-bar` unless the screenshot demands it — the bar is shared chrome.

### Naming

- Look id: lowercase, one word, CSS-safe (`halo`, `slate`, `noir`)
- Label: title case, the word users see on the card
- Class: `html.<id>-on`
- File: `kaiten-<id>.css`

### Theme modal

The right-hand half-circle button opens **Switch Theme**. Two rows:

1. **Look** — Default, Aurora, Halo, … (radio cards with a CSS mini-preview)
2. **Appearance** — Automatic, Light, Dark

Appearance must remain selectable while a look is selected. Closing the modal does not reset either axis.

### Login

`kaiten-login.js` reads the same `kaiten_ui_look` and `kaiten_ui_scheme` keys. Add login overrides to the new CSS only if the screenshot includes a sign-in.

### Do not

- Replace `kaiten.css` or rename `.aurora-on` (Aurora is frozen)
- Make look and appearance mutually exclusive
- Break `watchPopups`, pin shelves, or mega-menu search
- Bump assets without changing `ASSET_VERSION`
