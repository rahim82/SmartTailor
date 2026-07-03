import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { 
  ArrowRight, 
  CalendarDays, 
  CreditCard, 
  Ruler, 
  Search, 
  ShieldCheck, 
  Workflow, 
  Star, 
  MapPin, 
  Scissors, 
  Store,
  Clock,
  Sparkles
} from "lucide-react";

const features = [
  { icon: Ruler, title: "Digital Measurements", text: "Save reusable customer profiles for every garment type." },
  { icon: Workflow, title: "Order Pipeline Tracking", text: "Track cutting, stitching, trial, ready, and delivery stages." },
  { icon: CreditCard, title: "Payments Logging", text: "Collect advance, balance, cash, and Razorpay payments." },
  { icon: CalendarDays, title: "Delivery Calendar", text: "Prioritize due dates and reduce missed commitments." }
];

const popularServices = ["Blouse", "Kurta", "Alteration", "Lehenga", "Shirt", "Trousers"];

const tailorImages = ["/boutique_shop_1.png", "/boutique_shop_2.png", "/boutique_shop_3.png"];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityInput, setCityInput] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  async function fetchTailors() {
    try {
      setLoading(true);
      const params = {};
      if (cityInput.trim()) params.city = cityInput.trim();
      if (serviceFilter) params.service = serviceFilter;

      const { data } = await api.get("/tailors", { params });
      setTailors(data.tailors || []);
    } catch (err) {
      console.error("Failed to load tailors list:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTailors();
  }, [serviceFilter]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchTailors();
  }

  function handleBooking(tailor) {
    if (!user) {
      navigate("/auth", { 
        state: { 
          from: "/customer", 
          selectedTailorId: tailor._id 
        } 
      });
    } else if (user.role === "customer") {
      navigate("/customer", { 
        state: { 
          selectedTailorId: tailor._id 
        } 
      });
    } else {
      alert(`You are logged in as a ${user.role}. Only customer accounts can book tailor orders.`);
    }
  }

  return (
    <main className="relative min-h-screen bg-linen overflow-hidden">
      {/* Sleek Gradient Blobs & SVGs for Premium Vibe */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-saffron/25 blur-[120px]" />
        <div className="absolute top-[25%] -right-[15%] w-[800px] h-[800px] rounded-full bg-stitch/25 blur-[150px]" />
        <div className="absolute -bottom-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-saffron/20 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Floating Outline Tailoring Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none hidden lg:block select-none opacity-90">
        <div className="absolute left-[7%] top-[18%] text-saffron/35 transform -rotate-12 animate-bounce" style={{ animationDuration: "5s" }}>
          <Scissors size={76} strokeWidth={1} />
        </div>
        <div className="absolute right-[8%] top-[25%] text-stitch/35 transform rotate-45 animate-pulse" style={{ animationDuration: "4s" }}>
          <Ruler size={84} strokeWidth={1} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 border-b border-black/[0.06] bg-transparent">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28 text-center flex flex-col items-center">
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl leading-[1.1]">
            Boutique Tailoring, <span className="text-stitch">Digitized & Tracked.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-md leading-relaxed text-ink/75">
            SmartTailor connects customers with premium boutique tailors. Track cutting, stitching, trials, and payments digitally, replacing manual notebooks for local shops.
          </p>
          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row justify-center w-full sm:w-auto">
            <a href="#marketplace" className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-6 py-3.5 font-semibold text-white shadow-soft transition hover:bg-ink/90">
              Browse Nearby Tailors <ArrowRight size={18} />
            </a>
            <Link to="/auth?role=tailor" className="inline-flex items-center justify-center gap-2 rounded-md border border-black/15 bg-white px-6 py-3.5 font-semibold text-ink/80 transition hover:bg-black/[0.02]">
              Register My Tailor Shop
            </Link>
          </div>
        </div>
      </section>

      {/* Discovery Section */}
      <section id="marketplace" className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 scroll-mt-10">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-stitch">Discover Partners</p>
          <h2 className="text-3xl font-extrabold text-ink sm:text-4xl mt-2 leading-tight">Find Your Custom Stitching Shop</h2>
          <p className="mt-4 text-md text-ink/70 leading-relaxed">
            Filter our network of verified boutique tailors by city or specialty service, view their stitching works, and place order requests directly.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl border border-black/10 bg-white/60 p-4 backdrop-blur-md shadow-sm md:flex-row">
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-md items-center gap-2">
            <div className="relative flex-1">
              <MapPin size={16} className="absolute left-3.5 top-3.5 text-ink/40" />
              <input
                type="text"
                placeholder="Search by city (e.g. Jaipur, Indore)..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="w-full rounded-md border border-black/15 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-stitch focus:bg-white"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90 shadow-sm"
            >
              <Search size={14} /> Search
            </button>
          </form>

          {/* Service Filters */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setServiceFilter("")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all duration-200 ${
                !serviceFilter 
                  ? "bg-stitch text-white border-stitch shadow-sm" 
                  : "bg-white text-ink/75 border-black/10 hover:bg-black/[0.02]"
              }`}
            >
              All Services
            </button>
            {popularServices.map((service) => (
              <button
                key={service}
                onClick={() => setServiceFilter(service)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all duration-200 ${
                  serviceFilter === service 
                    ? "bg-stitch text-white border-stitch shadow-sm" 
                    : "bg-white text-ink/75 border-black/10 hover:bg-black/[0.02]"
                }`}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        {/* Tailors Grid list */}
        {loading ? (
          <div className="py-24 text-center text-sm font-semibold text-ink/50 flex flex-col items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-stitch border-t-transparent" />
            Searching verified tailor boutiques...
          </div>
        ) : tailors.length === 0 ? (
          <div className="py-20 text-center border border-black/10 rounded-2xl bg-white/50 backdrop-blur shadow-sm mt-8 max-w-lg mx-auto">
            <Store className="mx-auto text-ink/30 mb-3" size={40} />
            <h3 className="font-bold text-ink text-sm">No Boutique Shops Found</h3>
            <p className="text-xs text-ink/50 mt-1.5 px-6">
              There are no verified shops matching your queries. Ensure you have run the database seed script to initialize Meena Boutique.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tailors.map((tailor, index) => {
              const imageSrc = (tailor.portfolioImages && tailor.portfolioImages.length > 0 && tailor.portfolioImages[0].url) 
                ? tailor.portfolioImages[0].url 
                : tailorImages[index % tailorImages.length];
              return (
                <div 
                  key={tailor._id} 
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-black/10 bg-white/80 backdrop-blur-md shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-stitch/30 hover:shadow-soft"
                >
                  <div>
                    {/* Tailor Shop Image Section */}
                    <div className="relative h-48 w-full overflow-hidden bg-black/5 border-b border-black/5">
                      <img
                        src={imageSrc}
                        alt={tailor.shopName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Saffron ratings badge overlay */}
                      <div className="absolute right-3.5 top-3.5 flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-extrabold text-saffron shadow-sm border border-saffron/10">
                        <Star size={12} className="fill-saffron" />
                        {tailor.ratingAvg || "0.0"}
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-ink group-hover:text-stitch transition-colors">{tailor.shopName}</h3>
                          <p className="mt-1 text-xs text-ink/55 flex items-center gap-1">
                            <MapPin size={12} /> {tailor.location?.address}, {tailor.location?.city}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3.5 text-xs text-ink/75 leading-relaxed min-h-[36px]">
                        {tailor.description || "Boutique tailoring partners specialising in custom stitching work."}
                      </p>

                      <div className="mt-4 border-t border-black/5 pt-3.5">
                        <p className="text-[9px] uppercase font-extrabold tracking-wider text-ink/40 mb-2">Stitching Specialties</p>
                        <div className="flex flex-wrap gap-1">
                          {tailor.services?.map((serv) => (
                            <span key={serv} className="rounded bg-black/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-ink/70">
                              {serv}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <div className="border-t border-black/5 pt-4 flex items-center justify-between">
                      <div className="text-[11px] text-ink/55 space-y-0.5">
                        <p className="flex items-center gap-1"><Clock size={11} /> {tailor.workingHours || "10 AM - 8 PM"}</p>
                        <p className="font-semibold text-stitch">{tailor.totalReviews || 0} orders stitched</p>
                      </div>
                      <button
                        onClick={() => handleBooking(tailor)}
                        className="inline-flex items-center gap-1 rounded bg-ink px-4 py-2.5 text-xs font-bold text-white transition hover:bg-ink/90 hover:shadow-soft"
                      >
                        Stitch Here <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Features Overview */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-black/10 bg-white/40 backdrop-blur-sm">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-black/10 bg-white p-6 shadow-sm hover:shadow-soft transition-all duration-300">
              <feature.icon className="text-stitch" size={24} />
              <h3 className="mt-4 font-bold text-ink">{feature.title}</h3>
              <p className="mt-2.5 text-xs leading-relaxed text-ink/65">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Marketplace info band */}
      <section className="relative z-10 border-t border-black/10 bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex gap-3">
            <Search className="mt-1 text-saffron" size={20} />
            <div>
              <h3 className="font-bold text-sm">Marketplace Discovery</h3>
              <p className="mt-2 text-xs text-white/75 leading-relaxed">Search verified boutique tailors based on city location, rating scores, and specialty services.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 text-saffron" size={20} />
            <div>
              <h3 className="font-bold text-sm">Verified Operational Workflows</h3>
              <p className="mt-2 text-xs text-white/75 leading-relaxed">Full accountability through status logs, payments, reviews, and admin dashboard visibility.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Workflow className="mt-1 text-saffron" size={20} />
            <div>
              <h3 className="font-bold text-sm">Tailor Boutique Operating System</h3>
              <p className="mt-2 text-xs text-white/75 leading-relaxed">Robust calendar, customer catalog, and fitting values specifically designed for boutique tailoring work.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
