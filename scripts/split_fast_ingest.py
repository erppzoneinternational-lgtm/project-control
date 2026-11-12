with open('scripts/fast_ingest.sql', 'r', encoding='utf-8') as f:
    text = f.read()

# Split into stakeholder inserts and project_stakeholder inserts
parts = text.split("INSERT INTO public.project_stakeholders")

stk_sql = parts[0] + "\nCOMMIT;"
proj_stk_sql = "BEGIN;\n" + "\n".join(["INSERT INTO public.project_stakeholders " + p for p in parts[1:]])

with open('scripts/part_a_stakeholders.sql', 'w', encoding='utf-8') as f:
    f.write(stk_sql)

with open('scripts/part_b_project_stakeholders.sql', 'w', encoding='utf-8') as f:
    f.write(proj_stk_sql)

print(f"Part A: {len(stk_sql)} chars")
print(f"Part B: {len(proj_stk_sql)} chars")
