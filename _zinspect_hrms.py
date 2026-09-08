import frappe
frappe.connect("jwellery.local")

rows = frappe.db.sql("""
    SELECT knm.name, knm.title, knm.sequence,
           kni.type, kni.label, kni.section, kni.idx
    FROM `tabKaiten Nav Menu` knm
    LEFT JOIN `tabKaiten Nav Item` kni ON kni.parent = knm.name
    WHERE knm.menu_config = 'i7l1glkf6i'
    ORDER BY knm.sequence, kni.idx
""", as_dict=True)

from collections import defaultdict
navs = defaultdict(list)
nav_meta = {}
for r in rows:
    navs[r.name].append(r)
    if r.name not in nav_meta:
        nav_meta[r.name] = (r.title, r.sequence)

for name in sorted(navs.keys(), key=lambda x: nav_meta[x][1] or 0):
    title, seq = nav_meta[name]
    items = navs[name]
    breaks = [i for i in items if i.type == "Card Break"]
    print(f"\n[{seq}] {title} ({name}) — {len(breaks)} card breaks")
    for i in items:
        if i.type == "Card Break":
            print(f"  --- AREA: {i.label} ---")
        else:
            prefix = "    "
            print(f"{prefix}[{i.section}] {i.label}")

frappe.destroy()
