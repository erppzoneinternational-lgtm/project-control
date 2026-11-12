import os
import sys

# Script to verify subchunks and combine into 2 larger transactions
for i in range(1, 5):
    fname = f'scripts/proj_stk_subchunk_{i}.sql'
    if os.path.exists(fname):
        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"Subchunk {i}: {len(content)} chars, {content.count('INSERT INTO')} statements")
