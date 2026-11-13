import { Link } from "react-router-dom";

export default function Logo({ onClick }) {
  return (
    <Link to="/" className="ss-logo" onClick={onClick} aria-label="ShopSphere home">
      <span className="ss-logo-mark">S</span>
      ShopSphere<span className="ss-logo-dot">.</span>
    </Link>
  );
}
