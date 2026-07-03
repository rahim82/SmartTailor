import { Link, NavLink } from "react-router-dom";
import { LogOut, Scissors } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { dashboardPath } from "../lib/routes.js";

const navItems = [
  { to: "/customer", label: "Customer" },
  { to: "/tailor", label: "Tailor" },
  { to: "/admin", label: "Admin" }
];

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-linen/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-ink text-white">
            <Scissors size={18} />
          </span>
          SmartTailor
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 rounded-md border border-black/10 bg-white p-1 text-sm shadow-sm sm:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded px-3 py-2 transition ${isActive ? "bg-ink text-white" : "text-ink/70 hover:bg-black/5"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {user ? (
            <div className="flex items-center gap-2">
              <Link to={dashboardPath(user.role)} className="hidden text-sm font-medium sm:block">{user.name}</Link>
              <button onClick={logout} className="grid h-9 w-9 place-items-center rounded-md border border-black/10 bg-white" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
