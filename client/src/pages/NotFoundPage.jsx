import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
    if (user?.role === "tailor") navigate("/tailor");
    else if (user?.role === "admin") navigate("/admin");
    else if (user?.role === "customer") navigate("/customer");
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f0fdf9 50%, #fdf8f0 100%)" }}>
      {/* Floating blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-20 animate-float-1" style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-20 animate-float-2" style={{ background: "radial-gradient(circle, #0f766e 0%, transparent 70%)" }} />
      </div>

      <div className="relative text-center max-w-lg w-full">
        {/* Glassmorphism card */}
        <div
          className="rounded-3xl px-10 py-14 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          {/* Animated 404 number */}
          <div className="relative mb-6 flex items-center justify-center select-none">
            <span
              className="text-[120px] font-black leading-none"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #0f766e 50%, #c77b2a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 4px 24px rgba(99,102,241,0.18))",
              }}
            >
              404
            </span>
          </div>

          {/* Scissors / stitch icon */}
          <div className="mb-5 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #0f766e)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" />
                <line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </div>
          </div>

          <h1
            className="mb-3 text-3xl font-bold"
            style={{ fontFamily: "'Outfit', sans-serif", color: "#1e293b" }}
          >
            Page Not Found
          </h1>
          <p className="mb-8 text-base leading-relaxed" style={{ color: "#64748b" }}>
            It seems this page went off track. The page you are looking for doesn't exist or may have been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleGoHome}
              className="flex-1 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
              style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)" }}
            >
              🏠 Go to Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 rounded-xl border px-6 py-3 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
              style={{ borderColor: "#e2e8f0", color: "#475569", background: "rgba(255,255,255,0.8)" }}
            >
              ← Go Back
            </button>
          </div>
        </div>

        {/* Decorative stitch line at bottom */}
        <div className="mt-6 flex items-center justify-center gap-1 opacity-40">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-1 w-4 rounded-full" style={{ background: i % 2 === 0 ? "#6366f1" : "#0f766e" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
