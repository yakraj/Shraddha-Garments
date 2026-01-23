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
    origin:
      process.env.NODE_ENV === "production"
        ? true // Allow the actual production domain
        : (origin, callback) => {
            if (
              !origin ||
              origin.includes("localhost") ||
              origin.includes("127.0.0.1") ||
              origin.startsWith("http://192.168.1.") ||
              origin.startsWith("https://192.168.1.")
            ) {
              callback(null, true);
            } else {
              callback(new Error("Not allowed by CORS"));
            }
          },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make prisma available in routes
app.locals.prisma = prisma;

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/measurements", measurementRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/hsn", hsnRoutes);
app.use("/api/fabrics", fabricRoutes);

// Health check
app.get("/api/health", (req, res) => {
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
  res.status(404).json({ success: false, message: "Route not found" });
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
