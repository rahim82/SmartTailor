export default function StatCard({ label, value, tone = "dark" }) {
  const styles = {
    dark: "bg-gradient-to-br from-ink to-neutral-800 text-white border border-neutral-700/30",
    light: "bg-white text-ink border border-black/5",
    stitch: "bg-gradient-to-br from-stitch to-teal-800 text-white shadow-teal-900/10",
    saffron: "bg-gradient-to-br from-saffron to-amber-700 text-white shadow-amber-950/10"
  };

  return (
    <div className={`rounded-xl p-5 shadow-soft hover:-translate-y-0.5 transition-all duration-200 ${styles[tone]}`}>
      <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
