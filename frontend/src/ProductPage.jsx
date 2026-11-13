import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./App.css";
import "./Storefront.css";

import { API_URL } from "./config";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductCard from "./components/ProductCard";
import { ProductImage } from "./components/ProductArt";
import { HeartIcon } from "./components/Icons";
import {
  discountPercent,
  formatPrice,
  useStore
} from "./store/StoreContext";

function Stars({ value }) {
  const filled = Math.round(value);
  return (
    <span className="ss-stars" aria-hidden="true">
      {"★".repeat(filled)}
      <span>{"★".repeat(5 - filled)}</span>
    </span>
  );
}

function ProductView({ product, products }) {
  const navigate = useNavigate();
  const { addToCart, isWished, toggleWishlist, setBagOpen } = useStore();

  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState(product.variants?.[0]?.color || "");
  const [imageIndex, setImageIndex] = useState(0);
  const [zoom, setZoom] = useState({ x: "50%", y: "50%" });

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/api/products/${product.id}/reviews`)
      .then(response => (response.ok ? response.json() : []))
      .then(data => {
        if (!cancelled) setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const variant =
    product.variants?.find(item => item.color === color) || product.variants?.[0];

  const images = variant?.images?.length
    ? variant.images
    : product.images?.length
      ? product.images
      : product.image
        ? [product.image]
        : [];

  const activeImage = images[imageIndex] || images[0] || "";

  const hasStock = typeof product.stock === "number";
  const soldOut = hasStock && product.stock <= 0;
  const lowStock = hasStock && product.stock > 0 && product.stock <= 5;
  const maxQuantity = hasStock ? Math.max(1, product.stock) : 99;

  const off = discountPercent(product);
  const wished = isWished(product.id);

  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0;

  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(review => Number(review.rating) === stars).length
  }));

  const related = useMemo(
    () =>
      products
        .filter(item => item.category === product.category && item.id !== product.id)
        .slice(0, 4),
    [products, product]
  );

  const handleZoom = event => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setZoom({
      x: `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
      y: `${((event.clientY - bounds.top) / bounds.height) * 100}%`
    });
  };

  const addAndOpenBag = () => {
    addToCart(product, quantity);
    setBagOpen(true);
  };

  const buyNow = () => {
    addToCart(product, quantity);
    navigate("/checkout");
  };

  return (
    <div className="ss-container">
      <nav className="ss-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/?category=${encodeURIComponent(product.category)}#products`}>
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="ss-pdp">
        <div className="ss-gallery">
          {images.length > 1 && (
            <div className="ss-thumbs" role="group" aria-label="Product images">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className={index === imageIndex ? "is-active" : undefined}
                  onClick={() => setImageIndex(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-current={index === imageIndex}
                >
                  <ProductImage
                    src={image}
                    alt=""
                    className="ss-thumb-image"
                    fallbackType={product.art}
                  />
                </button>
              ))}
            </div>
          )}

          <div
            className={`ss-main-image ss-tint-${product.color || "none"}`}
            onMouseMove={handleZoom}
            style={{ "--zx": zoom.x, "--zy": zoom.y }}
          >
            {product.label && <span className="ss-badge">{product.label}</span>}
            <ProductImage
              src={activeImage}
              alt={product.name}
              className="ss-main-photo"
              fallbackType={product.art}
              loading="eager"
            />
          </div>
        </div>

        <div className="ss-buybox">
          <span className="ss-eyebrow">{product.category}</span>
          <h1>{product.name}</h1>

          {reviews.length > 0 && (
            <a className="ss-rating" href="#reviews">
              <Stars value={average} />
              <span>
                {average.toFixed(1)} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </a>
          )}

          <div className="ss-pdp-price">
            <strong>{formatPrice(product.price)}</strong>
            {product.oldPrice > product.price && <del>{formatPrice(product.oldPrice)}</del>}
            {off > 0 && <span className="ss-off">{off}% off</span>}
          </div>

          <p className="ss-pdp-description">
            {product.description || `${product.name} is part of our ${product.category} collection.`}
          </p>

          {hasStock && (
            <p className={soldOut ? "ss-stock is-out" : lowStock ? "ss-stock is-low" : "ss-stock"}>
              <span aria-hidden="true" />
              {soldOut ? "Sold out" : lowStock ? `Only ${product.stock} left` : "In stock and ready to ship"}
            </p>
          )}

          {product.variants?.length > 0 && (
            <div className="ss-field">
              <div className="ss-field-label">
                Colour <strong>{color || "Default"}</strong>
              </div>
              <div className="ss-chips" role="group" aria-label="Colour">
                {product.variants.map(item => (
                  <button
                    type="button"
                    key={item.color}
                    className={color === item.color ? "is-active" : undefined}
                    aria-pressed={color === item.color}
                    onClick={() => {
                      setColor(item.color);
                      setImageIndex(0);
                    }}
                  >
                    {item.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="ss-field">
            <div className="ss-field-label">Quantity</div>
            <div className="ss-stepper ss-stepper-lg" role="group" aria-label="Quantity">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                disabled={soldOut}
              >−</button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                aria-label="Increase quantity"
                disabled={soldOut || quantity >= maxQuantity}
              >+</button>
            </div>
          </div>

          <div className="ss-buy-actions">
            <button
              type="button"
              className="ss-btn ss-btn-primary ss-btn-lg ss-grow"
              onClick={addAndOpenBag}
              disabled={soldOut}
            >
              {soldOut ? "Sold out" : `Add ${quantity > 1 ? `${quantity} ` : ""}to bag · ${formatPrice(product.price * quantity)}`}
            </button>
            <button
              type="button"
              className={wished ? "ss-icon-btn is-active" : "ss-icon-btn"}
              onClick={() => toggleWishlist(product)}
              aria-pressed={wished}
              aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
            >
              <HeartIcon filled={wished} />
            </button>
          </div>

          {!soldOut && (
            <button type="button" className="ss-btn ss-btn-dark ss-btn-lg ss-btn-block" onClick={buyNow}>
              Buy now
            </button>
          )}

          <div className="ss-accordions">
            <details open>
              <summary>Details</summary>
              <dl className="ss-specs">
                <div><dt>Category</dt><dd>{product.category}</dd></div>
                {product.variants?.length > 0 && (
                  <div><dt>Colours</dt><dd>{product.variants.map(item => item.color).join(", ")}</dd></div>
                )}
                {hasStock && (
                  <div><dt>Availability</dt><dd>{soldOut ? "Sold out" : "In stock"}</dd></div>
                )}
                {off > 0 && (
                  <div><dt>You save</dt><dd>{formatPrice(product.oldPrice - product.price)} ({off}%)</dd></div>
                )}
              </dl>
            </details>
            <details>
              <summary>Delivery</summary>
              <p>Free delivery on orders above ₹999. A ₹49 delivery fee applies to smaller orders. You can follow your order from the <Link to="/orders">Orders</Link> page.</p>
            </details>
          </div>
        </div>
      </div>

      <section className="ss-reviews" id="reviews">
        <div className="ss-section-head ss-section-head-tight">
          <div>
            <span className="ss-eyebrow">What people say</span>
            <h2>Customer <span className="ss-accent">reviews.</span></h2>
          </div>
          <Link to="/reviews" className="ss-btn ss-btn-ghost">Write a review</Link>
        </div>

        {reviewsLoading ? (
          <div className="ss-shimmer ss-review-skeleton" aria-hidden="true" />
        ) : reviews.length === 0 ? (
          <div className="ss-state ss-state-compact">
            <h3>No reviews yet.</h3>
            <p>Bought this one? Be the first to share what you think.</p>
          </div>
        ) : (
          <div className="ss-review-layout">
            <div className="ss-review-summary">
              <strong>{average.toFixed(1)}</strong>
              <Stars value={average} />
              <small>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</small>
              <ul>
                {distribution.map(row => (
                  <li key={row.stars}>
                    <span>{row.stars}★</span>
                    <div className="ss-progress-track">
                      <span style={{ width: `${(row.count / reviews.length) * 100}%` }} />
                    </div>
                    <span>{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <ul className="ss-review-list">
              {reviews.slice(0, 6).map(review => (
                <li key={review.id}>
                  <div className="ss-review-top">
                    <span className="ss-avatar">{(review.customerName || "C").charAt(0).toUpperCase()}</span>
                    <div>
                      <strong>{review.customerName || "Customer"}</strong>
                      <Stars value={Number(review.rating) || 0} />
                    </div>
                    {review.createdAt && <time>{review.createdAt}</time>}
                  </div>
                  <p>{review.comment}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="ss-related">
          <div className="ss-section-head ss-section-head-tight">
            <div>
              <span className="ss-eyebrow">Keep looking</span>
              <h2>You may also <span className="ss-accent">like.</span></h2>
            </div>
          </div>
          <div className="ss-grid">
            {related.map(item => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="ss-container" aria-busy="true">
      <div className="ss-pdp">
        <div className="ss-shimmer ss-main-image" />
        <div className="ss-buybox">
          <div className="ss-skeleton-line short ss-shimmer" />
          <div className="ss-skeleton-line ss-shimmer" style={{ height: 44 }} />
          <div className="ss-skeleton-line short ss-shimmer" />
          <div className="ss-skeleton-line ss-shimmer" style={{ height: 120 }} />
        </div>
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const { products, loading, error, reloadProducts } = useStore();

  const product = products.find(item => Number(item.id) === Number(id));

  // Refresh so variants and stock are current, like the previous behaviour.
  useEffect(() => {
    reloadProducts();
    window.scrollTo(0, 0);
  }, [id, reloadProducts]);

  return (
    <div className="ss-page">
      <Navbar />
      <main className="ss-pdp-main">
        {product ? (
          <ProductView key={product.id} product={product} products={products} />
        ) : loading ? (
          <ProductSkeleton />
        ) : (
          <div className="ss-container">
            <div className="ss-state">
              <h3>{error ? "We couldn’t load this product." : "We couldn’t find that product."}</h3>
              <p>{error ? "Check your connection and try again." : "It may have been removed or the link is wrong."}</p>
              <Link to="/#products" className="ss-btn ss-btn-primary">Back to shopping</Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
