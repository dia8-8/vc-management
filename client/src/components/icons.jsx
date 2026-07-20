function IconBase({ className = "w-5 h-5", children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.5" />
      <rect x="3" y="15" width="7.5" height="6" rx="1.5" />
    </IconBase>
  );
}

export function CustomersIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 20c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.3 14.6c2.35.2 4.2 2.16 4.2 4.9" />
    </IconBase>
  );
}

export function ProductsIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M20 12.8 12.8 20 4 11.2V4h7.2L20 12.8Z" />
      <circle cx="8" cy="8" r="1.15" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function InventoryIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3.5 8 12 4l8.5 4-8.5 4-8.5-4Z" />
      <path d="M3.5 8v8.5L12 20.5l8.5-4V8" />
      <path d="M12 12v8.5" />
    </IconBase>
  );
}

export function OrdersIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M7 3.5h10a1 1 0 0 1 1 1V21l-3-2-2 2-2-2-2 2-2-2-2 2V4.5a1 1 0 0 1 1-1Z" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3" />
    </IconBase>
  );
}

export function SuppliersIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="2.5" y="7" width="11" height="9" rx="1" />
      <path d="M13.5 10h4l3 3v3h-7z" />
      <circle cx="6.5" cy="18" r="1.6" />
      <circle cx="16.5" cy="18" r="1.6" />
    </IconBase>
  );
}

export function ExpensesIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
      <circle cx="7" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function DeliveriesIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z" />
      <path d="M12.5 13 21 3" />
    </IconBase>
  );
}

export function ReportsIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4.5 19.5V4.5" />
      <path d="M4.5 19.5h15" />
      <path d="M7 15.5 11 11l3 3 5-6.5" />
      <circle cx="7" cy="15.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="11" cy="11" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="19" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function UsersAdminIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="6" y="10.5" width="12" height="9" rx="1.5" />
      <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
      <circle cx="12" cy="14.5" r="1.3" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function SettingsIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.6M12 18.4V21M21 12h-2.6M5.6 12H3M18.02 5.98l-1.84 1.84M7.82 16.18l-1.84 1.84M18.02 18.02l-1.84-1.84M7.82 7.82 5.98 5.98" />
    </IconBase>
  );
}

export function ActivityIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l3 2" />
      <path d="M9.5 2.5h5" />
    </IconBase>
  );
}

export function SunIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.6M12 18.9v2.6M21.5 12h-2.6M5.1 12H2.5M18.5 5.5l-1.84 1.84M7.34 16.66l-1.84 1.84M18.5 18.5l-1.84-1.84M7.34 7.34 5.5 5.5" />
    </IconBase>
  );
}

export function MoonIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </IconBase>
  );
}

export function ScanIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3.5 8V5.5a2 2 0 0 1 2-2H8" />
      <path d="M16 3.5h2.5a2 2 0 0 1 2 2V8" />
      <path d="M20.5 16v2.5a2 2 0 0 1-2 2H16" />
      <path d="M8 20.5H5.5a2 2 0 0 1-2-2V16" />
      <path d="M7 8.5v7M10.5 8.5v7M13 8.5v7M17 8.5v7" />
    </IconBase>
  );
}
