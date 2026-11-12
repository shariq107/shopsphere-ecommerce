import { API_URL } from "./config";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerAddresses.css";
const emptyForm = {
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
};

function CustomerAddresses() {
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        async function verifyCustomerSession() {
            try {
                const response = await fetch(
                    `${API_URL}/api/customer/me`,
                    { credentials: "include" }
                );

                if (!response.ok) {
                    localStorage.removeItem("loggedInUser");
                    navigate("/login");
                    return;
                }

                const data = await response.json();
                const currentCustomer = data.user;

                setCustomer(currentCustomer);

                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(currentCustomer)
                );

                await fetchAddresses(currentCustomer.id);

            } catch {
                setError("Unable to connect to the server. Please try again.");
                setLoading(false);
            }
        }

        verifyCustomerSession();
    }, [navigate]);

    async function fetchAddresses(customerId) {
        try {
            const response = await fetch(
                `${API_URL}/api/addresses/${customerId}`,
                { credentials: "include" }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load addresses");
            }

            setAddresses(data);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setFormData(previous => ({
            ...previous,
            [name]: value
        }));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!customer || saving) return;

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch(`${API_URL}/api/addresses`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    customerId: customer.id,
                    ...formData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to save address");
            }

            setAddresses(previous => [data.address, ...previous]);
            setFormData(emptyForm);
            setShowForm(false);
            setMessage("Delivery address added successfully.");

        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(addressId) {
        if (!window.confirm("Are you sure you want to delete this address?")) {
            return;
        }

        setError("");
        setMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/addresses/${addressId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        customerId: customer.id
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete address");
            }

            setAddresses(previous =>
                previous.filter(address => address.id !== addressId)
            );

            setMessage("Address deleted successfully.");

        } catch (error) {
            setError(error.message);
        }
    }

    if (loading) {
        return (
            <main className="addresses-page">
                <div className="addresses-loading">
                    Loading your addresses...
                </div>
            </main>
        );
    }

    return (
        <main className="addresses-page">

            <header className="addresses-topbar">
                <button
                    className="addresses-brand"
                    onClick={() => navigate("/")}
                >
                    <span className="addresses-brand-mark">S</span>
                    <span>
                        ShopSphere<span className="addresses-brand-dot">.</span>
                    </span>
                </button>

                <button
                    className="addresses-back-top"
                    onClick={() => navigate("/profile")}
                >
                    ← Back to Profile
                </button>
            </header>

            <section className="addresses-content">

                <div className="addresses-heading">
                    <span className="addresses-eyebrow">
                        YOUR ACCOUNT
                    </span>

                    <h1>
                        Delivery <em>addresses.</em>
                    </h1>

                    <p>
                        Manage the places where your favourite finds are delivered.
                    </p>
                </div>

                {message && (
                    <div className="addresses-message success" role="status">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="addresses-message error" role="alert">
                        {error}
                    </div>
                )}

                <div className="addresses-section-heading">
                    <div>
                        <h2>Saved addresses</h2>
                        <p>
                            {addresses.length} saved{" "}
                            {addresses.length === 1 ? "address" : "addresses"}
                        </p>
                    </div>

                    <button
                        className="addresses-add-button"
                        onClick={() => {
                            setShowForm(!showForm);
                            setError("");
                            setMessage("");
                        }}
                    >
                        {showForm ? "Close form" : "+ Add address"}
                    </button>
                </div>

                {showForm && (
                    <form
                        className="addresses-form-card"
                        onSubmit={handleSubmit}
                    >
                        <div className="addresses-form-heading">
                            <span className="addresses-eyebrow">
                                NEW DELIVERY LOCATION
                            </span>
                            <h2>Add a new address</h2>
                            <p>Enter your delivery details below.</p>
                        </div>

                        <div className="addresses-form-grid">

                            <label>
                                Full name
                                <input
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    required
                                />
                            </label>

                            <label>
                                Phone number
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="10-digit phone number"
                                    inputMode="numeric"
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    required
                                />
                            </label>

                            <label className="addresses-full-width">
                                Complete address
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="House number, street and area"
                                    required
                                />
                            </label>

                            <label>
                                City
                                <input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="Enter city"
                                    required
                                />
                            </label>

                            <label>
                                State
                                <input
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="Enter state"
                                    required
                                />
                            </label>

                            <label>
                                Pincode
                                <input
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    placeholder="6-digit pincode"
                                    inputMode="numeric"
                                    maxLength={6}
                                    pattern="[0-9]{6}"
                                    required
                                />
                            </label>

                        </div>

                        <div className="addresses-form-actions">
                            <button
                                type="submit"
                                className="addresses-save-button"
                                disabled={saving}
                            >
                                {saving ? "Saving..." : "Save address"}
                            </button>

                            <button
                                type="button"
                                className="addresses-cancel-button"
                                onClick={() => {
                                    setShowForm(false);
                                    setFormData(emptyForm);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {addresses.length === 0 ? (

                    <div className="addresses-empty">
                        <div className="addresses-empty-icon">⌖</div>
                        <h2>No addresses saved yet.</h2>
                        <p>
                            Add your first delivery address to make checkout easier.
                        </p>

                        {!showForm && (
                            <button
                                className="addresses-add-button"
                                onClick={() => setShowForm(true)}
                            >
                                Add your first address
                            </button>
                        )}
                    </div>

                ) : (

                    <div className="addresses-grid">
                        {addresses.map(address => (
                            <article
                                key={address.id}
                                className="addresses-card"
                            >
                                <div className="addresses-card-top">
                                    <span className="addresses-location-icon">
                                        ⌖
                                    </span>
                                    <span className="addresses-saved-label">
                                        SAVED ADDRESS
                                    </span>
                                </div>

                                <h3>{address.fullName}</h3>

                                <p>{address.address}</p>

                                <p>
                                    {address.city}, {address.state} - {address.pincode}
                                </p>

                                <div className="addresses-phone">
                                    <span>PHONE</span>
                                    <strong>{address.phone}</strong>
                                </div>

                                <button
                                    className="addresses-delete-button"
                                    onClick={() => handleDelete(address.id)}
                                >
                                    Delete address
                                </button>
                            </article>
                        ))}
                    </div>
                )}

                <button
                    className="addresses-back-button"
                    onClick={() => navigate("/profile")}
                >
                    ← Back to Profile
                </button>

            </section>

            <footer className="addresses-footer">
                <span>© 2026 ShopSphere</span>
                <span>Good products. Unexpected discoveries.</span>
            </footer>

        </main>
    );
}

export default CustomerAddresses;
