"""Safely copy ShopSphere's existing SQLite data into Neon PostgreSQL.

Run from the backend folder after setting DATABASE_URL privately in your
PowerShell session. The source SQLite database is opened read-only. The target
must be empty; this script refuses to overwrite existing target data.
"""

import argparse
import os
import sqlite3
import sys
from pathlib import Path

import psycopg2
from psycopg2 import sql
from psycopg2.extras import DictCursor

from postgres_support import POSTGRES_SCHEMA, TABLE_ORDER


def open_sqlite_read_only(path):
    resolved = Path(path).resolve()
    if not resolved.is_file():
        raise FileNotFoundError(f"SQLite source database not found: {resolved}")
    # URI mode=ro guarantees this script cannot change the original SQLite DB.
    uri = resolved.as_uri() + "?mode=ro"
    connection = sqlite3.connect(uri, uri=True)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def read_source_counts(source):
    counts = {}
    for table in TABLE_ORDER:
        counts[table] = source.execute(
            f'SELECT COUNT(*) FROM "{table}"'
        ).fetchone()[0]
    return counts


def main():
    parser = argparse.ArgumentParser(description="Migrate ShopSphere SQLite data to PostgreSQL")
    parser.add_argument(
        "--source",
        default=str(Path(__file__).with_name("shopsphere.db")),
        help="SQLite source file (defaults to backend/shopsphere.db)",
    )
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        print("ERROR: DATABASE_URL is not set. Set it privately in PowerShell; do not paste it into chat.")
        return 2

    source = open_sqlite_read_only(args.source)
    target = None

    try:
        source_tables = {
            row[0]
            for row in source.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            ).fetchall()
        }
        expected_tables = set(TABLE_ORDER)
        missing = sorted(expected_tables - source_tables)
        extra = sorted(source_tables - expected_tables)
        if missing or extra:
            raise RuntimeError(
                f"SQLite table set does not match the inspected ShopSphere schema. Missing={missing}; extra={extra}"
            )

        fk_errors = source.execute("PRAGMA foreign_key_check").fetchall()
        if fk_errors:
            raise RuntimeError(f"SQLite foreign-key check failed with {len(fk_errors)} issue(s). Migration stopped.")

        source_counts = read_source_counts(source)
        source_total = sum(source_counts.values())
        print(f"SQLite source: {args.source}")
        print(f"Source rows to migrate: {source_total}")
        for table in TABLE_ORDER:
            print(f"  {table}: {source_counts[table]}")

        target = psycopg2.connect(
            database_url,
            cursor_factory=DictCursor,
            connect_timeout=15,
        )
        target.autocommit = False
        cursor = target.cursor()

        # Create the canonical schema within this transaction. If a later check
        # fails, rollback also removes any newly-created tables.
        for statement in POSTGRES_SCHEMA:
            cursor.execute(statement)

        existing = {}
        for table in TABLE_ORDER:
            cursor.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(sql.Identifier(table)))
            existing[table] = cursor.fetchone()[0]

        non_empty = {table: count for table, count in existing.items() if count}
        if non_empty:
            raise RuntimeError(
                "Target database is not empty. No rows were changed. "
                f"Existing target counts: {non_empty}. Do not rerun against a populated database."
            )

        for table in TABLE_ORDER:
            source_cursor = source.execute(f'SELECT * FROM "{table}"')
            columns = [item[0] for item in source_cursor.description]
            rows = source_cursor.fetchall()

            if rows:
                insert_query = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
                    sql.Identifier(table),
                    sql.SQL(", ").join(sql.Identifier(column) for column in columns),
                    sql.SQL(", ").join(sql.Placeholder() for _ in columns),
                )
                cursor.executemany(
                    insert_query.as_string(target),
                    [tuple(row[column] for column in columns) for row in rows],
                )

        # Preserve SQLite AUTOINCREMENT high-water marks, not only MAX(id).
        # This prevents reusing IDs that were previously allocated and deleted.
        sqlite_sequences = {}
        try:
            sqlite_sequences = {
                row["name"]: row["seq"]
                for row in source.execute("SELECT name, seq FROM sqlite_sequence").fetchall()
            }
        except sqlite3.OperationalError:
            pass

        for table in TABLE_ORDER:
            max_id = source.execute(
                f'SELECT COALESCE(MAX(id), 0) FROM "{table}"'
            ).fetchone()[0]
            high_water = max(int(max_id or 0), int(sqlite_sequences.get(table, 0) or 0))
            has_rows = source_counts[table] > 0
            sequence_value = high_water if has_rows else 1
            cursor.execute(
                "SELECT setval(pg_get_serial_sequence(%s, 'id'), %s, %s)",
                (f"public.{table}", sequence_value, has_rows),
            )

        target_counts = {}
        content_mismatches = {}
        for table in TABLE_ORDER:
            cursor.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(sql.Identifier(table)))
            target_counts[table] = cursor.fetchone()[0]

            source_columns = [
                item[1] for item in source.execute(f'PRAGMA table_info("{table}")').fetchall()
            ]
            selected_columns = sql.SQL(", ").join(
                sql.Identifier(column) for column in source_columns
            )
            cursor.execute(
                sql.SQL("SELECT {} FROM {} ORDER BY id").format(
                    selected_columns, sql.Identifier(table)
                )
            )
            postgres_rows = cursor.fetchall()
            sqlite_rows = source.execute(
                f'SELECT * FROM "{table}" ORDER BY id'
            ).fetchall()

            if len(sqlite_rows) != len(postgres_rows):
                content_mismatches[table] = "row count differs during full-row verification"
                continue

            for sqlite_row, postgres_row in zip(sqlite_rows, postgres_rows):
                sqlite_values = tuple(sqlite_row[column] for column in source_columns)
                postgres_values = tuple(postgres_row[column] for column in source_columns)
                if sqlite_values != postgres_values:
                    content_mismatches[table] = f"row id {sqlite_row['id']} differs"
                    break

        mismatches = {
            table: (source_counts[table], target_counts[table])
            for table in TABLE_ORDER
            if source_counts[table] != target_counts[table]
        }
        if mismatches or content_mismatches:
            raise RuntimeError(
                "Migration verification failed; transaction will be rolled back. "
                f"Count mismatches={mismatches}; content mismatches={content_mismatches}"
            )

        target.commit()

        print("\nPOSTGRESQL MIGRATION COMMITTED")
        print("Verified row counts and every migrated column value:")
        for table in TABLE_ORDER:
            print(f"  {table}: {target_counts[table]}")
        print(f"TOTAL: {sum(target_counts.values())}")
        print("All source foreign keys passed; PostgreSQL enforced target foreign keys during insertion.")
        print("SQLite source was opened read-only and was not modified.")
        return 0

    except Exception as exc:
        if target is not None:
            target.rollback()
        print(f"MIGRATION STOPPED: {exc}")
        print("PostgreSQL transaction rolled back. The SQLite source was not modified.")
        return 1
    finally:
        source.close()
        if target is not None:
            target.close()


if __name__ == "__main__":
    sys.exit(main())
