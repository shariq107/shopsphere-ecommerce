import { API_URL } from "./config";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCustomers: 0,
        totalOrders: 0,
        totalSales: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/admin/dashboard-stats`,
                    {
                        credentials: "include"
                    }
                );

                if (response.status === 401 || response.status === 403) {
                    navigate("/admin");
                    return;
                }

                const data = await response.json();

                if (response.ok) {
                    setStats({
                        totalProducts: data.totalProducts ?? 0,
                        totalCustomers: data.totalCustomers ?? 0,
                        totalOrders: data.totalOrders ?? 0,
                        totalSales: data.totalSales ?? 0
                    });
                } else {
                    console.error(
                        "Dashboard API error:",
                        data.message || "Unable to load statistics"
                    );
                }
            } catch (error) {
                console.error("Dashboard loading failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    const formatPrice = (amount) => {
        return "₹ " + Number(amount || 0).toLocaleString("en-IN");
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/api/admin/logout`, {
                method: "POST",
                credentials: "include"
            });

            localStorage.removeItem("loggedInAdmin");
            navigate("/admin");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const menuItems = [
        { name: "Dashboard", path: "/admin/dashboard" },
        { name: "Categories", path: "/admin/categories" },
        { name: "Products", path: "/admin/products" },
        { name: "Inventory", path: "/admin/inventory" },
        { name: "Orders", path: "/admin/orders" },
        { name: "Customers", path: "/admin/customers" },
        { name: "Reports", path: "/admin/reports" }
    ];

    const cards = [
        {
            title: "Total Products",
            value: stats.totalProducts,
            description: "Products in your store"
        },
        {
            title: "Total Customers",
            value: stats.totalCustomers,
            description: "Registered customers"
        },
        {
            title: "Total Orders",
            value: stats.totalOrders,
            description: "Orders received"
        },
        {
            title: "Total Sales",
            value: formatPrice(stats.totalSales),
            description: "Revenue from orders"
        }
    ];

    return (
        <div style={styles.container}>

            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <h2 style={styles.logo}>ShopSphere</h2>

                <p style={styles.adminLabel}>ADMIN PANEL</p>

                <nav>
                    {menuItems.map((item) => (
                        <div
                            key={item.name}
                            onClick={() => navigate(item.path)}
                            style={{
                                ...styles.menuItem,
                                background:
                                    item.name === "Dashboard"
                                        ? "#343a50"
                                        : "transparent"
                            }}
                        >
                            {item.name}
                        </div>
                    ))}
                </nav>

                <button
                    onClick={handleLogout}
                    style={styles.logout}
                >
                    Logout
                </button>
            </aside>

            {/* Main content */}
            <main style={styles.main}>

                <header style={styles.header}>
                    <div>
                        <h1>Dashboard</h1>
                        <p>Welcome to your ShopSphere Admin Panel</p>
                    </div>

                    <span style={styles.adminBadge}>
                        Administrator
                    </span>
                </header>

                {/* Statistics */}
                <section style={styles.cards}>
                    {cards.map((card) => (
                        <div key={card.title} style={styles.card}>
                            <p>{card.title}</p>

                            <h2>
                                {loading ? "..." : card.value}
                            </h2>

                            <span>{card.description}</span>
                        </div>
                    ))}
                </section>

                {/* Sales Summary */}
                <section style={styles.section}>
                    <h2>Sales Summary</h2>

                    <div style={styles.salesGrid}>
                        <div style={styles.salesCard}>
                            <p>Total Revenue</p>
                            <h2>
                                {loading ? "..." : formatPrice(stats.totalSales)}
                            </h2>
                        </div>

                        <div style={styles.salesCard}>
                            <p>Total Orders</p>
                            <h2>
                                {loading ? "..." : stats.totalOrders}
                            </h2>
                        </div>

                        <div style={styles.salesCard}>
                            <p>Total Products</p>
                            <h2>
                                {loading ? "..." : stats.totalProducts}
                            </h2>
                        </div>
                    </div>

                    <p style={styles.note}>
                        Sales information is calculated from your stored orders.
                    </p>
                </section>

                {/* Recent Orders */}
                <section style={styles.section}>
                    <h2>Recent Orders</h2>

                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr>
                                    <td colSpan="4" style={styles.empty}>
                                        Recent orders are available in the Orders section.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

            </main>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        minHeight: "100vh",
        background: "#f5f6fa",
        fontFamily: "Arial, sans-serif"
    },

    sidebar: {
        width: "230px",
        background: "#202538",
        color: "white",
        padding: "25px 15px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0
    },

    logo: {
        margin: "0 0 8px",
        fontSize: "24px"
    },

    adminLabel: {
        color: "#aab0c0",
        fontSize: "11px",
        letterSpacing: "2px",
        marginBottom: "30px"
    },

    menuItem: {
        padding: "14px",
        marginBottom: "8px",
        borderRadius: "7px",
        cursor: "pointer"
    },

    logout: {
        marginTop: "auto",
        padding: "12px",
        background: "#e05252",
        color: "white",
        border: "none",
        borderRadius: "7px",
        cursor: "pointer"
    },

    main: {
        flex: 1,
        padding: "35px",
        minWidth: 0
    },

    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "35px"
    },

    adminBadge: {
        background: "#e6eaff",
        color: "#3949ab",
        padding: "10px 16px",
        borderRadius: "20px",
        fontSize: "13px"
    },

    cards: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px"
    },

    card: {
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
    },

    section: {
        background: "white",
        padding: "25px",
        borderRadius: "12px",
        marginTop: "30px"
    },

    salesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "20px"
    },

    salesCard: {
        background: "#f5f6fa",
        padding: "20px",
        borderRadius: "10px"
    },

    tableWrapper: {
        overflowX: "auto"
    },

    table: {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left"
    },

    empty: {
        textAlign: "center",
        padding: "30px",
        color: "#777"
    },

    note: {
        color: "#888",
        fontSize: "13px",
        marginTop: "15px"
    }
};

export default AdminDashboard;
