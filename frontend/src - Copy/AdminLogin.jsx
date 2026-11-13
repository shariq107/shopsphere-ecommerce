import { API_URL } from "./config";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (event) => {
        event.preventDefault();

        setMessage("");
        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/admin/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                setMessage("Login successful!");

                // Save admin details
                localStorage.setItem(
                    "loggedInAdmin",
                    JSON.stringify(data.admin)
                );

                navigate("/admin/dashboard");
            } else {
                setMessage(data.message || "Login failed.");
            }
        } catch (error) {
            setMessage("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <form onSubmit={handleLogin} style={styles.form}>
                <h1>ShopSphere</h1>
                <h2>Admin Login</h2>

                <input
                    type="email"
                    placeholder="Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={styles.input}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={styles.input}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={styles.button}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

                {message && (
                    <p style={styles.message}>{message}</p>
                )}
            </form>
        </div>
    );
}

const styles = {
    container: {
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f4f4"
    },
    form: {
        width: "350px",
        padding: "35px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
        textAlign: "center"
    },
    input: {
        width: "100%",
        padding: "12px",
        margin: "10px 0",
        boxSizing: "border-box",
        border: "1px solid #ccc",
        borderRadius: "6px"
    },
    button: {
        width: "100%",
        padding: "12px",
        marginTop: "15px",
        background: "#222",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
    },
    message: {
        marginTop: "15px",
        color: "#333"
    }
};

export default AdminLogin;
