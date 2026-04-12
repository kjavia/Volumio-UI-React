#!/usr/bin/env python3
"""Fix macOS Lion style for aqua/forms.scss — handles CRLF line endings."""
import re

path = 'design-system/themes/aqua/forms.scss'
with open(path, 'rb') as f:
    raw = f.read()

# Work in bytes, preserve line ending style
# Detect line ending
crlf = b'\r\n' in raw
LE = b'\r\n' if crlf else b'\n'

content = raw.decode('utf-8')

# ── 1. Fix .input-field ──────────────────────────────────────────────────
old_input = (
    "// Aqua: white inset field, rounded corners, blue focus ring\r\n"
    ".input-field {\r\n"
    "  width: 100%;\r\n"
    "  background-color: var(--color-white);\r\n"
    "  border: 1px solid rgba(0, 0, 0, 0.22);\r\n"
    "  border-radius: 6px;\r\n"
    "  padding: 6px 10px;\r\n"
    "  color: var(--text-dark);\r\n"
    "  font-family: var(--font-body);\r\n"
    "  font-size: var(--text-sm);\r\n"
    "  box-shadow: inset 0 1px 2px var(--shadow-08);\r\n"
    "  transition:\r\n"
    "    border-color 0.15s,\r\n"
    "    box-shadow 0.15s;\r\n"
    "  box-sizing: border-box;\r\n"
    "\r\n"
    "  &:focus {\r\n"
    "    outline: none;\r\n"
    "    border-color: var(--color-aqua-vivid);\r\n"
    "    box-shadow:\r\n"
    "      inset 0 1px 2px var(--shadow-08),\r\n"
    "      0 0 0 3px var(--glow-aqua-20);\r\n"
    "  }\r\n"
    "\r\n"
    "  &::placeholder {\r\n"
    "    color: var(--color-gray-300);\r\n"
    "  }\r\n"
    "}"
)
new_input = (
    "// Aqua/Lion: white inset field, 5px corners, blue focus ring\r\n"
    ".input-field {\r\n"
    "  width: 100%;\r\n"
    "  background-color: var(--color-white);\r\n"
    "  border: 1px solid rgba(0, 0, 0, 0.28);\r\n"
    "  border-radius: 5px;\r\n"
    "  padding: 4px 8px;\r\n"
    "  color: var(--text-dark);\r\n"
    "  font-family: var(--font-body);\r\n"
    "  font-size: var(--text-sm);\r\n"
    "  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);\r\n"
    "  transition:\r\n"
    "    border-color 0.15s,\r\n"
    "    box-shadow 0.15s;\r\n"
    "  box-sizing: border-box;\r\n"
    "\r\n"
    "  &:focus {\r\n"
    "    outline: none;\r\n"
    "    border-color: #4a90d9;\r\n"
    "    box-shadow:\r\n"
    "      inset 0 1px 2px rgba(0, 0, 0, 0.10),\r\n"
    "      0 0 0 3px rgba(74, 144, 217, 0.35);\r\n"
    "  }\r\n"
    "\r\n"
    "  &::placeholder {\r\n"
    "    color: var(--color-gray-300);\r\n"
    "  }\r\n"
    "}"
)
if old_input in content:
    content = content.replace(old_input, new_input, 1)
    print("✓ input-field updated")
else:
    print("✗ input-field NOT found — check CRLF")

# ── 2. Fix .aqua-checkbox ────────────────────────────────────────────────
old_cb = (
    "/* .aqua-checkbox class for direct inputs */\r\n"
    ".aqua-checkbox {\r\n"
    "  appearance: none;\r\n"
    "  -webkit-appearance: none;\r\n"
    "  width: 14px;\r\n"
    "  height: 14px;\r\n"
    "  border-radius: 3px;\r\n"
    "  border: 1px solid #7c7c7c;\r\n"
    "\r\n"
    "  // Base State: Inset white box\r\n"
    "  background: white;\r\n"
    "  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);\r\n"
    "\r\n"
    "  cursor: pointer;\r\n"
    "  position: relative;\r\n"
    "  display: inline-block;\r\n"
    "  vertical-align: middle;\r\n"
    "\r\n"
    "  &:checked {\r\n"
    "    border-color: #104191;\r\n"
    "    // Blue Gel Gradient\r\n"
    "    background: linear-gradient(to bottom, #8abaed 0%, #1e69de 50%, #1254c0 51%, #539fe1 100%);\r\n"
    "    box-shadow:\r\n"
    "      inset 0 1px 0 rgba(255, 255, 255, 0.4),\r\n"
    "      0 1px 2px rgba(0, 0, 0, 0.2);\r\n"
    "\r\n"
    '    // The "Check" Mark\r\n'
    "    &::after {\r\n"
    "      content: '';\r\n"
    "      position: absolute;\r\n"
    "      top: 1px;\r\n"
    "      left: 4px;\r\n"
    "      width: 4px;\r\n"
    "      height: 8px;\r\n"
    "      border: solid white;\r\n"
    "      border-width: 0 2px 2px 0;\r\n"
    "      transform: rotate(45deg);\r\n"
    "      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));\r\n"
    "    }\r\n"
    "  }\r\n"
    "}"
)
new_cb = (
    "/* .aqua-checkbox class and native input[type=\"checkbox\"] */\r\n"
    ".aqua-checkbox,\r\n"
    "input[type=\"checkbox\"] {\r\n"
    "  appearance: none;\r\n"
    "  -webkit-appearance: none;\r\n"
    "  width: 14px;\r\n"
    "  height: 14px;\r\n"
    "  border-radius: 3px;\r\n"
    "  border: 1px solid #a0a0a0;\r\n"
    "\r\n"
    "  // Base State: inset light gradient (Lion style)\r\n"
    "  background: linear-gradient(to bottom, #f0f0f0 0%, #ffffff 100%);\r\n"
    "  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);\r\n"
    "\r\n"
    "  cursor: pointer;\r\n"
    "  position: relative;\r\n"
    "  display: inline-block;\r\n"
    "  vertical-align: middle;\r\n"
    "  flex-shrink: 0;\r\n"
    "\r\n"
    "  &:checked {\r\n"
    "    background: linear-gradient(to bottom, #f0f0f0 0%, #ffffff 100%);\r\n"
    "    border-color: #888;\r\n"
    "    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);\r\n"
    "\r\n"
    "    // Lion-style dark gray checkmark on white bg\r\n"
    "    &::after {\r\n"
    "      content: '';\r\n"
    "      position: absolute;\r\n"
    "      top: 1px;\r\n"
    "      left: 4px;\r\n"
    "      width: 4px;\r\n"
    "      height: 8px;\r\n"
    "      border: solid #333;\r\n"
    "      border-width: 0 2px 2px 0;\r\n"
    "      transform: rotate(45deg);\r\n"
    "    }\r\n"
    "  }\r\n"
    "\r\n"
    "  &:focus-visible {\r\n"
    "    outline: none;\r\n"
    "    box-shadow:\r\n"
    "      inset 0 1px 2px rgba(0, 0, 0, 0.12),\r\n"
    "      0 0 0 3px rgba(74, 144, 217, 0.4);\r\n"
    "  }\r\n"
    "}"
)
if old_cb in content:
    content = content.replace(old_cb, new_cb, 1)
    print("✓ aqua-checkbox updated")
else:
    print("✗ aqua-checkbox NOT found — trying without filter line...")
    # Variant without the filter line? Try stripping it
    old_cb2 = old_cb.replace("      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));\r\n", "")
    if old_cb2 in content:
        content = content.replace(old_cb2, new_cb, 1)
        print("✓ aqua-checkbox (variant) updated")
    else:
        # Find it and print surrounding for debug
        idx = content.find('.aqua-checkbox {')
        if idx >= 0:
            print(f"Found at {idx}:")
            print(repr(content[idx:idx+300]))

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)
print("Done.")
