import { Router } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all suppliers
router.get("/", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { supplierCode: { contains: String(search), mode: "insensitive" } },
        { name: { contains: String(search), mode: "insensitive" } },
        { contactPerson: { contains: String(search), mode: "insensitive" } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === "true";

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          _count: {
            select: { purchaseOrders: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      success: true,
      data: suppliers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get supplier by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!supplier) {
      return res
        .status(404)
        .json({ success: false, message: "Supplier not found" });
    }

    res.json({ success: true, data: supplier });
  } catch (error) {
    console.error("Get supplier error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create supplier
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  [body("name").notEmpty(), body("phone").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        country,
        gstNumber,
        panNumber,
        bankDetails,
      } = req.body;

      // Generate supplier code
      const lastSupplier = await prisma.supplier.findFirst({
        orderBy: { supplierCode: "desc" },
      });
      const nextId = lastSupplier
        ? String(
            parseInt(lastSupplier.supplierCode.replace("SUP", "")) + 1,
          ).padStart(4, "0")
        : "0001";
      const supplierCode = `SUP${nextId}`;

      const supplier = await prisma.supplier.create({
        data: {
          supplierCode,
          name,
          contactPerson,
          email,
          phone,
          address,
          city,
          state,
          country: country || "India",
          gstNumber,
          panNumber,
          bankDetails,
        },
      });

      res.status(201).json({ success: true, data: supplier });
    } catch (error) {
      console.error("Create supplier error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Update supplier
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      const {
        name,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        country,
        gstNumber,
        panNumber,
        bankDetails,
        isActive,
      } = req.body;

      const supplier = await prisma.supplier.update({
        where: { id: req.params.id },
        data: {
          name,
          contactPerson,
          email,
          phone,
          address,
          city,
          state,
          country,
          gstNumber,
          panNumber,
          bankDetails,
          isActive,
        },
      });

      res.json({ success: true, data: supplier });
    } catch (error) {
      console.error("Update supplier error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Delete supplier
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res) => {
    try {
      await prisma.supplier.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: "Supplier deleted successfully" });
    } catch (error) {
      console.error("Delete supplier error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

export default router;
