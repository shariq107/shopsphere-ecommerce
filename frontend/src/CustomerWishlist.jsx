
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerWishlist.css";

const API_URL = "http://localhost:5000";

function CustomerWishlist() {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);

    const [wishlist, setWishlist] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem("shopSphereWishlist")
            ) || [];
        } catch {
            return [];
        }
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(
            localStorage.getItem("loggedInUser")
        );

        if (!user) {
            navigate("/login");
            return;
        }

        fetch(`${API_URL}/api/products`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Unable to load products");
                }

                return response.json();
            })
            .then(data => setProducts(data))
            .catch(error => setMessage(error.message))
            .finally(() => setLoading(false));

    }, [navigate]);

    useEffect(() => {
        localStorage.setItem(
            "shopSphereWishlist",
            JSON.stringify(wishlist)
        );
    }, [wishlist]);

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => setMessage(""), 3000);

        return () => clearTimeout(timer);
    }, [message]);

    const addToWishlist = product => {
        const alreadyAdded = wishlist.some(
            item => item.id === product.id
        );

        if (alreadyAdded) {
            setMessage("This product is already in your wishlist.");
            return;
        }

        setWishlist(previous => [...previous, product]);
        setMessage(`${product.name} added to wishlist!`);
    };

    const removeFromWishlist = productId => {
        setWishlist(previous =>
            previous.filter(item => item.id !== productId)
        );

        setMessage("Product removed from wishlist.");
    };

    const formatPrice = price =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(price);

    const isSaved = productId =>
        wishlist.some(item => item.id === productId);

    const ProductCard = ({ product, saved }) => (
        <article className="wishlist-product-card">

            <div className="wishlist-product-art">
                <span className="wishlist-product-category">
                    {product.category}
                </span>

                <span className="wishlist-product-symbol">
                    ✳
                </span>
            </div>

            <div className="wishlist-product-info">
                <span className="wishlist-category-label">
                    {product.category}
                </span>

                <h3>{product.name}</h3>

                <strong className="wishlist-price">
                    {formatPrice(product.price)}
                </strong>

                {saved ? (
                    <button
                        className="wishlist-remove-button"
                        onClick={() => removeFromWishlist(product.id)}
                    >
                        Remove from wishlist
                        <span> ×</span>
                    </button>
                ) : (
                    <button
                        className={
                            isSaved(product.id)
                                ? "wishlist-add-button saved"
                                : "wishlist-add-button"
                        }
                        onClick={() => addToWishlist(product)}
                    >
                        {isSaved(product.id)
                            ? "✓ Added to wishlist"
                            : "♡ Add to wishlist"}
                    </button>
                )}
            </div>

        </article>
    );

    return (
        <main className="wishlist-page">

            <header className="wishlist-topbar">

                <button
                    className="wishlist-brand"
                    onClick={() => navigate("/")}
                >
                    <span className="wishlist-brand-mark">S</span>

                    <span>
                        ShopSphere<span className="wishlist-brand-dot">.</span>
                    </span>
                </button>

                <button
                    className="wishlist-back-top"
                    onClick={() => navigate("/profile")}
                >
                    ← Back to Profile
                </button>

            </header>

            <section className="wishlist-content">

                <div className="wishlist-heading">

                    <span className="wishlist-eyebrow">
                        YOUR PERSONAL COLLECTION
                    </span>

                    <h1>
                        My <em>Wishlist.</em>
                    </h1>

                    <p>
                        Keep the things you love close.
                        Your favourite finds, all in one place.
                    </p>

                </div>

                {message && (
                    <div className="wishlist-message" role="status">
                        {message}
                    </div>
                )}

                <section className="wishlist-section">

                    <div className="wishlist-section-heading">
                        <div>
                            <h2>Your saved products</h2>
                            <p>
                                {wishlist.length} favourite
                                {wishlist.length === 1 ? "" : "s"}
                            </p>
                        </div>
                    </div>

                    {wishlist.length === 0 ? (

                        <div className="wishlist-empty">
                            <span>♡</span>
                            <h3>Your wishlist is waiting.</h3>
                            <p>
                                Explore products below and save the ones you love.
                            </p>
                        </div>

                    ) : (

                        <div className="wishlist-grid">
                            {wishlist.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    saved={true}
                                />
                            ))}
                        </div>

                    )}

                </section>

                <section className="wishlist-section available-section">

                    <div className="wishlist-section-heading">
                        <div>
                            <span className="wishlist-eyebrow">
                                EXPLORE MORE
                            </span>

                            <h2>Available products.</h2>

                            <p>
                                Discover something you might love.
                            </p>
                        </div>

                        <span className="wishlist-product-count">
                            {products.length} PRODUCTS
                        </span>
                    </div>

                    {loading && (
                        <p className="wishlist-status">
                            Loading products...
                        </p>
                    )}

                    {!loading && products.length === 0 && (
                        <p className="wishlist-status">
                            No products available right now.
                        </p>
                    )}

                    {!loading && products.length > 0 && (
                        <div className="wishlist-grid">
                            {products.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    saved={false}
                                />
                            ))}
                        </div>
                    )}

                </section>

                <button
                    className="wishlist-back-button"
                    onClick={() => navigate("/profile")}
                >
                    ← Back to Profile
                </button>

            </section>

            <footer className="wishlist-footer">
                <span>© 2026 ShopSphere</span>
                <span>Good products. Unexpected discoveries.</span>
            </footer>

        </main>
    );
}

export default CustomerWishlist;
