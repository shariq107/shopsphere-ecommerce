import { API_URL } from "./config";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerProfile.css";
function CustomerProfile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;

        async function loadProfile() {
            try {
                const response = await fetch(
                    `${API_URL}/api/customer/me`,
                    { credentials: "include" }
                );

                if (!response.ok) {
                    localStorage.removeItem("loggedInUser");
                    if (isMounted) navigate("/login");
                    return;
                }

                const data = await response.json();
                const currentUser = data.user;

                if (isMounted) {
                    setUser(currentUser);
                    setName(currentUser.name);
                    setEmail(currentUser.email);

                    localStorage.setItem(
                        "loggedInUser",
                        JSON.stringify(currentUser)
                    );
                }
            } catch {
                if (isMounted) {
                    setMessage("Unable to connect to the server. Please try again.");
                }
            }
        }

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    const handleSave = async event => {
        event.preventDefault();

        if (!user || saving) return;

        setSaving(true);
        setMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/profile/${user.id}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Unable to update profile.");
                return;
            }

            const updatedUser = {
                ...user,
                name: data.user.name,
                email: data.user.email
            };

            localStorage.setItem(
                "loggedInUser",
                JSON.stringify(updatedUser)
            );

            setUser(updatedUser);
            setName(updatedUser.name);
            setEmail(updatedUser.email);
            setEditing(false);
            setMessage("Profile updated successfully!");

        } catch {
            setMessage("Unable to connect to the server. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const cancelEditing = () => {
        setEditing(false);
        setName(user.name);
        setEmail(user.email);
        setMessage("");
    };

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/api/customer/logout`, {
                method: "POST",
                credentials: "include"
            });
        } catch (error) {
            console.error("Logout request failed:", error);
        } finally {
            localStorage.removeItem("loggedInUser");
            navigate("/login");
        }
    };

    if (!user) {
        return (
            <main className="profile-page">
                <div className="profile-loading">
                    <span className="profile-brand-mark">S</span>
                    <p>{message || "Loading your profile..."}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="profile-page">

            <header className="profile-topbar">
                <button
                    className="profile-brand"
                    onClick={() => navigate("/")}
                >
                    <span className="profile-brand-mark">S</span>
                    <span>
                        ShopSphere<span className="profile-brand-dot">.</span>
                    </span>
                </button>

                <button
                    className="profile-back-link"
                    onClick={() => navigate("/")}
                >
                    ← Back to shop
                </button>
            </header>

            <section className="profile-content">

                <div className="profile-heading">
                    <span className="profile-eyebrow">YOUR ACCOUNT</span>

                    <h1>
                        My <em>Profile.</em>
                    </h1>

                    <p>
                        Manage your personal information and shopping activity.
                    </p>
                </div>

                {message && (
                    <div
                        className={`profile-message ${
                            message.includes("successfully")
                                ? "success"
                                : "error"
                        }`}
                        role="status"
                    >
                        {message}
                    </div>
                )}

                <div className="profile-layout">

                    <aside className="profile-sidebar">

                        <div className="profile-avatar">
                            {(user.name || "C").trim().charAt(0).toUpperCase()}
                        </div>

                        <h2>{user.name}</h2>
                        <p>{user.email}</p>

                        <span className="profile-customer-id">
                            CUSTOMER ID · {user.id}
                        </span>

                        <div className="profile-side-links">

                            <button
                                className="active"
                                onClick={() => navigate("/profile")}
                            >
                                ♙ <span>My Profile</span>
                            </button>

                            <button onClick={() => navigate("/orders")}>
                                ▤ <span>My Orders</span>
                            </button>

                            <button onClick={() => navigate("/addresses")}>
                                ⌖ <span>My Addresses</span>
                            </button>

                            <button onClick={() => navigate("/wishlist")}>
                                ♡ <span>My Wishlist</span>
                            </button>

                            <button onClick={() => navigate("/reviews")}>
                                ☆ <span>My Reviews</span>
                            </button>

                        </div>

                        <button
                            className="profile-logout"
                            onClick={handleLogout}
                        >
                            Log out ↗
                        </button>

                    </aside>

                    <section className="profile-card">

                        <div className="profile-card-heading">

                            <div>
                                <span className="profile-eyebrow">
                                    PERSONAL DETAILS
                                </span>

                                <h2>
                                    {editing
                                        ? "Edit your details"
                                        : "Account information"}
                                </h2>
                            </div>

                            {!editing && (
                                <button
                                    className="profile-edit-button"
                                    onClick={() => {
                                        setMessage("");
                                        setEditing(true);
                                    }}
                                >
                                    Edit profile <span>↗</span>
                                </button>
                            )}

                        </div>

                        {editing ? (

                            <form
                                className="profile-form"
                                onSubmit={handleSave}
                            >

                                <label>
                                    Full name

                                    <input
                                        type="text"
                                        value={name}
                                        onChange={event =>
                                            setName(event.target.value)
                                        }
                                        placeholder="Enter your name"
                                        required
                                    />
                                </label>

                                <label>
                                    Email address

                                    <input
                                        type="email"
                                        value={email}
                                        onChange={event =>
                                            setEmail(event.target.value)
                                        }
                                        placeholder="Enter your email"
                                        required
                                    />
                                </label>

                                <div className="profile-form-actions">

                                    <button
                                        className="profile-save-button"
                                        type="submit"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? "Saving..."
                                            : "Save changes"}
                                    </button>

                                    <button
                                        className="profile-cancel-button"
                                        type="button"
                                        onClick={cancelEditing}
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </form>

                        ) : (

                            <div className="profile-details-grid">

                                <div className="profile-detail-item">
                                    <span>FULL NAME</span>
                                    <strong>{user.name}</strong>
                                </div>

                                <div className="profile-detail-item">
                                    <span>EMAIL ADDRESS</span>
                                    <strong>{user.email}</strong>
                                </div>

                                <div className="profile-detail-item">
                                    <span>CUSTOMER ID</span>
                                    <strong>#{user.id}</strong>
                                </div>

                                <div className="profile-detail-item">
                                    <span>ACCOUNT TYPE</span>
                                    <strong>Customer</strong>
                                </div>

                            </div>
                        )}

                    </section>

                </div>
            </section>

            <footer className="profile-footer">
                <span>© 2026 ShopSphere</span>
                <span>Good products. Unexpected discoveries.</span>
            </footer>

        </main>
    );
}

export default CustomerProfile;
