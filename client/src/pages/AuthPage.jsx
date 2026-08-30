import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Scissors, Eye, EyeOff, User, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { dashboardPath } from "../lib/routes.js";

const demoAccounts = [
  { label: "Customer", email: "customer@smarttailor.test", phone: "8888888888", password: "password123", role: "customer", icon: User },
  { label: "Tailor", email: "tailor@smarttailor.test", phone: "7777777777", password: "password123", role: "tailor", icon: Store }
];

export default function AuthPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState(params.get("role") || "customer");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "password123", identifier: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, login, register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // If already logged in, redirect directly to user role dashboard
  useEffect(() => {
    if (user && !busy) {
      navigate(dashboardPath(user.role), { replace: true });
    }
  }, [user, navigate, busy]);

  // Load Google Identity Services SDK
  useEffect(() => {
    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (googleClientId && window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: (res) => handleGoogleSuccess(res)
          });
        }
      };
      document.body.appendChild(script);
    }
  }, []);

  async function handleGoogleSuccess(credentialResponse) {
    try {
      setBusy(true);
      setError("");
      const authUser = await googleLogin({
        credential: credentialResponse.credential,
        role: mode === "register" ? role : undefined
      });
      navigate(dashboardPath(authUser?.role || "customer"), { 
        replace: true, 
        state: { selectedTailorId: location.state?.selectedTailorId } 
      });
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignInClick() {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      const email = prompt("Enter your Google Account email to continue:", "customer.google@gmail.com");
      if (!email || !email.trim()) return;
      try {
        setBusy(true);
        setError("");
        const authUser = await googleLogin({
          email: email.trim(),
          name: email.split("@")[0].replace(/[._]/g, " "),
          avatarUrl: "https://lh3.googleusercontent.com/a/default-user",
          role: mode === "register" ? role : "customer"
        });
        navigate(dashboardPath(authUser?.role || "customer"), { 
          replace: true, 
          state: { selectedTailorId: location.state?.selectedTailorId } 
        });
      } catch (err) {
        setError(err.response?.data?.message || "Google authentication failed");
      } finally {
        setBusy(false);
      }
    }
  }

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
            const result = await googleLogin(credential);
            if (result.requiresRole) {
              setGoogleCredential(credential);
              setGoogleRole("customer");
              return;
            }
            navigate(dashboardPath(result.role), { replace: true });
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
      const authUser =
        mode === "login"
          ? await login({ identifier: form.identifier, password: form.password, role })
          : await register({ name: form.name, phone: form.phone, email: form.email, password: form.password, role });

      // Direct destination determined strictly by the user's role from database
      const dest = dashboardPath(authUser?.role || "customer");
      navigate(dest, { 
        replace: true, 
        state: { selectedTailorId: location.state?.selectedTailorId } 
      });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Authentication failed. Please check your credentials.");
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
        
        <div className="mt-6 rounded-xl border border-white/70 bg-white/45 p-4 text-sm shadow-soft backdrop-blur-md">
          <p className="font-semibold text-ink">Quick Demo Login</p>
          <p className="text-xs text-ink/60 mt-0.5">Click any role to prefill credentials and log in directly:</p>
          <div className="mt-3 space-y-2">
            {demoAccounts.map(({ label, email, phone, password, icon: IconComponent }) => (
              <button
                key={email}
                type="button"
                onClick={() => {
                  setMode("login");
                  setForm((current) => ({ ...current, identifier: email, password: password }));
                }}
                className="flex w-full items-center justify-between rounded-lg border border-black/5 bg-white/80 px-3.5 py-2.5 text-left hover:bg-black/[0.04] transition shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="grid h-7 w-7 place-items-center rounded bg-ink/5 text-stitch">
                    <IconComponent size={15} />
                  </div>
                  <div>
                    <span className="font-semibold text-ink text-xs block">{label} Account</span>
                    <span className="text-ink/60 text-[11px] block">{email}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-ink/50 block">Phone: {phone}</span>
                  <span className="text-[11px] font-semibold text-stitch">Use Demo →</span>
                </div>
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
          <div className="relative my-2 flex items-center justify-center">
            <div className="border-t border-black/10 w-full" />
            <span className="bg-white/80 px-3 text-[11px] font-semibold text-ink/45 uppercase tracking-wider whitespace-nowrap">
              Or continue with
            </span>
            <div className="border-t border-black/10 w-full" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignInClick}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-xs hover:bg-black/[0.02] hover:border-black/30 transition active:scale-[0.99] disabled:opacity-60"
          >
            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{mode === "login" ? "Sign in with Google" : "Sign up with Google"}</span>
          </button>
          {mode === "login" && (
            <button type="button" onClick={() => navigate("/forgot-password")} className="w-full text-sm font-medium text-stitch hover:underline pt-1">
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
