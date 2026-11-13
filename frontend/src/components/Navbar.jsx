import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import {
  BagIcon,
  CloseIcon,
  GridIcon,
  HeartIcon,
  HomeIcon,
  MenuIcon,
  SearchIcon,
  UserIcon
} from "./Icons";
import { formatPrice, productImage, useStore } from "../store/StoreContext";

const ANNOUNCEMENT_KEY = "shopSphereAnnouncementDismissed";

export default function Navbar() {
  const {
    products, customer, cartCount, wishlist, setBagOpen, search, setSearch
  } = useStore();
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  const [announcementOpen, setAnnouncementOpen] = useState(() => {
    try {
      return sessionStorage.getItem(ANNOUNCEMENT_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchRef = useRef(null);

  const dismissAnnouncement = () => {
    setAnnouncementOpen(false);
    try {
      sessionStorage.setItem(ANNOUNCEMENT_KEY, "1");
    } catch {
      // Ignore storage errors.
    }
  };

  const suggestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return products
      .filter(product => product.name.toLowerCase().includes(term))
      .slice(0, 5);
  }, [products, search]);

  useEffect(() => {
    const onPointerDown = event => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, hash]);

  const goToShop = event => {
    event.preventDefault();
    setSuggestOpen(false);
    navigate("/#products");
  };

  const accountPath = customer ? "/profile" : "/login";

  const links = [
    { label: "Home", to: "/", active: pathname === "/" && !hash },
    { label: "Categories", to: "/#categories", active: pathname === "/" && hash === "#categories" },
    {
      label: "Shop",
      to: "/#products",
      active: (pathname === "/" && hash === "#products") || pathname.startsWith("/product/")
    },
    { label: "Orders", to: "/orders", active: pathname === "/orders" },
    { label: "Wishlist", to: "/wishlist", active: pathname === "/wishlist", count: wishlist.length },
    { label: "Account", to: accountPath, active: pathname === "/profile" || pathname === "/login" }
  ];

  return (
    <>
      {announcementOpen && (
        <div className="ss-announcement">
          <p>
            Your next favourite thing is just around the corner.
            <strong> Free shipping on orders over ₹999</strong>
          </p>
          <button type="button" onClick={dismissAnnouncement} aria-label="Dismiss announcement">
            <CloseIcon width={16} height={16} />
          </button>
        </div>
      )}

      <header className="ss-navbar">
        <div className="ss-navbar-inner">
          <Logo />

          <nav className="ss-nav-links" aria-label="Main">
            {links.map(link => (
              <Link
                key={link.label}
                to={link.to}
                className={link.active ? "is-active" : undefined}
                aria-current={link.active ? "page" : undefined}
              >
                {link.label}
                {link.count > 0 && <span className="ss-nav-count">{link.count}</span>}
              </Link>
            ))}
            <a href="#footer">About</a>
          </nav>

          <div className="ss-nav-actions">
            {customer && (
              <Link to="/profile" className="ss-greeting" title={customer.email}>
                Hi, {customer.name}
              </Link>
            )}

            <form
              className="ss-search"
              role="search"
              ref={searchRef}
              onSubmit={goToShop}
            >
              <SearchIcon width={18} height={18} />
              <input
                type="search"
                placeholder="Find something..."
                aria-label="Search products"
                value={search}
                onChange={event => {
                  setSearch(event.target.value);
                  setSuggestOpen(true);
                }}
                onFocus={() => setSuggestOpen(true)}
                onKeyDown={event => {
                  if (event.key === "Escape") setSuggestOpen(false);
                }}
              />
              {search && (
                <button
                  type="button"
                  className="ss-search-clear"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <CloseIcon width={14} height={14} />
                </button>
              )}

              {suggestOpen && search.trim() && (
                <ul className="ss-suggestions">
                  {suggestions.length > 0 ? (
                    suggestions.map(product => (
                      <li key={product.id}>
                        <Link
                          to={`/product/${product.id}`}
                          onClick={() => {
                            setSuggestOpen(false);
                            setSearch("");
                          }}
                        >
                          <span className="ss-suggest-thumb">
                            {productImage(product) && (
                              <img src={productImage(product)} alt="" loading="lazy" />
                            )}
                          </span>
                          <span className="ss-suggest-text">
                            <strong>{product.name}</strong>
                            <small>{product.category}</small>
                          </span>
                          <span className="ss-suggest-price">{formatPrice(product.price)}</span>
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="ss-suggest-empty">No matches for “{search.trim()}”.</li>
                  )}
                </ul>
              )}
            </form>

            <button
              type="button"
              className="ss-bag-button"
              onClick={() => setBagOpen(true)}
              aria-label={`Open bag, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
            >
              <BagIcon width={18} height={18} />
              <span>Bag</span>
              <span className="ss-bag-count" key={cartCount}>{cartCount}</span>
            </button>

            <button
              type="button"
              className="ss-menu-button"
              onClick={() => setMenuOpen(open => !open)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="ss-mobile-menu" aria-label="Mobile">
            {links.map(link => (
              <Link key={link.label} to={link.to} className={link.active ? "is-active" : undefined}>
                {link.label}
                {link.count > 0 && <span className="ss-nav-count">{link.count}</span>}
              </Link>
            ))}
            <a href="#footer" onClick={() => setMenuOpen(false)}>About</a>
          </nav>
        )}
      </header>

      <nav className="ss-tabbar" aria-label="Quick navigation">
        <Link to="/" className={pathname === "/" && !hash ? "is-active" : undefined}>
          <HomeIcon /><span>Home</span>
        </Link>
        <Link to="/#products" className={hash === "#products" ? "is-active" : undefined}>
          <GridIcon /><span>Shop</span>
        </Link>
        <Link to="/wishlist" className={pathname === "/wishlist" ? "is-active" : undefined}>
          <HeartIcon /><span>Wishlist</span>
          {wishlist.length > 0 && <em>{wishlist.length}</em>}
        </Link>
        <button type="button" onClick={() => setBagOpen(true)}>
          <BagIcon /><span>Bag</span>
          {cartCount > 0 && <em>{cartCount}</em>}
        </button>
        <Link to={accountPath} className={pathname === "/profile" ? "is-active" : undefined}>
          <UserIcon /><span>Account</span>
        </Link>
      </nav>
    </>
  );
}
