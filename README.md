# Kaiten ERP UI Themes

A Frappe / ERPNext app that restyles the desk and login screen, and adds a
global top mega menu for every workspace, doctype, report and admin tool the
logged-in user is allowed to see.

Works on **Frappe v15+ / ERPNext v15+**, including the v17 desk shell (dock,
sidebar, list sheet, forms).

## Install

From any bench:

```bash
bench get-app https://github.com/kaiten-software/kaiten-erp-ui-themes.git
bench --site [site] install-app kaiten_erp_ui_themes
bench --site [site] clear-cache
```

Then hard-refresh the browser. The Kaiten bar appears under the navbar; the
theme paints lists, forms, cards, the sidebar and the login page.

To update later:

```bash
bench update --apps kaiten_erp_ui_themes
# or
cd apps/kaiten_erp_ui_themes && git pull
bench --site [site] clear-cache
```

## What it adds

- **Desk theme** — accent-tinted tokens, glass chrome, card hover, colourful
  list/form sheets, sidebar and dock, dark mode.
- **Mega menu** — Workspaces, Modules, Create, Insights, Tools, Pinned and
  Recent. Search filters the tree. Pins can be filed onto shelves.
- **Login** — branded sign-in with the same accent presets as the desk.
- **Menu API** — one cached, permission-filtered call that feeds the bar.

## Branding

The wordmark defaults to **Kaiten**. Override it with either:

- Website Settings → App Name, or
- `site_config.json`:

```json
{
  "kaiten_brand": "Your Company"
}
```

## Keyboard

| Key | Action |
| --- | --- |
| `/` or `Ctrl+/` | focus Kaiten search (when the menu is closed) |
| printable keys | filter the open mega menu |
| `↑` `↓` | move through results |
| `Enter` | open the highlighted item |
| `Esc` | close the mega menu |
| `Ctrl+K` | Frappe awesomebar (unchanged) |
| `Alt+1`…`9` | jump to a pinned item |

## Toggling

Click the brand mark on the left of the Kaiten bar, or run
`localStorage.setItem("kaiten_ui_enabled", "0")` and reload to fall back to
the stock desk. The bar itself stays available either way.

Accent and density live in the palette popover on the right of the bar.

## Uninstall

```bash
bench --site [site] uninstall-app kaiten_erp_ui_themes
```

User pins, recents and accent choice are stored in the browser (`localStorage`)
and are not removed from the site database.
