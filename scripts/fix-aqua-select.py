with open('design-system/themes/aqua/forms.scss', 'rb') as f:
    raw = f.read()
text = raw.decode('utf-8')

# ── .select-field (used in settings panels) ──────────────────────────────────
old_select_field = (
    '.select-field {\r\n'
    '  appearance: none;\r\n'
    '  -webkit-appearance: none;\r\n'
    '  width: 100%;\r\n'
    '  padding: 6px 32px 6px 10px;\r\n'
    '  border-radius: 6px;\r\n'
    '  background-color: var(--color-white);\r\n'
    '  border: 1px solid rgba(0, 0, 0, 0.22);\r\n'
    '  font-family: var(--font-body);\r\n'
    '  font-size: var(--text-sm);\r\n'
    '  color: var(--text-dark);\r\n'
    '  box-shadow: inset 0 1px 2px var(--shadow-08);\r\n'
    '  // Custom double-arrow icon (macOS default sort)\r\n'
    '  background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'14\' viewBox=\'0 0 12 14\'%3E%3Cpath fill=\'%23555\' d=\'M6 0l5 6H1zM6 14l-5-6h10z\'/%3E%3C/svg%3E");\r\n'
    '  background-repeat: no-repeat;\r\n'
    '  background-position: right 10px center;\r\n'
    '  cursor: pointer;\r\n'
    '\r\n'
    '  &:focus {\r\n'
    '    outline: none;\r\n'
    '    border-color: var(--color-aqua-vivid);\r\n'
    '    box-shadow:\r\n'
    '      inset 0 1px 2px var(--shadow-08),\r\n'
    '      0 0 0 3px var(--glow-aqua-20);\r\n'
    '  }\r\n'
    '}'
)

new_select_field = (
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

# ── .form-select (Bootstrap override used in playlist manager etc.) ───────────
old_form_select = (
    '// \u2500\u2500\u2500 Select / Dropdown \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n'
    '.form-select {\r\n'
    '  @extend .btn;\r\n'
    '  @extend .btn-secondary;\r\n'
    '  appearance: none;\r\n'
    '  display: block;\r\n'
    '  text-align: left;\r\n'
    '  padding: 4px 28px 4px 12px;\r\n'
    '  background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\'%3E%3Cpath d=\'M0 0l5 6 5-6z\' fill=\'%23555555\'/%3E%3C/svg%3E");\r\n'
    '  background-repeat: no-repeat;\r\n'
    '  background-position: right 9px center;\r\n'
    '\r\n'
    '  option {\r\n'
    '    background: #f0f0f0;\r\n'
    '    color: #1a1a1a;\r\n'
    '  }\r\n'
    '\r\n'
    '  &::after {\r\n'
    '    display: none;\r\n'
    '    content: none;\r\n'
    '  }\r\n'
    '\r\n'
    '  &:focus {\r\n'
    '    outline: none;\r\n'
    '    border-color: #4a90d9;\r\n'
    '    box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.25);\r\n'
    '  }\r\n'
    '\r\n'
    '  &:disabled {\r\n'
    '    opacity: 0.5;\r\n'
    '    cursor: not-allowed;\r\n'
    '  }\r\n'
    '}'
)

new_form_select = (
    '// \u2500\u2500\u2500 Select / Dropdown \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n'
    '.form-select {\r\n'
    '  // Lion-style popup button — white gradient, thin border, single chevron\r\n'
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

changed = 0
if old_select_field in text:
    text = text.replace(old_select_field, new_select_field, 1)
    changed += 1
    print('select-field: OK')
else:
    print('select-field: NOT FOUND')

if old_form_select in text:
    text = text.replace(old_form_select, new_form_select, 1)
    changed += 1
    print('form-select: OK')
else:
    print('form-select: NOT FOUND')
    # Debug: find the actual section
    idx = text.find('form-select')
    if idx >= 0:
        print('ACTUAL:', repr(text[idx-60:idx+400]))

if changed > 0:
    with open('design-system/themes/aqua/forms.scss', 'wb') as f:
        f.write(text.encode('utf-8'))
    print(f'Wrote {changed} change(s)')
