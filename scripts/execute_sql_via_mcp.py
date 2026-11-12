with open('scripts/assign_part1.sql', 'r', encoding='utf-8') as f:
    t1 = f.read()

with open('scripts/assign_part2.sql', 'r', encoding='utf-8') as f:
    t2 = f.read()

with open('scripts/assign_part3.sql', 'r', encoding='utf-8') as f:
    t3 = f.read()

all_sql = t1 + "\n" + t2 + "\n" + t3
statements = [s.strip() for s in all_sql.split("INSERT INTO public.project_stakeholders") if s.strip() and "BEGIN;" not in s and "COMMIT;" not in s]

print(f"Total statements to execute: {len(statements)}")

chunk_size = 40
chunks = []
for i in range(0, len(statements), chunk_size):
    sub = statements[i:i+chunk_size]
    sql_text = "BEGIN;\n" + "\n".join(["INSERT INTO public.project_stakeholders " + s for s in sub]) + "\nCOMMIT;"
    chunks.append(sql_text)

for idx, c in enumerate(chunks):
    with open(f'scripts/sub_assign_{idx+1}.sql', 'w', encoding='utf-8') as f:
        f.write(c)
    print(f"Saved scripts/sub_assign_{idx+1}.sql ({len(c)} bytes)")
