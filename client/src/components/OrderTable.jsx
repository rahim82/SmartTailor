import { CreditCard, Calendar, User, Scissors } from "lucide-react";

export default function OrderTable({ rows, mode = "customer", onSelect, selectedId }) {
  const getStatusBadge = (status) => {
    const styles = {
      placed: "bg-blue-50 text-blue-700 border-blue-200",
      measurement: "bg-purple-50 text-purple-700 border-purple-200",
      cutting: "bg-amber-50 text-amber-700 border-amber-200",
      stitching: "bg-indigo-50 text-indigo-700 border-indigo-200",
      trial: "bg-orange-50 text-orange-700 border-orange-200",
      ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
      delivered: "bg-gray-50 text-gray-700 border-gray-200",
      cancelled: "bg-red-50 text-red-700 border-red-200"
    };
    return (
      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${styles[status] || "bg-gray-50 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-black/10 bg-white p-8 text-center text-ink/50 shadow-soft">
        No orders found.
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Card List View (For screens smaller than md) */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => {
          const partner = mode === "customer" 
            ? (row.tailorId?.shopName || "Unknown Tailor")
            : (row.customerId?.name || "Walk-in Customer");
          const dateStr = row.dueDate 
            ? new Date(row.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : "Not set";
          const isSelected = selectedId === row._id;

          return (
            <div 
              key={row._id}
              onClick={() => onSelect && onSelect(row)}
              className={`rounded-lg border p-4 transition-all bg-white shadow-soft cursor-pointer flex flex-col justify-between gap-2.5 ${
                isSelected ? "border-stitch bg-linen/25 ring-1 ring-stitch/10" : "border-black/10 hover:border-black/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink text-sm">{row.orderNo}</span>
                {getStatusBadge(row.status)}
              </div>
              <div className="text-xs text-ink/80 space-y-1 mt-0.5">
                <p className="flex items-center gap-1.5">
                  <User size={13} className="text-ink/40" />
                  <span>
                    <span className="text-ink/55">{mode === "customer" ? "Tailor:" : "Customer:"}</span>{" "}
                    <strong className="text-ink font-semibold">{partner}</strong>
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Scissors size={13} className="text-ink/40" />
                  <span>
                    <span className="text-ink/55">Garment:</span>{" "}
                    <strong className="text-ink font-semibold">{row.garmentType}</strong>
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-ink/40" />
                  <span>
                    <span className="text-ink/55">Due Date:</span> {dateStr}
                  </span>
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-black/5 pt-2.5 mt-1">
                <span className="text-[10px] text-ink/40 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <CreditCard size={11} /> Total Price
                </span>
                <span className="font-bold text-ink text-sm">₹{(row.pricing?.total || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table view (For screens md and wider) */}
      <div className="hidden md:block overflow-hidden rounded-md border border-black/10 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-ink/60 border-b border-black/10">
              <tr>
                <th className="px-5 py-3.5">Order No</th>
                <th className="px-5 py-3.5">{mode === "customer" ? "Tailor Shop" : "Customer"}</th>
                <th className="px-5 py-3.5">Garment</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {rows.map((row) => {
                const partner = mode === "customer" 
                  ? (row.tailorId?.shopName || "Unknown Tailor")
                  : (row.customerId?.name || "Walk-in Customer");
                const dateStr = row.dueDate 
                  ? new Date(row.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : "Not set";
                const isSelected = selectedId === row._id;

                return (
                  <tr 
                    key={row._id} 
                    onClick={() => onSelect && onSelect(row)}
                    className={`group transition-colors ${onSelect ? "cursor-pointer hover:bg-black/[0.01]" : ""} ${isSelected ? "bg-linen/50" : ""}`}
                  >
                    <td className="px-5 py-4 font-semibold text-ink group-hover:text-stitch">
                      {row.orderNo}
                    </td>
                    <td className="px-5 py-4 font-medium">{partner}</td>
                    <td className="px-5 py-4 text-ink/80">{row.garmentType}</td>
                    <td className="px-5 py-4">{getStatusBadge(row.status)}</td>
                    <td className="px-5 py-4 text-ink/70">{dateStr}</td>
                    <td className="px-5 py-4 text-right font-semibold text-ink">
                      ₹{(row.pricing?.total || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
