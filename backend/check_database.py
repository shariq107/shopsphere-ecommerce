import sqlite3

conn = sqlite3.connect("file:shopsphere.db?mode=ro", uri=True)

tables = conn.execute("""
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    AND name NOT LIKE 'sqlite_%'
    ORDER BY name
""").fetchall()

print("DATABASE TABLES AND COLUMNS")

for (table,) in tables:
    print(f"\n{table}:")
    columns = conn.execute(
        f'PRAGMA table_info("{table}")'
    ).fetchall()

    for column in columns:
        print(f"  {column[1]} - {column[2]}")

conn.close()