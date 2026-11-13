
import sqlite3
import shutil
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).resolve().parent / "shopsphere.db"

# Correct images for Running Shoes - Product ID 28
RUNNING_SHOES_IMAGES = {
    "Aero White": [
        "photo-1549298916-b41d501d3772",
        "photo-1584735935682-2f2b69dff9d2"
    ],
    "Velocity Grey": [
        "photo-1595950653106-6c9ebd614d3a",
        "photo-1600185365483-26d7a4cc7519"
    ]
}


def main():

    if not DB_PATH.exists():
        raise FileNotFoundError("ShopSphere database not found.")

    connection = sqlite3.connect(DB_PATH)

    try:
        cursor = connection.cursor()

        # Verify the correct product
        product = cursor.execute(
            "SELECT id, name FROM products WHERE id = 28"
        ).fetchone()

        if not product or product[1] != "Running Shoes":
            raise ValueError("Product ID 28 is not Running Shoes.")

        # Get variants
        variants = cursor.execute(
            """
            SELECT id, color
            FROM product_variants
            WHERE product_id = 28
            ORDER BY sort_order, id
            """
        ).fetchall()

        # Validate variant names before making changes
        actual_colors = {variant[1] for variant in variants}
        expected_colors = set(RUNNING_SHOES_IMAGES.keys())

        if actual_colors != expected_colors:
            raise ValueError(
                f"Variant mismatch. Found: {actual_colors}. "
                "No changes made."
            )

        # Create backup before updating
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        backup_path = DB_PATH.with_name(
            f"shopsphere_before_running_shoes_ID28_{timestamp}.db"
        )

        shutil.copy2(DB_PATH, backup_path)

        # Update each variant gallery
        for variant_id, color in variants:

            cursor.execute(
                "DELETE FROM product_images WHERE variant_id = ?",
                (variant_id,)
            )

            for position, image_id in enumerate(
                RUNNING_SHOES_IMAGES[color]
            ):

                image_url = (
                    f"https://images.unsplash.com/{image_id}"
                    "?auto=format&fit=crop&w=1000&q=85"
                )

                cursor.execute(
                    """
                    INSERT INTO product_images
                    (variant_id, image_url, sort_order)
                    VALUES (?, ?, ?)
                    """,
                    (variant_id, image_url, position)
                )

        # Update main product image
        first_image = (
            "https://images.unsplash.com/"
            "photo-1549298916-b41d501d3772"
            "?auto=format&fit=crop&w=1000&q=85"
        )

        cursor.execute(
            "UPDATE products SET image = ? WHERE id = 28",
            (first_image,)
        )

        connection.commit()

        print("Running Shoes updated successfully!")
        print("Product ID: 28")
        print("Variants updated:", len(variants))
        print("Backup created:", backup_path)

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


if __name__ == "__main__":
    main()

