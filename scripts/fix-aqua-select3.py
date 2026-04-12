with open('design-system/themes/aqua/forms.scss', 'rb') as f:
    raw = f.read()
text = raw.decode('utf-8')

# Double up-down arrow SVG (URL-encoded)
# <svg xmlns='http://www.w3.org/2000/svg' width='8' height='14' viewBox='0 0 8 14'>
#   <path d='M4 0L8 5H0z' fill='%23444'/>
#   <path d='M4 14L0 9h8z' fill='%23444'/>
# </svg>
ARROW = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='14' viewBox='0 0 8 14'%3E%3Cpath d='M4 0L8 5H0z' fill='%23444'/%3E%3Cpath d='M4 14L0 9h8z' fill='%23444'/%3E%3C/svg%3E\")"

# Stacked backgrounds: arrow | gel shine | base gradient
BG = (
    f"  background:\r\n"
    f"    {ARROW} no-repeat right 9px center,\r\n"
    f"    linear-gradient(to bottom, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 50%) no-repeat,\r\n"
    f"    linear-gradient(to bottom, #f0f0f0 0%, #d8d8d8 49%, #cecece 51%, #e8e8e8 100%);\r\n"
)

# ── .select-field ─────────────────────────────────────────────────────────────
old_sf = (
    '.select-field {\r\n'
    '  // Lion-style popup button: white gradient, thin border, single chevron\r\n'
    '  appearance: none;\r\n'
    '  -webkit-appearance: none;\r\n'
    '  width: 100%;\r\n'
    '  padding: 4px 28px 4px 8px;\r\n'
    '  border-radius: 5px;\r\n'
    '  background: linear-gradient(to bottom, #ffffff 0%, #e8e8e8 100%);\r\n'
    '  border: 1px solid rgba(0, 0, 0, 0.28);\r\n'
    '  font-family: var(--font-body);\r\n'
    '  font-size: var(--text-sm);\r\n'
    '  color: #1a1a1a;\r\n'
    '  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(0, 0, 0, 0.1);\r\n'
    '  // Single downward chevron\r\n'
    '  background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23444444\'/%3E%3C/svg%3E");\r\n'
    '  background-repeat: no-repeat;\r\n'
    '  background-position: right 9px center;\r\n'
    '  cursor: pointer;\r\n'
    '\r\n'
    '  &:focus {\r\n'
    '    outline: none;\r\n'
    '    border-color: #4a90d9;\r\n'
    '    box-shadow:\r\n'
    '      inset 0 1px 0 rgba(255, 255, 255, 0.9),\r\n'
    '      0 0 0 3px rgba(74, 144, 217, 0.35);\r\n'
    '  }\r\n'
    '\r\n'
    '  option {\r\n'
    '    background: #ffffff;\r\n'
    '    color: #1a1a1a;\r\n'
    '  }\r\n'
    '}'
)

new_sf = (
    '.select-field {\r\n'
    '  // Aqua gel popup button: stacked gel shine + double arrow\r\n'
    '  appearance: none;\r\n'
    '  -webkit-appearance: none;\r\n'
    '  width: 100%;\r\n'
    '  padding: 4px 28px 4px 8px;\r\n'
    '  border-radius: 5px;\r\n'
    + BG +
    '  border: 1px solid rgba(0, 0, 0, 0.32);\r\n'
    '  font-family: var(--font-body);\r\n'
    '  font-size: var(--text-sm);\r\n'
    '  color: #1a1a1a;\r\n'
    '  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 1px 3px rgba(0, 0, 0, 0.18);\r\n'
    '  cursor: pointer;\r\n'
    '\r\n'
    '  &:focus {\r\n'
    '    outline: none;\r\n'
    '    border-color: #4a90d9;\r\n'
    '    box-shadow:\r\n'
    '      inset 0 1px 0 rgba(255, 255, 255, 0.6),\r\n'
    '      0 0 0 3px rgba(74, 144, 217, 0.35);\r\n'
    '  }\r\n'
    '\r\n'
    '  option {\r\n'
    '    background: #ffffff;\r\n'
    '    color: #1a1a1a;\r\n'
    '  }\r\n'
    '}'
)

# ── .form-select ──────────────────────────────────────────────────────────────
old_fs = (
    '.form-select {\r\n'
    '  // Lion-style popup button \u2014 white gradient, thin border, single chevron\r\n'
    '  appearance: none;\r\n'
    '  -webkit-appearance: none;\r\n'
    '  display: block;\r\n'
    '  width: 100%;\r\n'
    '  padding: 4px 28px 4px 8px;\r\n'
    '  border-radius: 5px;\r\n'
    '  background: linear-gradient(to bottom, #ffffff 0%, #e8e8e8 100%);\r\n'
    '  border: 1px solid rgba(0, 0, 0, 0.28);\r\n'
    '  font-family: var(--font-body);\r\n'
    '  font-size: var(--text-sm, 0.8rem);\r\n'
    '  color: #1a1a1a;\r\n'
    '  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 1px 2px rgba(0, 0, 0, 0.1);\r\n'
    '  background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23444444\'/%3E%3C/svg%3E");\r\n'
    '  background-repeat: no-repeat;\r\n'
    '  background-position: right 9px center;\r\n'
    '  cursor: pointer;\r\n'
    '  line-height: 1.4;\r\n'
    '  min-height: unset;\r\n'
    '\r\n'
    '  option {\r\n'
    '    background: #ffffff;\r\n'
    '    color: #1a1a1a;\r\n'
    '  }\r\n'
    '\r\n'
    '  &:focus {\r\n'
    '    outline: none;\r\n'
    '    border-color: #4a90d9;\r\n'
    '    box-shadow:\r\n'
    '      inset 0 1px 0 rgba(255, 255, 255, 0.9),\r\n'
    '      0 0 0 3px rgba(74, 144, 217, 0.35);\r\n'
    '  }\r\n'
    '\r\n'
    '  &:disabled {\r\n'
    '    opacity: 0.5;\r\n'
    '    cursor: not-allowed;\r\n'
    '    pointer-events: none;\r\n'
    '  }\r\n'
    '}'
)

new_fs = (
    '.form-select {\r\n'
    '  // Aqua gel popup button: stacked gel shine + double arrow\r\n'
    '  appearance: none;\r\n'
    '  -webkit-appearance: none;\r\n'
    '  display: block;\r\n'
    '  width: 100%;\r\n'
    '  padding: 4px 28px 4px 8px;\r\n'
    '  border-radius: 5px;\r\n'
    + BG +
    '  border: 1px solid rgba(0, 0, 0, 0.32);\r\n'
    '  font-family: var(--font-body);\r\n'
    '  font-size: var(--text-sm, 0.8rem);\r\n'
    '  color: #1a1a1a;\r\n'
    '  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 1px 3px rgba(0, 0, 0, 0.18);\r\n'
    '  cursor: pointer;\r\n'
    '  line-height: 1.4;\r\n'
    '  min-height: unset;\r\n'
    '\r\n'
    '  option {\r\n'
    '    background: #ffffff;\r\n'
    '    color: #1a1a1a;\r\n'
    '  }\r\n'
    '\r\n'
    '  &:focus {\r\n'
    '    outline: none;\r\n'
    '    border-color: #4a90d9;\r\n'
    '    box-shadow:\r\n'
    '      inset 0 1px 0 rgba(255, 255, 255, 0.6),\r\n'
    '      0 0 0 3px rgba(74, 144, 217, 0.35);\r\n'
    '  }\r\n'
    '\r\n'
    '  &:disabled {\r\n'
    '    opacity: 0.5;\r\n'
    '    cursor: not-allowed;\r\n'
    '    pointer-events: none;\r\n'
    '  }\r\n'
    '}'
)

changed = 0
if old_sf in text:
    text = text.replace(old_sf, new_sf, 1)
    changed += 1
    print('select-field: OK')
else:
    print('select-field: NOT FOUND')

if old_fs in text:
    text = text.replace(old_fs, new_fs, 1)
    changed += 1
    print('form-select: OK')
else:
    print('form-select: NOT FOUND')

if changed > 0:
    with open('design-system/themes/aqua/forms.scss', 'wb') as f:
        f.write(text.encode('utf-8'))
    print(f'Wrote {changed} change(s)')
