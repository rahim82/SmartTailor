import { Outlet } from "react-router-dom";
import Header from "./components/Header.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-linen text-ink">
      <Header />
      <Outlet />
    </div>
  );
}
