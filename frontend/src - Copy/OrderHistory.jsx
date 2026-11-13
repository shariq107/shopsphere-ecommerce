import { API_URL } from "./config";

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./OrderHistory.css";
function OrderHistory() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [message, setMessage] = useState("");
    const [cancellingOrderId, setCancellingOrderId] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function loadOrders() {
            try {
                const sessionResponse = await fetch(
                    `${API_URL}/api/customer/me`,
                    { credentials: "include" }
                );

                if (!sessionResponse.ok) {
                    localStorage.removeItem("loggedInUser");
                    if (isMounted) navigate("/login");
                    return;
                }

                const sessionData = await sessionResponse.json();
                const customer = sessionData.user;

                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(customer)
                );

                const response = await fetch(
                    `${API_URL}/api/customer/orders/${customer.id}`,
                    { credentials: "include" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Unable to load your orders."
                    );
                }

                if (isMounted) {
                    setOrders(
                        Array.isArray(data) ? data : data.orders || []
                    );
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(
                        error.message || "Unable to connect to the server."
                    );
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        loadOrders();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    const formatPrice = (price) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(price) || 0);

    const getOrderId = (order) =>
        order.orderId || order.order_id || order.id || null;

    const getOrderDate = (order) => {
        const date =
            order.date ||
            order.createdAt ||
            order.created_at ||
            order.orderDate ||
            order.order_date;

        if (!date) return "Date unavailable";

        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) return date;

        return parsedDate.toLocaleString("en-IN");
    };

    const getItems = (order) =>
        Array.isArray(order.items) ? order.items : [];

    const getOrderTotal = (order) => {
        if (order.total !== undefined && order.total !== null) {
            return Number(order.total) || 0;
        }

        if (order.total_amount !== undefined) {
            return Number(order.total_amount) || 0;
        }

        return getItems(order).reduce((sum, item) => {
            return sum +
                (Number(item.price) || 0) *
                (Number(item.quantity) || 0);
        }, 0);
    };

    const getOrderStatus = (order) =>
        order.status ||
        order.orderStatus ||
        order.order_status ||
        "Placed";

    const handleCancelOrder = async (order) => {
        const orderId = getOrderId(order);

        if (!orderId) {
            setErrorMessage("Order ID is unavailable.");
            return;
        }

        if (!window.confirm("Are you sure you want to cancel this order?")) {
            return;
        }

        setCancellingOrderId(orderId);
        setErrorMessage("");
        setMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/customer/orders/${orderId}/cancel`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to cancel this order."
                );
            }

            setOrders(previousOrders =>
                previousOrders.map(existingOrder =>
                    String(getOrderId(existingOrder)) === String(orderId)
                        ? {
                            ...existingOrder,
                            status: data.order?.status || "Cancelled",
                            orderStatus: data.order?.status || "Cancelled",
                            order_status: data.order?.status || "Cancelled"
                        }
                        : existingOrder
                )
            );

            setMessage(
                data.message || "Order cancelled successfully."
            );
        } catch (error) {
            setErrorMessage(
                error.message || "Unable to cancel this order."
            );
        } finally {
            setCancellingOrderId(null);
        }
    };

    return (
        <div className="order-history-page">

            {/* Header */}
            <header className="history-header">

                <Link to="/" className="history-logo">
                    <span className="logo-mark">S</span>
                    ShopSphere<span className="logo-dot">.</span>
                </Link>

                <div className="history-header-links">

                    <Link to="/profile" className="back-to-profile">
                        ← Back to Profile
                    </Link>

                    <Link to="/" className="back-to-shop">
                        Back to Shopping ↗
                    </Link>

                </div>

            </header>

            {/* Introduction */}
            <section className="history-intro">

                <span className="eyebrow">
                    YOUR SHOPPING JOURNEY ✳
                </span>

                <h1>
                    Order <em>history.</em>
                </h1>

                <p>
                    All your ShopSphere purchases, together in one place.
                </p>

            </section>

            {/* Main Content */}
            <main className="history-content">

                {loading ? (

                    <div className="history-loading">
                        Loading your orders...
                    </div>

                ) : (

                    <>

                        {/* Success Message */}
                        {message && (
                            <p
                                className="history-message success-message"
                                role="status"
                            >
                                {message}
                            </p>
                        )}

                        {/* Error Message */}
                        {errorMessage && (
                            <p
                                className="history-message error-message"
                                role="alert"
                            >
                                {errorMessage}
                            </p>
                        )}

                        {/* Order Count */}
                        <div className="history-count">

                            <strong>{orders.length}</strong>

                            <span>
                                {orders.length === 1
                                    ? "TOTAL ORDER"
                                    : "TOTAL ORDERS"}
                            </span>

                        </div>

                        {/* Empty Orders */}
                        {orders.length === 0 ? (

                            <div className="no-orders">

                                <div className="no-orders-icon">
                                    ♡
                                </div>

                                <h2>No orders yet.</h2>

                                <p>
                                    Your future favourite finds will appear here.
                                </p>

                                <Link
                                    to="/"
                                    className="shop-now-button"
                                >
                                    Start Shopping ↗
                                </Link>

                            </div>

                        ) : (

                            /* Order List */
                            <div className="history-orders">

                                {orders.map((order, index) => {

                                    const orderId = getOrderId(order);
                                    const items = getItems(order);
                                    const total = getOrderTotal(order);
                                    const status = getOrderStatus(order);

                                    const normalizedStatus =
                                        String(status).toLowerCase();

                                    const canCancel = ![
                                        "cancelled",
                                        "delivered",
                                        "shipped"
                                    ].includes(normalizedStatus);

                                    return (

                                        <article
                                            className="history-order-card"
                                            key={
                                                orderId ||
                                                `legacy-order-${index}`
                                            }
                                        >

                                            {/* Order Header */}
                                            <div className="history-order-header">

                                                <div>

                                                    <span className="order-label">
                                                        ORDER ID
                                                    </span>

                                                    <strong>
                                                        {orderId
                                                            ? String(orderId)
                                                            : "Not available"}
                                                    </strong>

                                                </div>

                                                <span
                                                    className={`order-status status-${normalizedStatus}`}
                                                >
                                                    {status}
                                                </span>

                                            </div>

                                            {/* Order Information */}
                                            <div className="history-order-info">

                                                <div>

                                                    <span>Order Date</span>

                                                    <strong>
                                                        {getOrderDate(order)}
                                                    </strong>

                                                </div>

                                                <div>

                                                    <span>Payment Method</span>

                                                    <strong>
                                                        {order.paymentMethod ||
                                                            order.payment_method ||
                                                            "Not available"}
                                                    </strong>

                                                </div>

                                                <div>

                                                    <span>Payment Status</span>

                                                    <strong>
                                                        {order.paymentStatus ||
                                                            order.payment_status ||
                                                            "Not available"}
                                                    </strong>

                                                </div>

                                            </div>

                                            {/* Purchased Products */}
                                            <div className="history-products">

                                                <h3>Purchased Products</h3>

                                                {items.length > 0 ? (

                                                    items.map((item, itemIndex) => (

                                                        <div
                                                            className="history-product"
                                                            key={
                                                                item.id ||
                                                                item.product_id ||
                                                                itemIndex
                                                            }
                                                        >

                                                            <div>

                                                                <strong>
                                                                    {item.name ||
                                                                        item.product_name ||
                                                                        "Product"}
                                                                </strong>

                                                                <span>
                                                                    Quantity:{" "}
                                                                    {Number(item.quantity) || 1}
                                                                </span>

                                                            </div>

                                                            <strong>
                                                                {formatPrice(
                                                                    (Number(item.price) || 0) *
                                                                    (Number(item.quantity) || 1)
                                                                )}
                                                            </strong>

                                                        </div>

                                                    ))

                                                ) : (

                                                    <p>
                                                        No product details available.
                                                    </p>

                                                )}

                                            </div>

                                            {/* Order Total */}
                                            <div className="history-total">

                                                <span>Order Total</span>

                                                <strong>
                                                    {formatPrice(total)}
                                                </strong>

                                            </div>

                                            {/* Cancel Order */}
                                            {canCancel && orderId && (

                                                <button
                                                    type="button"
                                                    className="cancel-order-button"
                                                    onClick={() =>
                                                        handleCancelOrder(order)
                                                    }
                                                    disabled={
                                                        cancellingOrderId === orderId
                                                    }
                                                >

                                                    {cancellingOrderId === orderId
                                                        ? "Cancelling..."
                                                        : "Cancel Order"}

                                                </button>

                                            )}

                                        </article>

                                    );

                                })}

                            </div>

                        )}

                    </>

                )}

            </main>

            {/* Footer */}
            <footer className="history-footer">

                © 2026 ShopSphere · Good products. Great discoveries.

            </footer>

        </div>
    );
}

export default OrderHistory;
