import glob

chunks = sorted(glob.glob('scripts/clean_chunk_*.sql'))
print("Executing SQL chunks...")

for cfile in chunks:
    with open(cfile, 'r', encoding='utf-8') as f:
        sql = f.read()
    print(f"{cfile}: {len(sql)} chars")
