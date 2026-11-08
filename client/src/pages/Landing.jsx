import { useEffect, useRef, useState } from "react";
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

/* ----------------------------- content ----------------------------- */

const ROTATING_WORDS = ["orders", "inventory", "deliveries", "invoices", "profits"];

const STATS = [
  { to: 14, label: "Day free trial" },
  { to: 3, label: "Team roles" },
  { to: 2, label: "Ways to scan" },
  { to: 100, suffix: "%", label: "Private workspace" },
];

const AUDIENCE = ["Butchers", "Poultry suppliers", "Seafood wholesalers", "Produce distributors", "Dairy suppliers", "Restaurant suppliers", "Food wholesalers", "Catering supply"];

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
  { n: "2", title: "Add products & customers", text: "Enter your catalogue, prices and customers. No setup fees, no installs." },
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

const FAQ = [
  {
    q: "Is my data kept separate from other companies?",
    a: "Yes. Every company gets its own private workspace. Customers, products, orders and settings are completely isolated, and other businesses can never see yours.",
  },
  {
    q: "What happens when my free trial ends?",
    a: "Your data stays safe. Access pauses until your license is activated, and everything is exactly as you left it when you come back.",
  },
  {
    q: "Do I need a barcode scanner?",
    a: "No. You can scan with your phone's camera, or plug in any standard USB or Bluetooth scanner. It also reads item code and weight from scale-printed labels.",
  },
  {
    q: "Can my drivers use it on their phones?",
    a: "Yes. The app works in any modern browser, and drivers get a simple screen showing only their assigned deliveries, where they can mark stops out for delivery or delivered.",
  },
];

const PREVIEW_ORDERS = [
  { id: "ORD-0142", who: "Restaurant Le Bistrot", total: "$412.50", status: "Delivered", tone: "green" },
  { id: "ORD-0143", who: "Boucherie Dupont", total: "$186.20", status: "Out for delivery", tone: "blue" },
  { id: "ORD-0144", who: "Marché Central", total: "$93.75", status: "Preparing", tone: "amber" },
  { id: "ORD-0145", who: "Chez Marcel", total: "$268.00", status: "Pending", tone: "gray" },
  { id: "ORD-0146", who: "Hôtel du Parc", total: "$531.40", status: "Delivered", tone: "green" },
];

const TONES = {
  green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

/* ------------------------- small building blocks ------------------------- */

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// Fades/slides its children in the first time they scroll into view
function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}

// Counts up to a number once it scrolls into view
function CountUp({ to, prefix = "", suffix = "", duration = 1400, decimals = 0 }) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      setValue(to);
      return;
    }
    let raf;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(to * eased);
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  const text = value.toLocaleString("en-CA", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (
    <span ref={ref}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

// Cycles through words with a slide-up animation
function RotatingWord({ words }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2200);
    return () => clearInterval(t);
  }, [words.length]);

  return (
    <span className="inline-block h-[1.2em] overflow-hidden align-bottom">
      <span key={i} className="inline-block text-brand-500 dark:text-brand-400 animate-word-in motion-reduce:animate-none">
        {words[i]}
      </span>
    </span>
  );
}

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

/* --------------------------- hero app preview --------------------------- */

// A mock of the dashboard that keeps moving: numbers count up, the sales line
// draws itself, and a new order slides into the feed every few seconds.
function AppPreview() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const rows = [0, 1, 2].map((k) => PREVIEW_ORDERS[(tick + k) % PREVIEW_ORDERS.length]);

  return (
    <div className="relative max-w-3xl mx-auto mt-14 mb-6">
      {/* floating callouts */}
      <div className="hidden sm:flex absolute -bottom-5 left-6 z-10 items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-lg text-xs animate-float motion-reduce:animate-none">
        <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center">✓</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">Order delivered</span>
      </div>
      <div className="hidden sm:flex absolute -bottom-5 right-6 z-10 items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-lg text-xs animate-float-slow motion-reduce:animate-none">
        <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">!</span>
        <span className="text-gray-700 dark:text-gray-200 font-medium">Low stock: Whole Chicken</span>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl shadow-brand-500/10 overflow-hidden text-left">
        {/* window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-[11px] text-gray-400 dark:text-gray-500">Dashboard · Today's overview</span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-400">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping motion-reduce:animate-none" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
            </span>
            Live
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* stat cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Sales today", node: <CountUp to={4820} prefix="$" duration={1800} />, tone: "text-gray-900 dark:text-gray-100" },
              { label: "Orders", node: <CountUp to={38} />, tone: "text-gray-900 dark:text-gray-100" },
              { label: "Profit", node: <CountUp to={1264} prefix="$" duration={2000} />, tone: "text-green-600 dark:text-green-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-3">
                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
                <div className={`text-lg sm:text-2xl font-semibold ${s.tone}`}>{s.node}</div>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-5 gap-3">
            {/* sales chart */}
            <div className="sm:col-span-3 rounded-xl border border-gray-100 dark:border-gray-700 p-3">
              <div className="text-[11px] font-medium text-gray-700 dark:text-gray-200 mb-1">Sales, last 14 days</div>
              <svg viewBox="0 0 300 100" className="w-full h-24 sm:h-28" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="landingFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#b91c1c" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#b91c1c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[25, 50, 75].map((y) => (
                  <line key={y} x1="0" x2="300" y1={y} y2={y} className="stroke-gray-100 dark:stroke-gray-700" strokeDasharray="3 3" />
                ))}
                <path
                  d="M0 80 C 25 70, 40 78, 60 60 S 100 40, 125 52 S 170 25, 195 38 S 245 12, 300 20 L300 100 L0 100 Z"
                  fill="url(#landingFill)"
                  className="animate-fade-in motion-reduce:animate-none"
                />
                <path
                  d="M0 80 C 25 70, 40 78, 60 60 S 100 40, 125 52 S 170 25, 195 38 S 245 12, 300 20"
                  fill="none"
                  stroke="#b91c1c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="[stroke-dasharray:600] [stroke-dashoffset:600] animate-draw motion-reduce:[stroke-dashoffset:0] motion-reduce:animate-none"
                />
              </svg>
            </div>

            {/* live order feed */}
            <div className="sm:col-span-2 rounded-xl border border-gray-100 dark:border-gray-700 p-3">
              <div className="text-[11px] font-medium text-gray-700 dark:text-gray-200 mb-2">Latest orders</div>
              <div className="space-y-2">
                {rows.map((o, idx) => (
                  <div
                    key={idx === 0 ? `${tick}-${o.id}` : o.id}
                    className={`flex items-center justify-between gap-2 ${idx === 0 ? "animate-fade-up motion-reduce:animate-none" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-gray-800 dark:text-gray-100 truncate">{o.who}</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        {o.id} · {o.total}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${TONES[o.tone]}`}>{o.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- page -------------------------------- */

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL;
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header
        className={`sticky top-0 z-30 backdrop-blur border-b transition-shadow ${
          scrolled
            ? "bg-white/90 dark:bg-gray-900/90 border-gray-200 dark:border-gray-800 shadow-sm"
            : "bg-white/60 dark:bg-gray-900/60 border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold">VC</span>
            <span className="hidden sm:inline font-semibold whitespace-nowrap">Viandes Corona</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</a>
            <a href="#how" className="hover:text-gray-900 dark:hover:text-white">How it works</a>
            <a href="#plans" className="hover:text-gray-900 dark:hover:text-white">Plans</a>
            <a href="#faq" className="hover:text-gray-900 dark:hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="text-sm font-medium px-3 py-2 whitespace-nowrap rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
              Log in
            </Link>
            <Link to="/register" className="text-sm font-medium px-4 py-2 whitespace-nowrap rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-transform hover:scale-105">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-white to-white dark:from-brand-900/20 dark:via-gray-900 dark:to-gray-900" />
        {/* drifting colour blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-brand-200/60 dark:bg-brand-700/20 blur-3xl -z-10 animate-blob motion-reduce:animate-none" />
        <div className="absolute top-40 -right-24 w-96 h-96 rounded-full bg-amber-200/40 dark:bg-amber-500/10 blur-3xl -z-10 animate-blob motion-reduce:animate-none [animation-delay:-6s]" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-16 sm:pt-24 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 mb-5 animate-fade-up motion-reduce:animate-none">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse motion-reduce:animate-none" />
            Built for meat &amp; food distributors
          </span>
          <h1 className="text-3xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
            One system for all your
            <br />
            <RotatingWord words={ROTATING_WORDS} />
          </h1>
          <p className="mt-6 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Orders, inventory, deliveries, invoices and profit reports in a single, fast system that works on your desk and on your
            drivers' phones.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium shadow-lg shadow-brand-500/25 transition-all hover:-translate-y-0.5"
            >
              Start your 14-day free trial
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:-translate-y-0.5"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">No credit card required · Your data stays private to your company</p>

          <AppPreview />
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl sm:text-4xl font-bold text-brand-500 dark:text-brand-400">
                <CountUp to={s.to} suffix={s.suffix || ""} />
              </div>
              <div className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Audience marquee */}
      <section className="py-6 overflow-hidden" aria-label="Who it's for">
        <div className="flex w-max animate-marquee motion-reduce:animate-none hover:[animation-play-state:paused]">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 items-center" aria-hidden={dup === 1}>
              {AUDIENCE.map((a) => (
                <span key={a} className="flex items-center text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <span className="px-6">{a}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-300 dark:bg-brand-700" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need, nothing you don't</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">Designed around how food distributors actually work, from the first order to the last delivery.</p>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div className="group h-full rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/10 hover:border-brand-200 dark:hover:border-brand-800">
                <span className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 transition-colors duration-300 group-hover:bg-brand-500 group-hover:text-white">
                  <f.icon className="w-5 h-5" />
                </span>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-gray-50 dark:bg-gray-800/40 border-y border-gray-100 dark:border-gray-800 scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-center mb-14">Up and running in minutes</h2>
          </Reveal>
          <div className="relative grid md:grid-cols-3 gap-8">
            {/* connecting line (desktop) */}
            <div className="hidden md:block absolute top-5 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-transparent via-brand-300 dark:via-brand-700 to-transparent" />
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 140} className="text-center relative">
                <span className="inline-flex w-11 h-11 rounded-full bg-brand-500 text-white font-bold items-center justify-center mb-4 ring-4 ring-gray-50 dark:ring-gray-800 shadow-md shadow-brand-500/30">
                  {s.n}
                </span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight">One license per business</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">
            Every company gets its own private workspace and license. Start with a free trial, then pick the plan that fits.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 110} className="h-full">
              <div
                className={`relative h-full rounded-2xl p-6 flex flex-col border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  p.highlight
                    ? "border-brand-500 ring-1 ring-brand-500 bg-white dark:bg-gray-800/60 hover:shadow-brand-500/20"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:shadow-gray-500/10"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-6 text-[10px] font-semibold uppercase tracking-wide bg-brand-500 text-white px-2.5 py-1 rounded-full">
                    Start here
                  </span>
                )}
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
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 scroll-mt-20">
        <Reveal>
          <h2 className="text-3xl font-bold tracking-tight text-center mb-8">Questions, answered</h2>
        </Reveal>
        <div className="space-y-3">
          {FAQ.map((f, i) => {
            const open = openFaq === i;
            return (
              <Reveal key={f.q} delay={i * 70}>
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-sm sm:text-base"
                  >
                    {f.q}
                    <span className={`shrink-0 w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center transition-transform duration-300 ${open ? "rotate-45" : ""}`}>
                      +
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-brand-500 text-white text-center px-6 py-14">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl animate-blob motion-reduce:animate-none" />
            <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-brand-700/40 blur-2xl animate-blob motion-reduce:animate-none [animation-delay:-7s]" />
            <h2 className="relative text-2xl sm:text-3xl font-bold">Ready to get organised?</h2>
            <p className="relative mt-2 text-brand-100">Create your workspace and try every feature free for 14 days.</p>
            <Link
              to="/register"
              className="relative inline-block mt-6 px-6 py-3 rounded-xl bg-white text-brand-600 font-medium hover:bg-brand-50 transition-transform hover:scale-105"
            >
              Create your account
            </Link>
          </div>
        </Reveal>
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
