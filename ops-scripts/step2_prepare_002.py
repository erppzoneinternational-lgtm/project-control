"""Generate + execute ADAPTED migration files (pm.projects -> public.projects etc.)."""
import os, re

MIG = os.path.join(os.pardir, "supabase", "migrations")
OUT = "tmp_adapted"
os.makedirs(OUT, exist_ok=True)


def read(name):
    with open(os.path.join(MIG, name), encoding="utf-8") as fh:
        return fh.read()


def write(name, text):
    p = os.path.join(OUT, name)
    with open(p, "w", encoding="utf-8") as fh:
        fh.write(text)
    return p


# ---------- STEP 2: 002_stakeholders_tables.sql ----------
src = read("002_stakeholders_tables.sql")
n = src.count("pm.projects")
adapted = src.replace("pm.projects", "public.projects")
p = write("002_stakeholders_tables.adapted.sql", f"-- Adapted: pm.projects -> public.projects ({n} occurrences)\n" + adapted)
print(f"002: replaced {n} pm.projects refs -> {p}")
