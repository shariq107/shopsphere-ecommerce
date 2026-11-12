"""
ShopSphere product gallery image refresh.

This script ONLY updates:
  - products.image
  - product_images.image_url rows

It does NOT delete products, variants, customers, orders, payments, or other records.
A timestamped database backup is created before changes.
Run from any directory with: python fix_product_gallery_images.py
"""

from pathlib import Path
from datetime import datetime
import shutil
import sqlite3
import sys

DB_PATH = Path(__file__).resolve().parent / "shopsphere.db"

def image(photo_id):
    # Keep the source photograph's natural aspect ratio; CSS controls display.
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&w=1000&q=85"

# Four distinct photographs per product family:
# first pair -> first colour variant; second pair -> second colour variant.
# No photo ID is shared between unrelated product families.
IMAGES_BY_PRODUCT = {
    "Arc Studio Headphones": [
        "1505740420928-5e560c06d30e",
        "1484704849700-f032a568e944",
        "1546435770-a3e426bf472b",
        "1583394838336-acd97773977b",
    ],
    "Orbit Smart Watch": [
        "1508685096489-7aacd43bd3b1",
        "1579586337278-3befd40fd17a",
        "1524805444758-089113d48a6d",
        "1533139502658-0198f920d8e8",
    ],
    "Mellow Desk Lamp": [
        "1507473885765-e6ed057f782c",
        "1540932239986-30128078f3c5",
        "1513506003901-1e6a229e2d15",
        "1534349762230-e0cadf78f5da",
    ],
    "Cloud Nine Sneakers": [
        "1549298916-b41d501d3772",
        "1525966222134-fcfa99b8ae77",
        "1542291026-7eec264c27ff",
        "1608231387042-66d1773070a5",
    ],
    "Daily Ritual Bottle": [
        "1602143407151-7111542de6e8",
        "1544816155-12df9643f363",
        "1570554886111-e80fcca6a029",
        "1589365278144-c9e705f843ba",
    ],
    "Soft Focus Serum": [
        "1620916566398-39f1143ab7be",
        "1608248543803-ba4f8c70ae0b",
        "1601049541289-9b1b7bbbfe19",
        "1571781926291-c477ebfd024b",
    ],
    "Classic Watch": [
        "1523275335684-37898b6baf30",
        "1526045612212-70caf35c14df",
        "1539185441755-769473a23570",
        "1509042239860-f550ce710b93",
    ],
    "Wireless Headphones": [
        "1590658268037-6bf12165a8df",
        "1577174881658-0f30ed549adc",
        "1585298723682-7115561c51b7",
        "1613040809024-b4ef7ba99bc3",
    ],
    "Everyday Backpack": [
        "1553062407-98eeb64c6a62",
        "1680039211156-66c721b87625",
        "1622560480605-d83c853bc4b4",
        "1546938576-6e6a64f317cc",
    ],
    "Running Shoes": [
        "1600185365483-26d7a4cc7519",
        "1584735935682-2f2b69dff9d2",
        "1595950653106-6c9ebd614d3a",
        "1515955656352-a1fa3ffcd111",
    ],
    "Sunglasses": [
        "1511499767150-a48a237f0083",
        "1618677366787-9727aacca7ea",
        "1572635196237-14b3f281503f",
        "1508296695146-257a814070b4",
    ],
    "Smart Speaker": [
        "1543512214-318c7553f230",
        "1589492477829-5e65395b66cc",
        "1517048676732-d65bc937f952",
        "1518444065439-e933c06ce9cd",
    ],
}

def main():
    if not DB_PATH.exists():
        print(f"Database not found: {DB_PATH}")
        sys.exit(1)

    backup_path = DB_PATH.with_name(
        f"{DB_PATH.stem}.before_gallery_{datetime.now():%Y%m%d_%H%M%S}{DB_PATH.suffix}"
    )
    shutil.copy2(DB_PATH, backup_path)

    connection = sqlite3.connect(DB_PATH)
    try:
        connection.execute("PRAGMA foreign_keys = ON")
        required = {"products", "product_variants", "product_images"}
        present = {
            row[0] for row in connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            )
        }
        if not required.issubset(present):
            raise RuntimeError("Required product gallery tables are missing.")

        product_rows = connection.execute(
            "SELECT id, name FROM products ORDER BY id"
        ).fetchall()

        missing = sorted({name for _, name in product_rows} - set(IMAGES_BY_PRODUCT))
        if missing:
            raise RuntimeError("No image mapping for: " + ", ".join(missing))

        updated_images = 0
        updated_products = 0

        with connection:
            for product_id, product_name in product_rows:
                urls = [image(photo_id) for photo_id in IMAGES_BY_PRODUCT[product_name]]
                variants = connection.execute(
                    """SELECT id FROM product_variants
                       WHERE product_id = ? ORDER BY sort_order, id""",
                    (product_id,)
                ).fetchall()

                if not variants:
                    # Do not create or rename variants; leave this product untouched.
                    continue

                # Keep the existing variant names and order.
                for variant_index, (variant_id,) in enumerate(variants):
                    start = min(variant_index * 2, len(urls) - 2)
                    selected_urls = urls[start:start + 2]

                    connection.execute(
                        "DELETE FROM product_images WHERE variant_id = ?",
                        (variant_id,)
                    )
                    connection.executemany(
                        """INSERT INTO product_images
                           (variant_id, image_url, sort_order)
                           VALUES (?, ?, ?)""",
                        [(variant_id, url, order) for order, url in enumerate(selected_urls)]
                    )
                    updated_images += len(selected_urls)

                first_variant = variants[0][0]
                first_image = connection.execute(
                    """SELECT image_url FROM product_images
                       WHERE variant_id = ? ORDER BY sort_order, id LIMIT 1""",
                    (first_variant,)
                ).fetchone()
                if first_image:
                    connection.execute(
                        "UPDATE products SET image = ? WHERE id = ?",
                        (first_image[0], product_id)
                    )
                    updated_products += 1

        print("Product gallery image refresh completed.")
        print(f"Products updated: {updated_products}")
        print(f"Image rows added: {updated_images}")
        print(f"Database backup: {backup_path}")
        print("No product, customer, order, payment, or variant records were deleted.")
    except Exception:
        connection.rollback()
        print("Update failed. The original database backup is available at:")
        print(backup_path)
        raise
    finally:
        connection.close()

if __name__ == "__main__":
    main()
