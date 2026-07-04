import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Plus, Ruler, Upload, Scissors, CreditCard, ChevronRight, X, Star } from "lucide-react";
import PageShell from "../components/PageShell.jsx";
import StatCard from "../components/StatCard.jsx";
import OrderTable from "../components/OrderTable.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const SERVICE_PRICES = {
  kurta: 600,
  blouse: 500,
  lehenga: 1800,
  alteration: 150,
  suit: 900,
  shirt: 400,
  pants: 500,
  sherwani: 2500,
  default: 800
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // File Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null); // { url, publicId }

  // Forms
  const [orderForm, setOrderForm] = useState({
    tailorId: "",
    measurementId: "",
    garmentType: "",
    instructions: "",
    fabricProvidedBy: "customer",
    stitchingCharge: 0,
    fabricCharge: 0,
    discount: 0,
    dueDate: ""
  });

  const [measurementForm, setMeasurementForm] = useState({
    _id: "",
    profileName: "Self",
    gender: "female",
    garmentType: "Blouse",
    chest: "",
    waist: "",
    hip: "",
    shoulder: "",
    sleeve: "",
    neck: "",
    inseam: "",
    length: "",
    armhole: "",
    blouseLength: "",
    salwarLength: "",
    notes: ""
  });

  const [reviewForm, setReviewForm] = useState({
    orderId: "",
    tailorId: "",
    rating: 5,
    comment: ""
  });

  const [isPaying, setIsPaying] = useState(false);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [ordersRes, measurementsRes, tailorsRes] = await Promise.all([
        api.get("/orders/my"),
        api.get("/measurements"),
        api.get("/tailors")
      ]);
      setOrders(ordersRes.data.orders || []);
      setMeasurements(measurementsRes.data.measurements || []);
      setTailors(tailorsRes.data.tailors || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (location.state?.selectedTailorId && tailors.length > 0) {
      setOrderForm((prev) => ({
        ...prev,
        tailorId: location.state.selectedTailorId
      }));
      setIsOrderModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, tailors]);

  // Update selected order details if order list refreshes
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o._id === selectedOrder._id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  // Stats calculation
  const activeOrders = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  ).length;

  const totalPendingPayment = orders
    .filter((o) => o.paymentStatus !== "paid" && o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

  // Image Upload handler
  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const { data } = await api.post("/uploads/images", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadedImage(data.image);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload image reference.");
    } finally {
      setUploading(false);
    }
  }

  // Submit Measurement (Create or Update)
  async function handleCreateMeasurement(e) {
    e.preventDefault();
    const isEditing = Boolean(measurementForm._id);

    try {
      const values = {
        chest: parseFloat(measurementForm.chest) || 0,
        waist: parseFloat(measurementForm.waist) || 0,
        hip: parseFloat(measurementForm.hip) || 0,
        shoulder: parseFloat(measurementForm.shoulder) || 0,
        sleeve: parseFloat(measurementForm.sleeve) || 0,
        neck: parseFloat(measurementForm.neck) || 0,
        inseam: parseFloat(measurementForm.inseam) || 0,
        length: parseFloat(measurementForm.length) || 0,
        armhole: parseFloat(measurementForm.armhole) || 0,
        blouseLength: parseFloat(measurementForm.blouseLength) || 0,
        salwarLength: parseFloat(measurementForm.salwarLength) || 0,
      };

      const payload = {
        profileName: measurementForm.profileName,
        gender: measurementForm.gender,
        garmentType: measurementForm.garmentType,
        values,
        notes: measurementForm.notes
      };

      if (isEditing) {
        await api.put(`/measurements/${measurementForm._id}`, payload);
        alert("Measurement profile updated successfully!");
      } else {
        await api.post("/measurements", payload);
        alert("Measurement profile created successfully!");
      }

      setIsMeasurementModalOpen(false);
      // Reset form
      setMeasurementForm({
        _id: "",
        profileName: "Self",
        gender: "female",
        garmentType: "Blouse",
        chest: "",
        waist: "",
        hip: "",
        shoulder: "",
        sleeve: "",
        neck: "",
        inseam: "",
        length: "",
        armhole: "",
        blouseLength: "",
        salwarLength: "",
        notes: ""
      });
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save measurement profile");
    }
  }

  // Edit Action Clicked
  function handleEditClick(m) {
    setMeasurementForm({
      _id: m._id,
      profileName: m.profileName || "",
      gender: m.gender || "female",
      garmentType: m.garmentType || "Blouse",
      chest: m.values?.chest || "",
      waist: m.values?.waist || "",
      hip: m.values?.hip || "",
      shoulder: m.values?.shoulder || "",
      sleeve: m.values?.sleeve || "",
      neck: m.values?.neck || "",
      inseam: m.values?.inseam || "",
      length: m.values?.length || "",
      armhole: m.values?.armhole || "",
      blouseLength: m.values?.blouseLength || "",
      salwarLength: m.values?.salwarLength || "",
      notes: m.notes || ""
    });
    setIsMeasurementModalOpen(true);
  }

  // Delete Action Clicked
  async function handleDeleteClick(id) {
    if (!confirm("Are you sure you want to delete this measurement profile?")) return;
    try {
      await api.delete(`/measurements/${id}`);
      alert("Measurement profile deleted successfully!");
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete measurement profile");
    }
  }

  // Submit Order
  async function handleCreateOrder(e) {
    e.preventDefault();
    try {
      const stitching = parseFloat(orderForm.stitchingCharge) || 0;
      const fabric = parseFloat(orderForm.fabricCharge) || 0;
      const disc = parseFloat(orderForm.discount) || 0;
      const total = stitching + fabric - disc;

      const payload = {
        tailorId: orderForm.tailorId,
        measurementId: orderForm.measurementId || undefined,
        garmentType: orderForm.garmentType,
        fabricProvidedBy: orderForm.fabricProvidedBy,
        instructions: orderForm.instructions,
        designImages: uploadedImage ? [uploadedImage] : [],
        pricing: {
          stitchingCharge: stitching,
          fabricCharge: fabric,
          discount: disc,
          total: total
        },
        dueDate: orderForm.dueDate ? new Date(orderForm.dueDate) : undefined
      };

      await api.post("/orders", payload);
      setIsOrderModalOpen(false);
      setUploadedImage(null); // Reset upload
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to place order");
    }
  }

  // Submit Review
  async function handleCreateReview(e) {
    e.preventDefault();
    try {
      await api.post("/reviews", reviewForm);
      alert("Review submitted successfully! Thank you for your feedback.");
      setIsReviewModalOpen(false);
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || "You have already reviewed this order or request failed.");
    }
  }

  // Handle Payment
  async function handlePayment(order) {
    if (!order) return;
    setIsPaying(true);
    try {
      const balance = order.pricing?.total || 0;
      const { data } = await api.post("/payments/create-order", {
        orderId: order._id,
        amount: balance
      });

      const { payment, razorpayOrder, keyId } = data;

      if (window.Razorpay && keyId && razorpayOrder) {
        const options = {
          key: keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "SmartTailor",
          description: `Payment for Order ${order.orderNo}`,
          order_id: razorpayOrder.id,
          handler: async function (response) {
            try {
              await api.post("/payments/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });
              alert("Payment captured successfully!");
              loadDashboardData();
            } catch (err) {
              alert("Payment verification failed. Please try again.");
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.phone || ""
          },
          theme: {
            color: "#1e1e1e"
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        const simulate = confirm(
          "Razorpay integration requires environment configurations. Would you like to simulate a successful payment?"
        );
        if (simulate) {
          await api.post("/payments/verify", {
            razorpay_order_id: payment.razorpayOrderId,
            isSimulated: true
          });
          alert("Simulated payment success!");
          loadDashboardData();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initialize payment process");
    } finally {
      setIsPaying(false);
    }
  }

  const orderStages = ["placed", "measurement", "cutting", "stitching", "trial", "ready", "delivered"];

  const getStageIndex = (status) => {
    return orderStages.indexOf(status);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center font-medium text-ink/70">
        Loading customer dashboard...
      </div>
    );
  }

  const selectedTailorObj = tailors.find(t => t._id === orderForm.tailorId);
  const availableServices = selectedTailorObj?.services && selectedTailorObj.services.length > 0
    ? selectedTailorObj.services
    : ["Kurta", "Blouse", "Lehenga", "Suit", "Alteration"];

  return (
    <PageShell
      eyebrow="Customer Dashboard"
      title="Track orders and reuse measurements"
      action={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setMeasurementForm({
                _id: "",
                profileName: "Self",
                gender: "female",
                garmentType: "Blouse",
                chest: "",
                waist: "",
                hip: "",
                shoulder: "",
                sleeve: "",
                neck: "",
                inseam: "",
                length: "",
                armhole: "",
                blouseLength: "",
                salwarLength: "",
                notes: ""
              });
              setIsMeasurementModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-black/15 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-black/[0.02]"
          >
            <Ruler size={16} /> New Profile
          </button>
          <button
            onClick={() => {
              if (tailors.length === 0) {
                alert("No tailors registered on the platform yet.");
                return;
              }
              setIsOrderModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink/90"
          >
            <Plus size={16} /> New Order
          </button>
        </div>
      }
    >
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Active orders" value={activeOrders.toString()} tone="dark" />
        <StatCard label="Saved profiles" value={measurements.length.toString()} tone="stitch" />
        <div className="col-span-2 sm:col-span-1">
          <StatCard label="Payments pending" value={`₹${totalPendingPayment.toLocaleString("en-IN")}`} tone="saffron" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink">My Tailoring Orders</h2>
          <OrderTable 
            rows={orders} 
            onSelect={setSelectedOrder} 
            selectedId={selectedOrder?._id}
          />
        </div>

        <aside className="space-y-4">
          {/* Order Details & Timeline - Desktop Only */}
          <div className="hidden lg:block">
            {selectedOrder ? (
              <div className="rounded-md border border-black/10 bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between border-b border-black/5 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-stitch uppercase tracking-wide">Selected Order</p>
                    <h3 className="text-lg font-bold text-ink">{selectedOrder.orderNo}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)} 
                    className="rounded p-1 hover:bg-black/5 text-ink/40 hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-4 space-y-2.5 text-sm border-b border-black/5 pb-4">
                  <div className="flex justify-between">
                    <span className="text-ink/60">Garment Type:</span>
                    <span className="font-semibold text-ink">{selectedOrder.garmentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Tailor Shop:</span>
                    <span className="font-semibold text-ink">{selectedOrder.tailorId?.shopName || "Unknown"}</span>
                  </div>
                  {selectedOrder.instructions && (
                    <div className="rounded bg-linen/50 p-2.5 text-xs text-ink/80 mt-1 border border-black/[0.04]">
                      <strong>Instructions:</strong> {selectedOrder.instructions}
                    </div>
                  )}

                  {/* Uploaded Image display */}
                  {selectedOrder.designImages && selectedOrder.designImages.length > 0 && (
                    <div className="mt-2.5">
                      <p className="text-xs font-semibold text-ink/50 mb-1">Fabric / Reference Photo:</p>
                      <div className="rounded-lg overflow-hidden border border-black/10 max-h-[140px] bg-black/5">
                        <img 
                          src={selectedOrder.designImages[0].url} 
                          alt="Design Reference" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between border-t border-black/[0.04] pt-2">
                    <span className="text-ink/60">Payment Status:</span>
                    <span className={`font-semibold capitalize ${selectedOrder.paymentStatus === "paid" ? "text-emerald-700" : "text-amber-700"}`}>
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/60">Total Cost:</span>
                    <span className="font-bold text-ink">₹{(selectedOrder.pricing?.total || 0).toLocaleString("en-IN")}</span>
                  </div>

                  {selectedOrder.paymentStatus !== "paid" && selectedOrder.status !== "cancelled" && (
                    <button
                      onClick={() => handlePayment(selectedOrder)}
                      disabled={isPaying}
                      className="w-full mt-3 flex items-center justify-center gap-2 rounded bg-saffron px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-saffron/90 disabled:opacity-50"
                    >
                      <CreditCard size={14} /> {isPaying ? "Processing..." : `Pay ₹${(selectedOrder.pricing?.total || 0).toLocaleString("en-IN")}`}
                    </button>
                  )}

                  {/* Rating Button - Available when order status is delivered */}
                  {selectedOrder.status === "delivered" && (
                    <button
                      onClick={() => {
                        setReviewForm({
                          orderId: selectedOrder._id,
                          tailorId: selectedOrder.tailorId?._id || selectedOrder.tailorId,
                          rating: 5,
                          comment: ""
                        });
                        setIsReviewModalOpen(true);
                      }}
                      className="w-full mt-3 flex items-center justify-center gap-2 rounded bg-stitch px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stitch/90"
                    >
                      ★ Rate Tailor / Shop
                    </button>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Upload size={16} className="text-stitch" />
                    <h4 className="font-semibold text-sm">Stitching Timeline</h4>
                  </div>
                  <div className="relative border-l-2 border-black/10 pl-4 ml-2 space-y-4 py-1">
                    {orderStages.map((stage, index) => {
                      const currentStageIndex = getStageIndex(selectedOrder.status);
                      const isCompleted = index <= currentStageIndex;
                      const isCurrent = index === currentStageIndex;
                      
                      return (
                        <div key={stage} className="relative">
                          {/* Dot indicator */}
                          <span 
                            className={`absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white transition-colors duration-250 ${
                              isCompleted ? "bg-stitch" : "bg-gray-300"
                            } ${isCurrent ? "ring-2 ring-stitch/30 scale-110" : ""}`}
                          />
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider ${isCompleted ? "text-ink font-semibold" : "text-ink/40"}`}>
                              {stage}
                            </p>
                            {isCurrent && selectedOrder.statusHistory?.length > 0 && (
                              <p className="text-[11px] text-ink/65 mt-0.5">
                                {selectedOrder.statusHistory[selectedOrder.statusHistory.length - 1].note || "Status updated"}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-black/10 bg-white p-6 shadow-soft text-center py-10">
                <Scissors className="mx-auto text-ink/30 mb-3" size={32} />
                <h3 className="font-semibold text-ink text-sm">Select an order</h3>
                <p className="text-xs text-ink/60 mt-1">Click on any order in the table to view the real-time timeline, custom details, and payments.</p>
              </div>
            )}
          </div>

          {/* Measurements List */}
          <div className="rounded-md border border-black/10 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3 border-b border-black/5 pb-3">
              <Ruler className="text-stitch" />
              <h2 className="font-semibold text-sm text-ink">Measurement Profiles</h2>
            </div>
            <div className="mt-3 divide-y divide-black/[0.06] max-h-[300px] overflow-y-auto pr-1">
              {measurements.length === 0 ? (
                <p className="text-xs text-ink/50 py-3 text-center">No measurement profiles saved. Create one to place orders quickly!</p>
              ) : (
                measurements.map((m) => (
                  <div key={m._id} className="py-3 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-ink font-semibold">{m.profileName} ({m.garmentType})</span>
                      <span className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[10px] text-ink/60 uppercase">{m.gender}</span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-3 gap-1 text-[11px] text-ink/75">
                      {m.values?.chest && <span>Chest: {m.values.chest}"</span>}
                      {m.values?.waist && <span>Waist: {m.values.waist}"</span>}
                      {m.values?.shoulder && <span>Shoulder: {m.values.shoulder}"</span>}
                      {m.values?.sleeve && <span>Sleeve: {m.values.sleeve}"</span>}
                      {m.values?.length && <span>Length: {m.values.length}"</span>}
                    </div>
                    
                    <div className="mt-2.5 flex justify-end gap-3 text-[10px] font-semibold text-ink/50 border-t border-black/[0.03] pt-1.5">
                      <button 
                        onClick={() => handleEditClick(m)} 
                        className="hover:text-stitch"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(m._id)} 
                        className="hover:text-red-650"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* New Order Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-md bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsOrderModalOpen(false)}
              className="absolute right-4 top-4 text-ink/50 hover:text-ink"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold border-b border-black/10 pb-3">Place Stitching Order</h3>
            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Select Tailor Shop</label>
                  <select
                    required
                    value={orderForm.tailorId}
                    onChange={(e) => setOrderForm({ ...orderForm, tailorId: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  >
                    <option value="">Choose tailor...</option>
                    {tailors.map((t) => (
                      <option key={t._id} value={t._id}>{t.shopName} - {t.location?.city}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/75">Measurement Profile</label>
                  <select
                    value={orderForm.measurementId}
                    onChange={(e) => setOrderForm({ ...orderForm, measurementId: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  >
                    <option value="">No Profile (tailor will measure)</option>
                    {measurements.map((m) => (
                      <option key={m._id} value={m._id}>{m.profileName} - {m.garmentType}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Garment Type</label>
                  <select
                    required
                    value={orderForm.garmentType}
                    onChange={(e) => {
                      const service = e.target.value;
                      const serviceKey = service.toLowerCase().trim();
                      const price = SERVICE_PRICES[serviceKey] || SERVICE_PRICES.default;
                      setOrderForm({ 
                        ...orderForm, 
                        garmentType: service,
                        stitchingCharge: price
                      });
                    }}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch bg-white"
                  >
                    <option value="">Select garment...</option>
                    {availableServices.map((srv) => (
                      <option key={srv} value={srv}>{srv}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/75">Fabric Source</label>
                  <select
                    value={orderForm.fabricProvidedBy}
                    onChange={(e) => setOrderForm({ ...orderForm, fabricProvidedBy: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  >
                    <option value="customer">I will provide fabric</option>
                    <option value="tailor">Tailor shop fabric</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">Stitching Instructions</label>
                <textarea
                  placeholder="Elbow sleeves, back hook, round neck design etc."
                  value={orderForm.instructions}
                  onChange={(e) => setOrderForm({ ...orderForm, instructions: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch resize-none"
                />
              </div>

              {/* Upload Fabric Design Section */}
              <div>
                <label className="block text-xs font-semibold text-ink/75">Fabric / Design Reference Image</label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-ink/75 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-stitch/10 file:text-stitch hover:file:bg-stitch/20"
                  />
                  {uploading && <span className="text-xs text-ink/40 animate-pulse">Uploading to Cloudinary...</span>}
                  {uploadedImage && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      ✓ Upload Successful
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Est. Stitch Charge (₹)</label>
                  <input
                    type="number"
                    disabled
                    value={orderForm.stitchingCharge}
                    className="mt-1 w-full rounded border border-black/15 bg-black/[0.03] px-3 py-2 text-sm text-ink/65 outline-none cursor-not-allowed font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/75">Due Date</label>
                  <input
                    type="date"
                    required
                    value={orderForm.dueDate}
                    onChange={(e) => setOrderForm({ ...orderForm, dueDate: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-ink/90 mt-2"
              >
                Place Order
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Measurement Profile Modal (Create & Edit) */}
      {isMeasurementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-md bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsMeasurementModalOpen(false)}
              className="absolute right-4 top-4 text-ink/50 hover:text-ink"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold border-b border-black/10 pb-3">
              {measurementForm._id ? "Edit Measurement Profile" : "Create Measurement Profile"}
            </h3>
            <form onSubmit={handleCreateMeasurement} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Profile Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Self, Mom"
                    value={measurementForm.profileName}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, profileName: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Gender</label>
                  <select
                    value={measurementForm.gender}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, gender: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="kids">Kids</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Garment Type</label>
                  <select
                    value={measurementForm.garmentType}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, garmentType: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  >
                    <option value="Blouse">Blouse</option>
                    <option value="Kurta">Kurta</option>
                    <option value="Salwar">Salwar Suit</option>
                    <option value="Lehenga">Lehenga Choli</option>
                    <option value="Shirt">Shirt</option>
                    <option value="Trousers">Trousers</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-black/5 pt-3">
                <p className="text-xs font-bold text-stitch mb-2 uppercase tracking-wider">Inches (") values</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { key: "chest", label: "Chest" },
                    { key: "waist", label: "Waist" },
                    { key: "hip", label: "Hip" },
                    { key: "shoulder", label: "Shoulder" },
                    { key: "sleeve", label: "Sleeve" },
                    { key: "neck", label: "Neck" },
                    { key: "length", label: "Total Length" },
                    { key: "armhole", label: "Armhole" },
                    { key: "blouseLength", label: "Blouse L." },
                    { key: "salwarLength", label: "Salwar L." },
                    { key: "inseam", label: "Inseam" }
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-[10px] font-semibold text-ink/65">{field.label}</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder='0.0'
                        value={measurementForm[field.key]}
                        onChange={(e) => setMeasurementForm({ ...measurementForm, [field.key]: e.target.value })}
                        className="mt-1 w-full rounded border border-black/15 px-2 py-1.5 text-xs outline-none focus:border-stitch"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">Fittings Notes</label>
                <textarea
                  placeholder="e.g. Loose armhole fit, tight collars, etc."
                  value={measurementForm.notes}
                  onChange={(e) => setMeasurementForm({ ...measurementForm, notes: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-ink/90 mt-2"
              >
                {measurementForm._id ? "Update Profile" : "Save Profile"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rate/Review Tailor Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-md bg-white p-6 shadow-lg">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute right-4 top-4 text-ink/50 hover:text-ink"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold border-b border-black/10 pb-3">Rate Tailor Shop</h3>
            <form onSubmit={handleCreateReview} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/75">Select Star Rating</label>
                <div className="mt-1.5 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="text-saffron hover:scale-110 transition-transform"
                    >
                      <Star 
                        size={32} 
                        className={star <= reviewForm.rating ? "fill-saffron text-saffron" : "text-gray-300"} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">Feedback / Comments</label>
                <textarea
                  required
                  placeholder="e.g. Fitting was absolutely perfect! Highly recommended for wedding wear blouse stitching."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2.5 text-sm outline-none focus:border-stitch resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-ink/90 mt-2"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Selected Order Details - Mobile Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm lg:hidden">
          <div className="relative w-full max-w-md rounded-md bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div>
                <p className="text-xs font-semibold text-stitch uppercase tracking-wide">Selected Order</p>
                <h3 className="text-lg font-bold text-ink">{selectedOrder.orderNo}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="rounded p-1 hover:bg-black/5 text-ink/40 hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-sm border-b border-black/5 pb-4">
              <div className="flex justify-between">
                <span className="text-ink/60">Garment Type:</span>
                <span className="font-semibold text-ink">{selectedOrder.garmentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Tailor Shop:</span>
                <span className="font-semibold text-ink">{selectedOrder.tailorId?.shopName || "Unknown"}</span>
              </div>
              {selectedOrder.instructions && (
                <div className="rounded bg-linen/50 p-2.5 text-xs text-ink/80 mt-1 border border-black/[0.04]">
                  <strong>Instructions:</strong> {selectedOrder.instructions}
                </div>
              )}

              {/* Uploaded Image display */}
              {selectedOrder.designImages && selectedOrder.designImages.length > 0 && (
                <div className="mt-2.5">
                  <p className="text-xs font-semibold text-ink/50 mb-1">Fabric / Reference Photo:</p>
                  <div className="rounded-lg overflow-hidden border border-black/10 max-h-[140px] bg-black/5">
                    <img 
                      src={selectedOrder.designImages[0].url} 
                      alt="Design Reference" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between border-t border-black/[0.04] pt-2">
                <span className="text-ink/60">Payment Status:</span>
                <span className={`font-semibold capitalize ${selectedOrder.paymentStatus === "paid" ? "text-emerald-700" : "text-amber-700"}`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Total Cost:</span>
                <span className="font-bold text-ink">₹{(selectedOrder.pricing?.total || 0).toLocaleString("en-IN")}</span>
              </div>

              {selectedOrder.paymentStatus !== "paid" && selectedOrder.status !== "cancelled" && (
                <button
                  onClick={() => handlePayment(selectedOrder)}
                  disabled={isPaying}
                  className="w-full mt-3 flex items-center justify-center gap-2 rounded bg-saffron px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-saffron/90 disabled:opacity-50"
                >
                  <CreditCard size={14} /> {isPaying ? "Processing..." : `Pay ₹${(selectedOrder.pricing?.total || 0).toLocaleString("en-IN")}`}
                </button>
              )}

              {/* Rating Button - Available when order status is delivered */}
              {selectedOrder.status === "delivered" && (
                <button
                  onClick={() => {
                    setReviewForm({
                      orderId: selectedOrder._id,
                      tailorId: selectedOrder.tailorId?._id || selectedOrder.tailorId,
                      rating: 5,
                      comment: ""
                    });
                    setIsReviewModalOpen(true);
                  }}
                  className="w-full mt-3 flex items-center justify-center gap-2 rounded bg-stitch px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stitch/90"
                >
                  ★ Rate Tailor / Shop
                </button>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Upload size={16} className="text-stitch" />
                <h4 className="font-semibold text-sm">Stitching Timeline</h4>
              </div>
              <div className="relative border-l-2 border-black/10 pl-4 ml-2 space-y-4 py-1">
                {orderStages.map((stage, index) => {
                  const currentStageIndex = getStageIndex(selectedOrder.status);
                  const isCompleted = index <= currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  
                  return (
                    <div key={stage} className="relative">
                      {/* Dot indicator */}
                      <span 
                        className={`absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white transition-colors duration-250 ${
                          isCompleted ? "bg-stitch" : "bg-gray-300"
                        } ${isCurrent ? "ring-2 ring-stitch/30 scale-110" : ""}`}
                      />
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${isCompleted ? "text-ink font-semibold" : "text-ink/40"}`}>
                          {stage}
                        </p>
                        {isCurrent && selectedOrder.statusHistory?.length > 0 && (
                          <p className="text-[11px] text-ink/65 mt-0.5">
                            {selectedOrder.statusHistory[selectedOrder.statusHistory.length - 1].note || "Status updated"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
