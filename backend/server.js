import dotenv from "dotenv";
dotenv.config();
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./src/config/db.js";
import eventRoutes from "./src/routes/event.js";
import { fileURLToPath } from "url";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use("/events", eventRoutes);

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*", // update in production
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("join-event", (eventId) => {
    socket.join(eventId);
    console.log(`Socket ${socket.id} joined event ${eventId}`);
  });

  socket.on("disconnect", () => {
  });
});

// Serve frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
});
