import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import App from "./App.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./styles.css";

const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.jsx"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard.jsx"));
const TailorDashboard = lazy(() => import("./pages/TailorDashboard.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const TrackOrder = lazy(() => import("./pages/TrackOrder.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage.jsx"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
          <Suspense fallback={
            <div className="flex h-screen w-screen items-center justify-center bg-zinc-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-stitch border-t-transparent" />
            </div>
          }>
            <Routes>
              <Route element={<App />}>
                <Route index element={<LandingPage />} />
                <Route path="track" element={<TrackOrder />} />
                <Route path="auth" element={<AuthPage />} />
                <Route path="customer" element={<ProtectedRoute roles={["customer"]}><CustomerDashboard /></ProtectedRoute>} />
                <Route path="tailor" element={<ProtectedRoute roles={["tailor"]}><TailorDashboard /></ProtectedRoute>} />
                <Route path="admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
                <Route path="unauthorized" element={<UnauthorizedPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
