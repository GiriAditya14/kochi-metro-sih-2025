import sqlite3

conn = sqlite3.connect('kmrl_induction.db')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("=== Database Contents ===\n")

for table in tables:
    table_name = table[0]
    if table_name.startswith('sqlite'):
        continue
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"{table_name}: {count} records")

conn.close()
