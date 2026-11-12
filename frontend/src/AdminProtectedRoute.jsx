
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

function AdminProtectedRoute() {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/admin/me",
                    {
                        method: "GET",
                        credentials: "include"
                    }
                );

                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (err) {
                setError("Unable to connect to the server.");
            }
        };

        checkAdmin();
    }, []);

    if (error) {
        return <p>{error}</p>;
    }

    if (isAuthenticated === null) {
        return <p>Checking admin access...</p>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin" replace />;
    }

    return <Outlet />;
}

export default AdminProtectedRoute;
