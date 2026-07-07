import http from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { registerSockets } from "./sockets/index.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);
registerSockets(io);

await connectDatabase();

server.listen(env.port, () => {
  console.log(`SmartTailor API running on port ${env.port}`);
});
