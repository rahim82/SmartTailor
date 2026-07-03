export function registerSockets(io) {
  io.on("connection", (socket) => {
    socket.on("user:join", (userId) => {
      if (userId) socket.join(userId);
    });
  });
}
