
import sqlite3
import os
import getpass
from werkzeug.security import generate_password_hash

DATABASE = os.path.join(os.path.dirname(__file__), "shopsphere.db")


def create_admin():

    connection = sqlite3.connect(DATABASE)

    try:
        # Check whether an admin already exists
        result = connection.execute(
            "SELECT COUNT(*) FROM admins"
        ).fetchone()

        if result[0] > 0:
            print("An admin account already exists.")
            print("Initial admin setup is already completed.")
            return

        print("\n--- ShopSphere Admin Setup ---")

        name = input("Enter admin name: ").strip()
        email = input("Enter admin email: ").strip().lower()

        password = getpass.getpass("Enter admin password: ")
        confirm_password = getpass.getpass("Confirm password: ")

        if not name or not email or not password:
            print("All fields are required.")
            return

        if len(password) < 8:
            print("Password must contain at least 8 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        # Hash the password
        hashed_password = generate_password_hash(password)

        # Save admin details
        connection.execute("""
            INSERT INTO admins (name, email, password)
            VALUES (?, ?, ?)
        """, (name, email, hashed_password))

        connection.commit()

        print("\nAdmin account created successfully!")
        print("You can now use these credentials for admin login.")

    except sqlite3.IntegrityError:
        print("This admin email already exists.")

    finally:
        connection.close()


if __name__ == "__main__":
    create_admin()
