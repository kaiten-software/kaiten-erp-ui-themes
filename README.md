# Kaiten ERP UI Themes

A Frappe / ERPNext app that restyles the desk and login screen, and replaces the
desk's navigation with either a global mega menu or a classic ERP module bar,
carrying every workspace, doctype, report and admin tool the logged-in user is
allowed to see.

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
bench --site [site] migrate
bench --site [site] clear-cache
```

`migrate` matters on an update, not just the first install: the menu doctypes
below arrive through the model sync, so a pull without it leaves the bar asking
for records the site does not have yet.

## What it adds

- **Two shells** — the shell decides what is on screen, and the theme decides
  how it looks; they are separate choices. *Command bar* is the tabbed mega
  menu this app started with. *Module nav* is the arrangement most ERP users
  already know: one menu per module across the top, each opening columns of
  entries, with a sidebar scoped to whichever module is open. Every feature
  works under both.
- **Themes** — *Default* is the stock desk with only the Kaiten bar; *Aurora* is
  colour at rest with an animated mesh; *Lumen* is soft light on a tinted
  gradient wash, with pill controls and ink-black actions; *Atlas* is the flat
  classic-ERP look — one solid accent, plain surfaces, square corners. Each
  theme offers its own colour tones, and a colour you mix yourself can be added
  to the palette.
- **Mega menu** — Workspaces, Modules, Create, Insights, Tools, Pinned and
  Recent. Search filters the tree. Pins can be filed onto shelves.
- **Menus you can edit** — the Module nav derives itself from the site's own
  workspaces, so it is correct on any app without being told anything. When
  that is not the menu you want, write it by hand in **Kaiten Nav Menu** and
  group those menus under a **Custom Menu Config** profile, then pick the
  profile in the panel. See *Content profiles* below.
- **Phone and tablet** — the shell folds to a single column on a small screen,
  with the module rail as a sheet, so the desk stays usable on a phone.
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
- **Preferences follow the user** — pins, shelves, recents, shell, content
  profile, theme, colour tones, mixed palettes, density, page style and layout
  are stored against the user in the database, so they survive a new machine, a
  different browser or cleared site data.

## The panel: shell, theme, colour and appearance

Everything lives in one panel: click the brand mark on the left of the Kaiten
bar, or the ◕ button on the right.

| Section | What it does |
| --- | --- |
| Appearance | Light, dark and system, one click each. This is Frappe's own setting, saved against the user; the ☀/☽/◑ button in the bar is a shortcut that steps through the same three. |
| Shell | Command bar or Module nav. |
| Content | Which menus the Module nav carries: *Module nav* is the automatic set derived from the site's workspaces, and every Active profile is offered beside it. |
| Look | How the Module nav opens a module — *Standard* drops a menu under the clicked module, *Workspace grid* lists modules down the left with the chosen module's entries as an icon grid. |
| Theme | Default, Aurora, Lumen or Atlas. Independent of the appearance: every theme has a light and a dark treatment. |
| Colour | The tones the chosen theme offers, and any you mixed. Hidden for Default, which has none. |
| Pages | *Standard* leaves Frappe's own forms and lists alone; *Custom* replaces them with the boxed, tighter treatment. |
| Density | Normal, cozy or compact. |

The panel stays open while you work in it, so a theme, a colour and a density
can be tried against the page behind it and compared without reopening
anything.

**Density.** Compact is not a smaller font — it is less air, everywhere.
Frappe derives most of its spacing from a handful of CSS variables, and compact
remaps them, so labels sit closer to their fields, sections stack tighter, rows
and cells lose their padding, inputs and buttons come down to 25px, the page
head to 40px, and corners tighten so the denser rows do not read as a stack of
lozenges. A form is around a fifth shorter. Aurora, Lumen and Atlas all
offer it; Default does not, and hides the control, because it is stock Frappe
with only the bar added — spacing included.

**Mixing a colour.** The `+` beside the tones opens three colour stops — the
gradient's start, middle and end. The middle one is also the flat accent used
for focus rings and selection. Name it, add it to the palette, and it sits
beside the presets for every theme. Right-click a mixed tone to remove it; the
theme falls back to its first preset.

A tone is remembered per theme, so moving between Aurora and Lumen and back
returns to the colour each was left on.

## Content profiles

Out of the box the Module nav reads the site's own workspaces, so it is right on
a plain ERPNext install and on any app that ships workspaces, without being
configured. A profile is for when that is not the menu the business wants.

| Doctype | Holds |
| --- | --- |
| **Custom Menu Config** | One profile: a domain name, a use case, and a status. Only *Active* profiles are offered in the panel, so a profile can be built up over days without anybody seeing it half-finished. |
| **Kaiten Nav Menu** | One top-level menu in that profile — its title, icon, sequence, an optional overview target the title itself opens, the roles allowed to see it, and its contents. |
| **Kaiten Nav Item** | One row inside a menu. A *Card Break* starts a new titled column; the *Link* rows after it belong to it. A link points at a DocType, Report, Page, Dashboard, Workspace or a plain URL, files itself under Main, Reports or Setup, and can be limited to one country. |

Menus are filtered per reader before they are sent, the same way the mega menu
is: a menu whose roles the user does not hold is not offered, and a link to
something the user cannot read is dropped. A user who may read nothing is
offered nothing.

Three helpers make a profile quicker to build than typing every row:

```bash
# write the automatic workspace-derived menu into editable records
bench --site [site] execute kaiten_erp_ui_themes.api.generate_nav_from_workspaces

# what the site offers that the configured menu does not carry
bench --site [site] execute kaiten_erp_ui_themes.api.nav_drift

# what ships with the app
bench --site [site] execute kaiten_erp_ui_themes.api.list_presets
```

`generate_nav_from_workspaces` gives a working starting point to edit by hand
rather than a blank profile. `nav_drift` is the review pass afterwards: it lists
the links the desk can reach that the menu has missed, so nothing is lost in
the move from automatic to hand-written.

## Presets

A preset is a whole profile in one file, shipped with the app and installed into
records:

```bash
bench --site [site] execute kaiten_erp_ui_themes.api.install_preset --kwargs "{'name': 'jewellery'}"
```

Links pointing at doctypes the site does not have are skipped, so a preset
written against one vertical lands on a plainer site as the subset that site can
actually reach, rather than failing or leaving dead entries. Pass
`{'overwrite': 1}` to replace an existing profile instead of adding beside it.

`jewellery` is the one shipped today: ten menus, around 390 links.

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

That removes the **Kaiten UI Preference** records along with the app, and with
them any **Custom Menu Config**, **Kaiten Nav Menu** and **Kaiten Nav Item**
records — a hand-built profile is worth exporting first if it is ever coming
back. The cached copy in each browser's `localStorage` is left behind and is
simply ignored once the app is gone.
