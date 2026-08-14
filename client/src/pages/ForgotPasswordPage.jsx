import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Mail, Scissors } from "lucide-react";
import { api } from "../lib/api.js";

export default function ForgotPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  async function sendResetLink(event) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setNotice(data.message + " Check your inbox and spam folder.");
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to send the reset link");
    } finally { setBusy(false); }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true); setError("");
    try {
      const { data } = await api.post("/auth/reset-password", { token, password });
      navigate("/auth", { replace: true, state: { resetMessage: data.message } });
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Unable to reset your password");
    } finally { setBusy(false); }
  }

  const isResetting = Boolean(token);
  return (
    <main className="mx-auto flex min-h-[calc(100vh-66px)] max-w-xl items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-xl border border-black/10 bg-white p-6 shadow-soft sm:p-8">
        <Link to="/auth" className="inline-flex items-center gap-2 text-sm font-medium text-ink/65 hover:text-stitch"><ArrowLeft size={16} /> Back to login</Link>
        <div className="mt-6 grid h-12 w-12 place-items-center rounded-md bg-ink text-white"><Scissors /></div>
        <h1 className="mt-5 text-3xl font-semibold">{isResetting ? "Choose a new password" : "Forgot your password?"}</h1>
        <p className="mt-2 text-sm leading-6 text-ink/65">{isResetting ? "Enter a new password for your SmartTailor account." : "Enter your registered email and we?ll send you a secure reset link."}</p>

        <form onSubmit={isResetting ? changePassword : sendResetLink} className="mt-6 space-y-4">
          {!isResetting && <Field label="Email address" type="email" value={email} onChange={setEmail} required />}
          {isResetting && <div className="relative"><Field label="New password" type={showPassword ? "text" : "password"} value={password} onChange={setPassword} minLength="8" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute bottom-3 right-4 text-ink/45 hover:text-ink">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>}
          {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {isResetting && <Field label="Confirm new password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={setConfirmPassword} minLength="8" required />}
          {notice && <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-ink/90 disabled:pointer-events-none disabled:opacity-60">{busy ? "Please wait..." : isResetting ? "Reset password" : "Email reset link"}</button>
        </form>
        {!isResetting && <p className="mt-5 flex items-center gap-2 text-xs text-ink/55"><Mail size={14} /> The link expires in 30 minutes.</p>}
      </section>
    </main>
  );
}

function Field({ label, type = "text", value, onChange, minLength, required }) {
  return <div><label className="text-xs font-semibold uppercase tracking-wider text-ink/75">{label}</label><input type={type} value={value} minLength={minLength} required={required} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-lg border border-black/15 bg-black/[0.01] px-4.5 py-3 text-sm outline-none" /></div>;
}
