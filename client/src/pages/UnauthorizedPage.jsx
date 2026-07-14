import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoToDashboard = () => {
    if (user?.role === "tailor") navigate("/tailor");
    else if (user?.role === "admin") navigate("/admin");
    else if (user?.role === "customer") navigate("/customer");
    else navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #fff7ed 50%, #fdf2f8 100%)" }}>
      {/* Floating blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full opacity-15 animate-float-1" style={{ background: "radial-gradient(circle, #f43f5e 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 -left-32 h-96 w-96 rounded-full opacity-15 animate-float-2" style={{ background: "radial-gradient(circle, #c77b2a 0%, transparent 70%)" }} />
      </div>

      <div className="relative text-center max-w-lg w-full">
        {/* Glassmorphism card */}
        <div
          className="rounded-3xl px-10 py-14 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          {/* 403 number */}
          <div className="relative mb-6 flex items-center justify-center select-none">
            <span
              className="text-[120px] font-black leading-none"
              style={{
                background: "linear-gradient(135deg, #f43f5e 0%, #c77b2a 60%, #f97316 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 4px 24px rgba(244,63,94,0.18))",
              }}
            >
              403
            </span>
          </div>

          {/* Lock icon */}
          <div className="mb-5 flex justify-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #f43f5e, #c77b2a)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          <h1
            className="mb-3 text-3xl font-bold"
            style={{ fontFamily: "'Outfit', sans-serif", color: "#1e293b" }}
          >
            Access Denied
          </h1>
          <p className="mb-2 text-base leading-relaxed" style={{ color: "#64748b" }}>
            This area is restricted. You do not have permission to access this page.
          </p>

          {user && (
            <div
              className="mb-6 mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
              style={{ background: "rgba(244,63,94,0.08)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.2)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              You are logged in as <span className="font-bold capitalize">{user.role}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleGoToDashboard}
              className="flex-1 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
              style={{ background: "linear-gradient(135deg, #0f766e, #0d9488)" }}
            >
              🏠 Go to Dashboard
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

        {/* Decorative stitch line */}
        <div className="mt-6 flex items-center justify-center gap-1 opacity-40">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-1 w-4 rounded-full" style={{ background: i % 2 === 0 ? "#f43f5e" : "#c77b2a" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
