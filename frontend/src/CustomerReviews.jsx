
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerReviews.css";

const API = "http://localhost:5000";

function CustomerReviews() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function verifySessionAndLoadProducts() {
            try {
                const sessionResponse = await fetch(
                    `${API}/api/customer/me`,
                    { credentials: "include" }
                );

                if (!sessionResponse.ok) {
                    localStorage.removeItem("loggedInUser");
                    navigate("/login");
                    return;
                }

                const sessionData = await sessionResponse.json();

                setUser(sessionData.user);

                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(sessionData.user)
                );

                const productsResponse = await fetch(
                    `${API}/api/products`
                );

                if (!productsResponse.ok) {
                    throw new Error("Unable to load products");
                }

                const productsData = await productsResponse.json();

                setProducts(productsData);

                if (productsData.length > 0) {
                    setSelectedProduct(String(productsData[0].id));
                }

            } catch (error) {
                setMessage(
                    error.message || "Unable to connect to the server."
                );
            }
        }

        verifySessionAndLoadProducts();
    }, [navigate]);

    useEffect(() => {
        if (selectedProduct) {
            loadReviews(selectedProduct);
        }
    }, [selectedProduct]);

    useEffect(() => {
        if (!message) return;

        const timer = setTimeout(() => setMessage(""), 4000);

        return () => clearTimeout(timer);
    }, [message]);

    const loadReviews = async productId => {
        setLoading(true);

        try {
            const response = await fetch(
                `${API}/api/products/${productId}/reviews`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load reviews");
            }

            setReviews(data);

        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async event => {
        event.preventDefault();

        if (!comment.trim()) {
            setMessage("Please write your review.");
            return;
        }

        if (submitting) return;

        setSubmitting(true);

        const reviewData = {
            customerId: user.id,
            productId: Number(selectedProduct),
            rating,
            comment: comment.trim()
        };

        try {
            const response = await fetch(
                editingId
                    ? `${API}/api/reviews/${editingId}`
                    : `${API}/api/reviews`,
                {
                    method: editingId ? "PUT" : "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(reviewData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to save review");
            }

            setMessage(data.message);
            setComment("");
            setRating(5);
            setEditingId(null);

            await loadReviews(selectedProduct);

        } catch (error) {
            setMessage(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = review => {
        setEditingId(review.id);
        setRating(review.rating);
        setComment(review.comment);
        setMessage("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const handleDelete = async reviewId => {
        if (!window.confirm("Are you sure you want to delete this review?")) {
            return;
        }

        try {
            const response = await fetch(
                `${API}/api/reviews/${reviewId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        customerId: user.id
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to delete review");
            }

            setMessage(data.message);
            setEditingId(null);
            setComment("");
            setRating(5);

            await loadReviews(selectedProduct);

        } catch (error) {
            setMessage(error.message);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setComment("");
        setRating(5);
        setMessage("");
    };

    const selectedProductName = products.find(
        product => String(product.id) === selectedProduct
    )?.name;

    if (!user) {
        return (
            <main className="reviews-page">
                <div className="reviews-loading">
                    {message || "Loading your reviews..."}
                </div>
            </main>
        );
    }

    return (
        <main className="reviews-page">

            <header className="reviews-topbar">

                <button
                    className="reviews-brand"
                    onClick={() => navigate("/")}
                >
                    <span className="reviews-brand-mark">S</span>

                    <span>
                        ShopSphere<span className="reviews-brand-dot">.</span>
                    </span>
                </button>

                <button
                    className="reviews-back-top"
                    onClick={() => navigate("/profile")}
                >
                    ← Back to Profile
                </button>

            </header>

            <section className="reviews-content">

                <div className="reviews-heading">

                    <span className="reviews-eyebrow">
                        YOUR EXPERIENCE MATTERS
                    </span>

                    <h1>
                        Product <em>reviews.</em>
                    </h1>

                    <p>
                        Share your experience and help others discover great products.
                    </p>

                </div>

                {message && (
                    <div className="reviews-message" role="status">
                        {message}
                    </div>
                )}

                <section className="reviews-form-card">

                    <div className="reviews-card-heading">
                        <span className="reviews-eyebrow">
                            CUSTOMER FEEDBACK
                        </span>

                        <h2>
                            {editingId
                                ? "Update your review"
                                : "Write a review"}
                        </h2>

                        <p>
                            Tell us what you think about your favourite finds.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <label className="reviews-label">
                            Select product

                            <select
                                value={selectedProduct}
                                onChange={event => {
                                    setSelectedProduct(event.target.value);
                                    cancelEdit();
                                }}
                                required
                            >
                                {products.map(product => (
                                    <option
                                        key={product.id}
                                        value={product.id}
                                    >
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="reviews-rating-section">

                            <span className="reviews-label">
                                Your rating
                            </span>

                            <div className="reviews-stars">
                                {[1, 2, 3, 4, 5].map(value => (
                                    <button
                                        key={value}
                                        type="button"
                                        className={
                                            value <= rating
                                                ? "reviews-star selected"
                                                : "reviews-star"
                                        }
                                        onClick={() => setRating(value)}
                                        aria-label={`Rate ${value} stars`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>

                            <span className="reviews-rating-text">
                                {rating} out of 5 stars
                            </span>

                        </div>

                        <label className="reviews-label">
                            Your review

                            <textarea
                                value={comment}
                                onChange={event =>
                                    setComment(event.target.value)
                                }
                                placeholder="Write about your experience with this product..."
                                rows={5}
                                required
                            />
                        </label>

                        <div className="reviews-form-actions">

                            <button
                                type="submit"
                                className="reviews-submit-button"
                                disabled={submitting || !selectedProduct}
                            >
                                {submitting
                                    ? "Saving..."
                                    : editingId
                                        ? "Update review"
                                        : "Submit review"}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    className="reviews-cancel-button"
                                    onClick={cancelEdit}
                                >
                                    Cancel
                                </button>
                            )}

                        </div>

                    </form>

                </section>

                <section className="reviews-list-section">

                    <div className="reviews-list-heading">
                        <div>
                            <span className="reviews-eyebrow">
                                COMMUNITY FEEDBACK
                            </span>

                            <h2>Customer reviews.</h2>

                            <p>
                                {selectedProductName
                                    ? `Reviews for ${selectedProductName}`
                                    : "Select a product to view its reviews."}
                            </p>
                        </div>

                        <span className="reviews-count">
                            {reviews.length} REVIEWS
                        </span>
                    </div>

                    {loading && (
                        <div className="reviews-empty">
                            Loading reviews...
                        </div>
                    )}

                    {!loading && reviews.length === 0 && (
                        <div className="reviews-empty">
                            <span>☆</span>
                            <h3>No reviews yet.</h3>
                            <p>
                                Be the first to share your experience with this product!
                            </p>
                        </div>
                    )}

                    {!loading && reviews.length > 0 && (
                        <div className="reviews-list">

                            {reviews.map(review => (
                                <article
                                    key={review.id}
                                    className="reviews-item"
                                >

                                    <div className="reviews-item-header">

                                        <div className="reviews-customer-avatar">
                                            {(review.customerName || "C")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="reviews-customer-info">
                                            <h3>{review.customerName}</h3>

                                            <div className="reviews-item-stars">
                                                {"★".repeat(review.rating)}
                                                {"☆".repeat(5 - review.rating)}
                                            </div>
                                        </div>

                                        <span className="reviews-date">
                                            {review.createdAt}
                                        </span>

                                    </div>

                                    <p className="reviews-comment">
                                        {review.comment}
                                    </p>

                                    {Number(review.customerId) === Number(user.id) && (
                                        <div className="reviews-item-actions">

                                            <button
                                                onClick={() => handleEdit(review)}
                                            >
                                                Edit review
                                            </button>

                                            <button
                                                onClick={() => handleDelete(review.id)}
                                            >
                                                Delete review
                                            </button>

                                        </div>
                                    )}

                                </article>
                            ))}

                        </div>
                    )}

                </section>

                <button
                    className="reviews-back-button"
                    onClick={() => navigate("/profile")}
                >
                    ← Back to Profile
                </button>

            </section>

            <footer className="reviews-footer">
                <span>© 2026 ShopSphere</span>
                <span>Good products. Unexpected discoveries.</span>
            </footer>

        </main>
    );
}

export default CustomerReviews;
