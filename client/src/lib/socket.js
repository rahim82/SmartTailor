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
