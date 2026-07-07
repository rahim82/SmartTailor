import { io } from "socket.io-client";

// Connect to API backend server (defaults to localhost:5000 in dev)
const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ["websocket"]
});

// Diagnostic connection logs for debugging production handshakes
socket.on("connect", () => {
  console.log("⚡ WebSocket connected successfully! Socket ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ WebSocket connection error details:", err.message, err);
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ WebSocket disconnected. Reason:", reason);
});
