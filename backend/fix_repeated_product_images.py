"""Update ShopSphere product gallery images by product ID.

This script updates only products.image and product_images.image_url.
It preserves product, variant, customer, order, payment and other records.
A timestamped backup is created before the transaction.
Run from backend folder: python fix_repeated_product_images.py
"""
from pathlib import Path
from datetime import datetime
import shutil
import sqlite3
import sys

DB_PATH = Path(__file__).resolve().parent / "shopsphere.db"

def unsplash(photo_id):
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&w=1000&q=85"

# Each product ID has its own image set. Primary images are unique among
# products with the same name, so repeated catalogue entries no longer
# display the same card image.
IMAGES_BY_PRODUCT_ID = {
    1: ['1505740420928-5e560c06d30e', '1484704849700-f032a568e944', '1546435770-a3e426bf472b', '1583394838336-acd977736f90'],
    2: ['1508685096489-7aacd43bd3b1', '1524805444758-089113d48a6d', '1579586337278-3befd40fd17a', '1522335789203-aabd1fc54bc9'],
    3: ['1507473885765-e6ed057f782c', '1540932239986-30128078f3c5', '1513506003901-1e6a229e2d15', '1534349762230-e0cadf78f5da'],
    4: ['1549298916-b41d501d3772', '1600185365483-26d7a4cc7519', '1542291026-7eec264c27ff', '1595950653106-6c9ebd614d3a'],
    5: ['1602143407151-7111542de6e8', '1544816155-12df9643f363', '1570554886111-e80fcca6a029', '1589365278144-c9e705f843ba'],
    6: ['1620916566398-39f1143ab7be', '1608248543803-ba4f8c70ae0b', '1601049541289-9b1b7bbbfe19', '1571781926291-c477ebfd024b'],
    7: ['1524805444758-089113d48a6d', '1522335789203-aabd1fc54bc9', '1523275335684-37898b6baf30', '1542496658-e33a6d0d50f6'],
    8: ['1590658268037-6bf12165a8df', '1577174881658-0f30ed549adc', '1585298723682-7115561c51b7', '1613040809024-b4ef7ba99bc3'],
    9: ['1553062407-98eeb64c6a62', '1680039211156-66c721b87625', '1622560480605-d83c853bc5c3', '1546938576-6e6a64f317cc'],
    10: ['1600185365483-26d7a4cc7519', '1584735935682-2f2b69dff9d2', '1595950653106-6c9ebd614d3a', '1515955656352-a1fa3ffcd111'],
    11: ['1511499767150-a48a237f0083', '1618677366787-9727aacca7ea', '1572635196237-14b3f281503f', '1508296695146-257a814070b4'],
    12: ['1543512214-318c7553f230', '1589492477829-5e65395b66cc', '1517048676732-d65bc937f952', '1518444065439-e933c06ce9cd'],
    13: ['1539185441755-769473a23570', '1509042239860-f550ce710b93', '1526045612212-70caf35c14df', '1533139502658-0198f920d8e8'],
    14: ['1599669454699-248893623440', '1524678606370-a47ad25cb82a', '1505740420928-5e560c06d30e', '1484704849700-f032a568e944'],
    15: ['1581605405669-fcdf81165afa', '1577733966973-d680bffd2e80', '1509762774605-f07235a08f1f', '1588850561407-ed78c282e89b'],
    16: ['1560769629-975ec94e6a86', '1525966222134-fcfa99b8ae77', '1608231387042-66d1773070a5', '1575537302964-96cd47c06b1b'],
    17: ['1577803645773-f96470509666', '1517841905240-472988babdf9', '1591076482161-42ce6da69f67', '1473496169904-658ba7c44d8a'],
    18: ['1608043152269-423dbba4e7e1', '1545454675-3531b543be5d', '1507676184212-d03ab07a01bf', '1543512214-318c7553f230'],
    19: ['1548036328-c9fa89d128fa', '1508057198894-247b23fe5ade', '1522335789203-aabd1fc54bc9', '1526045612212-70caf35c14df'],
    20: ['1572536147248-ac59a8abfa4b', '1545127398-14699f92334b', '1583394838336-acd977736f90', '1546435770-a3e426bf472b'],
    21: ['1512496015851-a90fb38ba796', '1553062407-98eeb64c6a62', '1622560480605-d83c853bc5c3', '1581605405669-fcdf81165afa'],
    22: ['1515955656352-a1fa3ffcd111', '1549298916-b41d501d3772', '1542291026-7eec264c27ff', '1608231387042-66d1773070a5'],
    23: ['1572635196237-14b3f281503f', '1473496169904-658ba7c44d8a', '1511499767150-a48a237f0083', '1591076482161-42ce6da69f67'],
    24: ['1545454675-3531b543be5d', '1608043152269-423dbba4e7e1', '1517048676732-d65bc937f952', '1589492477829-5e65395b66cc'],
    25: ['1509042239860-f550ce710b93', '1524805444758-089113d48a6d', '1523275335684-37898b6baf30', '1542496658-e33a6d0d50f6'],
    26: ['1546435770-a3e426bf472b', '1590658268037-6bf12165a8df', '1585298723682-7115561c51b7', '1577174881658-0f30ed549adc'],
    27: ['1546938576-6e6a64f317cc', '1680039211156-66c721b87625', '1622560480605-d83c853bc5c3', '1588850561407-ed78c282e89b'],
    28: ['1584735935682-2f2b69dff9d2', '1600185365483-26d7a4cc7519', '1560769629-975ec94e6a86', '1525966222134-fcfa99b8ae77'],
    29: ['1618677366787-9727aacca7ea', '1511499767150-a48a237f0083', '1508296695146-257a814070b4', '1572635196237-14b3f281503f'],
    30: ['1518444065439-e933c06ce9cd', '1543512214-318c7553f230', '1608043152269-423dbba4e7e1', '1507676184212-d03ab07a01bf'],
    31: ['1508057198894-247b23fe5ade', '1524805444758-089113d48a6d', '1526045612212-70caf35c14df', '1533139502658-0198f920d8e8'],
    32: ['1613040809024-b4ef7ba99bc3', '1505740420928-5e560c06d30e', '1572536147248-ac59a8abfa4b', '1546435770-a3e426bf472b'],
    33: ['1577733966973-d680bffd2e80', '1553062407-98eeb64c6a62', '1622560480605-d83c853bc5c3', '1509762774605-f07235a08f1f'],
    34: ['1575537302964-96cd47c06b1b', '1549298916-b41d501d3772', '1595950653106-6c9ebd614d3a', '1542291026-7eec264c27ff'],
    35: ['1508296695146-257a814070b4', '1577803645773-f96470509666', '1511499767150-a48a237f0083', '1473496169904-658ba7c44d8a'],
    36: ['1589492477829-5e65395b66cc', '1545454675-3531b543be5d', '1543512214-318c7553f230', '1518444065439-e933c06ce9cd'],
}

def main():
    if not DB_PATH.is_file():
        raise SystemExit(f"Database not found: {DB_PATH}")

    backup = DB_PATH.with_name(
        f"{DB_PATH.stem}.before_unique_images_{datetime.now():%Y%m%d_%H%M%S}{DB_PATH.suffix}"
    )
    shutil.copy2(DB_PATH, backup)
    connection = sqlite3.connect(DB_PATH)
    try:
        connection.execute("PRAGMA foreign_keys = ON")
        tables = {r[0] for r in connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )}
        if not {"products", "product_variants", "product_images"}.issubset(tables):
            raise RuntimeError("The required product gallery tables are missing.")

        products = connection.execute(
            "SELECT id, name FROM products ORDER BY id"
        ).fetchall()
        product_ids = {pid for pid, _ in products}
        missing = sorted(product_ids - set(IMAGES_BY_PRODUCT_ID))
        if missing:
            raise RuntimeError("Missing image mapping for product IDs: " + str(missing))

        changed_products = 0
        changed_gallery_rows = 0
        with connection:
            for product_id, product_name in products:
                urls = [unsplash(photo_id) for photo_id in IMAGES_BY_PRODUCT_ID[product_id]]
                if len(urls) != 4 or len(set(urls)) != 4:
                    raise RuntimeError(f"Invalid or repeated image mapping for product {product_id}")

                variants = connection.execute(
                    "SELECT id FROM product_variants WHERE product_id=? ORDER BY sort_order, id",
                    (product_id,)
                ).fetchall()
                if len(variants) < 2:
                    # Keep the card image unique even if this product has fewer variants.
                    connection.execute("UPDATE products SET image=? WHERE id=?", (urls[0], product_id))
                    changed_products += 1
                    continue

                # Assign two images to each of the first two existing variants.
                # Existing variant names, IDs and order are not changed.
                for index, (variant_id,) in enumerate(variants):
                    start = 0 if index == 0 else 2 if index == 1 else 0
                    selected = urls[start:start + 2]
                    connection.execute("DELETE FROM product_images WHERE variant_id=?", (variant_id,))
                    connection.executemany(
                        "INSERT INTO product_images (variant_id, image_url, sort_order) VALUES (?, ?, ?)",
                        [(variant_id, url, order) for order, url in enumerate(selected)]
                    )
                    changed_gallery_rows += len(selected)

                connection.execute("UPDATE products SET image=? WHERE id=?", (urls[0], product_id))
                changed_products += 1

        print("Unique product image update completed.")
        print(f"Product cards updated: {changed_products}")
        print(f"Gallery image rows written: {changed_gallery_rows}")
        print(f"Database backup: {backup}")
        print("No products, variants, customers, orders or payments were deleted.")
    except Exception:
        connection.rollback()
        print(f"Update failed. Backup is available at: {backup}")
        raise
    finally:
        connection.close()

if __name__ == "__main__":
    main()
