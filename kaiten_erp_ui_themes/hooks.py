app_name = "kaiten_erp_ui_themes"
app_title = "Kaiten ERP UI Themes"
app_publisher = "Kaiten"
app_description = "A rich, colorful desk theme and global mega menu for Frappe/ERPNext"
app_email = "hello@kaiten.dev"
app_license = "MIT"
required_apps = ["frappe"]

# Bump on every asset change: these are plain files, so nothing else busts the
# browser cache for them.
ASSET_VERSION = "5"

app_include_css = f"/assets/kaiten_erp_ui_themes/css/kaiten.css?v={ASSET_VERSION}"
app_include_js = f"/assets/kaiten_erp_ui_themes/js/kaiten.js?v={ASSET_VERSION}"

# The sign-in screen is a website page, not a desk page, so it needs its own
# pair. Both files no-op unless the login markup is present.
web_include_css = f"/assets/kaiten_erp_ui_themes/css/kaiten-login.css?v={ASSET_VERSION}"
web_include_js = f"/assets/kaiten_erp_ui_themes/js/kaiten-login.js?v={ASSET_VERSION}"

extend_bootinfo = "kaiten_erp_ui_themes.boot.extend_bootinfo"
update_website_context = ["kaiten_erp_ui_themes.boot.update_website_context"]
