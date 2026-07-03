export default function StatCard({ label, value, tone = "dark" }) {
  const styles = {
    dark: "bg-ink text-white",
    light: "bg-white text-ink",
    stitch: "bg-stitch text-white",
    saffron: "bg-saffron text-white"
  };

  return (
    <div className={`rounded-md p-5 shadow-soft ${styles[tone]}`}>
      <p className="text-sm opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
