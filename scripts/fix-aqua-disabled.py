with open('design-system/themes/aqua/button.scss', 'rb') as f:
    raw = f.read()
text = raw.decode('utf-8')

addition = (
    '\r\n'
    '// \u2500\u2500\u2500 Disabled State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\r\n'
    '.btn:disabled,\r\n'
    '.btn.disabled {\r\n'
    '  opacity: 0.4;\r\n'
    '  cursor: not-allowed;\r\n'
    '  pointer-events: none;\r\n'
    '}\r\n'
)

text = text + addition
with open('design-system/themes/aqua/button.scss', 'wb') as f:
    f.write(text.encode('utf-8'))
print('SUCCESS')
