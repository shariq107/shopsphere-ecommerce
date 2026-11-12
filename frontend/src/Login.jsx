import { API_URL } from "./config";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData({
            ...formData,
            [name]: value
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Keep user details for display only.
                // The backend session cookie handles authentication.
                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(data.user)
                );

                setMessage("Login successful!");

                setTimeout(() => {
                    navigate("/");
                }, 1000);
            } else {
                setMessage(data.message || "Login failed.");
            }
        } catch (error) {
            setMessage("Unable to connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <Link to="/" className="auth-logo">ShopSphere.</Link>

                <p className="auth-eyebrow">WELCOME BACK</p>
                <h1>Login to your account</h1>
                <p className="auth-description">
                    Enter your details to continue shopping.
                </p>

                <form onSubmit={handleSubmit}>
                    <label>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Logging in..." : "Login →"}
                    </button>
                </form>

                {message && <p className="auth-message">{message}</p>}

                <p className="auth-switch">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
