#!/usr/bin/env python3
import json, sys

files = {
    '/opt/homeledger/messages/en.json': 'Design Studio',
    '/opt/homeledger/messages/pt-BR.json': 'Design Studio',
}

for path, label in files.items():
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if 'nav' in data and 'designStudio' not in data['nav']:
        data['nav']['designStudio'] = label
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f'Updated {path}')
    else:
        print(f'Already has designStudio in {path}')
