import { API_URL } from "./config";
import { useEffect, useState } from "react";
function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch(`${API_URL}/api/admin/customers`, {
          credentials: "include"
        });

        if (response.status === 401 || response.status === 403) {
          window.location.href = "/admin";
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load customers");
        }

        setCustomers(data);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, []);

  async function viewCustomer(customerId) {
    setDetailsLoading(true);
    setSelectedCustomer(null);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/customers/${customerId}`,
        {
          credentials: "include"
        }
      );

      if (response.status === 401 || response.status === 403) {
        window.location.href = "/admin";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load customer details");
      }

      setSelectedCustomer(data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return "N/A";

    const date = new Date(dateValue.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) return dateValue;

    return date.toLocaleString("en-IN");
  }

  const filteredCustomers = customers.filter((customer) => {
    const searchText = search.toLowerCase();

    return (
      customer.name.toLowerCase().includes(searchText) ||
      customer.email.toLowerCase().includes(searchText) ||
      String(customer.id).includes(searchText)
    );
  });

  if (loading) {
    return <div style={styles.page}>Loading customers...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Customers</h1>
          <p style={styles.subtitle}>
            View registered customers and their order history.
          </p>
        </div>

        <div style={styles.countBox}>
          <strong>{customers.length}</strong>
          <span>Registered Customers</span>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {detailsLoading && (
        <div style={styles.message}>Loading customer details...</div>
      )}

      {selectedCustomer && (
        <div style={styles.detailsCard}>
          <div style={styles.detailsHeader}>
            <div>
              <h2 style={styles.sectionHeading}>Customer Details</h2>
              <p style={styles.subtitle}>
                Customer ID: #{selectedCustomer.id}
              </p>
            </div>

            <button
              style={styles.closeButton}
              onClick={() => setSelectedCustomer(null)}
            >
              Close Details
            </button>
          </div>

          <div style={styles.profileGrid}>
            <div>
              <span style={styles.detailLabel}>Name</span>
              <strong>{selectedCustomer.name}</strong>
            </div>

            <div>
              <span style={styles.detailLabel}>Email</span>
              <strong>{selectedCustomer.email}</strong>
            </div>

            <div>
              <span style={styles.detailLabel}>Total Orders</span>
              <strong>{selectedCustomer.totalOrders}</strong>
            </div>

            <div>
              <span style={styles.detailLabel}>Total Spent</span>
              <strong>
                ₹{Number(selectedCustomer.totalSpent).toFixed(2)}
              </strong>
            </div>
          </div>

          <h3 style={styles.sectionHeading}>Order History</h3>

          {selectedCustomer.orders.length === 0 ? (
            <div style={styles.empty}>
              This customer has not placed any orders.
            </div>
          ) : (
            <div style={styles.orderList}>
              {selectedCustomer.orders.map((order) => (
                <div key={order.id} style={styles.orderCard}>
                  <div style={styles.orderHeader}>
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <p style={styles.date}>
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <span style={styles.status}>
                      {order.orderStatus}
                    </span>
                  </div>

                  <div style={styles.orderInfo}>
                    <p>
                      <strong>Order Total:</strong>{" "}
                      ₹{Number(order.total).toFixed(2)}
                    </p>
                    <p>
                      <strong>Payment:</strong> {order.paymentMethod}
                    </p>
                    <p>
                      <strong>Payment Status:</strong> {order.paymentStatus}
                    </p>
                    <p>
                      <strong>Delivery Address:</strong>{" "}
                      {order.address}, {order.city} - {order.pincode}
                    </p>
                  </div>

                  <h4>Products</h4>

                  {order.items.map((item, index) => (
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

                      <div style={{ flex: 1 }}>
                        <strong>{item.name}</strong>
                        <p style={styles.date}>
                          Quantity: {item.quantity}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <h2 style={styles.sectionHeading}>Registered Customers</h2>

      <input
        type="text"
        placeholder="Search by name, email or customer ID..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={styles.search}
      />

      {filteredCustomers.length === 0 ? (
        <div style={styles.empty}>
          {customers.length === 0
            ? "No registered customers available."
            : "No customers match your search."}
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Customer ID</th>
                <th style={styles.th}>Customer Name</th>
                <th style={styles.th}>Email Address</th>
                <th style={styles.th}>Total Orders</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td style={styles.td}>#{customer.id}</td>
                  <td style={styles.td}>{customer.name}</td>
                  <td style={styles.td}>{customer.email}</td>
                  <td style={styles.td}>{customer.totalOrders}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.viewButton}
                      onClick={() => viewCustomer(customer.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    background: "#f5f6fa",
    fontFamily: "Arial, sans-serif",
    color: "#222"
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
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding: "15px 22px",
    background: "#fff",
    borderRadius: "10px"
  },
  message: {
    padding: "12px",
    background: "#eaf2ff",
    borderRadius: "7px",
    marginBottom: "15px"
  },
  detailsCard: {
    background: "#fff",
    padding: "22px",
    borderRadius: "10px",
    marginBottom: "30px"
  },
  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "20px"
  },
  sectionHeading: {
    fontSize: "20px",
    marginTop: "20px",
    marginBottom: "15px"
  },
  closeButton: {
    padding: "9px 15px",
    background: "#eee",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    padding: "20px 0",
    borderTop: "1px solid #eee",
    borderBottom: "1px solid #eee"
  },
  detailLabel: {
    display: "block",
    color: "#777",
    fontSize: "13px",
    marginBottom: "7px"
  },
  orderList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  orderCard: {
    border: "1px solid #eee",
    borderRadius: "8px",
    padding: "18px",
    marginBottom: "15px"
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    borderBottom: "1px solid #eee",
    paddingBottom: "12px"
  },
  date: {
    color: "#777",
    fontSize: "13px",
    marginTop: "5px"
  },
  status: {
    background: "#edf2ff",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "13px"
  },
  orderInfo: {
    lineHeight: "1.5",
    marginTop: "12px"
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "10px 0",
    borderBottom: "1px solid #eee"
  },
  productImage: {
    width: "55px",
    height: "55px",
    objectFit: "cover",
    borderRadius: "7px"
  },
  imagePlaceholder: {
    width: "55px",
    height: "55px",
    background: "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    borderRadius: "7px"
  },
  search: {
    width: "100%",
    maxWidth: "450px",
    padding: "12px 15px",
    marginBottom: "20px",
    border: "1px solid #ddd",
    borderRadius: "7px",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  empty: {
    padding: "25px",
    background: "#fff",
    borderRadius: "10px",
    textAlign: "center"
  },
  tableContainer: {
    width: "100%",
    overflowX: "auto",
    background: "#fff",
    borderRadius: "10px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    minWidth: "650px"
  },
  th: {
    padding: "16px",
    background: "#222",
    color: "#fff",
    fontSize: "14px"
  },
  td: {
    padding: "16px",
    borderBottom: "1px solid #eee",
    fontSize: "14px"
  },
  viewButton: {
    padding: "9px 13px",
    background: "#222",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  }
};

export default AdminCustomers;