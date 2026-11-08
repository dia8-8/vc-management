import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  OrdersIcon,
  InventoryIcon,
  ScanIcon,
  DeliveriesIcon,
  ReportsIcon,
  UsersAdminIcon,
  SunIcon,
  MoonIcon,
} from "../components/icons";

const FEATURES = [
  {
    icon: OrdersIcon,
    title: "Orders & invoices",
    text: "Take orders, apply customer-specific prices, record partial payments and print clean invoices in a click.",
  },
  {
    icon: InventoryIcon,
    title: "Live inventory",
    text: "Stock deducts automatically when an order is placed, restocks on cancellation, and low-stock alerts keep you ahead.",
  },
  {
    icon: ScanIcon,
    title: "Barcode & scale labels",
    text: "Scan with a USB scanner or your phone camera. Read item codes and weights straight from scale-printed labels.",
  },
  {
    icon: DeliveriesIcon,
    title: "Delivery dispatch",
    text: "Assign orders to drivers, track each stop from preparing to delivered, and let drivers update status from their phone.",
  },
  {
    icon: ReportsIcon,
    title: "Reports that matter",
    text: "Sales, expenses and profit over any date range, with your top products and best customers at a glance.",
  },
  {
    icon: UsersAdminIcon,
    title: "Teams & permissions",
    text: "Admin, staff and driver roles, plus an activity log so you always know who changed what.",
  },
];

const STEPS = [
  { n: "1", title: "Create your account", text: "Sign up in a minute. Your business gets its own private workspace." },
  { n: "2", title: "Add products & customers", text: "Enter your catalogue, prices and customers. Import as you go, no setup fees." },
  { n: "3", title: "Run your day", text: "Take orders, dispatch deliveries and watch stock and profit update in real time." },
];

const PLANS = [
  {
    name: "Free trial",
    tag: "14 days",
    blurb: "Everything in Pro, to try with your real data.",
    items: ["All features unlocked", "Up to 3 users", "No credit card required"],
    cta: { label: "Start free trial", to: "/register" },
    highlight: true,
  },
  {
    name: "Basic",
    tag: "Core operations",
    blurb: "For counters and small distributors getting organised.",
    items: ["Customers & products", "Inventory & suppliers", "Orders, payments & invoices", "Expenses tracking"],
    cta: { label: "Get in touch", contact: true },
  },
  {
    name: "Pro",
    tag: "Full platform",
    blurb: "For growing operations with drivers and a warehouse.",
    items: ["Everything in Basic", "Delivery dispatch & driver accounts", "Barcode & scale-label scanning", "Reports & profit tracking", "Full activity log"],
    cta: { label: "Get in touch", contact: true },
  },
];

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 mt-0.5 shrink-0 text-brand-500 dark:text-brand-400" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold">VC</span>
            <span className="font-semibold">Viandes Corona</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</a>
            <a href="#how" className="hover:text-gray-900 dark:hover:text-white">How it works</a>
            <a href="#plans" className="hover:text-gray-900 dark:hover:text-white">Plans</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="text-sm font-medium px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
              Log in
            </Link>
            <Link to="/register" className="text-sm font-medium px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-900/20 dark:via-gray-900 dark:to-gray-900" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 mb-5">
            Built for meat &amp; food distributors
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Run your whole distribution business from <span className="text-brand-500 dark:text-brand-400">one place</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Orders, inventory, deliveries, invoices and profit reports in a single, fast system that works on your desk and on your
            drivers' phones.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-sm">
              Start your 14-day free trial
            </Link>
            <Link to="/login" className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
              I already have an account
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">No credit card required · Your data stays private to your company</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need, nothing you don't</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">Designed around how food distributors actually work, from the first order to the last delivery.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6">
              <span className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5" />
              </span>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-gray-50 dark:bg-gray-800/40 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Up and running in minutes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <span className="inline-flex w-11 h-11 rounded-full bg-brand-500 text-white font-bold items-center justify-center mb-4">{s.n}</span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight">One license per business</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Every company gets its own private workspace and license. Start with a free trial, then pick the plan that fits.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-6 flex flex-col border ${
                p.highlight
                  ? "border-brand-500 ring-1 ring-brand-500 bg-white dark:bg-gray-800/60"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">{p.tag}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{p.blurb}</p>
              <ul className="mt-5 space-y-2.5 text-sm flex-1">
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <Check />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
              {p.cta.to ? (
                <Link to={p.cta.to} className="mt-6 text-center text-sm font-medium px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white">
                  {p.cta.label}
                </Link>
              ) : contactEmail ? (
                <a
                  href={`mailto:${contactEmail}?subject=${encodeURIComponent(`${p.name} plan`)}`}
                  className="mt-6 text-center text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {p.cta.label}
                </a>
              ) : (
                <Link to="/register" className="mt-6 text-center text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Try it free first
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-3xl bg-brand-500 text-white text-center px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold">Ready to get organised?</h2>
          <p className="mt-2 text-brand-100">Create your workspace and try every feature free for 14 days.</p>
          <Link to="/register" className="inline-block mt-6 px-6 py-3 rounded-xl bg-white text-brand-600 font-medium hover:bg-brand-50">
            Create your account
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>© {new Date().getFullYear()} Viandes Corona. All rights reserved.</span>
          <span className="flex items-center gap-4">
            <Link to="/login" className="hover:underline">Log in</Link>
            <Link to="/register" className="hover:underline">Register</Link>
            {contactEmail && <a href={`mailto:${contactEmail}`} className="hover:underline">Contact</a>}
          </span>
        </div>
      </footer>
    </div>
  );
}
