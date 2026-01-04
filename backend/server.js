import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import connectDB from "./src/config/db.js";
import eventRoutes from "./src/routes/event.js";
import { fileURLToPath } from "url";
import path from "path";
import { initSocket } from "./src/socket/index.js";

process.on("uncaughtException", (err) => {
  console.error(" UNCAUGHT EXCEPTION");
  console.error(err.name, err.message);
  process.exit(1);
});
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use("/events", eventRoutes);

const server = http.createServer(app);
initSocket(server);

// Serve frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});
//End Serve Frontend

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION");
  console.error(err.name, err.message);

  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    process.exit(0);
  });
});