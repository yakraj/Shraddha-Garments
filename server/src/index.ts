import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Import routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import employeeRoutes from "./routes/employees.js";
import attendanceRoutes from "./routes/attendance.js";
import machineRoutes from "./routes/machines.js";
import materialRoutes from "./routes/materials.js";
import customerRoutes from "./routes/customers.js";
import supplierRoutes from "./routes/suppliers.js";
import invoiceRoutes from "./routes/invoices.js";
import purchaseOrderRoutes from "./routes/purchaseOrders.js";
import measurementRoutes from "./routes/measurements.js";
import analyticsRoutes from "./routes/analytics.js";
import notificationRoutes from "./routes/notifications.js";
import settingsRoutes from "./routes/settings.js";
import hsnRoutes from "./routes/hsn.js";
import fabricRoutes from "./routes/fabrics.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handle Vercel's base path stripping or doubling
// If Vercel sends /api/health -> express sees /api/health
// If Vercel sends /health -> express sees /health but routes are mounted at /api/
// This middleware ensures consistent routing
app.use((req, res, next) => {
  // If request URL doesn't start with /api, but we are in Vercel, prefix it?
  // Actually, safer to mount routes on both / and /api to be sure.
  next();
});

// Make prisma available in routes
app.locals.prisma = prisma;

app.get("/", (req, res) => {
  res.json({ message: "Express server is running", version: "1.0.1" });
});

// API Routes
const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/employees", employeeRoutes);
apiRouter.use("/attendance", attendanceRoutes);
apiRouter.use("/machines", machineRoutes);
apiRouter.use("/materials", materialRoutes);
apiRouter.use("/customers", customerRoutes);
apiRouter.use("/suppliers", supplierRoutes);
apiRouter.use("/invoices", invoiceRoutes);
apiRouter.use("/purchase-orders", purchaseOrderRoutes);
apiRouter.use("/measurements", measurementRoutes);
apiRouter.use("/analytics", analyticsRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/settings", settingsRoutes);
apiRouter.use("/hsn", hsnRoutes);
apiRouter.use("/fabrics", fabricRoutes);

// Mount router at /api AND / (fallback for Vercel oddities)
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal Server Error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  },
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Express: Route not found",
    path: req.url,
  });
});

// Start server only when not running on Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
