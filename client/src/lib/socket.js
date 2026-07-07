import { io } from "socket.io-client";

// Connect to API backend server (defaults to localhost:5000 in dev)
let socketUrl = "http://localhost:5000";

try {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    socketUrl = new URL(apiUrl.trim()).origin;
  }
} catch (err) {
  console.error("Failed to parse socket connection URL:", err);
}

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
