with open('design-system/themes/aqua/button.scss', 'rb') as f:
    raw = f.read()
text = raw.decode('utf-8')

# ── Fix btn-link ──────────────────────────────────────────────────────────────
old_link = (
    '// \u2500\u2500\u2500 Link / Transparent Button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n'
    '.btn-link {\r\n'
    '  background: transparent;\r\n'
    '  border: none;\r\n'
    '  border-radius: 0;\r\n'
    '  box-shadow: none;\r\n'
    '  color: var(--text-primary);\r\n'
    '  min-height: unset;\r\n'
    '  padding: 0;\r\n'
    '  text-decoration: none;\r\n'
    '\r\n'
    '  // Remove the Aqua gel shine overlay\r\n'
    '  &::after {\r\n'
    '    display: none;\r\n'
    '  }\r\n'
    '\r\n'
    '  &:hover {\r\n'
    '    background: transparent;\r\n'
    '    color: var(--color-primary);\r\n'
    '  }\r\n'
    '\r\n'
    '  &:active {\r\n'
    '    background: transparent;\r\n'
    '  }\r\n'
    '}\r\n'
    '// \u2500\u2500\u2500 Disabled State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n'
    '.btn:disabled,\r\n'
    '.btn.disabled {\r\n'
    '  opacity: 0.4;\r\n'
    '  cursor: not-allowed;\r\n'
    '  pointer-events: none;\r\n'
    '}\r\n'
    '\r\n'
    '// \u2500\u2500\u2500 Disabled State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n'
    '.btn:disabled,\r\n'
    '.btn.disabled {\r\n'
    '  opacity: 0.4;\r\n'
    '  cursor: not-allowed;\r\n'
    '  pointer-events: none;\r\n'
    '}\r\n'
)

new_link = (
    '// \u2500\u2500\u2500 Link / Transparent Button \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n'
    '.btn-link {\r\n'
    '  background: transparent;\r\n'
    '  border: none;\r\n'
    '  border-radius: 0;\r\n'
    '  box-shadow: none;\r\n'
    '  // Lion hyperlink blue\r\n'
    '  color: #2c6ecd;\r\n'
    '  min-height: unset;\r\n'
    '  padding: 0;\r\n'
    '  text-decoration: none;\r\n'
    '\r\n'
    '  // Remove the Aqua gel shine overlay\r\n'
    '  &::after {\r\n'
    '    display: none;\r\n'
    '  }\r\n'
    '\r\n'
    '  &:hover {\r\n'
    '    background: transparent;\r\n'
    '    color: #1a4fa0;\r\n'
    '    text-decoration: underline;\r\n'
    '  }\r\n'
    '\r\n'
    '  &:active {\r\n'
    '    background: transparent;\r\n'
    '    color: #0f3070;\r\n'
    '  }\r\n'
    '\r\n'
    '  &:disabled,\r\n'
    '  &.disabled {\r\n'
    '    color: #8a8a8a;\r\n'
    '    pointer-events: none;\r\n'
    '  }\r\n'
    '}\r\n'
    '\r\n'
    '// \u2500\u2500\u2500 Disabled State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n'
    '.btn:disabled,\r\n'
    '.btn.disabled {\r\n'
    '  opacity: 0.4;\r\n'
    '  cursor: not-allowed;\r\n'
    '  pointer-events: none;\r\n'
    '}\r\n'
)

if old_link in text:
    text = text.replace(old_link, new_link, 1)
    with open('design-system/themes/aqua/button.scss', 'wb') as f:
        f.write(text.encode('utf-8'))
    print('SUCCESS')
else:
    print('NOT FOUND')
    idx = text.find('.btn-link')
    print(repr(text[idx:idx+600]))
