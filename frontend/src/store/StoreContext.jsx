import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../config";

const StoreContext = createContext(null);

export const FREE_DELIVERY_FROM = 999;
export const DELIVERY_FEE = 49;

// These keys are shared with Checkout.jsx and CustomerWishlist.jsx.
const CART_KEY = "shopSphereCart";
const WISHLIST_KEY = "shopSphereWishlist";

const readList = key => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeList = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore localStorage write errors.
  }
};

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export const formatPrice = price => priceFormatter.format(price || 0);

export const discountPercent = product =>
  product && product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

export const productImage = product =>
  product?.images?.[0] || product?.image || "";

export function StoreProvider({ children }) {
  const { pathname } = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [bagOpen, setBagOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [cartItems, setCartItems] = useState(() => readList(CART_KEY));
  const [wishlist, setWishlist] = useState(() => readList(WISHLIST_KEY));
  const cartRef = useRef(cartItems);
  const wishlistRef = useRef(wishlist);
  const toastTimer = useRef(null);

  /* ---------- Products ---------- */
  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setError("");
      return data;
    } catch (err) {
      console.error(err);
      setError("Unable to load products.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /* ---------- Customer session (Flask session is authoritative) ---------- */
  useEffect(() => {
    // The admin portal has its own session handling.
    if (pathname.startsWith("/admin")) return undefined;

    let cancelled = false;

    fetch(`${API_URL}/api/customer/me`, {
      method: "GET",
      credentials: "include"
    })
      .then(async response => {
        if (!response.ok) {
          if (response.status === 401) {
            try {
              localStorage.removeItem("loggedInUser");
            } catch {
              // Ignore localStorage access errors.
            }
          }
          return null;
        }
        const data = await response.json();
        return data.user || null;
      })
      .then(user => {
        if (!cancelled) setCustomer(user);
      })
      .catch(err => {
        console.error("Unable to check customer session:", err);
        if (!cancelled) setCustomer(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  /* ---------- Re-sync bag & wishlist with localStorage ----------
     Checkout clears the bag and the Wishlist page edits the wishlist
     directly in localStorage, so re-read whenever the route changes. */
  useEffect(() => {
    const nextCart = readList(CART_KEY);
    cartRef.current = nextCart;
    setCartItems(nextCart);

    const nextWishlist = readList(WISHLIST_KEY);
    wishlistRef.current = nextWishlist;
    setWishlist(nextWishlist);

    setBagOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onStorage = event => {
      if (event.key === CART_KEY) {
        const next = readList(CART_KEY);
        cartRef.current = next;
        setCartItems(next);
      }
      if (event.key === WISHLIST_KEY) {
        const next = readList(WISHLIST_KEY);
        wishlistRef.current = next;
        setWishlist(next);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ---------- Toast ---------- */
  const notify = useCallback((message, action) => {
    setToast({ message, action, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /* ---------- Bag ---------- */
  const commitCart = useCallback(next => {
    cartRef.current = next;
    setCartItems(next);
    writeList(CART_KEY, next);
  }, []);

  const addToCart = useCallback(
    (product, quantity = 1) => {
      const current = cartRef.current;
      const existing = current.find(item => item.id === product.id);

      commitCart(
        existing
          ? current.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          : [...current, { ...product, quantity }]
      );
    },
    [commitCart]
  );

  const increaseQuantity = useCallback(
    id =>
      commitCart(
        cartRef.current.map(item =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        )
      ),
    [commitCart]
  );

  const decreaseQuantity = useCallback(
    id =>
      commitCart(
        cartRef.current
          .map(item =>
            item.id === id ? { ...item, quantity: item.quantity - 1 } : item
          )
          .filter(item => item.quantity > 0)
      ),
    [commitCart]
  );

  const removeFromCart = useCallback(
    id => commitCart(cartRef.current.filter(item => item.id !== id)),
    [commitCart]
  );

  /* ---------- Wishlist ---------- */
  const toggleWishlist = useCallback(
    product => {
      const current = wishlistRef.current;
      const exists = current.some(item => item.id === product.id);
      const next = exists
        ? current.filter(item => item.id !== product.id)
        : [...current, product];

      wishlistRef.current = next;
      setWishlist(next);
      writeList(WISHLIST_KEY, next);
      notify(exists ? "Removed from wishlist" : "Saved to your wishlist");
    },
    [notify]
  );

  const isWished = useCallback(
    id => wishlist.some(item => item.id === id),
    [wishlist]
  );

  /* ---------- Totals (same rules as before) ---------- */
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const delivery =
    cartItems.length === 0 ? 0 : subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  const value = useMemo(
    () => ({
      products,
      loading,
      error,
      reloadProducts: loadProducts,
      customer,
      search,
      setSearch,
      cartItems,
      cartCount,
      subtotal,
      delivery,
      total,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      removeFromCart,
      wishlist,
      isWished,
      toggleWishlist,
      bagOpen,
      setBagOpen,
      notify
    }),
    [
      products, loading, error, loadProducts, customer, search, cartItems,
      cartCount, subtotal, delivery, total, addToCart, increaseQuantity,
      decreaseQuantity, removeFromCart, wishlist, isWished, toggleWishlist,
      bagOpen, notify
    ]
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div className="ss-toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="ss-toast" key={toast.id}>
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action.onClick();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </StoreContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside <StoreProvider>");
  return context;
}
