with open('design-system/themes/aqua/button.scss', 'rb') as f:
    raw = f.read()
text = raw.decode('utf-8')

# Extract exact divider from the file itself
idx = text.find('Disabled State')
line_start = text.rfind('\r\n', 0, idx) + 2
line_end = text.find('\r\n', idx)
DISABLED_DIVIDER = text[line_start:line_end]

DISABLED_BLOCK = (
    '.btn:disabled,\r\n'
    '.btn.disabled {\r\n'
    '  opacity: 0.4;\r\n'
    '  cursor: not-allowed;\r\n'
    '  pointer-events: none;\r\n'
    '}\r\n'
)

old = (
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
    + DISABLED_DIVIDER + '\r\n'
    + DISABLED_BLOCK
    + '\r\n'
    + DISABLED_DIVIDER + '\r\n'
    + DISABLED_BLOCK
)

new = (
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
    '    text-decoration: none;\r\n'
    '  }\r\n'
    '}\r\n'
    '\r\n'
    + DISABLED_DIVIDER + '\r\n'
    + DISABLED_BLOCK
)

if old in text:
    text = text.replace(old, new, 1)
    with open('design-system/themes/aqua/button.scss', 'wb') as f:
        f.write(text.encode('utf-8'))
    print('SUCCESS')
else:
    print('NOT FOUND')
    # show exact end of btn-link block
    idx2 = text.find('.btn-link')
    print(repr(text[idx2 + 380:idx2 + 620]))
