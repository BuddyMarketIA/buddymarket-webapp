#!/usr/bin/env python3
"""
Script to fix all JSX attributes with =t(...) to ={t(...)}
This fixes the syntax error: "JSX value should be either an expression or a quoted JSX text"
"""

import os
import re
from pathlib import Path

def fix_jsx_attributes(file_path):
    """Fix JSX attributes in a single file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern to match attributes like: attribute=t("key")
    # This will match: aria-label=t(...), title=t(...), placeholder=t(...), etc.
    # But NOT: attribute={t(...)} (already correct)
    pattern = r'(\s(?:aria-label|title|placeholder|alt|data-\w+))=t\('
    
    def replace_func(match):
        return match.group(1) + '={t('
    
    content = re.sub(pattern, replace_func, content)
    
    # Also handle cases where there's no space before the attribute
    # Like: >aria-label=t(
    pattern2 = r'(>|[\s])([a-zA-Z\-]+)=t\('
    
    def replace_func2(match):
        prefix = match.group(1)
        attr = match.group(2)
        # Only fix if it looks like a JSX attribute that should have a value
        if attr in ['aria-label', 'title', 'placeholder', 'alt'] or attr.startswith('data-'):
            return f'{prefix}{attr}={{t('
        return match.group(0)
    
    content = re.sub(pattern2, replace_func2, content)
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    """Main function to fix all TSX files"""
    client_src = Path('/home/ubuntu/buddymarket-webapp/client/src')
    
    fixed_count = 0
    files_checked = 0
    
    for tsx_file in client_src.rglob('*.tsx'):
        files_checked += 1
        if fix_jsx_attributes(tsx_file):
            fixed_count += 1
            print(f"✅ Fixed: {tsx_file.relative_to(client_src)}")
    
    print(f"\n✅ Fixed {fixed_count} files out of {files_checked} checked")

if __name__ == '__main__':
    main()
