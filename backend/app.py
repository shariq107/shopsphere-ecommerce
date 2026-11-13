import os
import sqlite3
from functools import wraps
from uuid import uuid4

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

app.secret_key = os.environ.get("FLASK_SECRET_KEY")

CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:5173",
        "https://shopsphere-ecommerce-zeta.vercel.app"
    ]
)

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "None"
app.config["SESSION_COOKIE_SECURE"] = True

DATABASE = os.path.join(os.path.dirname(__file__), "shopsphere.db")
ORDER_STATUSES = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"]


def get_db():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def admin_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        if not session.get("admin_id"):
            return jsonify({"message": "Admin authentication required"}), 401
        return function(*args, **kwargs)
    return wrapper


def customer_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        customer_id = session.get("customer_id")
        if not customer_id:
            return jsonify({"message": "Customer authentication required"}), 401
        requested_id = kwargs.get("customer_id")
        if requested_id is not None and int(requested_id) != int(customer_id):
            return jsonify({"message": "You cannot access another customer's data"}), 403
        return function(*args, **kwargs)
    return wrapper


def initialize_database():
    connection = get_db()
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            old_price REAL,
            label TEXT,
            art TEXT,
            color TEXT,
            image TEXT,
            stock INTEGER NOT NULL DEFAULT 0
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS product_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            color TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE(product_id, color)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS product_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            variant_id INTEGER NOT NULL,
            image_url TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT UNIQUE NOT NULL,
            customer_id INTEGER,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            phone TEXT,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            pincode TEXT NOT NULL,
            subtotal REAL NOT NULL,
            delivery REAL NOT NULL,
            total REAL NOT NULL,
            payment_method TEXT NOT NULL,
            payment_status TEXT NOT NULL,
            order_status TEXT NOT NULL DEFAULT 'Placed',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES users(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            image TEXT,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )
    """)

    # STEP 25: PRODUCT REVIEWS AND RATINGS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (customer_id, product_id),
            FOREIGN KEY (customer_id) REFERENCES users(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    """)

    # STEP 23: DELIVERY ADDRESSES
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS addresses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            pincode TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES users(id)
        )
    """)

    # STEP 27: CUSTOMER NOTIFICATIONS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            order_id INTEGER,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES users(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )
    """)

    # STEP 29: PAYMENT RECORDS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL UNIQUE,
            order_number TEXT NOT NULL,
            customer_id INTEGER,
            payment_method TEXT NOT NULL,
            amount REAL NOT NULL,
            payment_status TEXT NOT NULL,
            transaction_reference TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (customer_id) REFERENCES users(id)
        )
    """)

    # STEP 30: COUPONS AND DISCOUNTS
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coupons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
            discount_value REAL NOT NULL,
            minimum_order REAL NOT NULL DEFAULT 0,
            maximum_discount REAL,
            is_active INTEGER NOT NULL DEFAULT 1,
            expires_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)

    default_coupons = [
        ("WELCOME10", "percentage", 10, 500, 200, 1, None),
        ("FLAT100", "fixed", 100, 1000, None, 1, None)
    ]

    for coupon in default_coupons:
        cursor.execute("""
            INSERT OR IGNORE INTO coupons
            (code, discount_type, discount_value, minimum_order,
             maximum_discount, is_active, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, coupon)

    product_columns = {
        row["name"]
        for row in cursor.execute("PRAGMA table_info(products)").fetchall()
    }

    if "image" not in product_columns:
        cursor.execute("ALTER TABLE products ADD COLUMN image TEXT")

    if "stock" not in product_columns:
        cursor.execute(
            "ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0"
        )

    order_columns = {
        row["name"]
        for row in cursor.execute("PRAGMA table_info(orders)").fetchall()
    }

    if "coupon_code" not in order_columns:
        cursor.execute("ALTER TABLE orders ADD COLUMN coupon_code TEXT")

    if "discount" not in order_columns:
        cursor.execute(
            "ALTER TABLE orders ADD COLUMN discount REAL NOT NULL DEFAULT 0"
        )

    product_count = cursor.execute(
        "SELECT COUNT(*) FROM products"
    ).fetchone()[0]

    if product_count == 0:
        cursor.executemany("""
            INSERT INTO products
            (name, category, price, old_price, label, art, color, image, stock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            ("Classic T-Shirt", "Clothing", 499, 699, "Popular", "T", "#e8e8e8", "", 20),
            ("Running Shoes", "Footwear", 1499, 1999, "Trending", "S", "#dce8f5", "", 15),
            ("Smart Watch", "Electronics", 2499, 2999, "New", "W", "#e5e0f2", "", 10),
            ("Backpack", "Accessories", 899, 1199, "", "B", "#e8e2d8", "", 12),
            ("Wireless Headphones", "Electronics", 1799, 2299, "Popular", "H", "#e2e8e4", "", 8),
            ("Casual Sneakers", "Footwear", 1299, 1699, "", "C", "#f0e5df", "", 18)
        ])

    connection.commit()
    connection.close()


def get_product_variants(connection, product_id):
    variants = connection.execute("""
        SELECT id, color FROM product_variants
        WHERE product_id = ? ORDER BY sort_order, id
    """, (product_id,)).fetchall()

    result = []
    all_images = []
    for variant in variants:
        images = connection.execute("""
            SELECT image_url FROM product_images
            WHERE variant_id = ? ORDER BY sort_order, id
        """, (variant["id"],)).fetchall()
        image_urls = [image["image_url"] for image in images]
        all_images.extend(image_urls)
        result.append({"color": variant["color"], "images": image_urls})

    return result, all_images


def save_product_variants(connection, product_id, variants):
    if variants is None:
        return

    if not isinstance(variants, list):
        raise ValueError("Variants must be a list")

    connection.execute(
        "DELETE FROM product_variants WHERE product_id = ?", (product_id,)
    )

    for variant_index, variant in enumerate(variants):
        if not isinstance(variant, dict):
            raise ValueError("Each variant must contain a colour and image list")

        color = str(variant.get("color", "")).strip()
        images = variant.get("images", [])

        if not color:
            raise ValueError("Every variant must have a colour name")
        if not isinstance(images, list):
            raise ValueError("Variant images must be a list")

        cursor = connection.execute("""
            INSERT INTO product_variants (product_id, color, sort_order)
            VALUES (?, ?, ?)
        """, (product_id, color, variant_index))

        variant_id = cursor.lastrowid
        for image_index, image_url in enumerate(images):
            image_url = str(image_url).strip()
            if image_url:
                connection.execute("""
                    INSERT INTO product_images (variant_id, image_url, sort_order)
                    VALUES (?, ?, ?)
                """, (variant_id, image_url, image_index))


def product_to_dict(product, connection=None):
    result = {
        "id": product["id"],
        "name": product["name"],
        "category": product["category"],
        "price": product["price"],
        "oldPrice": product["old_price"],
        "label": product["label"],
        "art": product["art"],
        "color": product["color"],
        "image": product["image"],
        "stock": product["stock"]
    }
    if connection is not None:
        variants, images = get_product_variants(connection, product["id"])
        result["variants"] = variants
        result["images"] = images
    else:
        result["variants"] = []
        result["images"] = []
    return result


def order_to_dict(order):
    return {
        "id": order["id"],
        "orderNumber": order["order_number"],
        "customerId": order["customer_id"],
        "customerName": order["customer_name"],
        "customerEmail": order["customer_email"],
        "phone": order["phone"],
        "address": order["address"],
        "city": order["city"],
        "pincode": order["pincode"],
        "subtotal": order["subtotal"],
        "delivery": order["delivery"],
        "couponCode": order["coupon_code"] if "coupon_code" in order.keys() else None,
        "discount": order["discount"] if "discount" in order.keys() else 0,
        "total": order["total"],
        "paymentMethod": order["payment_method"],
        "paymentStatus": order["payment_status"],
        "orderStatus": order["order_status"],
        "createdAt": order["created_at"]
    }


def get_order_items(connection, order_id):
    items = connection.execute("""
        SELECT product_id, product_name, price, quantity, image
        FROM order_items WHERE order_id = ?
    """, (order_id,)).fetchall()

    return [
        {
            "productId": item["product_id"],
            "name": item["product_name"],
            "price": item["price"],
            "quantity": item["quantity"],
            "image": item["image"]
        }
        for item in items
    ]


def address_to_dict(address):
    return {
        "id": address["id"],
        "customerId": address["customer_id"],
        "fullName": address["full_name"],
        "phone": address["phone"],
        "address": address["address"],
        "city": address["city"],
        "state": address["state"],
        "pincode": address["pincode"],
        "createdAt": address["created_at"]
    }


@app.route("/")
def home():
    return jsonify({"message": "ShopSphere API is running"})


@app.route("/api/health")
def health():
    return jsonify({"status": "healthy"})


# CUSTOMER PRODUCTS

@app.route("/api/products", methods=["GET"])
def get_products():
    connection = get_db()
    products = connection.execute(
        "SELECT * FROM products ORDER BY id DESC"
    ).fetchall()
    result = [product_to_dict(product, connection) for product in products]
    connection.close()
    return jsonify(result)


# CUSTOMER REGISTRATION

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"message": "All fields are required"}), 400

    if len(password) < 6:
        return jsonify({"message": "Password must contain at least 6 characters"}), 400

    connection = get_db()

    try:
        cursor = connection.execute("""
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        """, (name, email, generate_password_hash(password)))

        connection.commit()

        return jsonify({
            "message": "Registration successful",
            "user": {
                "id": cursor.lastrowid,
                "name": name,
                "email": email
            }
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({"message": "Email already registered"}), 409

    finally:
        connection.close()


# CUSTOMER LOGIN

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    connection = get_db()
    user = connection.execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()
    connection.close()

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"message": "Invalid email or password"}), 401

    session.clear()
    session["customer_id"] = user["id"]
    session["customer_name"] = user["name"]
    session["customer_email"] = user["email"]

    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    })


@app.route("/api/customer/me", methods=["GET"])
@customer_required
def customer_me():
    connection = get_db()
    user = connection.execute(
        "SELECT id, name, email FROM users WHERE id = ?",
        (session["customer_id"],)
    ).fetchone()
    connection.close()

    if not user:
        session.clear()
        return jsonify({"message": "Customer account not found"}), 404

    return jsonify({"user": dict(user)})


@app.route("/api/customer/logout", methods=["POST"])
@customer_required
def customer_logout():
    session.clear()
    return jsonify({"message": "Customer logged out successfully"})


# CUSTOMER PROFILE UPDATE

@app.route("/api/profile/<int:customer_id>", methods=["PUT"])
@customer_required
def update_customer_profile(customer_id):
    customer_id = session["customer_id"]
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()

    if not name or not email:
        return jsonify({"message": "Name and email are required"}), 400

    if "@" not in email or "." not in email:
        return jsonify({"message": "Enter a valid email address"}), 400

    connection = get_db()

    customer = connection.execute(
        "SELECT id FROM users WHERE id = ?", (customer_id,)
    ).fetchone()

    if not customer:
        connection.close()
        return jsonify({"message": "Customer not found"}), 404

    existing_email = connection.execute("""
        SELECT id FROM users WHERE email = ? AND id != ?
    """, (email, customer_id)).fetchone()

    if existing_email:
        connection.close()
        return jsonify({"message": "This email is already registered"}), 409

    connection.execute("""
        UPDATE users SET name = ?, email = ? WHERE id = ?
    """, (name, email, customer_id))

    connection.commit()
    connection.close()

    # Keep the active customer session in sync with the updated profile.
    session["customer_name"] = name
    session["customer_email"] = email

    return jsonify({
        "message": "Profile updated successfully",
        "user": {"id": customer_id, "name": name, "email": email}
    })


# STEP 23: CUSTOMER DELIVERY ADDRESSES

@app.route("/api/addresses/<int:customer_id>", methods=["GET"])
@customer_required
def get_customer_addresses(customer_id):
    customer_id = session["customer_id"]
    connection = get_db()

    customer = connection.execute(
        "SELECT id FROM users WHERE id = ?", (customer_id,)
    ).fetchone()

    if not customer:
        connection.close()
        return jsonify({"message": "Customer not found"}), 404

    addresses = connection.execute("""
        SELECT * FROM addresses
        WHERE customer_id = ?
        ORDER BY id DESC
    """, (customer_id,)).fetchall()

    result = [address_to_dict(address) for address in addresses]
    connection.close()

    return jsonify(result)


@app.route("/api/addresses", methods=["POST"])
@customer_required
def add_customer_address():
    data = request.get_json(silent=True) or {}

    customer_id = session["customer_id"]

    full_name = data.get("fullName", "").strip()
    phone = data.get("phone", "").strip()
    address = data.get("address", "").strip()
    city = data.get("city", "").strip()
    state = data.get("state", "").strip()
    pincode = data.get("pincode", "").strip()

    if not all([full_name, phone, address, city, state, pincode]):
        return jsonify({"message": "Please complete all address fields"}), 400

    if not phone.isdigit() or len(phone) != 10:
        return jsonify({"message": "Enter a valid 10-digit phone number"}), 400

    if not pincode.isdigit() or len(pincode) != 6:
        return jsonify({"message": "Enter a valid 6-digit pincode"}), 400

    connection = get_db()

    customer = connection.execute(
        "SELECT id FROM users WHERE id = ?", (customer_id,)
    ).fetchone()

    if not customer:
        connection.close()
        return jsonify({"message": "Customer not found"}), 404

    cursor = connection.execute("""
        INSERT INTO addresses (
            customer_id, full_name, phone, address, city, state, pincode
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        customer_id, full_name, phone, address, city, state, pincode
    ))

    connection.commit()

    saved_address = connection.execute(
        "SELECT * FROM addresses WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()

    result = address_to_dict(saved_address)
    connection.close()

    return jsonify({
        "message": "Address added successfully",
        "address": result
    }), 201


@app.route("/api/addresses/<int:address_id>", methods=["DELETE"])
@customer_required
def delete_customer_address(address_id):
    data = request.get_json(silent=True) or {}

    customer_id = session["customer_id"]

    connection = get_db()

    cursor = connection.execute("""
        DELETE FROM addresses
        WHERE id = ? AND customer_id = ?
    """, (address_id, customer_id))

    connection.commit()
    connection.close()

    if cursor.rowcount == 0:
        return jsonify({"message": "Address not found"}), 404

    return jsonify({"message": "Address deleted successfully"})


# ADMIN AUTHENTICATION

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    connection = get_db()
    admin = connection.execute(
        "SELECT * FROM admins WHERE email = ?", (email,)
    ).fetchone()
    connection.close()

    if (
        not admin
        or not check_password_hash(admin["password"], password)
        or admin["is_active"] != 1
    ):
        return jsonify({"message": "Invalid admin credentials"}), 401

    session.clear()
    session["admin_id"] = admin["id"]
    session["admin_name"] = admin["name"]
    session["admin_email"] = admin["email"]

    return jsonify({
        "message": "Admin login successful",
        "admin": {
            "id": admin["id"],
            "name": admin["name"],
            "email": admin["email"]
        }
    })


@app.route("/api/admin/me", methods=["GET"])
@admin_required
def admin_me():
    return jsonify({
        "admin": {
            "id": session["admin_id"],
            "name": session["admin_name"],
            "email": session["admin_email"]
        }
    })


@app.route("/api/admin/logout", methods=["POST"])
@admin_required
def admin_logout():
    session.clear()
    return jsonify({"message": "Admin logged out successfully"})


# ADMIN DASHBOARD

@app.route("/api/admin/dashboard-stats", methods=["GET"])
@admin_required
def dashboard_stats():
    connection = get_db()

    total_products = connection.execute(
        "SELECT COUNT(*) FROM products"
    ).fetchone()[0]

    total_customers = connection.execute(
        "SELECT COUNT(*) FROM users"
    ).fetchone()[0]

    total_orders = connection.execute(
        "SELECT COUNT(*) FROM orders"
    ).fetchone()[0]

    total_sales = connection.execute("""
        SELECT COALESCE(SUM(total), 0)
        FROM orders WHERE order_status != 'Cancelled'
    """).fetchone()[0]

    connection.close()

    return jsonify({
        "totalProducts": total_products,
        "totalCustomers": total_customers,
        "totalOrders": total_orders,
        "totalSales": total_sales
    })


# ADMIN PRODUCT MANAGEMENT

@app.route("/api/admin/products", methods=["POST"])
@admin_required
def add_product():
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    category = data.get("category", "").strip()

    try:
        price = float(data.get("price"))
        old_price = (
            float(data["oldPrice"])
            if data.get("oldPrice") not in (None, "")
            else None
        )
        stock = int(data.get("stock", 0))
    except (TypeError, ValueError):
        return jsonify({"message": "Enter valid price and stock values"}), 400

    if not name or not category or price < 0 or stock < 0:
        return jsonify({"message": "Enter valid product details"}), 400

    connection = get_db()
    cursor = connection.execute("""
        INSERT INTO products
        (name, category, price, old_price, label, art, color, image, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        name, category, price, old_price,
        data.get("label", ""), data.get("art", ""),
        data.get("color", ""), data.get("image", ""), stock
    ))

    product_id = cursor.lastrowid
    try:
        save_product_variants(connection, product_id, data.get("variants", []))
        connection.commit()
    except ValueError as error:
        connection.rollback()
        connection.close()
        return jsonify({"message": str(error)}), 400
    connection.close()

    return jsonify({
        "message": "Product added successfully",
        "id": product_id
    }), 201


@app.route("/api/admin/products/<int:product_id>", methods=["PUT"])
@admin_required
def update_product(product_id):
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    category = data.get("category", "").strip()

    try:
        price = float(data.get("price"))
        old_price = (
            float(data["oldPrice"])
            if data.get("oldPrice") not in (None, "")
            else None
        )
        stock = int(data.get("stock", 0))
    except (TypeError, ValueError):
        return jsonify({"message": "Enter valid price and stock values"}), 400

    if not name or not category or price < 0 or stock < 0:
        return jsonify({"message": "Enter valid product details"}), 400

    connection = get_db()
    cursor = connection.execute("""
        UPDATE products
        SET name = ?, category = ?, price = ?, old_price = ?,
            label = ?, art = ?, color = ?, image = ?, stock = ?
        WHERE id = ?
    """, (
        name, category, price, old_price,
        data.get("label", ""), data.get("art", ""),
        data.get("color", ""), data.get("image", ""),
        stock, product_id
    ))

    if cursor.rowcount == 0:
        connection.close()
        return jsonify({"message": "Product not found"}), 404

    try:
        save_product_variants(connection, product_id, data.get("variants"))
        connection.commit()
    except ValueError as error:
        connection.rollback()
        connection.close()
        return jsonify({"message": str(error)}), 400

    connection.close()
    return jsonify({"message": "Product updated successfully"})


@app.route("/api/admin/products/<int:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):
    connection = get_db()
    connection.execute("""
        DELETE FROM product_images
        WHERE variant_id IN (
            SELECT id FROM product_variants WHERE product_id = ?
        )
    """, (product_id,))
    connection.execute(
        "DELETE FROM product_variants WHERE product_id = ?", (product_id,)
    )
    cursor = connection.execute(
        "DELETE FROM products WHERE id = ?", (product_id,)
    )
    connection.commit()
    connection.close()

    if cursor.rowcount == 0:
        return jsonify({"message": "Product not found"}), 404

    return jsonify({"message": "Product deleted successfully"})


# STEP 30: COUPON VALIDATION

@app.route("/api/coupons/validate", methods=["POST"])
def validate_coupon():
    data = request.get_json(silent=True) or {}
    code = str(data.get("code", "")).strip().upper()

    try:
        subtotal = float(data.get("subtotal", 0))
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid order subtotal"}), 400

    if not code:
        return jsonify({"message": "Enter a coupon code"}), 400

    if subtotal < 0:
        return jsonify({"message": "Invalid order subtotal"}), 400

    connection = get_db()
    coupon = connection.execute("""
        SELECT * FROM coupons
        WHERE code = ? AND is_active = 1
    """, (code,)).fetchone()
    connection.close()

    if not coupon:
        return jsonify({"message": "Invalid or inactive coupon code"}), 404

    if coupon["expires_at"]:
        # Expiry comparison is performed using SQLite's current date/time.
        check_connection = get_db()
        expired = check_connection.execute(
            "SELECT datetime(?) <= datetime('now')",
            (coupon["expires_at"],)
        ).fetchone()[0]
        check_connection.close()
        if expired:
            return jsonify({"message": "This coupon has expired"}), 400

    if subtotal < coupon["minimum_order"]:
        return jsonify({
            "message": f"Minimum order value for this coupon is ₹{coupon['minimum_order']:.0f}"
        }), 400

    if coupon["discount_type"] == "percentage":
        discount = subtotal * coupon["discount_value"] / 100
    else:
        discount = coupon["discount_value"]

    if coupon["maximum_discount"] is not None:
        discount = min(discount, coupon["maximum_discount"])

    discount = round(min(discount, subtotal), 2)

    return jsonify({
        "message": "Coupon applied successfully",
        "coupon": {
            "code": coupon["code"],
            "discountType": coupon["discount_type"],
            "discountValue": coupon["discount_value"],
            "discount": discount,
            "minimumOrder": coupon["minimum_order"]
        }
    })


@app.route("/api/admin/coupons", methods=["GET"])
@admin_required
def get_admin_coupons():
    connection = get_db()
    coupons = connection.execute(
        "SELECT * FROM coupons ORDER BY id DESC"
    ).fetchall()
    connection.close()

    return jsonify([
        {
            "id": coupon["id"],
            "code": coupon["code"],
            "discountType": coupon["discount_type"],
            "discountValue": coupon["discount_value"],
            "minimumOrder": coupon["minimum_order"],
            "maximumDiscount": coupon["maximum_discount"],
            "isActive": bool(coupon["is_active"]),
            "expiresAt": coupon["expires_at"]
        }
        for coupon in coupons
    ])


# CUSTOMER ORDER CREATION

@app.route("/api/orders", methods=["POST"])
@customer_required
def create_order():
    data = request.get_json(silent=True) or {}
    customer = data.get("customer") or {}
    items = data.get("items") or []
    payment_method = data.get("paymentMethod", "")
    coupon_code = str(data.get("couponCode", "")).strip().upper()

    required_fields = ["name", "email", "phone", "address", "city", "pincode"]

    if any(not str(customer.get(field, "")).strip() for field in required_fields):
        return jsonify({"message": "Complete all delivery details"}), 400

    if not items:
        return jsonify({"message": "Your cart is empty"}), 400

    if payment_method not in ["UPI", "Card", "COD"]:
        return jsonify({"message": "Invalid payment method"}), 400

    connection = get_db()
    cursor = connection.cursor()

    try:
        order_items = []
        subtotal = 0

        for item in items:
            product_id = int(item.get("id"))
            quantity = int(item.get("quantity", 1))

            if quantity < 1:
                raise ValueError("Invalid product quantity")

            product = cursor.execute(
                "SELECT * FROM products WHERE id = ?", (product_id,)
            ).fetchone()

            if not product:
                raise ValueError("A product in your cart was not found")

            subtotal += product["price"] * quantity

            order_items.append({
                "productId": product["id"],
                "name": product["name"],
                "price": product["price"],
                "quantity": quantity,
                "image": product["image"]
            })

        delivery = 0 if subtotal >= 999 else 49
        discount = 0
        applied_coupon_code = None

        if coupon_code:
            coupon = cursor.execute("""
                SELECT * FROM coupons
                WHERE code = ? AND is_active = 1
            """, (coupon_code,)).fetchone()

            if not coupon:
                raise ValueError("Invalid or inactive coupon code")

            if subtotal < coupon["minimum_order"]:
                raise ValueError(
                    f"Minimum order value for this coupon is ₹{coupon['minimum_order']:.0f}"
                )

            if coupon["expires_at"]:
                expired = cursor.execute(
                    "SELECT datetime(?) <= datetime('now')",
                    (coupon["expires_at"],)
                ).fetchone()[0]
                if expired:
                    raise ValueError("This coupon has expired")

            if coupon["discount_type"] == "percentage":
                discount = subtotal * coupon["discount_value"] / 100
            else:
                discount = coupon["discount_value"]

            if coupon["maximum_discount"] is not None:
                discount = min(discount, coupon["maximum_discount"])

            discount = round(min(discount, subtotal), 2)
            applied_coupon_code = coupon["code"]

        total = max(0, subtotal + delivery - discount)
        customer_id = session["customer_id"]
        account = cursor.execute(
            "SELECT name, email FROM users WHERE id = ?", (customer_id,)
        ).fetchone()
        if not account:
            raise ValueError("Customer account not found")
        customer_name = account["name"]
        customer_email = account["email"]
        order_number = "SS-" + uuid4().hex[:10].upper()

        payment_status = (
            "Pay on delivery"
            if payment_method == "COD"
            else "Demo payment successful"
        )

        cursor.execute("""
            INSERT INTO orders (
                order_number, customer_id, customer_name, customer_email,
                phone, address, city, pincode, subtotal, delivery, total,
                payment_method, payment_status, order_status, coupon_code, discount
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Placed', ?, ?)
        """, (
            order_number, customer_id, customer_name,
            customer_email, customer["phone"], customer["address"],
            customer["city"], customer["pincode"], subtotal,
            delivery, total, payment_method, payment_status,
            applied_coupon_code, discount
        ))

        order_id = cursor.lastrowid

        # Save a payment record for every order.
        # Online methods are simulated; COD remains pending collection.
        payment_record_status = (
            "Pending collection"
            if payment_method == "COD"
            else "Demo payment successful"
        )
        transaction_reference = (
            None
            if payment_method == "COD"
            else "DEMO-" + uuid4().hex[:12].upper()
        )

        cursor.execute("""
            INSERT INTO payments (
                order_id, order_number, customer_id, payment_method,
                amount, payment_status, transaction_reference
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            order_id, order_number, customer_id, payment_method,
            total, payment_record_status, transaction_reference
        ))

        for item in order_items:
            cursor.execute("""
                INSERT INTO order_items (
                    order_id, product_id, product_name,
                    price, quantity, image
                )
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                order_id, item["productId"], item["name"],
                item["price"], item["quantity"], item["image"]
            ))

        connection.commit()

        return jsonify({
            "message": "Order placed successfully",
            "order": {
                "id": order_id,
                "orderNumber": order_number,
                "customerName": customer_name,
                "customerEmail": customer_email,
                "subtotal": subtotal,
                "delivery": delivery,
                "couponCode": applied_coupon_code,
                "discount": discount,
                "total": total,
                "paymentMethod": payment_method,
                "paymentStatus": payment_status,
                "orderStatus": "Placed",
                "items": order_items
            }
        }), 201

    except (TypeError, ValueError) as error:
        connection.rollback()
        return jsonify({"message": str(error)}), 400

    except Exception:
        connection.rollback()
        return jsonify({"message": "Unable to place order"}), 500

    finally:
        connection.close()


# STEP 29: ADMIN PAYMENT RECORDS

@app.route("/api/admin/payments", methods=["GET"])
@admin_required
def get_admin_payments():
    connection = get_db()

    payments = connection.execute("""
        SELECT
            payments.*,
            orders.customer_name,
            orders.customer_email
        FROM payments
        JOIN orders ON orders.id = payments.order_id
        ORDER BY payments.created_at DESC, payments.id DESC
    """).fetchall()

    result = [
        {
            "id": payment["id"],
            "orderId": payment["order_id"],
            "orderNumber": payment["order_number"],
            "customerId": payment["customer_id"],
            "customerName": payment["customer_name"],
            "customerEmail": payment["customer_email"],
            "paymentMethod": payment["payment_method"],
            "amount": payment["amount"],
            "paymentStatus": payment["payment_status"],
            "transactionReference": payment["transaction_reference"],
            "createdAt": payment["created_at"]
        }
        for payment in payments
    ]

    connection.close()
    return jsonify(result)


# ADMIN ORDER MANAGEMENT

@app.route("/api/admin/orders", methods=["GET"])
@admin_required
def get_admin_orders():
    connection = get_db()
    orders = connection.execute(
        "SELECT * FROM orders ORDER BY id DESC"
    ).fetchall()

    result = []

    for order in orders:
        order_data = order_to_dict(order)
        order_data["items"] = get_order_items(connection, order["id"])
        result.append(order_data)

    connection.close()
    return jsonify(result)


@app.route("/api/admin/orders/<int:order_id>/status", methods=["PUT"])
@admin_required
def update_order_status(order_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("orderStatus", "").strip()

    if new_status not in ORDER_STATUSES:
        return jsonify({
            "message": "Invalid order status",
            "allowedStatuses": ORDER_STATUSES
        }), 400

    connection = get_db()
    order = connection.execute(
        "SELECT id FROM orders WHERE id = ?", (order_id,)
    ).fetchone()

    if not order:
        connection.close()
        return jsonify({"message": "Order not found"}), 404

    order_details = connection.execute(
        "SELECT customer_id, order_number FROM orders WHERE id = ?",
        (order_id,)
    ).fetchone()

    connection.execute(
        "UPDATE orders SET order_status = ? WHERE id = ?",
        (new_status, order_id)
    )

    if order_details and order_details["customer_id"] is not None:
        connection.execute("""
            INSERT INTO notifications (customer_id, order_id, title, message)
            VALUES (?, ?, ?, ?)
        """, (
            order_details["customer_id"],
            order_id,
            "Order status updated",
            f"Your order {order_details['order_number']} is now {new_status}."
        ))

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Order status updated successfully",
        "orderId": order_id,
        "orderStatus": new_status
    })


# ADMIN CUSTOMER MANAGEMENT

@app.route("/api/admin/customers", methods=["GET"])
@admin_required
def get_admin_customers():
    connection = get_db()

    customers = connection.execute("""
        SELECT
            users.id, users.name, users.email,
            COUNT(orders.id) AS total_orders,
            COALESCE(SUM(
                CASE WHEN orders.order_status != 'Cancelled'
                THEN orders.total ELSE 0 END
            ), 0) AS total_spent
        FROM users
        LEFT JOIN orders ON users.id = orders.customer_id
        GROUP BY users.id, users.name, users.email
        ORDER BY users.id DESC
    """).fetchall()

    result = [
        {
            "id": customer["id"],
            "name": customer["name"],
            "email": customer["email"],
            "totalOrders": customer["total_orders"],
            "totalSpent": customer["total_spent"]
        }
        for customer in customers
    ]

    connection.close()
    return jsonify(result)


@app.route("/api/admin/customers/<int:customer_id>", methods=["GET"])
@admin_required
def get_customer_details(customer_id):
    connection = get_db()

    customer = connection.execute("""
        SELECT id, name, email FROM users WHERE id = ?
    """, (customer_id,)).fetchone()

    if not customer:
        connection.close()
        return jsonify({"message": "Customer not found"}), 404

    orders = connection.execute("""
        SELECT * FROM orders
        WHERE customer_id = ?
        ORDER BY id DESC
    """, (customer_id,)).fetchall()

    order_list = []

    for order in orders:
        order_data = order_to_dict(order)
        order_data["items"] = get_order_items(connection, order["id"])
        order_list.append(order_data)

    customer_details = {
        "id": customer["id"],
        "name": customer["name"],
        "email": customer["email"],
        "totalOrders": len(order_list),
        "totalSpent": sum(
            order["total"]
            for order in order_list
            if order["orderStatus"] != "Cancelled"
        ),
        "orders": order_list
    }

    connection.close()
    return jsonify(customer_details)


# STEP 25: CUSTOMER PRODUCT REVIEWS AND RATINGS

def review_to_dict(review):
    return {
        "id": review["id"],
        "customerId": review["customer_id"],
        "customerName": review["customer_name"],
        "productId": review["product_id"],
        "rating": review["rating"],
        "comment": review["comment"],
        "createdAt": review["created_at"],
        "updatedAt": review["updated_at"]
    }


@app.route("/api/products/<int:product_id>/reviews", methods=["GET"])
def get_product_reviews(product_id):
    connection = get_db()

    product = connection.execute(
        "SELECT id FROM products WHERE id = ?", (product_id,)
    ).fetchone()

    if not product:
        connection.close()
        return jsonify({"message": "Product not found"}), 404

    reviews = connection.execute("""
        SELECT
            reviews.*,
            users.name AS customer_name
        FROM reviews
        JOIN users ON users.id = reviews.customer_id
        WHERE reviews.product_id = ?
        ORDER BY reviews.created_at DESC, reviews.id DESC
    """, (product_id,)).fetchall()

    result = [review_to_dict(review) for review in reviews]
    connection.close()
    return jsonify(result)


@app.route("/api/reviews", methods=["POST"])
@customer_required
def add_product_review():
    data = request.get_json(silent=True) or {}

    customer_id = session["customer_id"]
    try:
        product_id = int(data.get("productId"))
        rating = int(data.get("rating"))
    except (TypeError, ValueError):
        return jsonify({"message": "Product and rating are required"}), 400

    comment = str(data.get("comment", "")).strip()

    if rating < 1 or rating > 5:
        return jsonify({"message": "Rating must be between 1 and 5"}), 400

    if not comment:
        return jsonify({"message": "Please write a review"}), 400

    connection = get_db()

    customer = connection.execute(
        "SELECT id FROM users WHERE id = ?", (customer_id,)
    ).fetchone()
    product = connection.execute(
        "SELECT id FROM products WHERE id = ?", (product_id,)
    ).fetchone()

    if not customer:
        connection.close()
        return jsonify({"message": "Customer not found"}), 404

    if not product:
        connection.close()
        return jsonify({"message": "Product not found"}), 404

    try:
        cursor = connection.execute("""
            INSERT INTO reviews (customer_id, product_id, rating, comment)
            VALUES (?, ?, ?, ?)
        """, (customer_id, product_id, rating, comment))

        connection.commit()

        saved_review = connection.execute("""
            SELECT reviews.*, users.name AS customer_name
            FROM reviews
            JOIN users ON users.id = reviews.customer_id
            WHERE reviews.id = ?
        """, (cursor.lastrowid,)).fetchone()

        result = review_to_dict(saved_review)
        connection.close()

        return jsonify({
            "message": "Review submitted successfully",
            "review": result
        }), 201

    except sqlite3.IntegrityError:
        connection.close()
        return jsonify({
            "message": "You have already reviewed this product. You can edit your existing review."
        }), 409


@app.route("/api/reviews/<int:review_id>", methods=["PUT"])
@customer_required
def update_product_review(review_id):
    data = request.get_json(silent=True) or {}

    customer_id = session["customer_id"]
    try:
        rating = int(data.get("rating"))
    except (TypeError, ValueError):
        return jsonify({"message": "Rating is required"}), 400

    comment = str(data.get("comment", "")).strip()

    if rating < 1 or rating > 5:
        return jsonify({"message": "Rating must be between 1 and 5"}), 400

    if not comment:
        return jsonify({"message": "Please write a review"}), 400

    connection = get_db()

    review = connection.execute("""
        SELECT id FROM reviews
        WHERE id = ? AND customer_id = ?
    """, (review_id, customer_id)).fetchone()

    if not review:
        connection.close()
        return jsonify({"message": "Review not found"}), 404

    connection.execute("""
        UPDATE reviews
        SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND customer_id = ?
    """, (rating, comment, review_id, customer_id))

    connection.commit()

    updated_review = connection.execute("""
        SELECT reviews.*, users.name AS customer_name
        FROM reviews
        JOIN users ON users.id = reviews.customer_id
        WHERE reviews.id = ?
    """, (review_id,)).fetchone()

    result = review_to_dict(updated_review)
    connection.close()

    return jsonify({
        "message": "Review updated successfully",
        "review": result
    })


@app.route("/api/reviews/<int:review_id>", methods=["DELETE"])
@customer_required
def delete_product_review(review_id):
    data = request.get_json(silent=True) or {}

    customer_id = session["customer_id"]

    connection = get_db()

    cursor = connection.execute("""
        DELETE FROM reviews
        WHERE id = ? AND customer_id = ?
    """, (review_id, customer_id))

    connection.commit()
    connection.close()

    if cursor.rowcount == 0:
        return jsonify({"message": "Review not found"}), 404

    return jsonify({"message": "Review deleted successfully"})



# STEP 27: CUSTOMER ORDER CANCELLATION AND NOTIFICATIONS

@app.route("/api/customer/orders/<int:order_id>/cancel", methods=["PUT"])
@customer_required
def cancel_customer_order(order_id):
    data = request.get_json(silent=True) or {}

    customer_id = session["customer_id"]

    connection = get_db()
    order = connection.execute("""
        SELECT id, order_number, customer_id, order_status
        FROM orders
        WHERE id = ? AND customer_id = ?
    """, (order_id, customer_id)).fetchone()

    if not order:
        connection.close()
        return jsonify({"message": "Order not found"}), 404

    if order["order_status"] not in ["Placed", "Processing"]:
        connection.close()
        return jsonify({
            "message": "This order can no longer be cancelled because it has been shipped, delivered, or already cancelled."
        }), 400

    connection.execute(
        "UPDATE orders SET order_status = 'Cancelled' WHERE id = ?",
        (order_id,)
    )

    connection.execute("""
        INSERT INTO notifications (customer_id, order_id, title, message)
        VALUES (?, ?, ?, ?)
    """, (
        customer_id,
        order_id,
        "Order cancelled",
        f"Your order {order['order_number']} has been cancelled successfully."
    ))

    connection.commit()
    connection.close()

    return jsonify({
        "message": "Order cancelled successfully",
        "orderId": order_id,
        "orderStatus": "Cancelled"
    })


@app.route("/api/customer/notifications/<int:customer_id>", methods=["GET"])
@customer_required
def get_customer_notifications(customer_id):
    customer_id = session["customer_id"]
    connection = get_db()

    customer = connection.execute(
        "SELECT id FROM users WHERE id = ?", (customer_id,)
    ).fetchone()

    if not customer:
        connection.close()
        return jsonify({"message": "Customer not found"}), 404

    notifications = connection.execute("""
        SELECT id, customer_id, order_id, title, message, is_read, created_at
        FROM notifications
        WHERE customer_id = ?
        ORDER BY id DESC
    """, (customer_id,)).fetchall()

    result = [
        {
            "id": item["id"],
            "customerId": item["customer_id"],
            "orderId": item["order_id"],
            "title": item["title"],
            "message": item["message"],
            "isRead": bool(item["is_read"]),
            "createdAt": item["created_at"]
        }
        for item in notifications
    ]

    connection.close()
    return jsonify(result)


@app.route("/api/customer/notifications/<int:notification_id>/read", methods=["PUT"])
@customer_required
def mark_customer_notification_read(notification_id):
    data = request.get_json(silent=True) or {}

    customer_id = session["customer_id"]

    connection = get_db()
    cursor = connection.execute("""
        UPDATE notifications
        SET is_read = 1
        WHERE id = ? AND customer_id = ?
    """, (notification_id, customer_id))

    connection.commit()
    connection.close()

    if cursor.rowcount == 0:
        return jsonify({"message": "Notification not found"}), 404

    return jsonify({"message": "Notification marked as read"})


# STEP 26: CUSTOMER ORDER TRACKING

@app.route("/api/customer/orders/<int:customer_id>", methods=["GET"])
@customer_required
def get_customer_orders(customer_id):
    customer_id = session["customer_id"]
    connection = get_db()

    customer = connection.execute(
        "SELECT id FROM users WHERE id = ?",
        (customer_id,)
    ).fetchone()

    if not customer:
        connection.close()
        return jsonify({"message": "Customer not found"}), 404

    orders = connection.execute("""
        SELECT * FROM orders
        WHERE customer_id = ?
        ORDER BY created_at DESC
    """, (customer_id,)).fetchall()

    result = []

    for order in orders:
        order_data = order_to_dict(order)
        order_data["items"] = get_order_items(connection, order["id"])
        result.append(order_data)

    connection.close()
    return jsonify(result)



# STEP 31: ADMIN SALES AND ORDER REPORTS

@app.route("/api/admin/reports", methods=["GET"])
@admin_required
def get_admin_reports():
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()

    import datetime

    try:
        if start_date:
            datetime.date.fromisoformat(start_date)
        if end_date:
            datetime.date.fromisoformat(end_date)
        if start_date and end_date and start_date > end_date:
            return jsonify({"message": "Start date cannot be after end date"}), 400
    except ValueError:
        return jsonify({"message": "Dates must use YYYY-MM-DD format"}), 400

    conditions = ["1 = 1"]
    parameters = []

    if start_date:
        conditions.append("date(created_at) >= date(?)")
        parameters.append(start_date)
    if end_date:
        conditions.append("date(created_at) <= date(?)")
        parameters.append(end_date)

    where_clause = " AND ".join(conditions)
    connection = get_db()

    summary = connection.execute(f"""
        SELECT
            COUNT(*) AS total_orders,
            COALESCE(SUM(
                CASE WHEN order_status != 'Cancelled' THEN total ELSE 0 END
            ), 0) AS net_sales,
            COALESCE(SUM(
                CASE WHEN order_status = 'Cancelled' THEN 1 ELSE 0 END
            ), 0) AS cancelled_orders,
            COALESCE(SUM(
                CASE WHEN order_status = 'Delivered' THEN 1 ELSE 0 END
            ), 0) AS delivered_orders,
            COALESCE(SUM(
                CASE WHEN order_status IN ('Placed', 'Processing', 'Shipped')
                THEN 1 ELSE 0 END
            ), 0) AS active_orders
        FROM orders WHERE {where_clause}
    """, parameters).fetchone()

    status_rows = connection.execute(f"""
        SELECT order_status, COUNT(*) AS count
        FROM orders
        WHERE {where_clause}
        GROUP BY order_status
        ORDER BY count DESC
    """, parameters).fetchall()

    daily_rows = connection.execute(f"""
        SELECT date(created_at) AS report_date,
               COUNT(*) AS order_count,
               COALESCE(SUM(
                   CASE WHEN order_status != 'Cancelled' THEN total ELSE 0 END
               ), 0) AS sales
        FROM orders
        WHERE {where_clause}
        GROUP BY date(created_at)
        ORDER BY report_date ASC
    """, parameters).fetchall()

    product_where = where_clause.replace("created_at", "orders.created_at")
    top_product_rows = connection.execute(f"""
        SELECT
            order_items.product_name AS product_name,
            SUM(order_items.quantity) AS quantity_sold,
            COALESCE(SUM(order_items.price * order_items.quantity), 0) AS revenue
        FROM order_items
        JOIN orders ON orders.id = order_items.order_id
        WHERE {product_where}
          AND orders.order_status != 'Cancelled'
        GROUP BY order_items.product_id, order_items.product_name
        ORDER BY quantity_sold DESC, revenue DESC
        LIMIT 10
    """, parameters).fetchall()

    recent_orders = connection.execute(f"""
        SELECT id, order_number, customer_name, total,
               order_status, created_at
        FROM orders
        WHERE {where_clause}
        ORDER BY created_at DESC, id DESC
        LIMIT 10
    """, parameters).fetchall()

    connection.close()

    return jsonify({
        "summary": {
            "totalOrders": summary["total_orders"],
            "netSales": summary["net_sales"],
            "cancelledOrders": summary["cancelled_orders"],
            "deliveredOrders": summary["delivered_orders"],
            "activeOrders": summary["active_orders"]
        },
        "orderStatuses": [
            {"status": row["order_status"], "count": row["count"]}
            for row in status_rows
        ],
        "dailySales": [
            {
                "date": row["report_date"],
                "orders": row["order_count"],
                "sales": row["sales"]
            }
            for row in daily_rows
        ],
        "topProducts": [
            {
                "productName": row["product_name"],
                "quantitySold": row["quantity_sold"],
                "revenue": row["revenue"]
            }
            for row in top_product_rows
        ],
        "recentOrders": [
            {
                "id": row["id"],
                "orderNumber": row["order_number"],
                "customerName": row["customer_name"],
                "total": row["total"],
                "orderStatus": row["order_status"],
                "createdAt": row["created_at"]
            }
            for row in recent_orders
        ]
    })


if __name__ == "__main__":
    # Initialize database when the app starts (including Gunicorn)
initialize_database()

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1", port=5000)
