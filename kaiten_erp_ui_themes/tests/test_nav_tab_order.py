"""Pinned and Recent must lead the desk bar on every content profile."""

from __future__ import annotations

import re
import unittest
from pathlib import Path

APP = Path(__file__).resolve().parents[1]


def _read(rel: str) -> str:
	return (APP / rel).read_text(encoding="utf-8")


class TestNavTabOrder(unittest.TestCase):
	def test_default_strip_puts_recent_beside_pinned(self):
		src = _read("public/js/kaiten.js")
		self.assertIn("return [PINNED_TAB, RECENT_TAB].concat(SITE_TABS);", src)
		self.assertNotIn("[PINNED_TAB].concat(SITE_TABS, [RECENT_TAB])", src)

	def test_profile_strip_puts_recent_beside_pinned(self):
		"""HRMS / jewellery / any Kaiten Nav profile shares this builder."""
		src = _read("public/js/kaiten.js")
		self.assertIn("state.tabList = [PINNED_TAB, RECENT_TAB].concat(menuTabs);", src)
		self.assertNotIn("[PINNED_TAB].concat(menuTabs, [RECENT_TAB])", src)

	def test_personal_tabs_stay_pinned_and_recent(self):
		src = _read("public/js/kaiten.js")
		self.assertIn("id === PINNED_TAB.id || id === RECENT_TAB.id", src)

	def test_asset_version_busts_kaiten_js(self):
		hooks = _read("hooks.py")
		match = re.search(r'ASSET_VERSION = "(\d+)"', hooks)
		self.assertIsNotNone(match)
		self.assertGreaterEqual(int(match.group(1)), 84)
		self.assertIn("kaiten.js?v={ASSET_VERSION}", hooks)
