import { useState } from "react";
import { Link } from "react-router-dom";
import { ProductImage } from "./ProductArt";
import { CheckIcon, HeartIcon, PlusIcon } from "./Icons";
import {
  discountPercent,
  formatPrice,
  productImage,
  useStore
} from "../store/StoreContext";

export function ProductCardSkeleton() {
  return (
    <div className="ss-card ss-skeleton-card" aria-hidden="true">
      <div className="ss-card-media ss-shimmer" />
      <div className="ss-skeleton-line short ss-shimmer" />
      <div className="ss-skeleton-line ss-shimmer" />
      <div className="ss-skeleton-line short ss-shimmer" />
    </div>
  );
}

export default function ProductCard({ product }) {
  const { addToCart, isWished, toggleWishlist, notify, setBagOpen } = useStore();
  const [justAdded, setJustAdded] = useState(false);

  const soldOut = typeof product.stock === "number" && product.stock <= 0;
  const off = discountPercent(product);
  const wished = isWished(product.id);

  const handleAdd = () => {
    if (soldOut) return;
    addToCart(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
    notify(`${product.name} added to your bag`, {
      label: "View bag",
      onClick: () => setBagOpen(true)
    });
  };

  return (
    <article className="ss-card">
      <div className={`ss-card-media ss-tint-${product.color || "none"}`}>
        <Link
          to={`/product/${product.id}`}
          className="ss-card-link"
          aria-label={`View ${product.name}`}
        >
          <ProductImage
            className="ss-card-image"
            src={productImage(product)}
            alt={product.name}
            fallbackType={product.art}
          />
        </Link>

        {product.label && <span className="ss-badge">{product.label}</span>}
        {soldOut && <span className="ss-badge ss-badge-soldout">Sold out</span>}

        <button
          type="button"
          className={wished ? "ss-heart is-active" : "ss-heart"}
          onClick={() => toggleWishlist(product)}
          aria-pressed={wished}
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        >
          <HeartIcon filled={wished} />
        </button>

        <button
          type="button"
          className={justAdded ? "ss-quick-add is-added" : "ss-quick-add"}
          onClick={handleAdd}
          disabled={soldOut}
          aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to bag`}
        >
          {justAdded ? <CheckIcon /> : <PlusIcon />}
          <span>{soldOut ? "Sold out" : justAdded ? "Added" : "Add to bag"}</span>
        </button>
      </div>

      <div className="ss-card-body">
        <span className="ss-card-category">{product.category}</span>
        <h3>
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="ss-price-row">
          <strong>{formatPrice(product.price)}</strong>
          {product.oldPrice > product.price && <del>{formatPrice(product.oldPrice)}</del>}
          {off > 0 && <span className="ss-off">{off}% off</span>}
        </div>
      </div>
    </article>
  );
}
