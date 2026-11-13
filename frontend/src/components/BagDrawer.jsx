import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProductImage } from "./ProductArt";
import { BagIcon, CloseIcon } from "./Icons";
import {
  FREE_DELIVERY_FROM,
  formatPrice,
  productImage,
  useStore
} from "../store/StoreContext";

export default function BagDrawer() {
  const {
    bagOpen, setBagOpen, cartItems, cartCount, subtotal, delivery, total,
    increaseQuantity, decreaseQuantity, removeFromCart
  } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!bagOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = event => {
      if (event.key === "Escape") setBagOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [bagOpen, setBagOpen]);

  if (pathname.startsWith("/admin")) return null;

  const remaining = Math.max(0, FREE_DELIVERY_FROM - subtotal);
  const progress = Math.min(100, (subtotal / FREE_DELIVERY_FROM) * 100);

  return (
    <div className={bagOpen ? "ss-drawer-root is-open" : "ss-drawer-root"} aria-hidden={!bagOpen}>
      <div className="ss-drawer-overlay" onClick={() => setBagOpen(false)} />

      <aside className="ss-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag">
        <header className="ss-drawer-header">
          <div>
            <h2>Your bag</h2>
            <span>{cartCount} {cartCount === 1 ? "item" : "items"}</span>
          </div>
          <button type="button" ref={closeRef} onClick={() => setBagOpen(false)} aria-label="Close bag">
            <CloseIcon />
          </button>
        </header>

        {cartItems.length === 0 ? (
          <div className="ss-drawer-empty">
            <span className="ss-empty-icon"><BagIcon width={34} height={34} /></span>
            <h3>Your bag is taking a break.</h3>
            <p>Add something you love and it will appear here.</p>
            <button
              type="button"
              className="ss-btn ss-btn-primary"
              onClick={() => {
                setBagOpen(false);
                navigate("/#products");
              }}
            >
              Explore products
            </button>
          </div>
        ) : (
          <>
            <div className="ss-drawer-progress">
              <p>
                {remaining > 0
                  ? <>Add <strong>{formatPrice(remaining)}</strong> more for free delivery</>
                  : <strong>You’ve unlocked free delivery.</strong>}
              </p>
              <div className="ss-progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="ss-drawer-items">
              {cartItems.map(item => (
                <li key={item.id} className="ss-bag-item">
                  <div className={`ss-bag-thumb ss-tint-${item.color || "none"}`}>
                    <ProductImage
                      src={productImage(item)}
                      alt={item.name}
                      className="ss-bag-image"
                      fallbackType={item.art}
                    />
                  </div>

                  <div className="ss-bag-info">
                    <span className="ss-card-category">{item.category}</span>
                    <h3>{item.name}</h3>
                    <div className="ss-stepper" role="group" aria-label={`Quantity for ${item.name}`}>
                      <button type="button" onClick={() => decreaseQuantity(item.id)} aria-label="Decrease quantity">−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => increaseQuantity(item.id)} aria-label="Increase quantity">+</button>
                    </div>
                  </div>

                  <div className="ss-bag-end">
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                    <button type="button" onClick={() => removeFromCart(item.id)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="ss-drawer-footer">
              <div className="ss-summary-row">
                <span>Subtotal</span><strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="ss-summary-row">
                <span>Delivery</span>
                <strong>{delivery === 0 ? "Free" : formatPrice(delivery)}</strong>
              </div>
              <div className="ss-summary-row ss-summary-total">
                <span>Total</span><strong>{formatPrice(total)}</strong>
              </div>
              <button
                type="button"
                className="ss-btn ss-btn-primary ss-btn-block"
                onClick={() => {
                  setBagOpen(false);
                  navigate("/checkout");
                }}
              >
                Checkout · {formatPrice(total)}
              </button>
              <p className="ss-drawer-note">Demo checkout. No payment will be charged.</p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
