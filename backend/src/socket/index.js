import { Server } from "socket.io";

let io;

/**
 * Initialize socket.io ONCE
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("join-event", (eventId) => {
      socket.join(eventId);
      console.log(`Socket ${socket.id} joined event ${eventId}`);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  return io;
};

/**
 * Get initialized socket instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("❌ Socket.io not initialized");
  }
  return io;
};
