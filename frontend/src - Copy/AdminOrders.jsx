import { API_URL } from "./config";
import { useEffect, useState } from "react";
const ORDER_STATUSES = [
  "Placed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled"
];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState({});

  async function fetchOrders() {
    try {
      const response = await fetch(`${API_URL}/api/admin/orders`, {
        credentials: "include"
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/admin";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load orders");
      }

      setOrders(data);

      const statusValues = {};
      data.forEach((order) => {
        statusValues[order.id] = order.orderStatus;
      });

      setSelectedStatuses(statusValues);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  function handleStatusChange(orderId, newStatus) {
    setSelectedStatuses((previous) => ({
      ...previous,
      [orderId]: newStatus
    }));
  }

  async function updateStatus(orderId) {
    const newStatus = selectedStatuses[orderId];

    if (!newStatus) {
      setMessage("Please select an order status.");
      return;
    }

    setUpdatingId(orderId);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            orderStatus: newStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update order status");
      }

      setOrders((previous) =>
        previous.map((order) =>
          order.id === orderId
            ? { ...order, orderStatus: data.orderStatus }
            : order
        )
      );

      setMessage(`Order status updated to ${data.orderStatus}.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleString("en-IN");
  }

  function statusColor(status) {
    switch (status) {
      case "Delivered":
        return "#16803c";
      case "Cancelled":
        return "#dc2626";
      case "Shipped":
        return "#2563eb";
      case "Processing":
        return "#b45309";
      default:
        return "#555";
    }
  }

  if (loading) {
    return <div style={styles.page}>Loading orders...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Customer Orders</h1>
          <p style={styles.subtitle}>
            View and manage all customer orders.
          </p>
        </div>

        <div style={styles.countBox}>
          <strong>{orders.length}</strong>
          <span>Total Orders</span>
        </div>
      </div>

      {message && (
        <div style={styles.message}>
          {message}
        </div>
      )}

      {orders.length === 0 ? (
        <div style={styles.empty}>
          No customer orders available yet.
        </div>
      ) : (
        <div style={styles.orderList}>
          {orders.map((order) => (
            <div key={order.id} style={styles.orderCard}>
              <div style={styles.orderHeader}>
                <div>
                  <h3 style={styles.orderNumber}>
                    {order.orderNumber}
                  </h3>
                  <p style={styles.date}>
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                <span
                  style={{
                    ...styles.statusBadge,
                    color: statusColor(order.orderStatus),
                    borderColor: statusColor(order.orderStatus)
                  }}
                >
                  {order.orderStatus}
                </span>
              </div>

              <div style={styles.detailsGrid}>
                <div>
                  <strong>Customer</strong>
                  <p>{order.customerName}</p>
                  <p>{order.customerEmail}</p>
                  <p>{order.phone}</p>
                </div>

                <div>
                  <strong>Delivery Address</strong>
                  <p>{order.address}</p>
                  <p>
                    {order.city} - {order.pincode}
                  </p>
                </div>

                <div>
                  <strong>Payment</strong>
                  <p>{order.paymentMethod}</p>
                  <p>{order.paymentStatus}</p>
                </div>

                <div>
                  <strong>Order Total</strong>
                  <p style={styles.total}>
                    ₹{Number(order.total).toFixed(2)}
                  </p>
                </div>
              </div>

              <div style={styles.statusSection}>
                <label style={styles.label}>
                  Update Order Status
                </label>

                <select
                  style={styles.select}
                  value={
                    selectedStatuses[order.id] || order.orderStatus
                  }
                  onChange={(event) =>
                    handleStatusChange(order.id, event.target.value)
                  }
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <button
                  style={styles.updateButton}
                  onClick={() => updateStatus(order.id)}
                  disabled={updatingId === order.id}
                >
                  {updatingId === order.id
                    ? "Updating..."
                    : "Update Status"}
                </button>
              </div>

              <button
                style={styles.viewButton}
                onClick={() =>
                  setExpandedOrder(
                    expandedOrder === order.id ? null : order.id
                  )
                }
              >
                {expandedOrder === order.id
                  ? "Hide Products"
                  : "View Products"}
              </button>

              {expandedOrder === order.id && (
                <div style={styles.itemsSection}>
                  <h4>Ordered Products</h4>

                  {order.items?.map((item, index) => (
                    <div
                      key={`${order.id}-${index}`}
                      style={styles.item}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={styles.productImage}
                        />
                      ) : (
                        <div style={styles.imagePlaceholder}>
                          No Image
                        </div>
                      )}

                      <div style={styles.itemDetails}>
                        <strong>{item.name}</strong>
                        <p>Quantity: {item.quantity}</p>
                        <p>
                          ₹{Number(item.price).toFixed(2)} each
                        </p>
                      </div>

                      <strong>
                        ₹
                        {(
                          Number(item.price) * Number(item.quantity)
                        ).toFixed(2)}
                      </strong>
                    </div>
                  ))}

                  <div style={styles.summary}>
                    <p>
                      Subtotal: ₹
                      {Number(order.subtotal).toFixed(2)}
                    </p>
                    <p>
                      Delivery: ₹
                      {Number(order.delivery).toFixed(2)}
                    </p>
                    <strong>
                      Total: ₹{Number(order.total).toFixed(2)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "30px",
    minHeight: "100vh",
    background: "#f5f6fa",
    color: "#222",
    fontFamily: "Arial, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    marginBottom: "25px"
  },
  heading: {
    margin: 0,
    fontSize: "28px"
  },
  subtitle: {
    color: "#777",
    marginTop: "8px"
  },
  countBox: {
    background: "#fff",
    padding: "15px 25px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  message: {
    background: "#eaf2ff",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px"
  },
  empty: {
    background: "#fff",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center"
  },
  orderList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  orderCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "22px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    flexWrap: "wrap",
    borderBottom: "1px solid #eee",
    paddingBottom: "15px"
  },
  orderNumber: {
    margin: 0
  },
  date: {
    color: "#777",
    fontSize: "13px"
  },
  statusBadge: {
    border: "1px solid",
    borderRadius: "20px",
    padding: "7px 13px",
    fontSize: "13px",
    fontWeight: "bold"
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    padding: "20px 0"
  },
  total: {
    fontSize: "20px",
    fontWeight: "bold"
  },
  statusSection: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    padding: "15px 0",
    borderTop: "1px solid #eee"
  },
  label: {
    fontWeight: "bold"
  },
  select: {
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    minWidth: "150px"
  },
  updateButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    background: "#222",
    color: "#fff",
    cursor: "pointer"
  },
  viewButton: {
    padding: "9px 14px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer"
  },
  itemsSection: {
    marginTop: "20px",
    paddingTop: "15px",
    borderTop: "1px solid #eee"
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "12px 0",
    borderBottom: "1px solid #eee"
  },
  productImage: {
    width: "60px",
    height: "60px",
    objectFit: "cover",
    borderRadius: "8px"
  },
  imagePlaceholder: {
    width: "60px",
    height: "60px",
    background: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    borderRadius: "8px"
  },
  itemDetails: {
    flex: 1
  },
  summary: {
    textAlign: "right",
    marginTop: "15px",
    lineHeight: "1.5"
  }
};

export default AdminOrders;