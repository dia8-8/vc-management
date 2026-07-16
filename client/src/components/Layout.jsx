import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  DashboardIcon,
  CustomersIcon,
  ProductsIcon,
  InventoryIcon,
  OrdersIcon,
  SuppliersIcon,
  ExpensesIcon,
  DeliveriesIcon,
  ReportsIcon,
  UsersAdminIcon,
  SettingsIcon,
  ActivityIcon,
  SunIcon,
  MoonIcon,
} from "./icons";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: DashboardIcon, end: true },
  { to: "/customers", label: "Customers", icon: CustomersIcon },
  { to: "/products", label: "Products", icon: ProductsIcon },
  { to: "/inventory", label: "Inventory", icon: InventoryIcon },
  { to: "/orders", label: "Orders", icon: OrdersIcon },
  { to: "/suppliers", label: "Suppliers", icon: SuppliersIcon },
  { to: "/expenses", label: "Expenses", icon: ExpensesIcon },
  { to: "/deliveries", label: "Deliveries", icon: DeliveriesIcon },
  { to: "/reports", label: "Reports", icon: ReportsIcon },
];

const ADMIN_NAV_ITEMS = [
  { to: "/users", label: "Users", icon: UsersAdminIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/activity-log", label: "Activity Log", icon: ActivityIcon },
];

const DRIVER_NAV_ITEMS = [{ to: "/deliveries", label: "Deliveries", icon: DeliveriesIcon, end: true }];

const MOBILE_NAV_ITEMS = [
  { to: "/", label: "Home", icon: DashboardIcon, end: true },
  { to: "/orders", label: "Orders", icon: OrdersIcon },
  { to: "/customers", label: "Clients", icon: CustomersIcon },
  { to: "/products", label: "Products", icon: ProductsIcon },
  { to: "/inventory", label: "Stock", icon: InventoryIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isDriver = user?.role === "DRIVER";
  const items = isDriver ? DRIVER_NAV_ITEMS : user?.role === "ADMIN" ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;
  const mobileBottomItems = isDriver ? DRIVER_NAV_ITEMS : MOBILE_NAV_ITEMS;
  const mobileExtraItems = isDriver ? [] : NAV_ITEMS.filter((i) => !MOBILE_NAV_ITEMS.some((m) => m.to === i.to));

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed inset-y-0 left-0">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-200 dark:border-gray-700">
          <span className="w-9 h-9 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold">VC</span>
          <div className="leading-tight">
            <div className="font-semibold text-sm dark:text-gray-100">Viandes Corona</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Management</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="px-3 py-2 text-sm">
            <div className="font-medium dark:text-gray-100">{user?.name}</div>
            <div className="text-gray-500 dark:text-gray-400 text-xs">{user?.role}</div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-2 md:hidden">
            <span className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-sm">VC</span>
            <span className="font-semibold text-sm dark:text-gray-100">Viandes Corona</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="text-gray-600 dark:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button
              className="md:hidden text-sm font-medium text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {user?.name?.split(" ")[0] || "Menu"} ▾
            </button>
          </div>
        </header>

        {menuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            {mobileExtraItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex items-center gap-2.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300"
                onClick={() => setMenuOpen(false)}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
            {user?.role === "ADMIN" &&
              ADMIN_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-2.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300"
                  onClick={() => setMenuOpen(false)}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            <button onClick={handleLogout} className="block w-full text-left py-2 text-sm font-medium text-red-600 dark:text-red-400">
              Log out
            </button>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around py-1.5 z-30">
        {mobileBottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-medium ${
                isActive ? "text-brand-600 dark:text-brand-400" : "text-gray-500 dark:text-gray-400"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
