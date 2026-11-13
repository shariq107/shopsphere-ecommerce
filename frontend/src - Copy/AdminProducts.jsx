import { API_URL } from "./config";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
const LOW_STOCK_LIMIT = 5;

const emptyForm = {
    name: "",
    category: "",
    price: "",
    oldPrice: "",
    label: "",
    art: "",
    color: "",
    image: "",
    stock: "0"
};

function AdminProducts() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [variantsText, setVariantsText] = useState("[]");

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/api/products`);

            if (!response.ok) {
                throw new Error("Unable to load products");
            }

            const data = await response.json();
            setProducts(data);
        } catch (error) {
            setMessage(error.message);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const categories = useMemo(() => [
        "All",
        ...new Set(
            products.map((product) => product.category).filter(Boolean)
        )
    ], [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch = product.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

            const matchesCategory =
                selectedCategory === "All" ||
                product.category === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    const lowStockProducts = useMemo(() => {
        return products.filter(
            (product) => Number(product.stock ?? 0) <= LOW_STOCK_LIMIT
        );
    }, [products]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previousForm) => ({
            ...previousForm,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setLoading(true);

        const url = editingId
            ? `${API_URL}/api/admin/products/${editingId}`
            : `${API_URL}/api/admin/products`;

        let variants;
        try {
            variants = JSON.parse(variantsText || "[]");
            if (!Array.isArray(variants)) {
                throw new Error("Variants must be a JSON array.");
            }
        } catch (error) {
            setMessage(`Invalid variants format: ${error.message}`);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(url, {
                method: editingId ? "PUT" : "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...form,
                    stock: Number(form.stock),
                    variants
                })
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                navigate("/admin");
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            setMessage(data.message);
            setForm(emptyForm);
            setVariantsText("[]");
            setEditingId(null);
            await fetchProducts();

        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setEditingId(product.id);

        setForm({
            name: product.name || "",
            category: product.category || "",
            price: product.price ?? "",
            oldPrice: product.oldPrice ?? "",
            label: product.label || "",
            art: product.art || "",
            color: product.color || "",
            image: product.image || "",
            stock: String(product.stock ?? 0)
        });
        setVariantsText(JSON.stringify(product.variants || [], null, 2));

        setMessage("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
        setVariantsText("[]");
        setMessage("");
    };

    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/admin/products/${productId}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                navigate("/admin");
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete product");
            }

            setMessage(data.message);
            await fetchProducts();

        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.heading}>Product Management</h1>
                    <p style={styles.subtitle}>
                        Add, edit, delete and manage your products.
                    </p>
                </div>

                <button
                    style={styles.backButton}
                    onClick={() => navigate("/admin/dashboard")}
                >
                    Back to Dashboard
                </button>
            </div>

            {/* LOW STOCK ALERTS */}

            <section style={styles.alertSection}>
                <h2 style={styles.alertHeading}>
                    Low Stock Alerts
                </h2>

                {lowStockProducts.length > 0 ? (
                    <>
                        <p style={styles.alertDescription}>
                            {lowStockProducts.length} product(s) have
                            {` ${LOW_STOCK_LIMIT} or fewer units remaining.`}
                        </p>

                        <div style={styles.alertList}>
                            {lowStockProducts.map((product) => (
                                <div key={product.id} style={styles.alertItem}>
                                    <div>
                                        <strong>{product.name}</strong>
                                        <p style={styles.alertCategory}>
                                            {product.category}
                                        </p>
                                    </div>

                                    <span style={styles.lowStockBadge}>
                                        {product.stock ?? 0} units left
                                    </span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p style={styles.noAlerts}>
                        All products have sufficient stock.
                    </p>
                )}
            </section>

            {/* ADD / EDIT PRODUCT */}

            <section style={styles.formCard}>
                <h2 style={styles.sectionHeading}>
                    {editingId ? "Edit Product" : "Add New Product"}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGrid}>
                        <input
                            style={styles.input}
                            name="name"
                            placeholder="Product Name"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />

                        <input
                            style={styles.input}
                            name="category"
                            placeholder="Category"
                            value={form.category}
                            onChange={handleChange}
                            required
                        />

                        <input
                            style={styles.input}
                            name="price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Selling Price"
                            value={form.price}
                            onChange={handleChange}
                            required
                        />

                        <input
                            style={styles.input}
                            name="oldPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Old Price (Optional)"
                            value={form.oldPrice}
                            onChange={handleChange}
                        />

                        <input
                            style={styles.input}
                            name="label"
                            placeholder="Product Label (Optional)"
                            value={form.label}
                            onChange={handleChange}
                        />

                        <input
                            style={styles.input}
                            name="art"
                            placeholder="Product Emoji (Optional)"
                            value={form.art}
                            onChange={handleChange}
                        />

                        <input
                            style={styles.input}
                            name="color"
                            placeholder="Background Color (Optional)"
                            value={form.color}
                            onChange={handleChange}
                        />

                        <input
                            style={styles.input}
                            name="image"
                            type="url"
                            placeholder="Product Image URL (Optional)"
                            value={form.image}
                            onChange={handleChange}
                        />

                        <div style={styles.stockField}>
                            <label style={styles.stockLabel}>
                                Available Stock
                            </label>

                            <input
                                style={styles.input}
                                name="stock"
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Enter stock quantity"
                                value={form.stock}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {form.image && (
                        <div style={styles.previewContainer}>
                            <p>Image Preview</p>
                            <img
                                src={form.image}
                                alt="Product preview"
                                style={styles.previewImage}
                            />
                        </div>
                    )}

                    <div style={{ marginTop: "18px" }}>
                        <label style={{ display: "block", fontWeight: 700, marginBottom: "8px" }}>
                            Colour variants and image URLs
                        </label>
                        <textarea
                            value={variantsText}
                            onChange={(event) => setVariantsText(event.target.value)}
                            rows={9}
                            spellCheck="false"
                            style={{ ...styles.input, width: "100%", boxSizing: "border-box", fontFamily: "monospace", resize: "vertical" }}
                            placeholder='[{"color":"Black","images":["https://...","https://...","https://..."]}]'
                        />
                        <p style={{ color: "#73798a", fontSize: "12px", lineHeight: 1.6 }}>
                            Add each colour as an object. Put up to 3 image URLs in its images list. Example:
                           <code>{'[{"color":"Black","images":["image-1-url","image-2-url","image-3-url"]}]'}</code>
                        </p>
                    </div>

                    <div style={styles.formButtons}>
                        <button
                            type="submit"
                            style={styles.submitButton}
                            disabled={loading}
                        >
                            {loading
                                ? "Please wait..."
                                : editingId
                                    ? "Update Product"
                                    : "Add Product"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                style={styles.cancelButton}
                                onClick={cancelEdit}
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>

                {message && <p style={styles.message}>{message}</p>}
            </section>

            {/* PRODUCT LIST */}

            <section style={styles.productsSection}>
                <h2 style={styles.sectionHeading}>Existing Products</h2>

                <div style={styles.filterContainer}>
                    <input
                        style={styles.searchInput}
                        type="text"
                        placeholder="Search products by name..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />

                    <select
                        style={styles.select}
                        value={selectedCategory}
                        onChange={(event) =>
                            setSelectedCategory(event.target.value)
                        }
                    >
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                <p style={styles.resultCount}>
                    Showing {filteredProducts.length} of {products.length} products
                </p>

                <div style={styles.productGrid}>
                    {filteredProducts.map((product) => {
                        const stock = Number(product.stock ?? 0);
                        const isLowStock = stock <= LOW_STOCK_LIMIT;

                        return (
                            <article key={product.id} style={styles.productCard}>
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        style={styles.productImage}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            ...styles.imagePlaceholder,
                                            backgroundColor: product.color || "#eeeeee"
                                        }}
                                    >
                                        {product.art || "📦"}
                                    </div>
                                )}

                                <div style={styles.productInfo}>
                                    <h3 style={styles.productName}>
                                        {product.name}
                                    </h3>

                                    <p style={styles.categoryText}>
                                        {product.category}
                                    </p>

                                    <p style={styles.priceText}>
                                        ₹{Number(product.price).toLocaleString("en-IN")}
                                    </p>
                                    <p style={{ ...styles.categoryText, marginTop: "4px" }}>
                                        {(product.variants || []).length} colour(s) · {(product.images || []).length} image(s)
                                    </p>

                                    <p style={{
                                        ...styles.stockText,
                                        color: isLowStock ? "#c62828" : "#256d45"
                                    }}>
                                        Available Stock: {stock} units
                                    </p>

                                    {isLowStock && (
                                        <p style={styles.warningText}>
                                            Low stock – restock required
                                        </p>
                                    )}

                                    <div style={styles.actionButtons}>
                                        <button
                                            style={styles.editButton}
                                            onClick={() => handleEdit(product)}
                                        >
                                            Edit / Update Stock
                                        </button>

                                        <button
                                            style={styles.deleteButton}
                                            onClick={() => handleDelete(product.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <p style={styles.emptyMessage}>No products found.</p>
                )}
            </section>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        padding: "32px",
        background: "#f5f6fa",
        color: "#202438",
        fontFamily: "Arial, sans-serif"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
        marginBottom: "28px"
    },
    heading: {
        margin: 0,
        fontSize: "28px"
    },
    subtitle: {
        color: "#73798a",
        marginTop: "8px"
    },
    backButton: {
        padding: "11px 18px",
        border: "none",
        borderRadius: "8px",
        background: "#252b43",
        color: "white",
        cursor: "pointer"
    },
    alertSection: {
        background: "#fff4e5",
        border: "1px solid #f2d3a7",
        padding: "22px",
        borderRadius: "12px",
        marginBottom: "25px"
    },
    alertHeading: {
        margin: "0 0 10px",
        fontSize: "20px",
        color: "#9a4d00"
    },
    alertDescription: {
        color: "#85500c",
        fontSize: "14px"
    },
    alertList: {
        display: "grid",
        gap: "10px",
        marginTop: "15px"
    },
    alertItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        borderRadius: "8px",
        background: "white"
    },
    alertCategory: {
        margin: "5px 0 0",
        color: "#73798a",
        fontSize: "12px"
    },
    lowStockBadge: {
        background: "#ffe0e0",
        color: "#b42318",
        padding: "7px 10px",
        borderRadius: "6px",
        fontWeight: "bold",
        fontSize: "12px",
        whiteSpace: "nowrap"
    },
    noAlerts: {
        color: "#256d45",
        marginBottom: 0
    },
    formCard: {
        background: "white",
        padding: "24px",
        borderRadius: "12px",
        marginBottom: "30px",
        boxShadow: "0 3px 15px rgba(0,0,0,0.05)"
    },
    sectionHeading: {
        marginTop: 0,
        marginBottom: "20px",
        fontSize: "21px"
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px"
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px",
        border: "1px solid #dce0e8",
        borderRadius: "7px",
        fontSize: "14px"
    },
    stockField: {
        display: "flex",
        flexDirection: "column",
        gap: "7px"
    },
    stockLabel: {
        fontSize: "13px",
        fontWeight: "bold"
    },
    previewContainer: {
        marginTop: "18px"
    },
    previewImage: {
        width: "120px",
        height: "120px",
        objectFit: "cover",
        borderRadius: "8px",
        border: "1px solid #e1e4eb"
    },
    formButtons: {
        display: "flex",
        gap: "10px",
        marginTop: "18px",
        flexWrap: "wrap"
    },
    submitButton: {
        padding: "12px 22px",
        background: "#4f46e5",
        color: "white",
        border: "none",
        borderRadius: "7px",
        cursor: "pointer"
    },
    cancelButton: {
        padding: "12px 22px",
        background: "#e5e7eb",
        color: "#202438",
        border: "none",
        borderRadius: "7px",
        cursor: "pointer"
    },
    message: {
        color: "#256d45"
    },
    productsSection: {
        background: "white",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 3px 15px rgba(0,0,0,0.05)"
    },
    filterContainer: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "12px"
    },
    searchInput: {
        flex: "1 1 240px",
        padding: "12px",
        border: "1px solid #dce0e8",
        borderRadius: "7px",
        fontSize: "14px"
    },
    select: {
        minWidth: "180px",
        padding: "12px",
        border: "1px solid #dce0e8",
        borderRadius: "7px",
        background: "white"
    },
    resultCount: {
        color: "#73798a",
        fontSize: "13px",
        marginBottom: "18px"
    },
    productGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "18px"
    },
    productCard: {
        border: "1px solid #e7e9ef",
        borderRadius: "10px",
        overflow: "hidden",
        background: "white"
    },
    productImage: {
        width: "100%",
        height: "170px",
        objectFit: "cover",
        display: "block"
    },
    imagePlaceholder: {
        height: "170px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "55px"
    },
    productInfo: {
        padding: "15px"
    },
    productName: {
        margin: "0 0 7px",
        fontSize: "17px"
    },
    categoryText: {
        color: "#73798a",
        fontSize: "13px"
    },
    priceText: {
        fontWeight: "bold",
        marginBottom: "8px"
    },
    stockText: {
        fontWeight: "bold",
        fontSize: "14px"
    },
    warningText: {
        color: "#c62828",
        fontSize: "12px",
        fontWeight: "bold"
    },
    actionButtons: {
        display: "flex",
        gap: "8px",
        marginTop: "14px",
        flexWrap: "wrap"
    },
    editButton: {
        flex: 1,
        padding: "9px",
        background: "#e8eaff",
        color: "#4540b5",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
    },
    deleteButton: {
        flex: 1,
        padding: "9px",
        background: "#ffe8e8",
        color: "#c62828",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
    },
    emptyMessage: {
        textAlign: "center",
        color: "#73798a",
        padding: "25px"
    }
};

export default AdminProducts;