import { useState, useEffect } from "react";
import { ShieldCheck, UserCheck, Scissors, TrendingUp, RefreshCw, Check, X } from "lucide-react";
import PageShell from "../components/PageShell.jsx";
import StatCard from "../components/StatCard.jsx";
import { api } from "../lib/api.js";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, tailors: 0, orders: 0, gmv: 0 });
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAdminData() {
    try {
      setLoading(true);
      const [statsRes, tailorsRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/tailors")
      ]);
      setStats(statsRes.data.stats || { users: 0, tailors: 0, orders: 0, gmv: 0 });
      setTailors(tailorsRes.data.tailors || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load admin workspace data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleVerify(tailorId, status) {
    try {
      await api.patch(`/admin/tailors/${tailorId}/verify`, { verificationStatus: status });
      alert(`Tailor status updated to ${status}`);
      loadAdminData(); // Refresh list and stats
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update verification status");
    }
  }

  if (loading && tailors.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center font-medium text-ink/70">
        Loading admin panel dashboard...
      </div>
    );
  }

  return (
    <PageShell 
      eyebrow="Admin Dashboard" 
      title="Monitor marketplace operations"
      action={
        <button
          onClick={loadAdminData}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-medium transition hover:bg-black/[0.02]"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      }
    >
      {error && <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="GMV (Gross Volume)" value={`₹${(stats.gmv || 0).toLocaleString("en-IN")}`} tone="dark" />
        <StatCard label="Total Orders" value={stats.orders.toString()} tone="stitch" />
        <StatCard label="Boutique Partners" value={stats.tailors.toString()} tone="light" />
        <StatCard label="Platform Users" value={stats.users.toString()} tone="saffron" />
      </div>

      <div className="mt-6 rounded-md border border-black/10 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-stitch" />
            <h2 className="font-semibold text-ink">Tailor Verification Queue</h2>
          </div>
          <span className="rounded bg-black/[0.04] px-2.5 py-1 text-xs font-semibold text-ink/75">
            {tailors.filter(t => t.verificationStatus === "pending").length} Pending
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/60 border-b border-black/10">
              <tr>
                <th className="px-5 py-3.5">Shop Name</th>
                <th className="px-5 py-3.5">City & Location</th>
                <th className="px-5 py-3.5">Owner Details</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {tailors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink/50">
                    No tailor boutiques registered.
                  </td>
                </tr>
              ) : (
                tailors.map((tailor) => {
                  const statusStyles = {
                    pending: "bg-amber-50 text-amber-700 border-amber-200",
                    verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    rejected: "bg-red-50 text-red-700 border-red-200"
                  };

                  return (
                    <tr key={tailor._id} className="hover:bg-black/[0.005] transition-colors">
                      <td className="px-5 py-4 font-semibold text-ink">
                        {tailor.shopName}
                        {tailor.description && (
                          <span className="block text-xs font-normal text-ink/50 mt-0.5 truncate max-w-[200px]">
                            {tailor.description}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-ink/80">{tailor.location?.city || "Unknown City"}</span>
                        <span className="block text-[11px] text-ink/50 mt-0.5">
                          {tailor.location?.address}, {tailor.location?.pincode}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-ink/80">{tailor.userId?.name || "No User linked"}</span>
                        <span className="block text-[11px] text-ink/50 mt-0.5">
                          Ph: {tailor.userId?.phone || "N/A"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${statusStyles[tailor.verificationStatus] || "bg-gray-50 text-gray-700"}`}>
                          {tailor.verificationStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {tailor.verificationStatus !== "verified" && (
                            <button
                              onClick={() => handleVerify(tailor._id, "verified")}
                              className="inline-flex h-7 w-7 items-center justify-center rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              title="Verify Partner"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          {tailor.verificationStatus !== "rejected" && (
                            <button
                              onClick={() => handleVerify(tailor._id, "rejected")}
                              className="inline-flex h-7 w-7 items-center justify-center rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                              title="Reject / Suspend"
                            >
                              <X size={14} />
                            </button>
                          )}
                          {tailor.verificationStatus !== "pending" && (
                            <button
                              onClick={() => handleVerify(tailor._id, "pending")}
                              className="text-xs text-stitch hover:underline ml-1"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
