import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import "./App.css";
import "./Cart.css";
import "./ProductDetails.css";
import "./ProductGallery.css";
import "./Storefront.css";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductCard, { ProductCardSkeleton } from "./components/ProductCard";
import { ProductArt, ProductImage } from "./components/ProductArt";
import { ArrowIcon, PackageIcon, ShieldIcon, SparkIcon, TruckIcon } from "./components/Icons";
import { formatPrice, productImage, useStore } from "./store/StoreContext";

const PAGE_SIZE = 12;

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" }
];

const TILE_TINTS = ["blue", "peach", "mint", "lilac", "butter"];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Hero({ products, onViewDeals, hasDeals }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // One slide per category, using real products that have a photo.
  const slides = useMemo(() => {
    const seen = new Set();
    const picked = [];
    for (const product of products) {
      if (!productImage(product) || seen.has(product.category)) continue;
      seen.add(product.category);
      picked.push(product);
      if (picked.length === 4) break;
    }
    return picked;
  }, [products]);

  const activeIndex = slides.length ? index % slides.length : 0;

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const timer = setInterval(() => setIndex(i => i + 1), 6000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  const active = slides[activeIndex];

  return (
    <section className="ss-hero" id="home">
      <div className="ss-container ss-hero-grid">
        <div className="ss-hero-copy">
          <span className="ss-eyebrow">A marketplace with personality</span>
          <h1>
            Find your next <span className="ss-accent">favourite</span> thing.
          </h1>
          <p>Good products. Great discoveries. A little something for every version of you.</p>

          <div className="ss-hero-actions">
            <Link to="/#products" className="ss-btn ss-btn-primary ss-btn-lg">
              Explore the good stuff <ArrowIcon width={18} height={18} />
            </Link>
            {hasDeals && (
              <button type="button" className="ss-btn ss-btn-ghost ss-btn-lg" onClick={onViewDeals}>
                View deals
              </button>
            )}
          </div>
        </div>

        <div
          className="ss-hero-visual"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="ss-blob" aria-hidden="true" />
          <span className="ss-sticker" aria-hidden="true">New<br />finds!</span>
          <span className="ss-spark" aria-hidden="true"><SparkIcon width={44} height={44} /></span>

          <div className="ss-arch">
            {slides.length > 0 ? (
              slides.map((product, i) => (
                <ProductImage
                  key={product.id}
                  className={i === activeIndex ? "ss-arch-image is-active" : "ss-arch-image"}
                  src={productImage(product)}
                  alt={i === activeIndex ? product.name : ""}
                  fallbackType={product.art}
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ))
            ) : (
              <div className="ss-arch-art"><ProductArt type="headphones" /></div>
            )}
          </div>

          <div className="ss-hero-caption" aria-live="polite">
            {active ? (
              <Link to={`/product/${active.id}`}>
                <span>0{activeIndex + 1} / The {active.category} edit</span>
                <strong>{active.name}</strong>
                <em>{formatPrice(active.price)}</em>
              </Link>
            ) : (
              <div>
                <span>01 / The sound edit</span>
                <strong>Turn up your world.</strong>
              </div>
            )}
          </div>

          {slides.length > 1 && (
            <div className="ss-dots" role="group" aria-label="Featured products">
              {slides.map((product, i) => (
                <button
                  key={product.id}
                  type="button"
                  className={i === activeIndex ? "is-active" : undefined}
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${product.name}`}
                  aria-current={i === activeIndex}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function TrustRow() {
  const items = [
    { icon: <TruckIcon />, title: "Free delivery", text: "On orders over ₹999" },
    { icon: <PackageIcon />, title: "Easy tracking", text: "Follow every order" },
    { icon: <ShieldIcon />, title: "Secure checkout", text: "Your details stay safe" },
    { icon: <SparkIcon />, title: "Curated finds", text: "Everyday prices" }
  ];

  return (
    <div className="ss-container">
      <ul className="ss-trust">
        {items.map(item => (
          <li key={item.title}>
            <span className="ss-trust-icon">{item.icon}</span>
            <div>
              <strong>{item.title}</strong>
              <small>{item.text}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const { products, loading, error, reloadProducts, search, setSearch } = useStore();
  const { hash } = useLocation();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [activeCategory, setActiveCategory] = useState(categoryParam || "All");
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [sort, setSort] = useState("featured");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Keep the filter in sync when a footer link sets ?category=
  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
      setOnlyDeals(false);
      setVisibleCount(PAGE_SIZE);
    }
  }, [categoryParam]);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (hash) scrollToId(hash.slice(1));
  }, [hash, loading]);

  // Categories come from the real product data, so filters always match.
  const categories = useMemo(() => {
    const list = [];
    products.forEach(product => {
      if (product.category && !list.includes(product.category)) list.push(product.category);
    });
    return list;
  }, [products]);

  const hasDeals = useMemo(
    () => products.some(product => product.oldPrice > product.price),
    [products]
  );

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = products.filter(product => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const matchesDeals = !onlyDeals || product.oldPrice > product.price;
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.category || "").toLowerCase().includes(term);
      return matchesCategory && matchesDeals && matchesSearch;
    });

    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [products, activeCategory, onlyDeals, search, sort]);

  const shown = visibleProducts.slice(0, visibleCount);
  const filtersActive = activeCategory !== "All" || onlyDeals || search.trim() !== "";

  const chooseCategory = category => {
    setActiveCategory(category);
    setOnlyDeals(false);
    setVisibleCount(PAGE_SIZE);
  };

  const showDeals = () => {
    setActiveCategory("All");
    setOnlyDeals(true);
    setVisibleCount(PAGE_SIZE);
    scrollToId("products");
  };

  const clearFilters = () => {
    setActiveCategory("All");
    setOnlyDeals(false);
    setSearch("");
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="ss-page">
      <Navbar />

      <main>
        <Hero products={products} hasDeals={hasDeals} onViewDeals={showDeals} />
        <TrustRow />

        {categories.length > 0 && (
          <section className="ss-section ss-section-tinted" id="categories">
            <div className="ss-container">
              <div className="ss-section-head">
                <div>
                  <span className="ss-eyebrow">Explore your world</span>
                  <h2>Something for <span className="ss-accent">everyone.</span></h2>
                </div>
                <p>Different moods. Different needs. One happy place.</p>
              </div>

              <div className="ss-tiles">
                {categories.map((category, i) => {
                  const inCategory = products.filter(product => product.category === category);
                  const cover = inCategory.find(product => productImage(product));
                  return (
                    <button
                      type="button"
                      key={category}
                      className={`ss-tile ss-tile-${TILE_TINTS[i % TILE_TINTS.length]}`}
                      onClick={() => {
                        chooseCategory(category);
                        scrollToId("products");
                      }}
                    >
                      <span className="ss-tile-number">{String(i + 1).padStart(2, "0")}</span>
                      {cover && (
                        <span className="ss-tile-photo">
                          <img src={productImage(cover)} alt="" loading="lazy" />
                        </span>
                      )}
                      <span className="ss-tile-name">{category}</span>
                      <span className="ss-tile-meta">
                        {inCategory.length} {inCategory.length === 1 ? "item" : "items"}
                      </span>
                      <span className="ss-tile-arrow"><ArrowIcon width={18} height={18} /></span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="ss-section" id="products">
          <div className="ss-container">
            <div className="ss-section-head">
              <div>
                <span className="ss-eyebrow">The good stuff</span>
                <h2>Worth a <span className="ss-accent">closer look.</span></h2>
              </div>
              {!loading && !error && (
                <span className="ss-count">
                  {visibleProducts.length} {visibleProducts.length === 1 ? "product" : "products"}
                </span>
              )}
            </div>

            <div className="ss-toolbar">
              <div className="ss-pills" role="group" aria-label="Filter by category">
                <button
                  type="button"
                  className={activeCategory === "All" && !onlyDeals ? "is-active" : undefined}
                  onClick={() => chooseCategory("All")}
                >
                  All
                </button>
                {categories.map(category => (
                  <button
                    type="button"
                    key={category}
                    className={activeCategory === category && !onlyDeals ? "is-active" : undefined}
                    onClick={() => chooseCategory(category)}
                  >
                    {category}
                  </button>
                ))}
                {hasDeals && (
                  <button
                    type="button"
                    className={onlyDeals ? "is-active is-deal" : "is-deal"}
                    onClick={showDeals}
                  >
                    On sale
                  </button>
                )}
              </div>

              <label className="ss-sort">
                <span>Sort</span>
                <select
                  value={sort}
                  onChange={event => setSort(event.target.value)}
                >
                  {SORTS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            {search.trim() && (
              <p className="ss-search-note">
                Showing results for “{search.trim()}”.{" "}
                <button type="button" onClick={() => setSearch("")}>Clear search</button>
              </p>
            )}

            {loading && (
              <div className="ss-grid" aria-busy="true">
                {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            )}

            {!loading && error && (
              <div className="ss-state">
                <h3>We couldn’t load the products.</h3>
                <p>Check your connection and try again.</p>
                <button type="button" className="ss-btn ss-btn-primary" onClick={reloadProducts}>
                  Try again
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {shown.length > 0 ? (
                  <div className="ss-grid">
                    {shown.map(product => <ProductCard key={product.id} product={product} />)}
                  </div>
                ) : (
                  <div className="ss-state">
                    <h3>Nothing matches yet.</h3>
                    <p>Try another search or category.</p>
                    {filtersActive && (
                      <button type="button" className="ss-btn ss-btn-primary" onClick={clearFilters}>
                        Clear filters
                      </button>
                    )}
                  </div>
                )}

                {visibleProducts.length > shown.length && (
                  <div className="ss-more">
                    <button
                      type="button"
                      className="ss-btn ss-btn-ghost ss-btn-lg"
                      onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                    >
                      Show more ({visibleProducts.length - shown.length} left)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="ss-container ss-promo-wrap">
          <div className="ss-promo">
            <div className="ss-promo-copy">
              <span className="ss-eyebrow ss-eyebrow-lime">A little treat for you</span>
              <h2>Good finds.<br />Even better prices.</h2>
              <p>Discover something new without stretching your budget.</p>
              {hasDeals && (
                <button type="button" className="ss-btn ss-btn-lime ss-btn-lg" onClick={showDeals}>
                  See what’s on sale <ArrowIcon width={18} height={18} />
                </button>
              )}
            </div>
            <div className="ss-promo-sticker" aria-hidden="true">
              <span>The</span>
              <strong>Good<br />Deal</strong>
              <span>Club</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
