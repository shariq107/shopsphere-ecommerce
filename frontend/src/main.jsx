import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import Register from "./Register";
import Login from "./Login";
import Checkout from "./Checkout";
import OrderSuccess from "./OrderSuccess";
import OrderHistory from "./OrderHistory";
import CustomerProfile from "./CustomerProfile";
import CustomerAddresses from "./CustomerAddresses";
import CustomerWishlist from "./CustomerWishlist";
import CustomerReviews from "./CustomerReviews";

import AdminLogin from "./AdminLogin";
import AdminProtectedRoute from "./AdminProtectedRoute";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminCategories from "./AdminCategories";
import AdminProducts from "./AdminProducts";
import AdminInventory from "./AdminInventory";
import AdminOrders from "./AdminOrders";
import AdminCustomers from "./AdminCustomers";
import Reports from "./Reports";

function Main() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/profile" element={<CustomerProfile />} />
                <Route path="/addresses" element={<CustomerAddresses />} />
                <Route path="/wishlist" element={<CustomerWishlist />} />
                <Route path="/reviews" element={<CustomerReviews />} />

                <Route path="/admin" element={<AdminLogin />} />

                <Route element={<AdminProtectedRoute />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />

                    <Route element={<AdminLayout />}>
                        <Route path="/admin/categories" element={<AdminCategories />} />
                        <Route path="/admin/products" element={<AdminProducts />} />
                        <Route path="/admin/inventory" element={<AdminInventory />} />
                        <Route path="/admin/orders" element={<AdminOrders />} />
                        <Route path="/admin/customers" element={<AdminCustomers />} />
                        <Route path="/admin/reports" element={<Reports />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <Main />
    </React.StrictMode>
);
