import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

function Reports() {
    const [report, setReport] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const formatPrice = value =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(Number(value || 0));

    const loadReports = async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();

            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);

            const response = await fetch(
                `${API_URL}/api/admin/reports?${params.toString()}`,
                { credentials: "include" }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load reports");
            }

            setReport(data);
        } catch (err) {
            setError(err.message || "Unable to load reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const handleFilter = event => {
        event.preventDefault();

        if (startDate && endDate && startDate > endDate) {
            setError("Start date cannot be after end date.");
            return;
        }

        loadReports();
    };

    const cardStyle = {
        background: "#fff",
        border: "1px solid #e8e5e0",
        borderRadius: "14px",
        padding: "20px"
    };

    const headingStyle = {
        color: "#252525",
        fontSize: "18px",
        margin: "0 0 16px"
    };

    const tableStyle = {
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "left"
    };

    const cellStyle = {
        padding: "12px 10px",
        borderBottom: "1px solid #eee",
        fontSize: "14px"
    };

    if (loading && !report) {
        return <div style={{ padding: "28px" }}>Loading reports...</div>;
    }

    return (
        <div style={{
            padding: "28px",
            background: "#f7f6f3",
            minHeight: "100vh",
            color: "#292929"
        }}>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "24px"
            }}>
                <div>
                    <p style={{
                        margin: "0 0 6px",
                        color: "#8a8176",
                        fontSize: "12px",
                        letterSpacing: "2px"
                    }}>
                        SHOPSPHERE ADMINISTRATION
                    </p>
                    <h1 style={{ margin: 0, fontSize: "28px" }}>
                        Sales & Order Reports
                    </h1>
                    <p style={{ color: "#777", marginBottom: 0 }}>
                        Review sales performance and order activity.
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleFilter}
                style={{
                    ...cardStyle,
                    display: "flex",
                    alignItems: "end",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "20px"
                }}
            >
                <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
                    Start date
                    <input
                        type="date"
                        value={startDate}
                        onChange={event => setStartDate(event.target.value)}
                        style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "7px" }}
                    />
                </label>

                <label style={{ display: "grid", gap: "6px", fontSize: "13px" }}>
                    End date
                    <input
                        type="date"
                        value={endDate}
                        onChange={event => setEndDate(event.target.value)}
                        style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "7px" }}
                    />
                </label>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "11px 20px",
                        border: 0,
                        borderRadius: "7px",
                        background: "#252525",
                        color: "#fff",
                        cursor: "pointer"
                    }}
                >
                    {loading ? "Loading..." : "Apply filter"}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setStartDate("");
                        setEndDate("");
                        setTimeout(() => {
                            setLoading(true);
                            setError("");
                            fetch(`${API_URL}/api/admin/reports`, {
                                credentials: "include"
                            })
                                .then(async response => {
                                    const data = await response.json();
                                    if (!response.ok) {
                                        throw new Error(data.message || "Unable to load reports");
                                    }
                                    setReport(data);
                                })
                                .catch(err => setError(err.message))
                                .finally(() => setLoading(false));
                        }, 0);
                    }}
                    style={{
                        padding: "11px 16px",
                        border: "1px solid #ddd",
                        borderRadius: "7px",
                        background: "#fff",
                        cursor: "pointer"
                    }}
                >
                    Clear dates
                </button>
            </form>

            {error && (
                <p style={{ color: "#b42318", marginBottom: "18px" }}>
                    {error}
                </p>
            )}

            {report && (
                <>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "14px",
                        marginBottom: "20px"
                    }}>
                        {[
                            ["Net sales", formatPrice(report.summary.netSales)],
                            ["Total orders", report.summary.totalOrders],
                            ["Delivered orders", report.summary.deliveredOrders],
                            ["Active orders", report.summary.activeOrders],
                            ["Cancelled orders", report.summary.cancelledOrders]
                        ].map(([label, value]) => (
                            <div key={label} style={cardStyle}>
                                <p style={{ color: "#777", margin: "0 0 10px", fontSize: "13px" }}>
                                    {label}
                                </p>
                                <strong style={{ fontSize: "24px" }}>{value}</strong>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "18px",
                        marginBottom: "20px"
                    }}>
                        <section style={cardStyle}>
                            <h2 style={headingStyle}>Order status summary</h2>
                            {report.orderStatuses.length === 0 ? (
                                <p style={{ color: "#777" }}>No order data available.</p>
                            ) : report.orderStatuses.map(item => (
                                <div key={item.status} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "11px 0",
                                    borderBottom: "1px solid #eee"
                                }}>
                                    <span>{item.status}</span>
                                    <strong>{item.count}</strong>
                                </div>
                            ))}
                        </section>

                        <section style={cardStyle}>
                            <h2 style={headingStyle}>Top-selling products</h2>
                            {report.topProducts.length === 0 ? (
                                <p style={{ color: "#777" }}>No product sales available.</p>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={tableStyle}>
                                        <thead>
                                            <tr>
                                                <th style={cellStyle}>Product</th>
                                                <th style={cellStyle}>Qty sold</th>
                                                <th style={cellStyle}>Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.topProducts.map((item, index) => (
                                                <tr key={`${item.productName}-${index}`}>
                                                    <td style={cellStyle}>{item.productName}</td>
                                                    <td style={cellStyle}>{item.quantitySold}</td>
                                                    <td style={cellStyle}>{formatPrice(item.revenue)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>

                    <section style={{ ...cardStyle, marginBottom: "20px" }}>
                        <h2 style={headingStyle}>Daily sales</h2>
                        {report.dailySales.length === 0 ? (
                            <p style={{ color: "#777" }}>No sales data available for this period.</p>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={tableStyle}>
                                    <thead>
                                        <tr>
                                            <th style={cellStyle}>Date</th>
                                            <th style={cellStyle}>Orders</th>
                                            <th style={cellStyle}>Sales</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.dailySales.map(item => (
                                            <tr key={item.date}>
                                                <td style={cellStyle}>{item.date}</td>
                                                <td style={cellStyle}>{item.orders}</td>
                                                <td style={cellStyle}>{formatPrice(item.sales)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section style={cardStyle}>
                        <h2 style={headingStyle}>Recent orders</h2>
                        {report.recentOrders.length === 0 ? (
                            <p style={{ color: "#777" }}>No orders available.</p>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={tableStyle}>
                                    <thead>
                                        <tr>
                                            <th style={cellStyle}>Order number</th>
                                            <th style={cellStyle}>Customer</th>
                                            <th style={cellStyle}>Amount</th>
                                            <th style={cellStyle}>Status</th>
                                            <th style={cellStyle}>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.recentOrders.map(order => (
                                            <tr key={order.id}>
                                                <td style={cellStyle}>{order.orderNumber}</td>
                                                <td style={cellStyle}>{order.customerName}</td>
                                                <td style={cellStyle}>{formatPrice(order.total)}</td>
                                                <td style={cellStyle}>{order.orderStatus}</td>
                                                <td style={cellStyle}>{order.createdAt}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default Reports;
