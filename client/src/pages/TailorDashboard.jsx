import { useState, useEffect } from "react";
import { CalendarDays, CheckCircle2, Scissors, Ruler, ChevronRight, X, Sparkles, Store, Search, ClipboardList, MessageSquare } from "lucide-react";
import PageShell from "../components/PageShell.jsx";
import StatCard from "../components/StatCard.jsx";
import OrderTable from "../components/OrderTable.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { compressImage, getOptimizedImageUrl } from "../lib/imageCompress.js";
import { socket } from "../lib/socket.js";

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [profileForm, setProfileForm] = useState({
    shopName: "",
    description: "",
    services: [
      { name: "Blouse", price: 500 },
      { name: "Kurta", price: 600 },
      { name: "Alteration", price: 150 },
      { name: "Lehenga", price: 1800 }
    ],
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

  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successOrderData, setSuccessOrderData] = useState(null);
  const [customGarmentName, setCustomGarmentName] = useState("");

  const [walkInForm, setWalkInForm] = useState({
    customerPhone: "",
    customerName: "",
    garmentType: "",
    fabricProvidedBy: "customer",
    instructions: "",
    dueDate: "",
    stitchingCharge: "",
    fabricCharge: "",
    discount: "",
    measurementId: ""
  });

  function handleWalkInPhoneChange(phoneVal) {
    const digitsOnlyInput = phoneVal.replace(/\D/g, "");
    
    const foundCust = customers.find(c => {
      const dbPhDigits = (c.phone || "").replace(/\D/g, "");
      if (digitsOnlyInput.length >= 10 && dbPhDigits.length >= 10) {
        return dbPhDigits.slice(-10) === digitsOnlyInput.slice(-10);
      }
      return dbPhDigits === digitsOnlyInput && dbPhDigits.length > 0;
    });
    
    if (foundCust) {
      const custMeasurements = measurements.filter(m => getUserId(m.customerId) === foundCust._id);
      setWalkInForm(prev => ({
        ...prev,
        customerPhone: phoneVal,
        customerName: foundCust.name,
        measurementId: custMeasurements[0]?._id || ""
      }));
    } else {
      setWalkInForm(prev => ({
        ...prev,
        customerPhone: phoneVal,
        customerName: digitsOnlyInput.length === 0 ? "" : prev.customerName,
        measurementId: ""
      }));
    }
  }

  async function handleWalkInSubmit(e) {
    e.preventDefault();
    try {
      const gType = walkInForm.garmentType === "custom_other" ? customGarmentName : walkInForm.garmentType;
      if (!gType || !gType.trim()) {
        alert("Please specify a garment type.");
        return;
      }

      const payload = {
        customerPhone: walkInForm.customerPhone,
        customerName: walkInForm.customerName,
        garmentType: gType,
        fabricProvidedBy: walkInForm.fabricProvidedBy,
        instructions: walkInForm.instructions,
        dueDate: walkInForm.dueDate || undefined,
        pricing: {
          stitchingCharge: parseFloat(walkInForm.stitchingCharge) || 0,
          fabricCharge: parseFloat(walkInForm.fabricCharge) || 0,
          discount: parseFloat(walkInForm.discount) || 0
        },
        measurementId: walkInForm.measurementId || undefined
      };

      const res = await api.post("/orders/walk-in", payload);
      setIsWalkInModalOpen(false);
      setSuccessOrderData(res.data);
      setIsSuccessModalOpen(true);
      
      // Reset form
      setWalkInForm({
        customerPhone: "",
        customerName: "",
        garmentType: "",
        fabricProvidedBy: "customer",
        instructions: "",
        dueDate: "",
        stitchingCharge: "",
        fabricCharge: "",
        discount: "",
        measurementId: ""
      });
      setCustomGarmentName("");
      
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create walk-in order");
    }
  }

  function handleSendWalkInWhatsApp() {
    if (!successOrderData) return;
    const { order, customer } = successOrderData;
    const phone = customer.phone;
    if (!phone) {
      alert("Customer phone is missing.");
      return;
    }

    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const trackingUrl = `${window.location.origin}/track?orderNo=${order.orderNo}&phone=${customer.phone}`;
    
    let message = `Hello ${customer.name}, your stitching order ${order.orderNo} for ${order.garmentType} has been successfully registered at "${profile?.shopName || "our boutique"}". \n\nYou can track the live progress here: ${trackingUrl}\nOrder ID: ${order.orderNo}\nPhone: ${customer.phone}`;
    
    if (customer.isNew && customer.tempPassword) {
      message += `\n\nTo view all your details and historical orders, you can also log in to our web portal with Password: ${customer.tempPassword}`;
    }
    
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  }

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
      const rawOrders = res.data.orders || [];
      const sortedOrders = [...rawOrders].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;   // no due date → end
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate); // earliest first
      });
      setOrders(sortedOrders);
      setMeasurements(measurementsRes.data.measurements || []);
      setCustomers(customersRes.data.customers || []);
      setProfileMissing(false);
      
      // Initialize profile form
      if (res.data.tailor) {
        setProfileForm({
          shopName: res.data.tailor.shopName || "",
          description: res.data.tailor.description || "",
          services: res.data.tailor.services && res.data.tailor.services.length > 0
            ? res.data.tailor.services
            : [],
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

    socket.connect();
    socket.emit("user:join", user?.id || user?._id);
    socket.on("order:updated", loadDashboard);

    return () => {
      socket.off("order:updated", loadDashboard);
      socket.disconnect();
    };
  }, [user]);

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

    setUploadingImage(true);
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressedFile);

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
      const servicesArray = (profileForm.services || []).filter((s) => s.name && s.name.trim());

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

  // Delete completed/cancelled order
  async function handleDeleteOrder() {
    if (!selectedOrder) return;
    try {
      await api.delete(`/tailors/orders/${selectedOrder._id}`);
      setIsDeleteModalOpen(false);
      setSelectedOrder(null);
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete order");
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

  const getUserId = (userObj) => {
    if (!userObj) return "";
    if (typeof userObj === "string") return userObj.trim();
    const id = userObj._id || userObj.id || "";
    return typeof id === "string" ? id.trim() : String(id).trim();
  };

  function openRecordMeasurement(customerId = "", initialGarmentType = "Blouse", measureId = "", isFromOrder = false) {
    let existing = null;

    if (isFromOrder) {
      if (measureId) {
        const targetMeasureId = getUserId(measureId);
        existing = measurements.find((m) => getUserId(m._id) === targetMeasureId);
      }
    } else {
      const targetId = getUserId(customerId);
      if (targetId) {
        existing = measurements.find((m) => {
          const mCustId = getUserId(m.customerId);
          return mCustId && mCustId === targetId;
        });
      }
    }

    if (existing) {
      setMeasurementForm({
        _id: "",
        customerId,
        profileName: existing.profileName || "Self",
        gender: existing.gender || "female",
        garmentType: existing.garmentType || initialGarmentType,
        chest: existing.values?.chest || "",
        waist: existing.values?.waist || "",
        hip: existing.values?.hip || "",
        shoulder: existing.values?.shoulder || "",
        sleeve: existing.values?.sleeve || "",
        neck: existing.values?.neck || "",
        inseam: existing.values?.inseam || "",
        length: existing.values?.length || "",
        armhole: existing.values?.armhole || "",
        blouseLength: existing.values?.blouseLength || "",
        salwarLength: existing.values?.salwarLength || "",
        notes: existing.notes || ""
      });
    } else {
      setMeasurementForm({
        _id: "",
        customerId,
        profileName: "Customer Profile",
        gender: "female",
        garmentType: initialGarmentType,
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
    }
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
              <label className="block text-xs font-semibold text-ink/75 mb-2">Services & Pricing</label>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {(profileForm.services || []).map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="e.g. Kurta"
                      value={item.name}
                      onChange={(e) => {
                        const updated = [...profileForm.services];
                        updated[idx].name = e.target.value;
                        setProfileForm({ ...profileForm, services: updated });
                      }}
                      className="flex-1 rounded border border-black/15 px-3 py-1.5 text-xs outline-none focus:border-stitch"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price || ""}
                      onChange={(e) => {
                        const updated = [...profileForm.services];
                        updated[idx].price = parseFloat(e.target.value) || 0;
                        setProfileForm({ ...profileForm, services: updated });
                      }}
                      className="w-20 rounded border border-black/15 px-3 py-1.5 text-xs outline-none focus:border-stitch"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = profileForm.services.filter((_, i) => i !== idx);
                        setProfileForm({ ...profileForm, services: updated });
                      }}
                      className="text-red-500 hover:text-red-700 p-1 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileForm({
                    ...profileForm,
                    services: [...(profileForm.services || []), { name: "", price: 0 }]
                  });
                }}
                className="mt-2 text-xs font-semibold text-stitch hover:underline flex items-center gap-1"
              >
                + Add Service Rate
              </button>
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
        <div className="flex flex-wrap gap-2">
          {activeTab === "measurements" && (
            <button
              onClick={() => {
                setSelectedOrder(null);
                openRecordMeasurement();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-black/15 bg-white px-4 py-2.5 text-sm font-medium transition hover:bg-black/[0.02]"
            >
              <Ruler size={16} /> Record Measurement
            </button>
          )}
          {activeTab === "orders" && (
            <button
              onClick={() => setIsWalkInModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-stitch px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stitch/90"
            >
              <Scissors size={16} /> New Walk-in Order
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
            {/* Order Actions - Desktop Only */}
            <div className="hidden lg:block">
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
                             src={getOptimizedImageUrl(selectedOrder.designImages[0].url, 400)} 
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
                          const custId = selectedOrder.customerId?._id || selectedOrder.customerId || "";
                          openRecordMeasurement(custId, selectedOrder.garmentType, selectedOrder.measurementId, true);
                        }}
                        className="flex-1 rounded border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-ink text-center hover:bg-black/[0.02]"
                      >
                        Record Measure
                      </button>
                    </div>

                    <div className="mt-2.5 border-t border-black/[0.04] pt-2.5 space-y-2">
                      <button
                        onClick={handleSendFreeWhatsApp}
                        className="w-full rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 text-center hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare size={13} className="text-emerald-600" /> Send Free WhatsApp Alert
                      </button>

                      {/* Delete button — only for delivered or cancelled orders */}
                      {["delivered", "cancelled"].includes(selectedOrder.status) && (
                        <button
                          onClick={() => setIsDeleteModalOpen(true)}
                          className="w-full rounded border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 text-center hover:bg-red-100 transition flex items-center justify-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                          Delete Order
                        </button>
                      )}
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
            </div>

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
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs text-ink/80 sm:grid-cols-4">
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
                <label className="block text-xs font-semibold text-ink/75 mb-2">Services & Pricing</label>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {(profileForm.services || []).map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="e.g. Kurta"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...profileForm.services];
                          updated[idx].name = e.target.value;
                          setProfileForm({ ...profileForm, services: updated });
                        }}
                        className="flex-1 rounded border border-black/15 px-3 py-1.5 text-xs outline-none focus:border-stitch"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.price || ""}
                        onChange={(e) => {
                          const updated = [...profileForm.services];
                          updated[idx].price = parseFloat(e.target.value) || 0;
                          setProfileForm({ ...profileForm, services: updated });
                        }}
                        className="w-20 rounded border border-black/15 px-3 py-1.5 text-xs outline-none focus:border-stitch"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = profileForm.services.filter((_, i) => i !== idx);
                          setProfileForm({ ...profileForm, services: updated });
                        }}
                        className="text-red-500 hover:text-red-700 p-1 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm({
                      ...profileForm,
                      services: [...(profileForm.services || []), { name: "", price: 0 }]
                    });
                  }}
                  className="mt-2 text-xs font-semibold text-stitch hover:underline flex items-center gap-1"
                >
                  + Add Service Rate
                </button>
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
                    onChange={(e) => {
                      const customerId = e.target.value;
                      const targetId = getUserId(customerId);
                      const existing = targetId
                        ? measurements.find((m) => {
                            const mCustId = getUserId(m.customerId);
                            return mCustId && mCustId === targetId;
                          })
                        : null;
                      if (existing) {
                        setMeasurementForm({
                          ...measurementForm,
                          customerId,
                          profileName: existing.profileName || "Self",
                          gender: existing.gender || "female",
                          garmentType: existing.garmentType || "Blouse",
                          chest: existing.values?.chest || "",
                          waist: existing.values?.waist || "",
                          hip: existing.values?.hip || "",
                          shoulder: existing.values?.shoulder || "",
                          sleeve: existing.values?.sleeve || "",
                          neck: existing.values?.neck || "",
                          inseam: existing.values?.inseam || "",
                          length: existing.values?.length || "",
                          armhole: existing.values?.armhole || "",
                          blouseLength: existing.values?.blouseLength || "",
                          salwarLength: existing.values?.salwarLength || "",
                          notes: existing.notes || ""
                        });
                      } else {
                        setMeasurementForm({
                          ...measurementForm,
                          customerId,
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
                      }
                    }}
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
      {/* Selected Order Details - Mobile Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-1 z-20 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm lg:hidden">
          <div className="relative w-full max-w-md rounded-md bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div>
                <p className="text-xs font-semibold text-stitch uppercase tracking-wide">Manage Stitching</p>
                <h3 className="text-lg font-bold text-ink">{selectedOrder.orderNo}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="rounded p-1 hover:bg-black/5 text-ink/40 hover:text-ink"
              >
                <X size={20} />
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
                       src={getOptimizedImageUrl(selectedOrder.designImages[0].url, 400)} 
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
                    const custId = selectedOrder.customerId?._id || selectedOrder.customerId || "";
                    openRecordMeasurement(custId, selectedOrder.garmentType, selectedOrder.measurementId, true);
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
        </div>
      )}

      {/* Walk-in Order Modal */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsWalkInModalOpen(false)}
              className="absolute right-4 top-4 text-ink/50 hover:text-ink transition"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-bold border-b border-black/10 pb-3 text-ink">
              Create Walk-in / Direct Order
            </h3>
            
            <form onSubmit={handleWalkInSubmit} className="mt-4 space-y-4">
              {/* Customer Contact */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Customer Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={walkInForm.customerPhone}
                    onChange={(e) => handleWalkInPhoneChange(e.target.value)}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={walkInForm.customerName}
                    onChange={(e) => setWalkInForm({ ...walkInForm, customerName: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
                </div>
              </div>

              {/* Garment & Catalog */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Garment Selection *</label>
                  <select
                    required
                    value={walkInForm.garmentType}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = profile?.services?.find(s => s.name === val);
                      setWalkInForm(prev => ({
                        ...prev,
                        garmentType: val,
                        stitchingCharge: matched ? matched.price.toString() : prev.stitchingCharge
                      }));
                    }}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  >
                    <option value="">Select garment type...</option>
                    {profile?.services?.map((s, idx) => (
                      <option key={idx} value={s.name}>{s.name} (₹{s.price})</option>
                    ))}
                    <option value="custom_other">-- Other Custom Garment --</option>
                  </select>
                </div>

                {/* Conditional Custom Garment Name */}
                {walkInForm.garmentType === "custom_other" && (
                  <div>
                    <label className="block text-xs font-semibold text-stitch">Custom Garment Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Designer Gown"
                      value={customGarmentName}
                      onChange={(e) => setCustomGarmentName(e.target.value)}
                      className="mt-1 w-full rounded border border-stitch/30 px-3 py-2 text-sm outline-none focus:border-stitch"
                    />
                  </div>
                )}
              </div>

              {/* Pricing & Fabric */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Stitching Charge (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="0"
                    value={walkInForm.stitchingCharge}
                    onChange={(e) => setWalkInForm({ ...walkInForm, stitchingCharge: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Fabric Charge (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={walkInForm.fabricCharge}
                    onChange={(e) => setWalkInForm({ ...walkInForm, fabricCharge: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={walkInForm.discount}
                    onChange={(e) => setWalkInForm({ ...walkInForm, discount: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
                </div>
              </div>

              {/* Fabric Source, Due Date, Measurements */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-ink/75">Fabric Provider</label>
                  <select
                    value={walkInForm.fabricProvidedBy}
                    onChange={(e) => setWalkInForm({ ...walkInForm, fabricProvidedBy: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  >
                    <option value="customer">Customer</option>
                    <option value="tailor">Tailor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/75">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={walkInForm.dueDate}
                    onChange={(e) => setWalkInForm({ ...walkInForm, dueDate: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink/75">Measurement Profile</label>
                  <select
                    value={walkInForm.measurementId}
                    onChange={(e) => setWalkInForm({ ...walkInForm, measurementId: e.target.value })}
                    className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch"
                  >
                    <option value="">None (Record later)</option>
                    {measurements
                      .filter(m => {
                        const targetPhone = walkInForm.customerPhone.trim();
                        return m.customerId?.phone?.trim() === targetPhone || getUserId(m.customerId) === walkInForm.measurementId;
                      })
                      .map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.profileName || "Profile"} ({m.garmentType})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-semibold text-ink/75">Stitching Instructions</label>
                <textarea
                  placeholder="e.g. Side zippers, sleeve style, collar depth, neck pattern design details..."
                  value={walkInForm.instructions}
                  onChange={(e) => setWalkInForm({ ...walkInForm, instructions: e.target.value })}
                  rows={2}
                  className="mt-1 w-full rounded border border-black/15 px-3 py-2 text-sm outline-none focus:border-stitch resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded bg-stitch px-4 py-3 font-semibold text-white transition hover:bg-stitch/90 mt-2 hover:shadow-md"
              >
                Create Order & Generate ID
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Walk-In Confirmation Modal */}
      {isSuccessModalOpen && successOrderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl text-center">
            <h3 className="text-2xl font-black text-emerald-600 mb-2">Order Created Successfully!</h3>
            <p className="text-sm text-ink/65 mb-6">
              Walk-in order has been recorded in the database.
            </p>

            <div className="rounded-lg bg-linen/25 border border-black/5 p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-ink/65">Order Number:</span>
                <span className="font-bold text-ink">{successOrderData.order.orderNo}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink/65">Customer Name:</span>
                <span className="font-bold text-ink">{successOrderData.customer.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink/65">Phone Number:</span>
                <span className="font-bold text-ink">{successOrderData.customer.phone}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-black/5 pt-2">
                <span className="text-ink/65">Garment:</span>
                <span className="font-bold text-stitch">{successOrderData.order.garmentType}</span>
              </div>
              
              {successOrderData.customer.isNew && successOrderData.customer.tempPassword && (
                <div className="mt-3 p-2 bg-emerald-50 rounded border border-emerald-100 text-xs text-emerald-800">
                  <p className="font-bold">New User Account Registered!</p>
                  <p className="mt-0.5">Temporary login password: <span className="font-mono font-bold select-all text-sm">{successOrderData.customer.tempPassword}</span></p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSendWalkInWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-emerald-650 bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 shadow"
              >
                <MessageSquare size={18} /> Send WhatsApp Alert (Free)
              </button>
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full rounded-md border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-black/[0.02]"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Order Confirmation Modal */}
      {isDeleteModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            {/* Icon */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 border border-red-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </div>
            </div>
            <h3 className="text-center text-lg font-bold text-ink">Delete Order?</h3>
            <p className="mt-2 text-center text-sm text-ink/60">
              Are you sure you want to permanently delete order{" "}
              <span className="font-semibold text-ink">{selectedOrder.orderNo}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-black/[0.02] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
