import { Router } from "express";
import { UserRole, MaterialStatus } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all materials
router.get("/", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { materialCode: { contains: String(search), mode: "insensitive" } },
        { name: { contains: String(search), mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;
    if (status) where.status = status;

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { name: "asc" },
      }),
      prisma.material.count({ where }),
    ]);

    res.json({
      success: true,
      data: materials,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get materials error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get material by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: req.params.id },
      include: {
        transactions: {
          take: 50,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!material) {
      return res
        .status(404)
        .json({ success: false, message: "Material not found" });
    }

    res.json({ success: true, data: material });
  } catch (error) {
    console.error("Get material error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create material
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  [
    body("name").notEmpty(),
    body("category").notEmpty(),
    body("unit").notEmpty(),
    body("unitPrice").isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        name,
        category,
        unit,
        quantity,
        minQuantity,
        unitPrice,
        supplier,
        location,
      } = req.body;

      // Generate material code
      const lastMaterial = await prisma.material.findFirst({
        orderBy: { materialCode: "desc" },
      });
      const nextId = lastMaterial
        ? String(
            parseInt(lastMaterial.materialCode.replace("MAT", "")) + 1
          ).padStart(4, "0")
        : "0001";
      const materialCode = `MAT${nextId}`;

      // Determine status based on quantity
      let status = MaterialStatus.AVAILABLE;
      if (quantity <= 0) status = MaterialStatus.OUT_OF_STOCK;
      else if (quantity <= minQuantity) status = MaterialStatus.LOW_STOCK;

      const material = await prisma.material.create({
        data: {
          materialCode,
          name,
          category,
          unit,
          quantity: quantity || 0,
          minQuantity: minQuantity || 0,
          unitPrice,
          supplier,
          location,
          status,
        },
      });

      res.status(201).json({ success: true, data: material });
    } catch (error) {
      console.error("Create material error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Update material
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      const {
        name,
        category,
        unit,
        minQuantity,
        unitPrice,
        supplier,
        location,
        status,
      } = req.body;

      const material = await prisma.material.update({
        where: { id: req.params.id },
        data: {
          name,
          category,
          unit,
          minQuantity,
          unitPrice,
          supplier,
          location,
          status,
        },
      });

      res.json({ success: true, data: material });
    } catch (error) {
      console.error("Update material error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Delete material
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res) => {
    try {
      await prisma.material.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: "Material deleted successfully" });
    } catch (error) {
      console.error("Delete material error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Update quantity (add/remove stock)
router.post(
  "/:id/transaction",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  [
    body("type").isIn(["IN", "OUT", "ADJUSTMENT", "RETURN"]),
    body("quantity").isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { type, quantity, reference, notes } = req.body;

      const material = await prisma.material.findUnique({
        where: { id: req.params.id },
      });

      if (!material) {
        return res
          .status(404)
          .json({ success: false, message: "Material not found" });
      }

      // Calculate new quantity
      let newQuantity = Number(material.quantity);
      if (type === "IN" || type === "RETURN") {
        newQuantity += Number(quantity);
      } else if (type === "OUT") {
        newQuantity -= Number(quantity);
        if (newQuantity < 0) {
          return res
            .status(400)
            .json({ success: false, message: "Insufficient stock" });
        }
      } else if (type === "ADJUSTMENT") {
        newQuantity = Number(quantity);
      }

      // Determine new status
      let status = MaterialStatus.AVAILABLE;
      if (newQuantity <= 0) status = MaterialStatus.OUT_OF_STOCK;
      else if (newQuantity <= Number(material.minQuantity))
        status = MaterialStatus.LOW_STOCK;

      // Create transaction and update material
      const [transaction, updatedMaterial] = await Promise.all([
        prisma.materialTransaction.create({
          data: {
            materialId: req.params.id,
            type,
            quantity,
            reference,
            notes,
          },
        }),
        prisma.material.update({
          where: { id: req.params.id },
          data: {
            quantity: newQuantity,
            status,
          },
        }),
      ]);

      res.json({
        success: true,
        data: { transaction, material: updatedMaterial },
      });
    } catch (error) {
      console.error("Material transaction error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get categories
router.get("/meta/categories", authenticate, async (req, res) => {
  try {
    const categories = await prisma.material.findMany({
      distinct: ["category"],
      select: { category: true },
    });

    res.json({ success: true, data: categories.map((c) => c.category) });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get inventory summary
router.get("/summary/inventory", authenticate, async (req, res) => {
  try {
    const [totalValue, byStatus, byCategory] = await Promise.all([
      prisma.material.aggregate({
        _sum: {
          quantity: true,
        },
      }),
      prisma.material.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.material.groupBy({
        by: ["category"],
        _count: { category: true },
        _sum: { quantity: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalValue,
        byStatus,
        byCategory,
      },
    });
  } catch (error) {
    console.error("Inventory summary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
