const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true
};

export const HeartIcon = ({ filled, ...props }) => (
  <svg {...base} {...props} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.8 3.6 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.4 0 5.3 3.3 4.2 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z" />
  </svg>
);

export const PlusIcon = props => (
  <svg {...base} {...props}><path d="M12 5v14M5 12h14" /></svg>
);

export const CheckIcon = props => (
  <svg {...base} {...props}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);

export const SearchIcon = props => (
  <svg {...base} {...props}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);

export const BagIcon = props => (
  <svg {...base} {...props}>
    <path d="M5 8h14l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);

export const UserIcon = props => (
  <svg {...base} {...props}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20c.9-3.6 3.8-5.4 7.5-5.4s6.6 1.8 7.5 5.4" /></svg>
);

export const HomeIcon = props => (
  <svg {...base} {...props}><path d="M4 11 12 4l8 7" /><path d="M6 10v9.5h12V10" /></svg>
);

export const GridIcon = props => (
  <svg {...base} {...props}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
);

export const CloseIcon = props => (
  <svg {...base} {...props}><path d="M6 6l12 12M18 6 6 18" /></svg>
);

export const MenuIcon = props => (
  <svg {...base} {...props}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);

export const ArrowIcon = props => (
  <svg {...base} {...props}><path d="M7 17 17 7M9 7h8v8" /></svg>
);

export const TruckIcon = props => (
  <svg {...base} {...props}>
    <path d="M3 6.5h11v9H3z" /><path d="M14 9.5h4l3 3v3h-7" />
    <circle cx="7.5" cy="17.5" r="1.8" /><circle cx="17.5" cy="17.5" r="1.8" />
  </svg>
);

export const ShieldIcon = props => (
  <svg {...base} {...props}><path d="M12 3.5 5 6v5.5c0 4.4 2.9 7.6 7 9 4.1-1.4 7-4.6 7-9V6l-7-2.5Z" /><path d="m9 12 2.2 2.2L15.2 10" /></svg>
);

export const PackageIcon = props => (
  <svg {...base} {...props}><path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2L12 3Z" /><path d="m4 7.2 8 4.3 8-4.3M12 11.5V21" /></svg>
);

export const SparkIcon = props => (
  <svg {...base} {...props}><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" /></svg>
);

export const ChevronIcon = props => (
  <svg {...base} {...props}><path d="m6 9 6 6 6-6" /></svg>
);
