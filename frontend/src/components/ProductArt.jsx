import { useState, useEffect } from "react";

export function ProductArt({ type }) {
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


export function ProductImage({ src, alt, className, fallbackType, loading = "lazy" }) {
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
