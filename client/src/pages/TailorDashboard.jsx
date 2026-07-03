import { useState, useEffect } from "react";
import { CalendarDays, CheckCircle2, Scissors, Ruler, ChevronRight, X, Sparkles, Store, Search, ClipboardList, MessageSquare } from "lucide-react";
import PageShell from "../components/PageShell.jsx";
import StatCard from "../components/StatCard.jsx";
import OrderTable from "../components/OrderTable.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function TailorDashboard() {
  const { user } = useAuth();
  
  // Tabs: "orders" or "measurements"
  const [activeTab, setActiveTab] = useState("orders");

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ activeOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);

  // Selection & Search
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [measurementSearch, setMeasurementSearch] = useState("");

  // Modals/Forms states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Forms data
  const [profileForm, setProfileForm] = useState({
    shopName: "",
    description: "",
    services: "Blouse, Kurta, Lehenga, Alteration",
    address: "",
    city: "",
    state: "",
    pincode: "",
    workingHours: "10 AM - 8 PM",
    shopImageUrl: ""
  });

  const [statusForm, setStatusForm] = useState({
    status: "placed",
    note: ""
  });

  const [measurementForm, setMeasurementForm] = useState({
    _id: "",
    customerId: "",
    profileName: "Customer Profile",
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

  async function loadDashboard() {
    try {
      setLoading(true);
      const [res, measurementsRes, customersRes] = await Promise.all([
        api.get("/tailors/me/dashboard"),
        api.get("/measurements"),
        api.get("/tailors/me/customers")
      ]);
      
      setProfile(res.data.tailor);
      setStats(res.data.stats || { activeOrders: 0 });
      setOrders(res.data.orders || []);
      setMeasurements(measurementsRes.data.measurements || []);
      setCustomers(customersRes.data.customers || []);
      setProfileMissing(false);
      
      // Initialize profile form
      if (res.data.tailor) {
        setProfileForm({
          shopName: res.data.tailor.shopName || "",
          description: res.data.tailor.description || "",
          services: res.data.tailor.services?.join(", ") || "",
          address: res.data.tailor.location?.address || "",
          city: res.data.tailor.location?.city || "",
          state: res.data.tailor.location?.state || "",
          pincode: res.data.tailor.location?.pincode || "",
          workingHours: res.data.tailor.workingHours || "10 AM - 8 PM",
          shopImageUrl: res.data.tailor.portfolioImages?.[0]?.url || ""
        });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setProfileMissing(true);
      } else {
        setError("Failed to fetch tailor dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // Update selected order details on orders changes
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o._id === selectedOrder._id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  // Handle uploading shop profile photo/banner
  async function handleShopImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploadingImage(true);
    try {
      const { data } = await api.post("/uploads/images", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProfileForm((prev) => ({
        ...prev,
        shopImageUrl: data.image.url
      }));
      alert("Shop profile photo uploaded successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  }

  // Submit Profile (Upsert)
  async function handleProfileSubmit(e) {
    e.preventDefault();
    try {
      const servicesArray = profileForm.services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        shopName: profileForm.shopName,
        description: profileForm.description,
        services: servicesArray,
        location: {
          address: profileForm.address,
          city: profileForm.city,
          state: profileForm.state,
          pincode: profileForm.pincode
        },
        workingHours: profileForm.workingHours,
        portfolioImages: profileForm.shopImageUrl ? [{ url: profileForm.shopImageUrl }] : []
      };

      await api.post("/tailors/profile", payload);
      setIsProfileModalOpen(false);
      alert("Shop profile saved successfully!");
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile");
    }
  }

  // Update Status
  async function handleStatusUpdate(e) {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await api.patch(`/tailors/orders/${selectedOrder._id}/status`, statusForm);
      setIsStatusModalOpen(false);
      setStatusForm({ status: "placed", note: "" });
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  }

  // Record or Edit Measurement
  async function handleCreateMeasurement(e) {
    e.preventDefault();
    const customerId = selectedOrder?.customerId?._id || 
                       (typeof selectedOrder?.customerId === "string" ? selectedOrder.customerId : "") || 
                       measurementForm.customerId;
                       
    const isEditing = Boolean(measurementForm._id);
    
    if (!isEditing && !customerId) {
      alert("Please select a customer first.");
      return;
    }

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
        await api.post(`/tailors/customers/${customerId}/measurements`, payload);
        alert("Measurement profile recorded successfully!");
      }

      setIsMeasurementModalOpen(false);
      // Reset form
      setMeasurementForm({
        _id: "",
        customerId: "",
        profileName: "Customer Profile",
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
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save measurements");
    }
  }

  // Edit Action Clicked
  function handleEditClick(m) {
    setSelectedOrder(null);
    setMeasurementForm({
      _id: m._id,
      customerId: m.customerId?._id || m.customerId || "",
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
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete measurement profile");
    }
  }

  // Open Personal WhatsApp Web with prefilled message (100% Free)
  function handleSendFreeWhatsApp() {
    if (!selectedOrder) return;
    const phone = selectedOrder.customerId?.phone || "";
    if (!phone) {
      alert("Customer phone number is not available.");
      return;
    }

    // Extract numbers only
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`; // Default to Indian country code
    }

    const message = `Hello ${selectedOrder.customerId?.name || "Customer"}, your stitching order ${selectedOrder.orderNo} for ${selectedOrder.garmentType} is currently at the "${selectedOrder.status.toUpperCase()}" stage. Thank you for choosing ${profile?.shopName || "our boutique"}!`;
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    window.open(whatsappUrl, "_blank");
  }

  // Search filter measurements
  const filteredMeasurements = measurements.filter((m) => {
    const customerName = m.customerId?.name || "Walk-in";
    const profileName = m.profileName || "";
    const garment = m.garmentType || "";
    const query = measurementSearch.toLowerCase();
    return (
      customerName.toLowerCase().includes(query) ||
      profileName.toLowerCase().includes(query) ||
      garment.toLowerCase().includes(query)
    );
  });

  // Onboarding screen
  if (profileMissing) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-md border border-black/10 bg-white p-6 shadow-soft text-center">
          <Store className="mx-auto text-stitch mb-4" size={48} />
          <h1 className="text-2xl font-bold text-ink">Setup Your Tailor Shop</h1>
          <p className="text-sm text-ink/70 mt-2">
            Create your digital shop profile so customers can find your services, view your location, and place stitching orders.
          </p>

          <form onSubmit={handleProfileSubmit} className="mt-6 text-left space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink/75">Shop Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Meena Boutique"
                value={profileForm.shopName}
                onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })}
                className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75">Shop Profile Photo / Banner</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleShopImageUpload}
                  className="text-xs text-ink/75 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-stitch/10 file:text-stitch hover:file:bg-stitch/20"
                />
                {uploadingImage && <span className="text-xs text-ink/40 animate-pulse">Uploading...</span>}
                {profileForm.shopImageUrl && (
                  <span className="text-xs text-emerald-600 font-semibold">✓ Photo Selected</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75">Description</label>
              <textarea
                placeholder="e.g. Specialist in designer blouses, wedding wear alterations..."
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75">Services (comma separated)</label>
              <input
                type="text"
                placeholder="Blouse, Kurta, Lehenga, Alteration"
                value={profileForm.services}
                onChange={(e) => setProfileForm({ ...profileForm, services: e.target.value })}
                className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink/75">Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MI Road"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jaipur"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink/75">State</label>
                <input
                  type="text"
                  placeholder="e.g. Rajasthan"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">Pincode</label>
                <input
                  type="text"
                  required
                  placeholder="302001"
                  value={profileForm.pincode}
                  onChange={(e) => setProfileForm({ ...profileForm, pincode: e.target.value })}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/75">Working Hours</label>
              <input
                type="text"
                placeholder="e.g. 10 AM - 8 PM"
                value={profileForm.workingHours}
                onChange={(e) => setProfileForm({ ...profileForm, workingHours: e.target.value })}
                className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-ink/90 mt-2"
            >
              Create Shop Profile
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center font-medium text-ink/70">
        Loading tailor dashboard...
      </div>
    );
  }

  return (
    <PageShell
      eyebrow="Tailor Dashboard"
      title="Manage boutique operations"
      action={
        <div className="flex gap-2">
          {activeTab === "measurements" && (
            <button
              onClick={() => {
                setSelectedOrder(null);
                setMeasurementForm({
                  _id: "",
                  customerId: customers[0]?._id || "",
                  profileName: "Customer Profile",
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
              <Ruler size={16} /> Record Measurement
            </button>
          )}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink/90"
          >
            <Store size={16} /> Edit Shop Profile
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active Orders" value={stats.activeOrders.toString()} tone="dark" />
        <StatCard label="Shop Status" value={profile?.verificationStatus?.toUpperCase() || "PENDING"} tone="stitch" />
        <StatCard label="Rating" value={`${profile?.ratingAvg || 0} (${profile?.totalReviews || 0} reviews)`} tone="saffron" />
        <StatCard label="Shop Name" value={profile?.shopName || "My Boutique"} tone="light" />
      </div>

      {/* Tabs navigation */}
      <div className="mt-6 flex border-b border-black/10">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "orders" 
              ? "border-stitch text-stitch" 
              : "border-transparent text-ink/60 hover:text-ink hover:border-black/10"
          }`}
        >
          Stitching Pipeline
        </button>
        <button
          onClick={() => setActiveTab("measurements")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === "measurements" 
              ? "border-stitch text-stitch" 
              : "border-transparent text-ink/60 hover:text-ink hover:border-black/10"
          }`}
        >
          Customer Measurements ({measurements.length})
        </button>
      </div>

      {activeTab === "orders" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <h2 className="mb-3 text-lg font-semibold text-ink">Active Work Orders</h2>
            <OrderTable 
              rows={orders} 
              mode="tailor" 
              onSelect={setSelectedOrder} 
              selectedId={selectedOrder?._id}
            />
          </div>

          <aside className="space-y-4">
            {/* Order Actions */}
            {selectedOrder ? (
              <div className="rounded-md border border-black/10 bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between border-b border-black/5 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-stitch uppercase tracking-wide">Manage Stitching</p>
                    <h3 className="text-lg font-bold text-ink">{selectedOrder.orderNo}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)} 
                    className="rounded p-1 hover:bg-black/5 text-ink/40 hover:text-ink"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink/65">Garment:</span>
                    <span className="font-semibold text-ink">{selectedOrder.garmentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/65">Customer:</span>
                    <span className="font-semibold text-ink">{selectedOrder.customerId?.name || "Walk-in"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/65">Contact:</span>
                    <span className="font-medium text-ink">{selectedOrder.customerId?.phone || "None"}</span>
                  </div>

                  {selectedOrder.designImages && selectedOrder.designImages.length > 0 && (
                    <div className="mt-2.5">
                      <p className="text-[11px] font-semibold text-ink/50 mb-1">Fabric / Design Photo:</p>
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
                    <span className="text-ink/65">Current Stage:</span>
                    <span className="font-bold text-stitch uppercase text-xs">{selectedOrder.status}</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setStatusForm({ status: selectedOrder.status, note: "" });
                        setIsStatusModalOpen(true);
                      }}
                      className="flex-1 rounded bg-stitch px-3 py-2 text-xs font-semibold text-white text-center hover:bg-stitch/90"
                    >
                      Update Stage
                    </button>
                    <button
                      onClick={() => {
                        setMeasurementForm({
                          _id: "",
                          customerId: selectedOrder.customerId?._id || selectedOrder.customerId || "",
                          profileName: "Customer Profile",
                          gender: "female",
                          garmentType: selectedOrder.garmentType,
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
                      className="flex-1 rounded border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-ink text-center hover:bg-black/[0.02]"
                    >
                      Record Measure
                    </button>
                  </div>

                  <div className="mt-2.5 border-t border-black/[0.04] pt-2.5">
                    <button
                      onClick={handleSendFreeWhatsApp}
                      className="w-full rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 text-center hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare size={13} className="text-emerald-600" /> Send Free WhatsApp Alert
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-black/10 bg-white p-6 shadow-soft text-center py-10">
                <Scissors className="mx-auto text-ink/30 mb-3" size={32} />
                <h3 className="font-semibold text-ink text-sm">Select an order</h3>
                <p className="text-xs text-ink/60 mt-1">Select any row from the work pipeline table to update its progress stage, add comments, or log measurement details.</p>
              </div>
            )}

            {/* Delivery Calendar */}
            <div className="rounded-md border border-black/10 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3 border-b border-black/5 pb-3">
                <CalendarDays className="text-saffron" />
                <h2 className="font-semibold text-sm">Delivery Calendar</h2>
              </div>
              <div className="mt-3 space-y-2.5 text-xs">
                {orders.length === 0 ? (
                  <p className="text-ink/50 py-2 text-center">No orders due.</p>
                ) : (
                  orders.slice(0, 4).map((o) => {
                    const days = Math.ceil((new Date(o.dueDate) - Date.now()) / (1000 * 60 * 60 * 24));
                    const dueLabel = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days left`;
                    return (
                      <div key={o._id} className="flex items-center justify-between rounded bg-black/[0.02] px-3 py-2 border border-black/[0.04]">
                        <div>
                          <p className="font-semibold text-ink">{o.orderNo} - {o.garmentType}</p>
                          <p className="text-[10px] text-ink/50">For {o.customerId?.name || "Customer"}</p>
                        </div>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${days <= 1 ? "bg-red-50 text-red-600" : "bg-black/5 text-ink/70"}`}>
                          {dueLabel}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Shop Health Stats */}
            <div className="rounded-md border border-black/10 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3 border-b border-black/5 pb-3">
                <CheckCircle2 className="text-stitch" />
                <h2 className="font-semibold text-sm">Shop Health</h2>
              </div>
              <div className="mt-3 space-y-2 text-xs text-ink/80">
                <p className="flex justify-between"><span>On-time delivery rate:</span> <strong>95%</strong></p>
                <p className="flex justify-between"><span>Repeat Customer Rate:</span> <strong>48%</strong></p>
                <p className="flex justify-between"><span>Subscription Tier:</span> <strong className="capitalize">{profile?.subscriptionPlan || "free"}</strong></p>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* Measurements Database Tab View */
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-3 bg-white border border-black/10 rounded-md p-4 max-w-md shadow-sm">
            <Search className="text-ink/40" size={18} />
            <input
              type="text"
              placeholder="Search by customer name, profile, garment..."
              value={measurementSearch}
              onChange={(e) => setMeasurementSearch(e.target.value)}
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMeasurements.length === 0 ? (
              <div className="col-span-full py-16 text-center border border-black/10 rounded bg-white">
                <Ruler className="mx-auto text-ink/30 mb-3" size={36} />
                <h3 className="font-semibold text-ink text-sm">No measurements recorded</h3>
                <p className="text-xs text-ink/50 mt-1">Stitch orders or click "Record Measurement" to create profile values.</p>
              </div>
            ) : (
              filteredMeasurements.map((m) => (
                <div key={m._id} className="rounded-md border border-black/10 bg-white p-5 shadow-soft hover:border-stitch transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                      <div>
                        <h4 className="font-bold text-ink text-sm">{m.customerId?.name || "Walk-in Customer"}</h4>
                        <p className="text-[10px] text-ink/50">Ph: {m.customerId?.phone || "N/A"}</p>
                      </div>
                      <span className="rounded bg-stitch/10 px-2 py-0.5 text-[10px] font-bold text-stitch uppercase tracking-wider">
                        {m.garmentType}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="block text-[10px] text-ink/50">Profile Name</span>
                        <span className="font-semibold text-ink">{m.profileName}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-ink/50">Gender</span>
                        <span className="font-semibold text-ink capitalize">{m.gender}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-ink/50">Last Update</span>
                        <span className="font-semibold text-ink">
                          {new Date(m.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3.5 bg-linen/30 border border-black/[0.03] rounded p-3">
                      <p className="text-[9px] uppercase font-bold tracking-wider text-ink/40 mb-1.5">Measurement Parameters (inches)</p>
                      <div className="grid grid-cols-4 gap-x-2 gap-y-1.5 text-xs text-ink/80">
                        {m.values?.chest && <p>Chest: <strong>{m.values.chest}"</strong></p>}
                        {m.values?.waist && <p>Waist: <strong>{m.values.waist}"</strong></p>}
                        {m.values?.hip && <p>Hip: <strong>{m.values.hip}"</strong></p>}
                        {m.values?.shoulder && <p>Shldr: <strong>{m.values.shoulder}"</strong></p>}
                        {m.values?.sleeve && <p>Sleeve: <strong>{m.values.sleeve}"</strong></p>}
                        {m.values?.neck && <p>Neck: <strong>{m.values.neck}"</strong></p>}
                        {m.values?.length && <p>Length: <strong>{m.values.length}"</strong></p>}
                        {m.values?.armhole && <p>Armhole: <strong>{m.values.armhole}"</strong></p>}
                      </div>
                    </div>

                    {m.notes && (
                      <div className="mt-3 rounded border border-black/[0.04] bg-linen/10 p-2.5 text-[11px] text-ink/70">
                        <strong>Notes:</strong> {m.notes}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-black/5 pt-3 flex justify-end gap-2 text-xs font-semibold">
                    <button
                      onClick={() => handleEditClick(m)}
                      className="rounded bg-black/5 px-3 py-1.5 hover:bg-black/10 text-ink/75"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(m._id)}
                      className="rounded bg-red-50 px-3 py-1.5 hover:bg-red-100 text-red-600 border border-red-100 animate-pulse hover:animate-none"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit Shop Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-md bg-white p-6 shadow-lg">
            <button 
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute right-4 top-4 text-ink/50 hover:text-ink"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold border-b border-black/10 pb-3">Edit Shop Profile</h3>
            <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/75">Shop Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.shopName}
                  onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">Shop Profile Photo / Banner</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleShopImageUpload}
                    className="text-xs text-ink/75 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-stitch/10 file:text-stitch hover:file:bg-stitch/20"
                  />
                  {uploadingImage && <span className="text-xs text-ink/40 animate-pulse">Uploading...</span>}
                  {profileForm.shopImageUrl && (
                    <span className="text-xs text-emerald-600 font-semibold">✓ Photo Selected</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">Description</label>
                <textarea
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">Services (comma separated)</label>
                <input
                  type="text"
                  value={profileForm.services}
                  onChange={(e) => setProfileForm({ ...profileForm, services: e.target.value })}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Address</label>
                  <input
                    type="text"
                    required
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/75">City</label>
                  <input
                    type="text"
                    required
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-ink/90 mt-2"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Update Order Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-md bg-white p-6 shadow-lg">
            <button 
              onClick={() => setIsStatusModalOpen(false)}
              className="absolute right-4 top-4 text-ink/50 hover:text-ink"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold border-b border-black/10 pb-3">Update Order Status ({selectedOrder?.orderNo})</h3>
            <form onSubmit={handleStatusUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink/75">Stitching Pipeline Stage</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                >
                  <option value="placed">Placed (Received)</option>
                  <option value="measurement">Measurement (Confirmed)</option>
                  <option value="cutting">Cutting (In Progress)</option>
                  <option value="stitching">Stitching (In Progress)</option>
                  <option value="trial">Trial (Pending Customer)</option>
                  <option value="ready">Ready (Completed)</option>
                  <option value="delivered">Delivered (Handed Over)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/75">Progress Note / Remarks</label>
                <textarea
                  required
                  placeholder="e.g. Cut pieces ready. Starting stitches on shoulders."
                  value={statusForm.note}
                  onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded bg-ink px-4 py-2.5 font-semibold text-white transition hover:bg-ink/90 mt-2"
              >
                Log Update
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Customer Measurement Modal */}
      {isMeasurementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-md bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsMeasurementModalOpen(false)}
              className="absolute right-4 top-4 text-ink/50 hover:text-ink"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold border-b border-black/10 pb-3">
              {measurementForm._id ? "Edit Customer Measurements" : "Record Customer Measurements"}
            </h3>
            <form onSubmit={handleCreateMeasurement} className="mt-4 space-y-4">
              
              {selectedOrder ? (
                <div>
                  <span className="block text-xs font-semibold text-ink/50">For Customer</span>
                  <span className="text-sm font-semibold text-ink">{selectedOrder.customerId?.name} ({selectedOrder.customerId?.phone})</span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Select Customer User</label>
                  <select
                    required
                    disabled={Boolean(measurementForm._id)} // Don't let edit customer once created
                    value={measurementForm.customerId}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, customerId: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch disabled:bg-black/[0.03]"
                  >
                    <option value="">Select customer...</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Profile Name</label>
                  <input
                    type="text"
                    required
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
                  <input
                    type="text"
                    required
                    value={measurementForm.garmentType}
                    onChange={(e) => setMeasurementForm({ ...measurementForm, garmentType: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
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
                        placeholder="0.0"
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
                  placeholder="e.g. Boat neck design, custom sleeves fitting."
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
                {measurementForm._id ? "Update Measurements" : "Save Measurements"}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
