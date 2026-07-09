import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { Scissors, Search, Calendar, MapPin, Phone, User, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag, Clock } from "lucide-react";

const STAGES = [
  { id: "placed", label: "Placed", desc: "Order registered" },
  { id: "measurement", label: "Measurements", desc: "Fittings verified" },
  { id: "cutting", label: "Cutting", desc: "Fabric marked & cut" },
  { id: "stitching", label: "Stitching", desc: "In progress on machine" },
  { id: "trial", label: "Trial Run", desc: "First fitting check" },
  { id: "ready", label: "Ready", desc: "Ironed & packed" },
  { id: "delivered", label: "Delivered", desc: "Handed over to customer" }
];

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const [orderNoInput, setOrderNoInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-search if parameters are in URL
  useEffect(() => {
    const urlOrderNo = searchParams.get("orderNo");
    const urlPhone = searchParams.get("phone");

    if (urlOrderNo && urlPhone) {
      setOrderNoInput(urlOrderNo);
      setPhoneInput(urlPhone);
      handleTrack(urlOrderNo, urlPhone);
    }
  }, [searchParams]);

  async function handleTrack(orderNo, phone) {
    const oNo = orderNo || orderNoInput;
    const ph = phone || phoneInput;

    if (!oNo.trim() || !ph.trim()) {
      setError("Please enter both Order Number and Phone Number.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await api.get(`/orders/track?orderNo=${encodeURIComponent(oNo.trim())}&phone=${encodeURIComponent(ph.trim())}`);
      setOrder(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not find a matching order. Please verify details.");
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (e) => {
    e.preventDefault();
    handleTrack();
  };

  const getStageIndex = (status) => {
    return STAGES.findIndex(s => s.id === status);
  };

  const stageIndex = order ? getStageIndex(order.status) : -1;
  const isCancelled = order?.status === "cancelled";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Title */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Track Stitching Order
        </h1>
        <p className="mt-3 text-sm text-ink/65">
          Enter your order details below to check the real-time status of your tailored clothes directly from the workshop.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        {/* Track Form Card */}
        <div>
          <div className="rounded-xl border border-black/10 bg-white p-6 shadow-soft">
            <h2 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
              <Search size={18} className="text-stitch" /> Track Details
            </h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink/70 uppercase tracking-wide">
                  Order Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. ST-L3K8J"
                  value={orderNoInput}
                  onChange={(e) => setOrderNoInput(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-stitch"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/70 uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-black/15 px-4 py-2.5 text-sm outline-none focus:border-stitch"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-stitch px-4 py-3 font-semibold text-white transition hover:bg-stitch/90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Scissors size={16} /> Track Status
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 flex gap-2 rounded-md bg-red-50 p-3 text-xs text-red-800 border border-red-100">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-ink/50">
              Registered Customer? <Link to="/auth" className="text-stitch hover:underline font-semibold">Log In here</Link>
            </span>
          </div>
        </div>

        {/* Status Display area */}
        <div>
          {order ? (
            <div className="space-y-6">
              {/* Order Info Summary */}
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-soft">
                <div className="flex flex-wrap items-center justify-between border-b border-black/5 pb-4 gap-4">
                  <div>
                    <span className="text-xs font-bold text-stitch uppercase tracking-wider">Stitching Order</span>
                    <h3 className="text-2xl font-black text-ink mt-0.5">{order.orderNo}</h3>
                  </div>
                  {isCancelled ? (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
                      CANCELLED
                    </span>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs text-ink/50 block">Current Status</span>
                      <span className="text-sm font-black text-stitch uppercase tracking-wide">
                        {order.status}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-2 rounded bg-black/5 text-ink/70">
                      <ShoppingBag size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-ink/50 block">Garment Type</span>
                      <span className="text-sm font-bold text-ink">{order.garmentType}</span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="p-2 rounded bg-black/5 text-ink/70">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-ink/50 block">Estimated Delivery</span>
                      <span className="text-sm font-bold text-ink">
                        {order.dueDate ? new Date(order.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not Scheduled"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="p-2 rounded bg-black/5 text-ink/70">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <span className="text-xs text-ink/50 block">Boutique / Shop</span>
                      <span className="text-sm font-bold text-ink">{order.tailor?.shopName || "Our Shop"}</span>
                    </div>
                  </div>
                </div>

                {order.instructions && (
                  <div className="mt-6 border-t border-black/5 pt-4">
                    <span className="text-xs font-semibold text-ink/50 uppercase block mb-1">Tailor Instructions</span>
                    <p className="text-sm text-ink/80 bg-linen/20 rounded p-3 border border-black/5 italic">
                      "{order.instructions}"
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Pipeline */}
              {!isCancelled && (
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-soft">
                  <h3 className="text-lg font-bold text-ink mb-6 flex items-center gap-2">
                    <Clock size={18} className="text-stitch" /> Workshop Progress
                  </h3>

                  {/* Desktop / Large Progress Stepper */}
                  <div className="hidden md:flex items-stretch justify-between relative select-none">
                    {/* Background Connection line */}
                    <div className="absolute top-5 left-1/12 right-1/12 h-0.5 bg-black/10 -z-0" />
                    {/* Active line progress */}
                    <div 
                      className="absolute top-5 left-1/12 h-0.5 bg-stitch -z-0 transition-all duration-500" 
                      style={{ width: `${stageIndex >= 0 ? (stageIndex / (STAGES.length - 1)) * 82 : 0}%` }}
                    />

                    {STAGES.map((stage, idx) => {
                      const isCompleted = idx < stageIndex;
                      const isActive = idx === stageIndex;
                      return (
                        <div key={stage.id} className="flex flex-col items-center text-center relative z-10 w-1/8">
                          <div 
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                              isCompleted 
                                ? "bg-stitch border-stitch text-white" 
                                : isActive 
                                ? "bg-white border-stitch text-stitch scale-110 shadow" 
                                : "bg-white border-black/15 text-ink/30"
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                          </div>
                          <span className={`mt-3 text-xs font-bold block ${isActive ? "text-stitch" : "text-ink/80"}`}>
                            {stage.label}
                          </span>
                          <span className="text-[10px] text-ink/40 leading-tight mt-1 max-w-[80px]">
                            {stage.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile Progress Pipeline (Vertical List) */}
                  <div className="flex flex-col space-y-4 md:hidden">
                    {STAGES.map((stage, idx) => {
                      const isCompleted = idx < stageIndex;
                      const isActive = idx === stageIndex;
                      return (
                        <div key={stage.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div 
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                                isCompleted 
                                  ? "bg-stitch border-stitch text-white" 
                                  : isActive 
                                  ? "bg-white border-stitch text-stitch shadow scale-105" 
                                  : "bg-white border-black/15 text-ink/30"
                              }`}
                            >
                              {isCompleted ? <CheckCircle2 size={12} /> : idx + 1}
                            </div>
                            {idx < STAGES.length - 1 && (
                              <div className={`w-0.5 h-10 my-1 ${isCompleted ? "bg-stitch" : "bg-black/10"}`} />
                            )}
                          </div>
                          <div className="pt-0.5">
                            <h4 className={`text-sm font-bold ${isActive ? "text-stitch" : "text-ink"}`}>
                              {stage.label}
                            </h4>
                            <p className="text-xs text-ink/50 mt-0.5">{stage.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status History Logs */}
              <div className="rounded-xl border border-black/10 bg-white p-6 shadow-soft">
                <h3 className="text-lg font-bold text-ink mb-4">Activity Log</h3>
                <div className="space-y-4">
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    order.statusHistory.map((history, idx) => (
                      <div key={idx} className="flex gap-4 items-start border-l-2 border-black/5 pl-4 ml-2">
                        <div className="pt-1">
                          <span className="text-xs font-bold text-stitch uppercase tracking-wide block">
                            {history.status}
                          </span>
                          <span className="text-[10px] text-ink/40">
                            {new Date(history.changedAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                          {history.note && (
                            <p className="text-xs text-ink/70 mt-1 italic font-medium">
                              "{history.note}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-ink/40 italic">No activity logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Empty State
            <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-black/15 bg-white min-h-[300px]">
              <div className="h-12 w-12 rounded-full bg-stitch/10 text-stitch flex items-center justify-center mb-4">
                <Scissors size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink">Enter details to see status</h3>
              <p className="text-sm text-ink/50 mt-1 max-w-sm">
                Enter your order ID and the customer phone number registered with the boutique to view tailoring progress.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
