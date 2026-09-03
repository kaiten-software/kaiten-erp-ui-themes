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

## Worked example — Nimbus

Nimbus is the calm counterpart to Aurora: flat backdrop, white cards, wide soft
shadows, near-neutral grays, one blue accent.

```css
.aurora-on[data-kaiten-skin="nimbus"] {
	--aur-accent: #4f6bed;
	--aur-grad: linear-gradient(135deg, #5b78f0, #4f6bed);
	--aur-mesh-a: transparent;   /* … b, c, d — kills the mesh */
	--aur-surface: #ffffff;
	--aur-line: rgba(16, 24, 40, 0.07);
	--aur-ink: #101828;
	--aur-ink-soft: #667085;
	--aur-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 32px -12px rgba(16, 24, 40, 0.1);
	--aur-r-lg: 22px;
	--aur-r-xl: 28px;
}

.aurora-on[data-kaiten-skin="nimbus"] body::before {
	background: none;
	animation: none;
}

/* One fixed hue instead of the eight-step cycle. */
.aurora-on[data-kaiten-skin="nimbus"] .list-row-container,
.aurora-on[data-kaiten-skin="nimbus"] .form-section {
	--cyc-h: 225;
}
```

Read the shipped `kaiten-nimbus.css` for the full treatment.

## Verification script

```bash
node .cursor/skills/kaiten-skin/scripts/shoot.mjs --skin nimbus
node .cursor/skills/kaiten-skin/scripts/shoot.mjs --skin nimbus --appearance dark
node .cursor/skills/kaiten-skin/scripts/shoot.mjs --skin aurora   # regression
```

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
  docker cp <app>/public/css/kaiten-nimbus.css \
    $cid:/home/frappe/frappe-bench/apps/<app>/<app>/public/css/kaiten-nimbus.css
done
```

Rebuild the image once the look is settled, or the change is lost on restart.
