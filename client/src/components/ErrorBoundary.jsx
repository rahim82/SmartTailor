import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // You can log to an error reporting service here
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;
    const isDev = import.meta.env.DEV;

    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}
      >
        {/* Floating blobs - dark themed */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            className="absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-10 animate-float-1"
            style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-10 animate-float-2"
            style={{ background: "radial-gradient(circle, #f43f5e 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative text-center max-w-lg w-full">
          {/* Dark glassmorphism card */}
          <div
            className="rounded-3xl px-10 py-14 shadow-2xl"
            style={{
              background: "rgba(30, 41, 59, 0.8)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
            }}
          >
            {/* Error icon with pulse ring */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-2xl animate-ping opacity-30"
                  style={{ background: "linear-gradient(135deg, #f43f5e, #6366f1)" }}
                />
                <div
                  className="relative flex h-20 w-20 items-center justify-center rounded-2xl shadow-2xl"
                  style={{ background: "linear-gradient(135deg, #f43f5e, #6366f1)" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
              </div>
            </div>

            <h1
              className="mb-2 text-4xl font-black"
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: "linear-gradient(135deg, #f1f5f9, #94a3b8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Something Went Wrong!
            </h1>
            <p className="mb-6 text-base leading-relaxed" style={{ color: "#94a3b8" }}>
              An unexpected error occurred in the application. Our team has been notified.
            </p>

            {/* Error message box (dev only) */}
            {isDev && error && (
              <div
                className="mb-6 rounded-xl p-4 text-left text-xs font-mono"
                style={{ background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244,63,94,0.25)", color: "#fca5a5" }}
              >
                <p className="mb-1 font-bold text-red-400">Error:</p>
                <p className="break-all">{error.message}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex-1 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                🔄 Try Again
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 rounded-xl px-6 py-3 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                style={{ border: "1px solid rgba(99,102,241,0.3)", color: "#94a3b8", background: "rgba(255,255,255,0.05)" }}
              >
                🏠 Go to Home
              </button>
            </div>
          </div>

          {/* Decorative stitch line */}
          <div className="mt-6 flex items-center justify-center gap-1 opacity-30">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-1 w-4 rounded-full" style={{ background: i % 2 === 0 ? "#6366f1" : "#f43f5e" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}
