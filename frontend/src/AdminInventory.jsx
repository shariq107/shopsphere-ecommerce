import { API_URL } from "./config";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminManagement.css";
function AdminInventory() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [stockValues, setStockValues] = useState({});
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadProducts = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch(`${API_URL}/api/products`);
            const data = await response.json();
            if (!response.ok || !Array.isArray(data)) {
                throw new Error(data.message || "Unable to load products.");
            }
            setProducts(data);
            setStockValues(Object.fromEntries(data.map(p => [p.id, String(p.stock ?? 0)])));
        } catch (err) {
            setError(err.message || "Unable to load inventory.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadProducts(); }, []);

    const lowStockCount = products.filter(p => Number(p.stock) <= 5).length;
    const outOfStockCount = products.filter(p => Number(p.stock) === 0).length;
    const totalUnits = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);

    const visibleProducts = useMemo(() => products.filter(product => {
        const term = search.trim().toLowerCase();
        const matchesSearch = !term ||
            product.name.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term);
        const stock = Number(product.stock || 0);
        const matchesFilter = filter === "all" ||
            (filter === "low" && stock > 0 && stock <= 5) ||
            (filter === "out" && stock === 0) ||
            (filter === "healthy" && stock > 5);
        return matchesSearch && matchesFilter;
    }), [products, search, filter]);

    const saveStock = async product => {
        const stock = Number(stockValues[product.id]);
        if (!Number.isInteger(stock) || stock < 0) {
            setError("Stock must be a whole number greater than or equal to zero.");
            return;
        }
        setSavingId(product.id);
        setMessage("");
        setError("");
        try {
            const response = await fetch(`${API_URL}/api/admin/products/${product.id}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: product.name,
                    category: product.category,
                    price: product.price,
                    oldPrice: product.oldPrice ?? "",
                    label: product.label ?? "",
                    art: product.art ?? "",
                    color: product.color ?? "",
                    image: product.image ?? "",
                    stock
                })
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    navigate("/admin");
                    return;
                }
                throw new Error(data.message || "Unable to update stock.");
            }
            setProducts(current => current.map(p => p.id === product.id ? { ...p, stock } : p));
            setMessage(`Stock updated for ${product.name}.`);
        } catch (err) {
            setError(err.message || "Unable to update stock.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="admin-page">
            <header className="admin-page-header">
                <div>
                    <span className="admin-eyebrow">SHOPSPHERE / ADMINISTRATION</span>
                    <h1>Inventory</h1>
                    <p>Monitor stock levels and update product quantities.</p>
                </div>
                <button className="admin-button admin-button-dark" onClick={() => navigate("/admin/dashboard")}>
                    Back to dashboard
                </button>
            </header>

            <section className="admin-stat-grid">
                <article className="admin-stat-card"><span>Total products</span><strong>{loading ? "—" : products.length}</strong><small>Products in catalogue</small></article>
                <article className="admin-stat-card"><span>Total stock units</span><strong>{loading ? "—" : totalUnits.toLocaleString("en-IN")}</strong><small>Units currently available</small></article>
                <article className="admin-stat-card admin-stat-warning"><span>Low stock</span><strong>{loading ? "—" : lowStockCount}</strong><small>Five or fewer units</small></article>
                <article className="admin-stat-card admin-stat-danger"><span>Out of stock</span><strong>{loading ? "—" : outOfStockCount}</strong><small>Products needing restock</small></article>
            </section>

            <section className="admin-panel">
                <div className="admin-panel-heading">
                    <div><h2>Stock overview</h2><p>Change a quantity and save it to update the product record.</p></div>
                    <button className="admin-button admin-button-light" onClick={loadProducts}>Refresh</button>
                </div>

                <div className="admin-toolbar">
                    <input className="admin-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product or category..." />
                    <select className="admin-select" value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="all">All stock levels</option>
                        <option value="low">Low stock (1–5)</option>
                        <option value="out">Out of stock</option>
                        <option value="healthy">Healthy stock</option>
                    </select>
                </div>

                {message && <p className="admin-success">{message}</p>}
                {error && <p className="admin-error">{error}</p>}
                {loading ? <div className="admin-empty">Loading inventory...</div> :
                    visibleProducts.length === 0 ? <div className="admin-empty">No matching products found.</div> : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead><tr><th>Product</th><th>Category</th><th>Current stock</th><th>Stock status</th><th>Update quantity</th></tr></thead>
                                <tbody>
                                    {visibleProducts.map(product => {
                                        const stock = Number(product.stock || 0);
                                        const status = stock === 0 ? "Out of stock" : stock <= 5 ? "Low stock" : "In stock";
                                        return (
                                            <tr key={product.id}>
                                                <td><strong>{product.name}</strong><small className="admin-subtext">Product #{product.id}</small></td>
                                                <td>{product.category}</td>
                                                <td><strong>{stock}</strong></td>
                                                <td><span className={`admin-stock-badge ${stock === 0 ? "is-out" : stock <= 5 ? "is-low" : "is-good"}`}>{status}</span></td>
                                                <td>
                                                    <div className="admin-stock-edit">
                                                        <input aria-label={`New stock for ${product.name}`} type="number" min="0" step="1" value={stockValues[product.id] ?? ""} onChange={e => setStockValues(v => ({ ...v, [product.id]: e.target.value }))} />
                                                        <button className="admin-button admin-button-dark" disabled={savingId === product.id} onClick={() => saveStock(product)}>{savingId === product.id ? "Saving..." : "Save"}</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
            </section>
        </div>
    );
}

export default AdminInventory;
