import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Scissors, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { dashboardPath } from "../lib/routes.js";

const demoAccounts = [
  { label: "Customer", email: "customer@smarttailor.test", password: "password123" },
  { label: "Tailor", email: "tailor@smarttailor.test", password: "password123" }
];

export default function AuthPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState(params.get("role") || "customer");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "password123", identifier: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [notice] = useState(location.state?.resetMessage || "");

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    function renderGoogleButton() {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setError("");
          setBusy(true);
          try {
            const user = await googleLogin(credential, role);
            navigate(dashboardPath(user.role), { replace: true });
          } catch (apiError) {
            setError(apiError.response?.data?.message || "Google sign-in failed");
          } finally {
            setBusy(false);
          }
        }
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: googleButtonRef.current.clientWidth,
        text: "continue_with"
      });
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);
  }, [googleClientId, googleLogin, mode, navigate, role]);
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const user =
        mode === "login"
          ? await login({ identifier: form.identifier, password: form.password, role })
          : await register({ name: form.name, phone: form.phone, email: form.email, password: form.password, role });
      const requestedPath = location.state?.from;
      const allowedPaths = {
        customer: "/customer",
        tailor: "/tailor",
        admin: "/admin"
      };
      const roleDashboard = allowedPaths[user.role] || "/customer";
      const dest = requestedPath === roleDashboard ? requestedPath : dashboardPath(user.role);
      navigate(dest, { 
        replace: true, 
        state: { selectedTailorId: location.state?.selectedTailorId } 
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page mx-auto flex min-h-[calc(100vh-66px)] max-w-2xl flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="flex w-full flex-col items-center justify-center text-center">
        <div className="grid h-12 w-12 place-items-center rounded-md bg-ink text-white">
          <Scissors />
        </div>
        <h1 className="mt-5 text-4xl font-semibold">Connect SmartTailor to real accounts</h1>
        
        <div className="mt-6 rounded-md border border-white/70 bg-white/45 p-4 text-sm shadow-soft backdrop-blur-md">
          <p className="font-semibold">Demo login</p>
          <div className="mt-3 space-y-2">
            {demoAccounts.map(({ label, email, password }) => (
              <button
                key={email}
                onClick={() => {
                  setMode("login");
                  setForm((current) => ({ ...current, identifier: email, password: password }));
                }}
                className="flex w-full items-center justify-between rounded bg-black/[0.03] px-3 py-2 text-left hover:bg-black/[0.06] transition"
              >
                <span>{label}</span>
                <span className="text-ink/60">{email}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full max-w-xl self-center rounded-md border border-white/70 bg-white/50 p-5 shadow-soft backdrop-blur-md">
        <div className="mb-5 grid grid-cols-2 rounded-md bg-black/[0.04] p-1">
          {["login", "register"].map((item) => (
            <button
              key={item}
              onClick={() => {
                setMode(item);
                if (item === "register" && role === "admin") setRole("customer");
              }}
              className={`rounded px-4 py-2 text-sm font-medium capitalize ${mode === item ? "bg-ink text-white" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-xs font-semibold text-ink/75 uppercase tracking-wider">Account type</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-white/45 px-4.5 py-3 text-sm outline-none focus:border-stitch focus:ring-4 focus:ring-stitch/10 focus:bg-white/85 transition-all duration-200"
              >
                <option value="customer">Customer</option>
                <option value="tailor">Tailor</option>
              </select>
            </div>
          )}
          {mode === "register" && (
            <>
              <Input label="Name" value={form.name} onChange={(value) => update("name", value)} required />
              <Input label="Phone" value={form.phone} onChange={(value) => update("phone", value)} required />
              <Input label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} />
            </>
          )}
          {mode === "login" && (
            <Input label="Email or phone" value={form.identifier} onChange={(value) => update("identifier", value)} required />
          )}
          <div className="relative">
            <label className="text-xs font-semibold text-ink/75 uppercase tracking-wider">Password</label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                required
                onChange={(event) => update("password", event.target.value)}
                className="w-full rounded-lg border border-black/15 bg-white/45 pl-4.5 pr-12 py-3 text-sm outline-none focus:border-stitch focus:ring-4 focus:ring-stitch/10 focus:bg-white/85 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-ink/40 hover:text-ink focus:outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {notice && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}
          <button 
            disabled={busy} 
            className="w-full rounded-lg bg-ink hover:bg-ink/90 active:scale-[0.99] px-4 py-3 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-60 disabled:pointer-events-none"
          >
            {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
          {mode === "login" && googleClientId && (
            <>
              <div className="flex items-center gap-3 text-xs text-ink/45">
                <span className="h-px flex-1 bg-black/10" />
                <span>or continue with</span>
                <span className="h-px flex-1 bg-black/10" />
              </div>
              <div ref={googleButtonRef} className="flex min-h-10 w-full justify-center" />
            </>
          )}
          {mode === "login" && (
            <button type="button" onClick={() => navigate("/forgot-password")} className="w-full text-sm font-medium text-stitch hover:underline">
              Forgot password?
            </button>
          )}
        </form>
      </section>
    </main>
  );
}

function Input({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="text-xs font-semibold text-ink/75 uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg border border-black/15 bg-white/45 px-4.5 py-3 text-sm outline-none focus:border-stitch focus:ring-4 focus:ring-stitch/10 focus:bg-white/85 transition-all duration-200"
      />
    </div>
  );
}
