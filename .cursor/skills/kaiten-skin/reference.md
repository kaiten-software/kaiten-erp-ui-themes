# Kaiten skin reference

## Token contract

Everything `kaiten.css` paints resolves through these. Overriding them is the
cheapest way to change the look.

### Palette

| Token | Used by |
| --- | --- |
| `--aur-accent` | primary buttons, focus rings, selection, icon chips, `--primary` remap |
| `--aur-grad` | brand wordmark, active tabs, card top stripe, count pills |
| `--aur-grad-cool` | segmented controls, timeline dots, secondary fills |
| `--aur-grad-soft` | row and item hover wash |
| `--aur-mesh-a` … `-d` | the four radial blobs in the page backdrop |

### Surfaces

| Token | Used by |
| --- | --- |
| `--aur-surface` | bar, mega panel, popovers, modals, cards |
| `--aur-surface-2` | inset strips, segmented control track, scrollbar track |
| `--aur-sheet` | list sheet, sticky list rail, grid heading |
| `--aur-row-tint` | list row fill; re-declared on `:nth-child(even)` and `:hover` |

### Lines, ink, depth, geometry

| Token | Used by |
| --- | --- |
| `--aur-line` / `--aur-line-strong` | every border and divider |
| `--aur-ink` / `--aur-ink-soft` | body text / secondary text |
| `--aur-shadow-sm` / `--aur-shadow` / `--aur-shadow-lg` | rows / cards / panels |
| `--aur-glow` | focus and drag states |
| `--aur-r-sm` `--aur-r` `--aur-r-lg` `--aur-r-xl` | 10 / 14 / 18 / 24 by default |

### Frappe v17 remap

`kaiten.css` rewrites Frappe's own tokens under `.aurora-on`:

- `--radius-sm` … `--radius-xl` — raised so every stock control rounds alike.
- `--gray-50` … `--gray-950` — the whole neutral ramp, tinted toward the accent
  with `color-mix()`. **A low-chroma skin must flatten this**, or stock
  components stay tinted while your cards are neutral.
- `--primary`, `--primary-color`, `--btn-primary` — all mapped to `--aur-accent`.

### Non-token features

| Feature | Selector |
| --- | --- |
| Animated backdrop | `.aurora-on body::before` |
| Hue cycling | `--cyc-h` set per `:nth-child(8n+N)` on `.list-row-container`, `.sidebar-item-container`, `.dock-item`; per `:nth-of-type(6n+N)` on `.form-section` |
| Card stripe | `.widget::before`, `.frappe-card::before`, `.form-section::before` |
| Dock wash | `.dock::after` (rotating conic gradient) |
| Sidebar entrance | `@keyframes aur-side-in`, staggered by `--aur-stagger` |

## Worked example — Lumen

Lumen is the calm counterpart to Aurora: a pale two-stop wash instead of the
animated mesh, opaque white cards, wide soft shadows, near-neutral grays, pill
controls and ink-black primary actions.

```css
.aurora-on[data-kaiten-skin="lumen"] {
	--aur-surface: #ffffff;
	--aur-line: rgba(18, 22, 34, 0.07);
	--aur-ink: #1b1f2a;
	--aur-ink-soft: #79808f;
	--aur-shadow: 0 1px 3px rgba(18, 22, 34, 0.04), 0 18px 40px -24px rgba(18, 22, 34, 0.28);
	--aur-r-lg: 22px;
	--aur-r-xl: 28px;

	/* One hue for the whole desk, in place of Aurora's eight. */
	--lum-h: 258;

	/* Derived from the accent, so a mixed tone repaints the page too. */
	--lum-page: color-mix(in oklab, var(--aur-accent) 5%, #f7f8fb);
	--lum-page-2: color-mix(in oklab, var(--aur-accent) 13%, #eef0f6);
	background: linear-gradient(163deg, #fdfdff 0%, var(--lum-page) 52%, var(--lum-page-2) 100%);
}

/* The blobs stay as a corner glow, but stop moving. */
.aurora-on[data-kaiten-skin="lumen"] body::before {
	filter: blur(26px);
	transform: none;
	animation: none;
}

/* Doubled class, because the nth-child cycles tie with a plain attribute. */
.aurora-on.aurora-on[data-kaiten-skin="lumen"] .list-row-container,
.aurora-on.aurora-on[data-kaiten-skin="lumen"] .form-section {
	--cyc-h: var(--lum-h);
}
```

Read the shipped `kaiten-lumen.css` for the full treatment, including its five
tones and the dark block.

## Verification script

```bash
node .cursor/skills/kaiten-skin/scripts/shoot.mjs --skin lumen
node .cursor/skills/kaiten-skin/scripts/shoot.mjs --skin lumen --appearance dark
node .cursor/skills/kaiten-skin/scripts/shoot.mjs --skin aurora   # regression
```

The script seeds `kaiten_ui_skin` before boot, which is enough on a site with no
stored preferences. Once a **Kaiten UI Preference** record exists the server copy
wins, so drive the panel instead: click the ◕ button, then the theme card and the
tone. That also exercises the controls rather than only the stylesheet.

Environment:

| Variable | Default |
| --- | --- |
| `KAITEN_URL` | `http://localhost:8080` |
| `KAITEN_USER` | `Administrator` |
| `KAITEN_PW` | `admin` |
| `KAITEN_CHROME` | first Puppeteer headless shell found under `~/.cache/puppeteer` |
| `KAITEN_OUT` | `/tmp/kaiten-shots` |

The script writes `<out>/<skin>-<appearance>-<route>.png` and prints the paths.
Read them with the image tool — a skin that reads fine in code often does not on
screen.

## Syncing into a running container

Assets are plain files; a rebuild is not needed to look at a change.

```bash
cd <frappe_docker>
for svc in frontend backend; do
  cid=$(docker compose -f pwd.yml ps -q $svc)
  docker cp <app>/public/css/kaiten-lumen.css \
    $cid:/home/frappe/frappe-bench/apps/<app>/<app>/public/css/kaiten-lumen.css
done
```

A new file also has to be listed in `app_include_css`, and `hooks.py` is Python
held in memory: copy it in, then `bench --site <site> clear-cache` and restart
the backend, or the stylesheet is never requested.

Rebuild the image once the look is settled, or the change is lost on restart.
