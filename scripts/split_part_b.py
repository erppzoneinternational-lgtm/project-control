with open('scripts/part_b_project_stakeholders.sql', 'r', encoding='utf-8') as f:
    text = f.read()

statements = [s.strip() for s in text.split("INSERT INTO public.project_stakeholders") if s.strip() and s.strip() != "BEGIN;" and s.strip() != "COMMIT;"]
print(f"Total project stakeholder statements: {len(statements)}")

chunk_size = 80
chunks = [statements[i:i+chunk_size] for i in range(0, len(statements), chunk_size)]

for idx, c in enumerate(chunks):
    chunk_sql = "BEGIN;\n" + "\n".join(["INSERT INTO public.project_stakeholders " + s for s in c]) + "\nCOMMIT;"
    with open(f'scripts/proj_stk_subchunk_{idx+1}.sql', 'w', encoding='utf-8') as f:
        f.write(chunk_sql)
    print(f"Saved proj_stk_subchunk_{idx+1}.sql ({len(chunk_sql)} bytes, {len(c)} statements)")
