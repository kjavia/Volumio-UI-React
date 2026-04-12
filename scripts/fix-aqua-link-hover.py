with open('design-system/themes/aqua/button.scss', 'rb') as f:
    raw = f.read()
text = raw.decode('utf-8')

old = (
    '  &:hover {\r\n'
    '    background: transparent;\r\n'
    '    color: #1a4fa0;\r\n'
    '    text-decoration: underline;\r\n'
    '  }\r\n'
)

new = (
    '  &:hover {\r\n'
    '    background: transparent;\r\n'
    '    color: #1a4fa0;\r\n'
    '  }\r\n'
)

if old in text:
    text = text.replace(old, new, 1)
    with open('design-system/themes/aqua/button.scss', 'wb') as f:
        f.write(text.encode('utf-8'))
    print('SUCCESS')
else:
    print('NOT FOUND')
