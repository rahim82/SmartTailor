import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { LogOut, Scissors, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { dashboardPath } from "../lib/routes.js";

const publicNav = [
  { to: "/track", label: "Track Order" }
];

export default function Header() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/track", label: "Track Order" },
    ...(!user
      ? [
          { to: "/customer", label: "Customer" },
          { to: "/tailor", label: "Tailor" },
          { to: "/admin", label: "Admin" }
        ]
      : user.role === "customer"
      ? [
          { to: "/customer", label: "My Orders & Fittings" }
        ]
      : user.role === "tailor"
      ? [
          { to: "/tailor", label: "Workshop Dashboard" }
        ]
      : [
          { to: "/admin", label: "Admin Portal" }
        ])
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/75 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-stitch text-white shadow-sm hover:scale-105 transition-transform duration-200">
            <Scissors size={18} />
          </span>
          <span className="font-bold text-ink">Smart<span className="text-stitch">Tailor</span></span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 rounded-md border border-black/10 bg-white p-1 text-sm shadow-sm sm:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded px-3 py-2 transition ${isActive ? "bg-ink text-white font-semibold" : "text-ink/70 hover:bg-black/5"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {user ? (
            <div className="flex items-center gap-2">
              <Link 
                to={dashboardPath(user.role)} 
                className="flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3.5 py-1.5 text-sm font-semibold text-ink shadow-xs hover:border-stitch/50 transition"
              >
                <span>{user.name}</span>
              </Link>
              <button 
                onClick={logout} 
                className="grid h-9 w-9 place-items-center rounded-md border border-black/10 bg-white text-ink/70 hover:text-red-600 hover:border-red-200 transition" 
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 transition shadow-sm">
              Login
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="grid h-9 w-9 place-items-center rounded-md border border-black/10 bg-white sm:hidden text-ink"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-black/10 bg-white px-4 py-3 sm:hidden shadow-md">
          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded px-3 py-2.5 transition font-medium ${isActive ? "bg-ink text-white" : "text-ink/70 hover:bg-black/5"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user && (
              <div className="mt-2 border-t border-black/5 pt-2 flex flex-col gap-1">
                <p className="px-3 py-1 text-xs font-semibold text-ink/40 uppercase tracking-wide">Logged In As</p>
                <Link
                  to={dashboardPath(user.role)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded px-3 py-2.5 text-sm font-bold text-stitch hover:bg-black/5"
                >
                  {user.name}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
