ShopSphere PostgreSQL migration patch
=======================================

Files in this patch:
- app.py: existing Flask application with PostgreSQL selection added. Existing API routes are retained.
- postgres_support.py: PostgreSQL schema, SQL compatibility layer, and Gunicorn-safe initialization.
- migrate_sqlite_to_postgres.py: read-only SQLite export to an empty PostgreSQL target, including ID and sequence preservation.
- requirements.txt: UTF-8 dependency file including psycopg2-binary.

Safety rules:
1. Keep shopsphere.db and shopsphere_backup.db unchanged.
2. The migration script reads shopsphere.db in read-only mode.
3. The migration script refuses to write if any target table already contains rows.
4. It uses one PostgreSQL transaction and rolls back on any failure.
5. Do not set DATABASE_URL in Render until the migration has been successfully verified locally.
6. Never commit DATABASE_URL or other secrets to GitHub.

This is a code patch only. It does not include, upload, delete, or modify any SQLite database.
