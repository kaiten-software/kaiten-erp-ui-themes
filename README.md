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
- **Two menu layouts** — *Split* keeps the group rail beside the entries;
  *Columns* drops the rail and lays every group out at once, each under its own
  heading. Long groups show their first eight entries with a `+n more` that opens
  the rest in place — pushing down only what sits below it in the same lane — so a
  module with ninety doctypes never crowds out the other thirty-four. Switch with
  the toggle beside the menu filter; the choice is remembered per user.
- **Login** — branded sign-in with the same accent presets as the desk.
- **Menu API** — one call feeds the whole bar, cached per user for five minutes.
  Every doctype, report and tool is filtered against that user's read permission,
  and workspaces come from the same role-aware source the stock sidebar uses, so
  the menu shows only what its reader could already reach. A user who may read
  nothing is offered nothing.
- **Preferences follow the user** — pins, shelves, recents, accent, density and
  layout are stored against the user in the database, so they survive a new
  machine, a different browser or cleared site data.

## Where preferences are stored

`localStorage` is still written first, so the bar paints without waiting on a
round trip. The durable copy lives in a **Kaiten UI Preference** record, one per
user, holding the state as JSON.

On load the two are compared and the later revision wins. Pushes are held back
until that first read answers, so a fresh browser cannot overwrite good data
with its own emptiness; if the read fails (offline, or the doctype not yet
installed) everything keeps working locally and nothing is sent.

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
| `Esc` | close the mega menu, a popover, or the awesomebar |
| `Ctrl+K` | Frappe awesomebar (unchanged) |
| `Alt+1`…`9` | jump to a pinned item |

`Esc` closes whichever overlay is open and is deliberately left to bubble, so the
desk's own dialogs, grid cells and quick entry keep responding to it.

## Toggling

Click the brand mark on the left of the Kaiten bar, or run
`localStorage.setItem("kaiten_ui_enabled", "0")` and reload to fall back to
the stock desk. The bar itself stays available either way.

Accent and density live in the palette popover on the right of the bar.

## Uninstall

```bash
bench --site [site] uninstall-app kaiten_erp_ui_themes
```

That removes the **Kaiten UI Preference** records along with the app. The cached
copy in each browser's `localStorage` is left behind and is simply ignored once
the app is gone.
