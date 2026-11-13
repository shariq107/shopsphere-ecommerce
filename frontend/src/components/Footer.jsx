import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useStore } from "../store/StoreContext";

export default function Footer() {
  const { products, customer } = useStore();

  const categories = [];
  products.forEach(product => {
    if (product.category && !categories.includes(product.category)) {
      categories.push(product.category);
    }
  });

  return (
    <footer className="ss-footer" id="footer">
      <div className="ss-container ss-footer-grid">
        <div className="ss-footer-brand">
          <Logo />
          <p>Good products. Unexpected discoveries.</p>
          <p className="ss-footer-note">Free delivery on orders over ₹999.</p>
        </div>

        <nav aria-label="Shop">
          <h4>Shop</h4>
          <Link to="/#products">All products</Link>
          <Link to="/#categories">Browse categories</Link>
          <Link to="/wishlist">Wishlist</Link>
        </nav>

        {categories.length > 0 && (
          <nav aria-label="Categories">
            <h4>Categories</h4>
            {categories.slice(0, 6).map(category => (
              <Link key={category} to={`/?category=${encodeURIComponent(category)}#products`}>
                {category}
              </Link>
            ))}
          </nav>
        )}

        <nav aria-label="Your account">
          <h4>Your account</h4>
          <Link to={customer ? "/profile" : "/login"}>{customer ? "Profile" : "Sign in"}</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/addresses">Addresses</Link>
          <Link to="/reviews">Reviews</Link>
        </nav>
      </div>

      <div className="ss-container ss-footer-bar">
        <span>© 2026 ShopSphere</span>
        <Link to="/admin">Admin Portal</Link>
      </div>
    </footer>
  );
}
