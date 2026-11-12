
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";
import "./Cart.css";
import "./ProductDetails.css";
import "./ProductGallery.css";

const categories = ["All", "Tech", "Style", "Home", "Beauty", "Everyday"];

function ProductArt({ type }) {
  const drawings = {
    headphones: <>
      <path d="M55 95 V75 C55 25 145 25 145 75 V95"
        fill="none" stroke="#252831" strokeWidth="13" strokeLinecap="round"/>
      <rect x="43" y="82" width="30" height="65" rx="13" fill="#526DE8"/>
      <rect x="127" y="82" width="30" height="65" rx="13" fill="#252831"/>
      <rect x="49" y="91" width="18" height="46" rx="8" fill="#AFC0FF"/>
      <rect x="133" y="91" width="18" height="46" rx="8" fill="#7888A0"/>
    </>,
    watch: <>
      <rect x="83" y="10" width="34" height="45" rx="12" fill="#414852"/>
      <rect x="83" y="125" width="34" height="45" rx="12" fill="#414852"/>
      <rect x="58" y="43" width="84" height="94" rx="25" fill="#242A34"/>
      <rect x="67" y="53" width="66" height="74" rx="18" fill="#A9E4CF"/>
      <circle cx="100" cy="90" r="23" fill="none" stroke="#315BE8" strokeWidth="5"/>
      <path d="M100 90 L100 72 M100 90 L116 98"
        stroke="#315BE8" strokeWidth="4" strokeLinecap="round"/>
    </>,
    lamp: <>
      <path d="M100 38 L65 100 H135 Z"
        fill="#F2A36E" stroke="#252831" strokeWidth="5"/>
      <path d="M100 100 V151 M70 155 H130"
        stroke="#252831" strokeWidth="7" strokeLinecap="round"/>
      <circle cx="100" cy="106" r="24" fill="#FFE0A6" opacity=".6"/>
    </>,
    sneaker: <>
      <path d="M34 112 Q55 105 74 65 Q86 55 97 80 L132 103 Q151 105 165 119 Q173 133 158 143 H42 Q23 138 34 112Z"
        fill="#FFFFFF" stroke="#252831" strokeWidth="5"/>
      <path d="M74 87 L105 104 M66 98 L96 115 M58 108 L86 125"
        stroke="#315BE8" strokeWidth="5" strokeLinecap="round"/>
      <path d="M35 132 Q88 145 166 128"
        fill="none" stroke="#F07861" strokeWidth="7"/>
    </>,
    bottle: <>
      <rect x="85" y="25" width="30" height="19" rx="5" fill="#252831"/>
      <rect x="69" y="43" width="62" height="111" rx="21"
        fill="#9ACFBD" stroke="#252831" strokeWidth="5"/>
      <path d="M80 60 V125" stroke="#D9F5E8" strokeWidth="8" strokeLinecap="round"/>
      <path d="M85 93 H115" stroke="#FFFFFF" strokeWidth="3"/>
    </>,
    serum: <>
      <rect x="87" y="24" width="26" height="25" rx="5" fill="#252831"/>
      <rect x="94" y="10" width="12" height="17" rx="4" fill="#252831"/>
      <rect x="69" y="47" width="62" height="105" rx="13"
        fill="#F5C8AF" stroke="#252831" strokeWidth="5"/>
      <rect x="80" y="68" width="40" height="45" rx="5" fill="#FFF1E8"/>
      <path d="M90 89 H110" stroke="#E77B62" strokeWidth="4"/>
    </>
  };

  return drawings[type] ? (
    <svg viewBox="0 0 200 180" className="product-art">
      {drawings[type]}
    </svg>
  ) : (
    <div className="product-art-emoji" aria-label="Product illustration">
      {type || "📦"}
    </div>
  );
}


function ProductImage({ src, alt, className, fallbackType, loading = "lazy" }) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (failed) {
    return (
      <span className={`${className || ""} product-image-fallback`} role="img" aria-label={alt}>
        <ProductArt type={fallbackType} />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

function App() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState(null);

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopSphereCart")) || [];
    } catch {
      return [];
    }
  });

  // Product details states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [selectedVariantColor, setSelectedVariantColor] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem("shopSphereCart", JSON.stringify(cartItems));
    } catch {
      // Ignore localStorage write error
    }
  }, [cartItems]);

  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then(response => {
        if (!response.ok) throw new Error("Failed to fetch products");
        return response.json();
      })
      .then(data => setProducts(data))
      .catch(error => {
        console.error(error);
        setError("Unable to load products.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Load the signed-in customer from the Flask session.
  // The server session is authoritative; localStorage is not used for authentication.
  useEffect(() => {
    let cancelled = false;

    fetch("http://localhost:5000/api/customer/me", {
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
      .catch(error => {
        console.error("Unable to check customer session:", error);
        if (!cancelled) setCustomer(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = (product, quantity = 1) => {
    setCartItems(previousItems => {
      const existing = previousItems.find(item => item.id === product.id);

      if (existing) {
        return previousItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...previousItems, { ...product, quantity }];
    });
  };

  const increaseQuantity = id => {
    setCartItems(items => items.map(item =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const decreaseQuantity = id => {
    setCartItems(items => items.map(item =>
      item.id === id ? { ...item, quantity: item.quantity - 1 } : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = id => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity, 0
  );

  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity, 0
  );

  const delivery = cartItems.length === 0 ? 0 : subtotal >= 999 ? 0 : 49;
  const total = subtotal + delivery;

  const formatPrice = price =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(price);

  const visibleProducts = products.filter(product => {
    const matchesCategory =
      activeCategory === "All" || product.category === activeCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

 
const openProduct = async (product) => {
  try {
    const response = await fetch("http://localhost:5000/api/products");
    const latestProducts = await response.json();

    const latestProduct = latestProducts.find(
      item => Number(item.id) === Number(product.id)
    ) || product;

    setProducts(latestProducts);
    setSelectedProduct(latestProduct);
    setDetailQuantity(1);

    const initialColor = latestProduct.variants?.[0]?.color || "";
    setSelectedVariantColor(initialColor);
    setActiveImageIndex(0);

    window.scrollTo({ top: 0, behavior: "smooth" });

  } catch (error) {
    console.error("Error refreshing product:", error);
    setSelectedProduct(product);
  }
};


  const selectedVariant = selectedProduct?.variants?.find(
    variant => variant.color === selectedVariantColor
  ) || selectedProduct?.variants?.[0];

  const detailImages = selectedVariant?.images?.length
    ? selectedVariant.images
    : (selectedProduct?.images?.length
        ? selectedProduct.images
        : (selectedProduct?.image ? [selectedProduct.image] : []));

  const activeDetailImage = detailImages[activeImageIndex] || detailImages[0] || selectedProduct?.image || "";

  const productDescription = {
    Tech: "Discover smart technology designed to make your everyday life easier, more productive and more enjoyable.",
    Style: "A carefully selected style essential combining everyday comfort with a distinctive modern look.",
    Home: "Bring comfort and personality to your space with this thoughtfully designed everyday essential.",
    Beauty: "A daily-care essential designed to make your personal care routine feel a little more special.",
    Everyday: "A practical everyday companion designed for convenience, durability and simple living."
  };

  const specifications = {
    Tech: ["Category: Electronics", "Warranty: 1 year", "Availability: In stock"],
    Style: ["Category: Fashion", "Material: Premium quality", "Availability: In stock"],
    Home: ["Category: Home & Living", "Design: Modern", "Availability: In stock"],
    Beauty: ["Category: Beauty", "Usage: Personal care", "Availability: In stock"],
    Everyday: ["Category: Everyday essentials", "Usage: Daily use", "Availability: In stock"]
  };

  return (
    <div className="shop-page">

      <div className="announcement">
        YOUR NEXT FAVOURITE THING IS JUST AROUND THE CORNER.
        <span> FREE SHIPPING ON ORDERS OVER ₹999 ↗</span>
      </div>

      <header className="navbar">
        <a href="#home" className="logo">
          <span className="logo-mark">S</span>
          ShopSphere<span className="logo-dot">.</span>
        </a>

        <nav className="nav-links">
          <a href="#home" onClick={() => setSelectedProduct(null)}>Home</a>
          <a href="#categories" onClick={() => setSelectedProduct(null)}>Categories</a>
          <a href="#products" onClick={() => setSelectedProduct(null)}>Shop</a>
          <Link to="/orders">Orders</Link>
          <Link to="/wishlist">Wishlist</Link>
          {customer ? <Link to="/profile">Account</Link> : <Link to="/login">Account</Link>}
          <a href="#footer">About</a>
        </nav>

        <div className="nav-actions">
          {customer && (
            <Link
              to="/profile"
              className="customer-name"
              title={customer.email}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#202126",
                whiteSpace: "nowrap"
              }}
            >
              Hi, {customer.name}
            </Link>
          )}

          <div className="search-box">
            <span>⌕</span>
            <input
              placeholder="Find something..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setSelectedProduct(null);
              }}
            />
          </div>

          <a href="#cart" className="cart-button">
            Bag ({cartCount})
          </a>
        </div>
      </header>

      <main>

        {!selectedProduct ? (
          <>
            <section className="hero" id="home">
              <div className="hero-content">
                <span className="eyebrow">A MARKETPLACE WITH PERSONALITY ✳</span>
                <h1>Find your<br />next <span>favourite</span><br />thing.</h1>
                <p>
                  Good products. Great discoveries.
                  A little something for every version of you.
                </p>
                <a href="#products" className="primary-button">
                  Explore the good stuff ↗
                </a>
                <div className="hero-note">
                  <span>✳</span> Curated finds. Everyday prices.
                </div>
              </div>

              <div className="hero-visual">
                <div className="hero-circle"></div>
                <span className="floating-star">✳</span>
                <span className="floating-label">NEW<br />FINDS!</span>
                <div className="hero-product">
                  <ProductArt type="headphones" />
                </div>
                <div className="hero-caption">
                  <span>01 / THE SOUND EDIT</span>
                  <strong>Turn up your world.</strong>
                </div>
              </div>
            </section>

            <section className="category-section" id="categories">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">EXPLORE YOUR WORLD</span>
                  <h2>Something for <em>everyone.</em></h2>
                </div>
                <p>Different moods. Different needs. One happy place.</p>
              </div>

              <div className="category-grid">
                {categories.filter(c => c !== "All").map((category, index) => (
                  <button
                    key={category}
                    className={`category-card category-${index + 1}`}
                    onClick={() => {
                      setActiveCategory(category);
                      document.getElementById("products").scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    <span className="category-number">0{index + 1}</span>
                    <span className="category-symbol">
                      {["◈", "✳", "⌂", "✿", "○"][index]}
                    </span>
                    <strong>{category}</strong>
                    <span className="category-arrow">↗</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="details-section">
            <button
              className="back-button"
              onClick={() => setSelectedProduct(null)}
            >
              ← Back to shopping
            </button>

            <div className="details-layout">
              <div className="product-gallery">
                <div className="gallery-container">
                  {detailImages.length > 1 && (
                    <div className="gallery-thumbnails" role="tablist" aria-label="Product thumbnails">
                      {detailImages.map((image, index) => (
                        <button
                          type="button"
                          key={`${image}-${index}`}
                          className={activeImageIndex === index ? "gallery-thumbnail active" : "gallery-thumbnail"}
                          onClick={() => setActiveImageIndex(index)}
                          aria-label={`View image ${index + 1}`}
                          aria-selected={activeImageIndex === index}
                        >
                          <ProductImage
                            src={image}
                            alt={`${selectedProduct.name} thumbnail ${index + 1}`}
                            className="gallery-thumbnail-image"
                            fallbackType={selectedProduct.art}
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="gallery-main-container">
                    {selectedProduct.label && (
                      <span className="details-label">{selectedProduct.label}</span>
                    )}
                    <div className="gallery-main-viewport">
                      <ProductImage
                        src={activeDetailImage}
                        alt={selectedProduct.name}
                        className="gallery-main-image"
                        fallbackType={selectedProduct.art}
                        loading="eager"
                      />
                    </div>
                    <span className="details-art-caption">✳ SHOPSPHERE SELECT</span>
                  </div>
                </div>
              </div>
                
              <div className="details-info">
                <span className="eyebrow">{selectedProduct.category} / PRODUCT DETAILS</span>

                <h1>{selectedProduct.name}</h1>

                <div className="details-rating">
                  <span>★★★★★</span> <small>Customer favourite</small>
                </div>

                <div className="details-price">
                  <strong>{formatPrice(selectedProduct.price)}</strong>
                  {selectedProduct.oldPrice && (
                    <>
                      <del>{formatPrice(selectedProduct.oldPrice)}</del>
                      <span className="discount-label">
                        {Math.round((selectedProduct.oldPrice - selectedProduct.price) / selectedProduct.oldPrice * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>

                <p className="details-description">
                  {productDescription[selectedProduct.category] ||
                    `Explore this ${selectedProduct.category} product, designed for everyday use.`}
                </p>

                <div className="stock-message">
                  <span>●</span> In stock and ready to ship
                </div>

                {selectedProduct.variants?.length > 0 && (
                  <div className="variant-selector">
                    <div className="variant-header">
                      <span className="variant-label">Colour:</span>
                      <strong className="variant-value">{selectedVariantColor || "Default"}</strong>
                    </div>
                    <div className="variant-options">
                      {selectedProduct.variants.map(variant => (
                        <button
                          type="button"
                          key={variant.color}
                          className={selectedVariantColor === variant.color ? "variant-option active" : "variant-option"}
                          onClick={() => {
                            setSelectedVariantColor(variant.color);
                            setActiveImageIndex(0);
                          }}
                        >
                          {variant.color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="details-quantity">
                  <strong>Quantity</strong>
                  <div className="quantity-controls">
                    <button
                      onClick={() => setDetailQuantity(q => Math.max(1, q - 1))}
                    >−</button>
                    <span>{detailQuantity}</span>
                    <button
                      onClick={() => setDetailQuantity(q => q + 1)}
                    >+</button>
                  </div>
                </div>

                <button
                  className="details-add-button"
                  onClick={() => {
                    addToCart(selectedProduct, detailQuantity);
                    setSelectedProduct(null);
                  }}
                >
                  Add {detailQuantity} to bag · {formatPrice(selectedProduct.price * detailQuantity)}
                </button>

                <div className="details-benefits">
                  <p>✳ Free delivery on orders above ₹999</p>
                  <p>✳ Secure demo checkout</p>
                  <p>✳ Easy order tracking</p>
                </div>
              </div>
            </div>

            <div className="specifications">
              <span className="eyebrow">KNOW YOUR PRODUCT</span>
              <h2>Product <em>information.</em></h2>
              <div className="specification-grid">
                {(specifications[selectedProduct.category] || [
                  `Category: ${selectedProduct.category}`,
                  "Quality: Premium",
                  "Availability: In stock"
                ]).map((spec, index) => (
                  <div key={index} className="specification-item">
                    <span>0{index + 1}</span>
                    <strong>{spec}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {!selectedProduct && (
          <section className="products-section" id="products">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE GOOD STUFF</span>
                <h2>Worth a <em>closer look.</em></h2>
              </div>
              <span className="product-count">{visibleProducts.length} PRODUCTS</span>
            </div>

            <div className="filter-bar">
              <div className="filter-buttons">
                {categories.map(category => (
                  <button
                    key={category}
                    className={activeCategory === category ? "filter active" : "filter"}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {loading && <p className="empty-message">Loading products...</p>}
            {error && <p className="empty-message">{error}</p>}

            {!loading && !error && (
              <>
                <div className="product-grid">
                  {visibleProducts.map(product => (
                    <article className="product-card" key={product.id}>
                      <div
                        className={`product-art-box ${product.color}`}
                        onClick={() => openProduct(product)}
                        role="button"
                      >
                        <span className="product-label">{product.label}</span>
                        <ProductImage
                          className="product-card-image"
                          src={product.images?.[0] || product.image}
                          alt={product.name}
                          fallbackType={product.art}
                        />
                        <button
                          className="wishlist-button"
                          onClick={e => e.stopPropagation()}
                        >♡</button>
                      </div>

                      <div className="product-info">
                        <div>
                          <span className="product-category">{product.category}</span>
                          <h3>{product.name}</h3>
                        </div>

                        <div className="price-row">
                          <strong>{formatPrice(product.price)}</strong>
                          {product.oldPrice && <del>{formatPrice(product.oldPrice)}</del>}
                        </div>

                        <button
                          className="view-details-button"
                          onClick={() => openProduct(product)}
                        >
                          View details ↗
                        </button>

                        <button
                          className="add-button"
                          onClick={() => addToCart(product)}
                        >
                          Add to bag <span>+</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {visibleProducts.length === 0 && (
                  <p className="empty-message">No products found. Try another search.</p>
                )}
              </>
            )}
          </section>
        )}

        {/* SHOPPING CART */}

        <section className="cart-section" id="cart">
          <div className="section-heading">
            <div>
              <span className="eyebrow">YOUR SELECTED FINDS</span>
              <h2>Your shopping <em>bag.</em></h2>
            </div>
            <span className="product-count">{cartCount} ITEMS</span>
          </div>

          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <span className="empty-cart-icon">♡</span>
              <h3>Your bag is taking a break.</h3>
              <p>Add something you love and it will appear here.</p>
              <a href="#products" className="primary-button">Explore products ↗</a>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                {cartItems.map(item => (
                  <article className="cart-item" key={item.id}>
                    <div className={`cart-item-art ${item.color}`}>
                      {item.images?.[0] ? (
                        <img className="cart-product-image" src={item.images[0]} alt={item.name} />
                      ) : (
                        <ProductArt type={item.art} />
                      )}
                    </div>

                    <div className="cart-item-details">
                      <span>{item.category}</span>
                      <h3>{item.name}</h3>
                      <strong>{formatPrice(item.price)}</strong>

                      <div className="quantity-controls">
                        <button onClick={() => decreaseQuantity(item.id)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => increaseQuantity(item.id)}>+</button>
                      </div>
                    </div>

                    <div className="cart-item-end">
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                      <button className="remove-button" onClick={() => removeFromCart(item.id)}>
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="order-summary">
                <span className="eyebrow">ORDER SUMMARY</span>
                <h3>Almost yours.</h3>

                <div className="summary-row">
                  <span>Items ({cartCount})</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>

                <div className="summary-row">
                  <span>Delivery</span>
                  <strong>{delivery === 0 ? "FREE" : formatPrice(delivery)}</strong>
                </div>

                {delivery === 0 && (
                  <p className="delivery-message">✳ You've unlocked free delivery!</p>
                )}

                <div className="summary-total">
                  <span>Total</span>
                  <strong>{formatPrice(total)}</strong>
                </div>

                <button
                  className="checkout-button"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to checkout ↗
                </button>
                <p className="summary-note">Demo checkout. No payment will be charged.</p>
              </div>
            </div>
          )}
        </section>

        <section className="promo-section">
          <div>
            <span className="eyebrow">A LITTLE TREAT FOR YOU</span>
            <h2>Good finds.<br />Even better prices.</h2>
            <p>Discover something new without stretching your budget.</p>
          </div>
          <div className="promo-sticker">
            <span>THE</span>
            <strong>GOOD<br />DEAL</strong>
            <span>CLUB ✳</span>
          </div>
        </section>

      </main>

      <footer id="footer">
        <a href="#home" className="logo">
          <span className="logo-mark">S</span>
          ShopSphere<span className="logo-dot">.</span>
        </a>
        <p>Good products. Unexpected discoveries.</p>
        <span>
          © 2026 ShopSphere · <Link to="/admin" style={{ color: "inherit", textDecoration: "underline" }}>Admin Portal</Link>
        </span>
      </footer>

    </div>
  );
}

export default App;
