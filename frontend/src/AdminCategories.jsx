import { API_URL } from "./config";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminManagement.css";
function AdminCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${API_URL}/api/products`);
                const products = await response.json();
                if (!response.ok || !Array.isArray(products)) {
                    throw new Error(products.message || "Unable to load categories.");
                }
                const counts = products.reduce((result, product) => {
                    const name = product.category || "Uncategorised";
                    result[name] = (result[name] || 0) + 1;
                    return result;
                }, {});
                setCategories(Object.entries(counts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([name, count], index) => ({ id: index + 1, name, count })));
            } catch (err) {
                setError(err.message || "Unable to load categories.");
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const visibleCategories = useMemo(() => categories.filter(category =>
        category.name.toLowerCase().includes(search.trim().toLowerCase())
    ), [categories, search]);

    const totalProducts = categories.reduce((sum, category) => sum + category.count, 0);

    return (
        <div className="admin-page">
            <header className="admin-page-header">
                <div>
                    <span className="admin-eyebrow">SHOPSPHERE / ADMINISTRATION</span>
                    <h1>Categories</h1>
                    <p>Review the product categories used across your store.</p>
                </div>
                <button className="admin-button admin-button-dark" onClick={() => navigate("/admin/dashboard")}>
                    Back to dashboard
                </button>
            </header>

            <section className="admin-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
                <article className="admin-stat-card"><span>Total categories</span><strong>{loading ? "—" : categories.length}</strong><small>Unique product categories</small></article>
                <article className="admin-stat-card"><span>Total products</span><strong>{loading ? "—" : totalProducts}</strong><small>Products across all categories</small></article>
                <article className="admin-stat-card"><span>Largest category</span><strong style={{ fontSize: "22px" }}>{loading ? "—" : categories.length ? [...categories].sort((a,b) => b.count-a.count)[0].name : "—"}</strong><small>{loading || !categories.length ? "No category data" : `${Math.max(...categories.map(c => c.count))} products`}</small></article>
            </section>

            <section className="admin-panel">
                <div className="admin-panel-heading">
                    <div><h2>Category list</h2><p>Category totals are calculated from your current product catalogue.</p></div>
                </div>
                <div className="admin-toolbar">
                    <input className="admin-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..." />
                </div>
                {error && <p className="admin-error">{error}</p>}
                {loading ? <div className="admin-empty">Loading categories...</div> :
                    visibleCategories.length === 0 ? <div className="admin-empty">No categories found.</div> : (
                        <div className="admin-table-wrap">
                            <table className="admin-table">
                                <thead><tr><th>#</th><th>Category name</th><th>Products</th><th>Share of catalogue</th></tr></thead>
                                <tbody>{visibleCategories.map(category => (
                                    <tr key={category.name}>
                                        <td>{category.id.toString().padStart(2, "0")}</td>
                                        <td><strong>{category.name}</strong></td>
                                        <td>{category.count}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 130 }}>
                                                <div style={{ height: 7, flex: 1, background: "#edf0f6", borderRadius: 8, overflow: "hidden" }}>
                                                    <div style={{ width: `${totalProducts ? category.count / totalProducts * 100 : 0}%`, height: "100%", background: "#6676c9", borderRadius: 8 }} />
                                                </div>
                                                <small>{totalProducts ? Math.round(category.count / totalProducts * 100) : 0}%</small>
                                            </div>
                                        </td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
            </section>
        </div>
    );
}

export default AdminCategories;
