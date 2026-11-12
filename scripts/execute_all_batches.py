import os
import json
import glob

# Read all batch files and print instructions or execute them
batch_files = sorted(glob.glob('scripts/batch_*.sql'))
print(f"Found {len(batch_files)} batch files.")

for bf in batch_files:
    with open(bf, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f"{bf}: {len(content)} bytes, {content.count('DO $$')} blocks")
