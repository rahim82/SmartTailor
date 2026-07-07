import { io } from "socket.io-client";

// Connect to API backend server (defaults to localhost:5000 in dev)
const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = io(socketUrl, {
  autoConnect: false,
  transports: ["websocket"]
});
