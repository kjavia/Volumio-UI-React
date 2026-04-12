#!/usr/bin/env python3
"""Fix aqua/button.scss - CRLF-aware replacements for Lion style."""

path = 'design-system/themes/aqua/button.scss'
with open(path, 'rb') as f:
    content = f.read().decode('utf-8')

# Verify CRLF
if '\r\n' not in content:
    print("No CRLF - using LF replacements")
    LE = '\n'
else:
    print("CRLF detected - using CRLF replacements")
    LE = '\r\n'

changes = 0

# ── 1. Base .btn: change border-radius 18px → 6px, min-height 30px → 22px
# Also update the comment line and the border/gradient slightly
old_btn_line = f'  border: 1px solid #9c9c9c;{LE}  border-radius: 18px;{LE}'
new_btn_line = f'  border: 1px solid #a0a0a0;{LE}  border-radius: 6px;   // Lion rounded-rect, not pill{LE}'
if old_btn_line in content:
    content = content.replace(old_btn_line, new_btn_line, 1)
    print("✓ .btn border-radius 18px → 6px")
    changes += 1
else:
    print("✗ .btn border-radius not found")
    # Try to find it
    idx = content.find('border-radius: 18px')
    print(f"  First occurrence at {idx}: {repr(content[max(0,idx-30):idx+30])}")

# ── 2. Replace .btn min-height: 30px → 22px
old_mh = f'  min-height: 30px;{LE}'
new_mh = f'  min-height: 22px;{LE}'
if old_mh in content:
    # Only replace the first occurrence (inside .btn, not btn-sm etc)
    content = content.replace(old_mh, new_mh, 1)
    print("✓ .btn min-height 30px → 22px")
    changes += 1
else:
    print("✗ .btn min-height 30px not found")

# ── 3. Update comment line for .btn
old_comment = f'// In macOS Aqua, regular (non-default) buttons are silver/gray.{LE}'
new_comment = f'// In macOS Aqua/Lion, regular buttons are rounded-rect silver.{LE}'
if old_comment in content:
    content = content.replace(old_comment, new_comment, 1)
    print("✓ .btn comment updated")
    changes += 1

# ── 4. .btn-primary: change border-radius 18px → 6px
# Find the .btn-primary block and replace its border-radius
old_primary_br = f'  border: 1px solid #104191;{LE}  border-radius: 18px;{LE}'
new_primary_br = f'  border: 1px solid #1050a0;{LE}  border-radius: 6px;   // same rounded-rect as standard button{LE}'
if old_primary_br in content:
    content = content.replace(old_primary_br, new_primary_br, 1)
    print("✓ .btn-primary border-radius 18px → 6px")
    changes += 1
else:
    # Find any remaining 18px
    remaining = []
    start = 0
    while True:
        idx = content.find('border-radius: 18px', start)
        if idx < 0:
            break
        remaining.append(idx)
        start = idx + 1
    print(f"✗ .btn-primary fix failed. Remaining 18px at: {remaining}")
    for r in remaining:
        print(f"  {repr(content[max(0,r-60):r+40])}")

# ── 5. Replace the shine arc border-radius in ::after from 14px to 4px
old_shine = f'  border-radius: 14px 14px 4px 4px;{LE}'
new_shine = f'  border-radius: 4px 4px 2px 2px;{LE}'
if old_shine in content:
    content = content.replace(old_shine, new_shine, 1)
    print("✓ ::after gel shine border-radius 14px → 4px")
    changes += 1
else:
    print("✗ ::after gel shine not found")

# ── 6. Add overflow: hidden to .btn (already added but may be duplicated - dedupe)
# Check if already there
btn_idx = content.find('.btn {')
overflow_idx = content.find('overflow: hidden', btn_idx)
# Check it's before the first closing } after .btn
close_idx = content.find('}', btn_idx)
if overflow_idx > 0 and overflow_idx < close_idx:
    print("✓ overflow: hidden already in .btn")
else:
    # Check for the standalone rule added by previous run
    standalone = f'.btn {{{LE}  overflow: hidden;{LE}}}'
    if standalone in content:
        print("✓ overflow: hidden block present")
    else:
        print("  overflow: hidden - checking...")
        idx = content.find('overflow: hidden')
        print(f"  overflow: hidden at {idx}: {repr(content[max(0,idx-50):idx+50])}")

print(f"\n{changes} replacements made.")

with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)
print("File written.")
