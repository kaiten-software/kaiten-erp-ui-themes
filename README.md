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

- **Themes** — *Default* is the stock desk with only the Kaiten bar; *Aurora* is
  colour at rest with an animated mesh; *Lumen* is soft light on a tinted
  gradient wash, with pill controls and ink-black actions. Each theme offers its
  own colour tones, and a colour you mix yourself can be added to the palette.
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
- **Preferences follow the user** — pins, shelves, recents, theme, colour tones,
  mixed palettes, density and layout are stored against the user in the database,
  so they survive a new machine, a different browser or cleared site data.

## Themes, colour and appearance

Everything lives in one panel: click the brand mark on the left of the Kaiten
bar, or the ◕ button on the right.

| Section | What it does |
| --- | --- |
| Appearance | Light, dark and system, one click each. This is Frappe's own setting, saved against the user; the ☀/☽/◑ button in the bar is a shortcut that steps through the same three. |
| Theme | Default, Aurora or Lumen. Independent of the appearance: every theme has a light and a dark treatment. |
| Colour | The tones the chosen theme offers, and any you mixed. Hidden for Default, which has none. |
| Density | Cozy or compact. |

The panel stays open while you work in it, so a theme, a colour and a density
can be tried against the page behind it and compared without reopening
anything.

**Density.** Compact is not a smaller font — it is less air, everywhere.
Frappe derives most of its spacing from a handful of CSS variables, and compact
remaps them, so labels sit closer to their fields, sections stack tighter, rows
and cells lose their padding, inputs and buttons come down to 25px, the page
head to 40px, and corners tighten so the denser rows do not read as a stack of
lozenges. A form is around a fifth shorter. Aurora and Lumen both offer it;
Default does not, and hides the control, because it is stock Frappe with only
the bar added — spacing included.

**Mixing a colour.** The `+` beside the tones opens three colour stops — the
gradient's start, middle and end. The middle one is also the flat accent used
for focus rings and selection. Name it, add it to the palette, and it sits
beside the presets for every theme. Right-click a mixed tone to remove it; the
theme falls back to its first preset.

A tone is remembered per theme, so moving between Aurora and Lumen and back
returns to the colour each was left on.

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

The open menu is driven entirely from the keyboard. Focus stays in the filter
field the whole time and the selection is drawn onto a row instead of being held
by it, so typing narrows the list and the arrows walk it in the same breath, with
no mode to switch between. The first row is armed as soon as the panel opens, and
the panel prints its own legend along its foot.

| Key | Action |
| --- | --- |
| `/` or `Ctrl+/` | open the mega menu immediately, ready to filter |
| printable keys | filter the open mega menu |
| `↑` `↓` `←` `→` | walk the rows; `←` `→` yield to the caret while there is filter text left to cross |
| `Tab` / `Shift+Tab` | next or previous group — the shelf, workspace or module heading |
| `Ctrl+←` / `Ctrl+→` | previous or next tab in the bar, keeping any filter |
| `Home` / `End` | first or last row |
| `PageUp` / `PageDown` | a screenful at a time |
| `Enter` | open the selected row, or expand a `+N more` group |
| `Ctrl+Enter` | open the selected row in a new tab |
| tap `Alt` | show letter badges (they stay until you pick one) |
| letter while badges are up | open that row; two letters for `AA` / `AS` style badges |
| tap `Alt` again / `Esc` | hide the badges |
| `Esc` | drop the badges, then the menu, then a popover or the awesomebar |
| `Ctrl+K` | Frappe awesomebar (unchanged) |
| `Alt+1`…`9` | jump to a pinned item |

Badges are taken from the rows' own names, so `S` really is Sales Invoice. Rows
sharing an initial take a second letter from their next word — `SI` for Sales
Invoice against `SO` for Sales Order — while a row whose initial is unique keeps
the single letter. Because a bare letter is only ever handed out when nothing
else begins with it, no badge is ambiguous. Only rows actually on screen are
lettered and they are dealt again on scroll, so the alphabet never runs out
however long the list underneath is. Letters are matched on the physical key, so
`Option` on a Mac does not post a diacritic instead. Tap `Alt` once to show the
badges; they stay after you release the key so you can press the letter next.

`Esc` peels one layer per press and is deliberately left to bubble, so the desk's
own dialogs, grid cells and quick entry keep responding to it.

## Toggling

Pick **Default** in the theme panel to fall back to the stock desk, or run
`localStorage.setItem("kaiten_ui_skin", "default")` and reload. The bar itself
stays available either way.

## Uninstall

```bash
bench --site [site] uninstall-app kaiten_erp_ui_themes
```

That removes the **Kaiten UI Preference** records along with the app. The cached
copy in each browser's `localStorage` is left behind and is simply ignored once
the app is gone.
