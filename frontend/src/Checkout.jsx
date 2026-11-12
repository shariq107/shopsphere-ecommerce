import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Checkout.css";

const API_URL = "http://localhost:5000";

function Checkout() {
    const navigate = useNavigate();

    const [cartItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("shopSphereCart")) || [];
        } catch {
            return [];
        }
    });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        pincode: ""
    });

    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponMessage, setCouponMessage] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const subtotal = cartItems.reduce(
        (total, item) => total + Number(item.price) * Number(item.quantity),
        0
    );

    const delivery = subtotal >= 999 ? 0 : 49;
    const discount = appliedCoupon?.discount || 0;
    const total = Math.max(0, subtotal + delivery - discount);

    const formatPrice = price =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(price);

    const handleChange = event => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handlePaymentMethodChange = event => {
        setPaymentMethod(event.target.value);
        setPaymentConfirmed(false);
        setErrorMessage("");
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) {
            setCouponMessage("Please enter a coupon code.");
            return;
        }

        setCouponLoading(true);
        setCouponMessage("");

        try {
            const response = await fetch(`${API_URL}/api/coupons/validate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    code: couponInput.trim(),
                    subtotal
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to apply coupon");
            }

            setAppliedCoupon(data.coupon);
            setCouponInput(data.coupon.code);
            setCouponMessage(data.message);
        } catch (error) {
            setAppliedCoupon(null);
            setCouponMessage(error.message);
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput("");
        setCouponMessage("Coupon removed.");
    };

    const handlePlaceOrder = async event => {
        event.preventDefault();
        setErrorMessage("");

        if (cartItems.length === 0) {
            setErrorMessage("Your shopping bag is empty.");
            return;
        }

        if (paymentMethod !== "COD" && !paymentConfirmed) {
            setErrorMessage("Please confirm the demo payment before placing your order.");
            return;
        }

        setLoading(true);

        try {
            let loggedInUser = null;

            try {
                loggedInUser = JSON.parse(
                    localStorage.getItem("loggedInUser")
                );
            } catch {
                loggedInUser = null;
            }

            const response = await fetch(`${API_URL}/api/orders`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    customer: formData,
                    customerId: loggedInUser?.id || null,
                    items: cartItems.map(item => ({
                        id: item.id,
                        quantity: item.quantity
                    })),
                    paymentMethod,
                    couponCode: appliedCoupon?.code || ""
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to place order");
            }

            const order = data.order;

            // Keep existing customer order history compatible.
            let previousOrders = [];

            try {
                previousOrders = JSON.parse(
                    localStorage.getItem("shopSphereOrders") || "[]"
                );
                if (!Array.isArray(previousOrders)) {
                    previousOrders = [];
                }
            } catch {
                previousOrders = [];
            }

            localStorage.setItem(
                "shopSphereOrders",
                JSON.stringify([order, ...previousOrders])
            );

            localStorage.removeItem("shopSphereCart");

            navigate("/order-success", {
                state: { order }
            });

        } catch (error) {
            setErrorMessage(error.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="checkout-page">
                <div className="empty-checkout">
                    <h2>Your shopping bag is empty.</h2>
                    <p>Add some products before checking out.</p>
                    <Link to="/">Continue Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">

            <header className="checkout-header">
                <Link to="/" className="checkout-logo">
                    <span className="logo-mark">S</span>
                    ShopSphere<span className="logo-dot">.</span>
                </Link>

                <span className="checkout-step">
                    YOUR BAG / CHECKOUT
                </span>
            </header>

            <div className="checkout-intro">
                <span className="eyebrow">ALMOST THERE ✳</span>
                <h1>Complete your <em>order.</em></h1>
                <p>Just a few details before your finds reach you.</p>
            </div>

            <form onSubmit={handlePlaceOrder}>
                <div className="checkout-layout">

                    <div className="checkout-left">

                        {/* DELIVERY INFORMATION */}
                        <section className="checkout-card">
                            <div className="checkout-section-heading">
                                <span>01</span>
                                <div>
                                    <h2>Delivery information</h2>
                                    <p>Where should we send your order?</p>
                                </div>
                            </div>

                            <div className="checkout-fields">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        autoComplete="name"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            autoComplete="email"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            placeholder="10-digit mobile number"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            pattern="[0-9]{10}"
                                            maxLength="10"
                                            autoComplete="tel"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Delivery Address</label>
                                    <textarea
                                        name="address"
                                        placeholder="House number, street, area"
                                        value={formData.address}
                                        onChange={handleChange}
                                        rows="3"
                                        autoComplete="street-address"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            placeholder="Your city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            autoComplete="address-level2"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>PIN Code</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            placeholder="6-digit PIN"
                                            value={formData.pincode}
                                            onChange={handleChange}
                                            pattern="[0-9]{6}"
                                            maxLength="6"
                                            autoComplete="postal-code"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* PAYMENT METHOD */}
                        <section className="checkout-card payment-card">
                            <div className="checkout-section-heading">
                                <span>02</span>
                                <div>
                                    <h2>Payment method</h2>
                                    <p>Choose how you would like to pay.</p>
                                </div>
                            </div>

                            <div className="payment-options">
                                <label className={`payment-option ${paymentMethod === "UPI" ? "selected" : ""}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="UPI"
                                        checked={paymentMethod === "UPI"}
                                        onChange={handlePaymentMethodChange}
                                    />
                                    <span className="payment-icon">↗</span>
                                    <span className="payment-text">
                                        <strong>UPI</strong>
                                        <small>Simulated UPI payment</small>
                                    </span>
                                </label>

                                <label className={`payment-option ${paymentMethod === "Card" ? "selected" : ""}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="Card"
                                        checked={paymentMethod === "Card"}
                                        onChange={handlePaymentMethodChange}
                                    />
                                    <span className="payment-icon">▣</span>
                                    <span className="payment-text">
                                        <strong>Credit / Debit Card</strong>
                                        <small>Simulated card payment</small>
                                    </span>
                                </label>

                                <label className={`payment-option ${paymentMethod === "COD" ? "selected" : ""}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="COD"
                                        checked={paymentMethod === "COD"}
                                        onChange={handlePaymentMethodChange}
                                    />
                                    <span className="payment-icon">₹</span>
                                    <span className="payment-text">
                                        <strong>Cash on Delivery</strong>
                                        <small>Pay when your order arrives</small>
                                    </span>
                                </label>
                            </div>

                            {paymentMethod !== "COD" ? (
                                <div className="demo-payment-panel">
                                    <strong>
                                        {paymentMethod === "UPI"
                                            ? "Demo UPI payment"
                                            : "Demo card payment"}
                                    </strong>
                                    <p>
                                        This project uses a simulated payment flow.
                                        No UPI app, bank account or card will be charged.
                                        No real payment details are required.
                                    </p>

                                    <label className="demo-confirmation">
                                        <input
                                            type="checkbox"
                                            checked={paymentConfirmed}
                                            onChange={event => {
                                                setPaymentConfirmed(event.target.checked);
                                                setErrorMessage("");
                                            }}
                                        />
                                        <span>
                                            I understand this is a demo payment and want to continue.
                                        </span>
                                    </label>
                                </div>
                            ) : (
                                <div className="demo-payment-panel">
                                    <strong>Cash on Delivery selected</strong>
                                    <p>
                                        You will pay the delivery amount when your order arrives.
                                    </p>
                                </div>
                            )}

                            <p className="demo-note">
                                ✳ Demo checkout only. No real payment is processed.
                            </p>
                        </section>

                    </div>

                    {/* ORDER SUMMARY */}
                    <aside className="checkout-summary">
                        <span className="eyebrow">YOUR SELECTION</span>
                        <h2>Order summary<span>.</span></h2>

                        <div className="checkout-items">
                            {cartItems.map(item => (
                                <div className="checkout-item" key={item.id}>
                                    <div className="checkout-item-info">
                                        <strong>{item.name}</strong>
                                        <small>Quantity: {item.quantity}</small>
                                    </div>

                                    <strong>
                                        {formatPrice(item.price * item.quantity)}
                                    </strong>
                                </div>
                            ))}
                        </div>

                        <div className="coupon-section" style={{
                            margin: "22px 0",
                            padding: "16px",
                            border: "1px solid #e5e1dc",
                            borderRadius: "12px"
                        }}>
                            <strong style={{ display: "block", marginBottom: "10px" }}>
                                Have a coupon?
                            </strong>

                            <div style={{ display: "flex", gap: "8px" }}>
                                <input
                                    type="text"
                                    value={couponInput}
                                    onChange={event => {
                                        setCouponInput(event.target.value.toUpperCase());
                                        setCouponMessage("");
                                        if (appliedCoupon) {
                                            setAppliedCoupon(null);
                                        }
                                    }}
                                    placeholder="Enter coupon code"
                                    aria-label="Coupon code"
                                    style={{
                                        minWidth: 0,
                                        flex: 1,
                                        padding: "11px",
                                        border: "1px solid #d8d3cd",
                                        borderRadius: "8px",
                                        textTransform: "uppercase"
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyCoupon}
                                    disabled={couponLoading}
                                    style={{
                                        padding: "0 14px",
                                        border: 0,
                                        borderRadius: "8px",
                                        cursor: couponLoading ? "wait" : "pointer"
                                    }}
                                >
                                    {couponLoading ? "Applying..." : "Apply"}
                                </button>
                            </div>

                            {couponMessage && (
                                <p style={{
                                    margin: "9px 0 0",
                                    fontSize: "13px",
                                    color: appliedCoupon ? "#247447" : "#c62828"
                                }}>
                                    {couponMessage}
                                </p>
                            )}

                            {appliedCoupon && (
                                <button
                                    type="button"
                                    onClick={handleRemoveCoupon}
                                    style={{
                                        marginTop: "8px",
                                        padding: 0,
                                        border: 0,
                                        background: "transparent",
                                        textDecoration: "underline",
                                        cursor: "pointer"
                                    }}
                                >
                                    Remove coupon
                                </button>
                            )}

                            <small style={{ display: "block", marginTop: "10px", color: "#777" }}>
                                Try WELCOME10 or FLAT100 on eligible orders.
                            </small>
                        </div>

                        <div className="checkout-price-row">
                            <span>Subtotal</span>
                            <strong>{formatPrice(subtotal)}</strong>
                        </div>

                        <div className="checkout-price-row">
                            <span>Delivery</span>
                            <strong>
                                {delivery === 0 ? "FREE" : formatPrice(delivery)}
                            </strong>
                        </div>

                        {appliedCoupon && (
                            <div className="checkout-price-row">
                                <span>Coupon discount ({appliedCoupon.code})</span>
                                <strong>-{formatPrice(discount)}</strong>
                            </div>
                        )}

                        <div className="checkout-total">
                            <span>Total</span>
                            <strong>{formatPrice(total)}</strong>
                        </div>

                        <div className="checkout-payment-summary">
                            <span>Payment method</span>
                            <strong>
                                {paymentMethod === "Card"
                                    ? "Credit / Debit Card"
                                    : paymentMethod === "COD"
                                        ? "Cash on Delivery"
                                        : "UPI"}
                            </strong>
                        </div>

                        {errorMessage && (
                            <p style={{
                                color: "#c62828",
                                fontSize: "14px",
                                marginBottom: "12px"
                            }}>
                                {errorMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="place-order-button"
                            disabled={loading || (paymentMethod !== "COD" && !paymentConfirmed)}
                        >
                            {loading
                                ? "Processing Order..."
                                : paymentMethod === "COD"
                                    ? "Place Order"
                                    : "Confirm Demo Payment & Place Order"}
                            {!loading && <span> ↗</span>}
                        </button>

                        <Link to="/" className="continue-shopping">
                            ← Continue shopping
                        </Link>

                        <div className="checkout-security">
                            <span>✳</span>
                            <p>Safe demo checkout · No real payment</p>
                        </div>
                    </aside>

                </div>
            </form>

            <footer className="checkout-footer">
                © 2026 ShopSphere · Good products. Great discoveries.
            </footer>

        </div>
    );
}

export default Checkout;
