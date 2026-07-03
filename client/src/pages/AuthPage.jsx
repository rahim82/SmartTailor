import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Scissors } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { dashboardPath } from "../lib/routes.js";

const demoAccounts = [
  ["Customer", "customer@smarttailor.test"],
  ["Tailor", "tailor@smarttailor.test"],
  ["Admin", "admin@smarttailor.test"]
];

export default function AuthPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState(params.get("role") || "customer");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "password123", identifier: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
          ? await login({ identifier: form.identifier, password: form.password })
          : await register({ name: form.name, phone: form.phone, email: form.email, password: form.password, role });
      const dest = location.state?.from || dashboardPath(user.role);
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
    <main className="mx-auto grid min-h-[calc(100vh-66px)] max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <section className="flex flex-col justify-center">
        <div className="grid h-12 w-12 place-items-center rounded-md bg-ink text-white">
          <Scissors />
        </div>
        <h1 className="mt-5 text-4xl font-semibold">Connect SmartTailor to real accounts</h1>
        <p className="mt-4 max-w-xl leading-7 text-ink/70">
          Login with seeded users or register a customer/tailor. JWT token is stored locally and every dashboard uses live API calls.
        </p>
        <div className="mt-6 rounded-md border border-black/10 bg-white p-4 text-sm shadow-soft">
          <p className="font-semibold">Seed login</p>
          <div className="mt-3 space-y-2">
            {demoAccounts.map(([label, email]) => (
              <button
                key={email}
                onClick={() => {
                  setMode("login");
                  setForm((current) => ({ ...current, identifier: email, password: "password123" }));
                }}
                className="flex w-full items-center justify-between rounded bg-black/[0.03] px-3 py-2 text-left"
              >
                <span>{label}</span>
                <span className="text-ink/60">{email}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="self-center rounded-md border border-black/10 bg-white p-5 shadow-soft">
        <div className="mb-5 grid grid-cols-2 rounded-md bg-black/[0.04] p-1">
          {["login", "register"].map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`rounded px-4 py-2 text-sm font-medium capitalize ${mode === item ? "bg-ink text-white" : ""}`}
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1 w-full rounded-md border border-black/15 px-3 py-3">
                  <option value="customer">Customer</option>
                  <option value="tailor">Tailor</option>
                </select>
              </div>
              <Input label="Name" value={form.name} onChange={(value) => update("name", value)} required />
              <Input label="Phone" value={form.phone} onChange={(value) => update("phone", value)} required />
              <Input label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} />
            </>
          )}
          {mode === "login" && (
            <Input label="Email or phone" value={form.identifier} onChange={(value) => update("identifier", value)} required />
          )}
          <Input label="Password" type="password" value={form.password} onChange={(value) => update("password", value)} required />
          {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-md bg-ink px-4 py-3 font-medium text-white disabled:opacity-60">
            {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Input({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-black/15 px-3 py-3 outline-none focus:border-stitch"
      />
    </div>
  );
}
