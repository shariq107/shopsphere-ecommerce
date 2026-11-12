import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

function AdminLayout() {
    const navigate = useNavigate();

    const menuItems = [
        { name: "Dashboard", path: "/admin/dashboard", icon: "▦" },
        { name: "Categories", path: "/admin/categories", icon: "▤" },
        { name: "Products", path: "/admin/products", icon: "□" },
        { name: "Inventory", path: "/admin/inventory", icon: "▣" },
        { name: "Orders", path: "/admin/orders", icon: "▧" },
        { name: "Customers", path: "/admin/customers", icon: "♙" },
        { name: "Reports", path: "/admin/reports", icon: "▥" }
    ];

    const handleLogout = async () => {
        try {
            await fetch("http://localhost:5000/api/admin/logout", {
                method: "POST",
                credentials: "include"
            });
        } catch (error) {
            console.error("Admin logout failed:", error);
        } finally {
            localStorage.removeItem("loggedInAdmin");
            navigate("/admin", { replace: true });
        }
    };

    return (
        <div className="admin-layout">
            <aside className="admin-layout-sidebar">
                <div className="admin-layout-brand">ShopSphere</div>
                <div className="admin-layout-caption">ADMINISTRATION</div>

                <nav className="admin-layout-nav">
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `admin-layout-link${isActive ? " active" : ""}`
                            }
                        >
                            <span className="admin-layout-icon">{item.icon}</span>
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <button className="admin-layout-logout" onClick={handleLogout}>
                    <span>↪</span> Logout
                </button>
            </aside>

            <main className="admin-layout-content">
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;
