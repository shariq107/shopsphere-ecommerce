
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./OrderSuccess.css";

function OrderSuccess() {
    const location = useLocation();

    const savedOrders = JSON.parse(
        localStorage.getItem("shopSphereOrders") || "[]"
    );

    const order = location.state?.order || savedOrders[0];

    if (!order) {
        return (
            <div className="success-page">
                <h2>No order found</h2>
                <Link to="/">Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div className="success-page">
            <div className="success-card">
                <div className="success-icon">✓</div>

                <h1>Order Placed Successfully!</h1>

                <p className="success-message">
                    Thank you for shopping with ShopSphere.
                    Your order has been received.
                </p>

                <div className="order-number">
                    Order ID: <strong>{order.orderId}</strong>
                </div>

                <div className="success-details">
                    <h3>Order Summary</h3>

                    {order.items.map((item) => (
                        <div className="success-item" key={item.id}>
                            <span>
                                {item.name} × {item.quantity}
                            </span>
                            <span>
                                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                        </div>
                    ))}

                    <div className="success-total">
                        <strong>Total Paid / Payable</strong>
                        <strong>
                            ₹{order.total.toLocaleString("en-IN")}
                        </strong>
                    </div>

                    <p>
                        Payment Method: {order.paymentMethod}
                    </p>

                    <p>
                        Payment Status: {order.paymentStatus}
                    </p>
                </div>

                <Link to="/" className="continue-shopping">
                    Continue Shopping →
                </Link>
            </div>
        </div>
    );
}

export default OrderSuccess;
