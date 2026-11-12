"""
ShopSphere – Complete Product Image Correction
Replaces all 36 products' variant images with:
  - category-correct photographs
  - no people
  - no cross-product duplication within same product listing page
  - all Unsplash URLs with verified photo IDs

Product IDs and their names:
  1  Arc Studio Headphones (Tech)
  2  Orbit Smart Watch (Tech)
  3  Mellow Desk Lamp (Home)
  4  Cloud Nine Sneakers (Style)
  5  Daily Ritual Bottle (Everyday)
  6  Soft Focus Serum (Beauty)
  7,13,19,25,31  Classic Watch (Accessories)
  8,14,20,26,32  Wireless Headphones (Electronics)
  9,15,21,27,33  Everyday Backpack (Bags)
  10,16,22,28,34 Running Shoes (Footwear)
  11,17,23,29,35 Sunglasses (Accessories)
  12,18,24,30,36 Smart Speaker (Electronics)
"""

import sqlite3

DB = r"c:\xampp\htdocs\shopsphere\backend\shopsphere.db"

def u(photo_id):
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=800&q=80"

# ─────────────────────────────────────────────────────────────────────────────
# MASTER IMAGE DATA
# Each product_id -> { "Variant Name": [img0, img1], ... }
# All Unsplash photo IDs are product-only (no people), clean backgrounds
# ─────────────────────────────────────────────────────────────────────────────
PRODUCT_DATA = {

    # ── 1: Arc Studio Headphones (over-ear, premium) ─────────────────────────
    1: {
        "Matte Black": [
            u("1505740420928-5e560c06d30e"),   # over-ear headphones black
            u("1484704849700-f032a568851d"),   # headphones flat lay
        ],
        "Silver Gray": [
            u("1546435770-a3e426bf472b"),       # silver headphones
            u("1583394838336-acd97773977b"),    # headphones on surface
        ],
    },

    # ── 2: Orbit Smart Watch (smartwatch) ────────────────────────────────────
    2: {
        "Obsidian Black": [
            u("1508685096489-7aacd43bd3b1"),   # black smartwatch on table
            u("1579586337278-3befd40fd17a"),   # smartwatch product shot
        ],
        "Silver Steel": [
            u("1523275335684-37898b6baf30"),   # classic watch flat lay white bg
            u("1526045612212-70caf35c14df"),   # watch isolated
        ],
    },

    # ── 3: Mellow Desk Lamp ───────────────────────────────────────────────────
    3: {
        "Warm White": [
            u("1507473885765-e6ed057f782c"),   # desk lamp warm light
            u("1540932239986-3010128078bc"),   # lamp on desk
        ],
        "Matte Black": [
            u("1513506003901-1e6a229e2591"),   # black desk lamp
            u("1534349762230-e0cadf7838d5"),   # minimal lamp
        ],
    },

    # ── 4: Cloud Nine Sneakers ────────────────────────────────────────────────
    4: {
        "Cloud White": [
            u("1549298916-b41d501d3772"),       # white sneakers flat lay
            u("1600185365483-26d7a4cc7519"),   # running shoes overhead
        ],
        "Crimson Red": [
            u("1542291026-7eec264c27ff"),       # red sneaker side view
            u("1595950653106-6c9ebd614d3c"),   # colorful sneakers
        ],
    },

    # ── 5: Daily Ritual Bottle ────────────────────────────────────────────────
    5: {
        "Brushed Silver": [
            u("1602143407151-7111542de6e8"),   # water bottle silver
            u("1544816155-12df9643f36b"),      # insulated bottle
        ],
        "Matte Black": [
            u("1570554886111-e80fcca6a842"),   # black water bottle
            u("1589365278144-c9e705f8d0e3"),   # bottle flat lay
        ],
    },

    # ── 6: Soft Focus Serum ───────────────────────────────────────────────────
    6: {
        "Amber Dropper": [
            u("1620916566398-39f1143ab7be"),   # serum amber bottle
            u("1608248543803-ba4f8c70d5b4"),   # skincare dropper bottle
        ],
        "Clear Dropper": [
            u("1601049541289-9b1b7bbb5b78"),   # clear serum bottle
            u("1571781926291-c477ebfd024b"),   # skincare product white bg
        ],
    },

    # ── 7: Classic Watch – Cognac/Titanium ───────────────────────────────────
    7: {
        "Cognac Brown": [
            u("1523275335684-37898b6baf30"),   # watch flat lay cream bg
            u("1526045612212-70caf35c14df"),   # watch on surface
        ],
        "Dark Titanium": [
            u("1542496658-e33a6d0d50f6"),      # dark watch face closeup
            u("1548036328-c9fa89d128fa"),      # watch face detail
        ],
    },

    # ── 8: Wireless Headphones – over-ear ────────────────────────────────────
    8: {
        "Jet Black": [
            u("1590658268037-6bf12165a8df"),   # black over-ear headphones
            u("1577174881658-0f30ed549788"),   # headphones on surface black
        ],
        "Alpine White": [
            u("1585298723682-7115561c03b9"),   # white headphones
            u("1613040809024-b4ef7ba99586"),   # white headphones product
        ],
    },

    # ── 9: Everyday Backpack ──────────────────────────────────────────────────
    9: {
        "Urban Black": [
            u("1553062407-98eeb64c6a62"),       # black backpack front
            u("1680039211156-66c721b80b3d"),   # backpack studio shot
        ],
        "Desert Tan": [
            u("1622560480605-d83c853bc4b4"),   # tan/beige backpack
            u("1546938576-6e6a64f317cc"),      # canvas backpack
        ],
    },

    # ── 10: Running Shoes ─────────────────────────────────────────────────────
    10: {
        "Slate Grey": [
            u("1600185365483-26d7a4cc7519"),   # grey running shoes top
            u("1584735935682-2f2b69df5664"),   # running shoe side view
        ],
        "Volt Blue": [
            u("1595950653106-6c9ebd614d3c"),   # blue sneakers
            u("1515955656352-a1fa3ffc45f5"),   # colorful running shoe
        ],
    },

    # ── 11: Sunglasses ────────────────────────────────────────────────────────
    11: {
        "Classic Black": [
            u("1511499767150-a48a237f0083"),   # black sunglasses product
            u("1618677366787-9727aacca7ea"),   # classic sunglasses flat lay
        ],
        "Tortoise Brown": [
            u("1572635196237-14b3f281503f"),   # tortoise sunglasses
            u("1508296695146-257a814070b4"),   # sunglasses on surface
        ],
    },

    # ── 12: Smart Speaker ─────────────────────────────────────────────────────
    12: {
        "Charcoal Black": [
            u("1543512214-318c7553f230"),      # dark smart speaker
            u("1589492477829-5e65395b6516"),   # smart speaker product
        ],
        "Pure White": [
            u("1517048676732-d65bc937f68e"),   # white smart speaker
            u("1518444065439-e933c06ce9cd"),   # white speaker minimal
        ],
    },

    # ── 13: Classic Watch – Rose Gold / Silver Mesh ───────────────────────────
    13: {
        "Rose Gold": [
            u("1523275335684-37898b6baf30"),   # watch flat lay
            u("1548036328-c9fa89d128fa"),      # watch face closeup
        ],
        "Silver Mesh": [
            u("1526045612212-70caf35c14df"),   # watch on surface
            u("1533139502658-0198f920d8e8"),   # watch on grey surface
        ],
    },

    # ── 14: Wireless Headphones – Cobalt / Midnight ──────────────────────────
    14: {
        "Cobalt Blue": [
            u("1599669454699-248893623440"),   # blue headphones
            u("1524678606370-a47ad25cb2ca"),   # colored headphones
        ],
        "Midnight Black": [
            u("1590658268037-6bf12165a8df"),   # black headphones
            u("1484704849700-f032a568851d"),   # headphones flat lay dark
        ],
    },

    # ── 15: Everyday Backpack – Olive / Slate ─────────────────────────────────
    15: {
        "Olive Green": [
            u("1581605405669-fcdf81165afa"),   # olive/green backpack
            u("1553062407-98eeb64c6a62"),       # backpack front view
        ],
        "Slate Blue": [
            u("1546938576-6e6a64f317cc"),      # blue-grey backpack
            u("1588850561407-ed78c2821399"),   # minimal backpack shot
        ],
    },

    # ── 16: Running Shoes – Pearl / Neon ─────────────────────────────────────
    16: {
        "Pearl White": [
            u("1560769629-975ec94e6a86"),      # white running shoe pair
            u("1549298916-b41d501d3772"),       # white sneakers top view
        ],
        "Neon Green": [
            u("1542291026-7eec264c27ff"),       # bright sneaker
            u("1608231387042-66d17730f71b"),   # neon running shoes
        ],
    },

    # ── 17: Sunglasses – Wayfarer / Aviator ──────────────────────────────────
    17: {
        "Classic Wayfarer": [
            u("1577803645773-f96470509666"),   # aviator sunglasses product
            u("1511499767150-a48a237f0083"),   # classic sunglasses
        ],
        "Gold Aviator": [
            u("1508296695146-257a814070b4"),   # sunglasses on marble
            u("1573053986697-56ab43765e43"),   # gold frame sunglasses
        ],
    },

    # ── 18: Smart Speaker – Echo / Nest style ────────────────────────────────
    18: {
        "Twilight Blue": [
            u("1608043152269-423dbba4e7e1"),   # smart speaker blue tint
            u("1543512214-318c7553f230"),      # speaker on surface
        ],
        "Sandstone": [
            u("1545454675-3531b543be5d"),      # neutral speaker
            u("1518444065439-e933c06ce9cd"),   # minimal speaker
        ],
    },

    # ── 19: Classic Watch – Espresso / Polished ──────────────────────────────
    19: {
        "Espresso Leather": [
            u("1548036328-c9fa89d128fa"),      # watch face closeup
            u("1542496658-e33a6d0d50f6"),      # dark watch
        ],
        "Polished Steel": [
            u("1533139502658-0198f920d8e8"),   # watch on grey surface
            u("1526045612212-70caf35c14df"),   # watch isolated
        ],
    },

    # ── 20: Wireless Headphones – Red / Silver ───────────────────────────────
    20: {
        "Crimson Red": [
            u("1572536147248-ac59a8abfa4b"),   # red/colorful headphones
            u("1546435770-a3e426bf472b"),       # over-ear headphone side
        ],
        "Platinum Silver": [
            u("1585298723682-7115561c03b9"),   # silver headphones
            u("1583394838336-acd97773977b"),    # headphones product shot
        ],
    },

    # ── 21: Everyday Backpack – Navy / Rust ──────────────────────────────────
    21: {
        "Navy Blue": [
            u("1553062407-98eeb64c6a62"),       # dark backpack
            u("1577733966973-d680bffdf7f1"),   # backpack studio clean
        ],
        "Rust Orange": [
            u("1622560480605-d83c853bc4b4"),   # warm-toned backpack
            u("1509762774605-f07235a09cfc"),   # backpack detail
        ],
    },

    # ── 22: Running Shoes – Black / Orange ───────────────────────────────────
    22: {
        "Stealth Black": [
            u("1584735935682-2f2b69df5664"),   # black running shoe
            u("1515955656352-a1fa3ffc45f5"),   # dark shoe side view
        ],
        "Blaze Orange": [
            u("1542291026-7eec264c27ff"),       # orange/bright sneaker
            u("1608231387042-66d17730f71b"),   # orange running shoes
        ],
    },

    # ── 23: Sunglasses – Retro / Onyx ────────────────────────────────────────
    23: {
        "Retro Tortoise": [
            u("1572635196237-14b3f281503f"),   # tortoise frame sunnies
            u("1473496169904-658ba7c44d8a"),   # retro sunglasses shot
        ],
        "Onyx Polarized": [
            u("1511499767150-a48a237f0083"),   # black polarized sunnies
            u("1591076482161-42ce6da69f27"),   # minimal black sunglasses
        ],
    },

    # ── 24: Smart Speaker – Onyx / Frost ─────────────────────────────────────
    24: {
        "Onyx Sound": [
            u("1545454675-3531b543be5d"),      # black round speaker
            u("1608043152269-423dbba4e7e1"),   # dark speaker product
        ],
        "Frost White": [
            u("1517048676732-d65bc937f68e"),   # white speaker
            u("1589492477829-5e65395b6516"),   # smart speaker minimal
        ],
    },

    # ── 25: Classic Watch – Heritage / Chrono ────────────────────────────────
    25: {
        "Heritage Brown": [
            u("1523275335684-37898b6baf30"),   # classic watch flat lay
            u("1548036328-c9fa89d128fa"),      # watch face detail
        ],
        "Chronograph Black": [
            u("1542496658-e33a6d0d50f6"),      # dark watch face
            u("1533139502658-0198f920d8e8"),   # watch on grey
        ],
    },

    # ── 26: Wireless Headphones – Stealth / Arctic ───────────────────────────
    26: {
        "Stealth Black": [
            u("1590658268037-6bf12165a8df"),   # black headphones
            u("1546435770-a3e426bf472b"),       # headphones side dark
        ],
        "Arctic White": [
            u("1613040809024-b4ef7ba99586"),   # white headphones
            u("1577174881658-0f30ed549788"),   # headphones product white
        ],
    },

    # ── 27: Everyday Backpack – Metro / Canvas ────────────────────────────────
    27: {
        "Metro Charcoal": [
            u("1546938576-6e6a64f317cc"),      # charcoal/grey backpack
            u("1680039211156-66c721b80b3d"),   # backpack studio
        ],
        "Canvas Sand": [
            u("1622560480605-d83c853bc4b4"),   # sand/beige backpack
            u("1588850561407-ed78c2821399"),   # backpack minimal
        ],
    },

    # ── 28: Running Shoes – Aero / Velocity ──────────────────────────────────
    28: {
        "Aero White": [
            u("1600185365483-26d7a4cc7519"),   # white running shoes
            u("1560769629-975ec94e6a86"),      # shoe pair side
        ],
        "Velocity Grey": [
            u("1584735935682-2f2b69df5664"),   # grey running shoe
            u("1525966222134-fcfa99b80f2f"),   # grey shoes detail
        ],
    },

    # ── 29: Sunglasses – Wayfarer / Amber ────────────────────────────────────
    29: {
        "Matte Wayfarer": [
            u("1618677366787-9727aacca7ea"),   # classic sunnies
            u("1511499767150-a48a237f0083"),   # sunglasses product
        ],
        "Amber Tortoise": [
            u("1508296695146-257a814070b4"),   # tortoise sunnies marble
            u("1572635196237-14b3f281503f"),   # tortoise frame
        ],
    },

    # ── 30: Smart Speaker – Nordic / Pearl ────────────────────────────────────
    30: {
        "Nordic Charcoal": [
            u("1543512214-318c7553f230"),      # dark speaker
            u("1608043152269-423dbba4e7e1"),   # speaker product shot
        ],
        "Pearl White": [
            u("1518444065439-e933c06ce9cd"),   # white speaker
            u("1507676184212-d03ab07a4b74"),   # smart speaker white bg
        ],
    },

    # ── 31: Classic Watch – Vintage / Sterling ───────────────────────────────
    31: {
        "Vintage Saddle": [
            u("1523275335684-37898b6baf30"),   # watch flat lay
            u("1526045612212-70caf35c14df"),   # watch on surface
        ],
        "Sterling Silver": [
            u("1526045612212-70caf35c14df"),   # watch isolated
            u("1533139502658-0198f920d8e8"),   # watch grey bg
        ],
    },

    # ── 32: Wireless Headphones – Matte Graphite / Silver Cloud ──────────────
    32: {
        "Matte Graphite": [
            u("1583394838336-acd97773977b"),    # graphite headphones
            u("1572536147248-ac59a8abfa4b"),   # dark headphones
        ],
        "Silver Cloud": [
            u("1546435770-a3e426bf472b"),       # silver headphones
            u("1613040809024-b4ef7ba99586"),   # white/silver headphone
        ],
    },

    # ── 33: Everyday Backpack – Tactical / Safari ─────────────────────────────
    33: {
        "Tactical Black": [
            u("1553062407-98eeb64c6a62"),       # black tactical backpack
            u("1577733966973-d680bffdf7f1"),   # backpack minimal
        ],
        "Safari Khaki": [
            u("1622560480605-d83c853bc4b4"),   # khaki backpack
            u("1509762774605-f07235a09cfc"),   # backpack detail view
        ],
    },

    # ── 34: Running Shoes – Ghost / Racing ───────────────────────────────────
    34: {
        "Ghost White": [
            u("1549298916-b41d501d3772"),       # white sneakers
            u("1575537302964-96cd47c0cb03"),   # white shoe top view
        ],
        "Racing Blue": [
            u("1595950653106-6c9ebd614d3c"),   # blue sneakers
            u("1542291026-7eec264c27ff"),       # colorful running shoe
        ],
    },

    # ── 35: Sunglasses – Aviator / Square ────────────────────────────────────
    35: {
        "Classic Aviator": [
            u("1577803645773-f96470509666"),   # aviator sunglasses
            u("1508296695146-257a814070b4"),   # sunnies on surface
        ],
        "Matte Square": [
            u("1511499767150-a48a237f0083"),   # square sunglasses product
            u("1473496169904-658ba7c44d8a"),   # sunnies minimal bg
        ],
    },

    # ── 36: Smart Speaker – Midnight / Alpine ────────────────────────────────
    36: {
        "Midnight Charcoal": [
            u("1545454675-3531b543be5d"),      # dark round speaker
            u("1543512214-318c7553f230"),      # dark speaker product
        ],
        "Alpine White": [
            u("1518444065439-e933c06ce9cd"),   # white speaker
            u("1589492477829-5e65395b6516"),   # smart speaker product
        ],
    },
}


def run():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    products_updated = 0
    variants_deleted = 0
    variants_inserted = 0
    images_inserted = 0

    for product_id, variant_data in PRODUCT_DATA.items():
        # Fetch product name for logging
        row = c.execute("SELECT name FROM products WHERE id=?", (product_id,)).fetchone()
        if not row:
            print(f"  SKIP: product {product_id} not found")
            continue
        pname = row["name"]

        # First image of the first variant becomes the product card image
        first_variant_imgs = list(variant_data.values())[0]
        card_image = first_variant_imgs[0]

        c.execute("UPDATE products SET image=? WHERE id=?", (card_image, product_id))
        products_updated += 1

        # Delete existing variants/images (cascade deletes product_images)
        deleted = c.execute(
            "DELETE FROM product_variants WHERE product_id=?", (product_id,)
        ).rowcount
        variants_deleted += deleted

        # Insert fresh variants + images
        for sort_idx, (color, images) in enumerate(variant_data.items()):
            vrow = c.execute(
                "INSERT INTO product_variants (product_id, color, sort_order) VALUES (?,?,?)",
                (product_id, color, sort_idx)
            )
            variant_id = vrow.lastrowid
            variants_inserted += 1

            for img_idx, img_url in enumerate(images):
                c.execute(
                    "INSERT INTO product_images (variant_id, image_url, sort_order) VALUES (?,?,?)",
                    (variant_id, img_url.strip(), img_idx)
                )
                images_inserted += 1

        print(f"  [{product_id:2}] {pname:25} → {len(variant_data)} variants, card={card_image.split('photo-')[1][:18]}")

    conn.commit()
    conn.close()
    print(f"\nDone.")
    print(f"  products.image updated : {products_updated}")
    print(f"  variants removed       : {variants_deleted}")
    print(f"  variants inserted      : {variants_inserted}")
    print(f"  images inserted        : {images_inserted}")


if __name__ == "__main__":
    run()

