import { Router } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all customers
router.get("/", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { customerCode: { contains: String(search), mode: "insensitive" } },
        { name: { contains: String(search), mode: "insensitive" } },
        { email: { contains: String(search), mode: "insensitive" } },
        { phone: { contains: String(search), mode: "insensitive" } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive === "true";

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          _count: {
            select: { invoices: true, measurements: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get customer by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        invoices: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        measurements: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error("Get customer error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create customer
router.post(
  "/",
  authenticate,
  [body("name").notEmpty(), body("phone").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        country,
        gstNumber,
        panNumber,
        paymentTerms,
        notes,
      } = req.body;

      // Generate customer code
      const lastCustomer = await prisma.customer.findFirst({
        orderBy: { customerCode: "desc" },
      });
      const nextId = lastCustomer
        ? String(
            parseInt(lastCustomer.customerCode.replace("CUST", "")) + 1,
          ).padStart(4, "0")
        : "0001";
      const customerCode = `CUST${nextId}`;

      const customer = await prisma.customer.create({
        data: {
          customerCode,
          name,
          email,
          phone,
          address,
          city,
          state,
          pincode,
          country: country || "India",
          gstNumber,
          panNumber,
          paymentTerms: paymentTerms ? Number(paymentTerms) : undefined,
          notes,
        },
      });

      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Update customer
router.put("/:id", authenticate, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      country,
      gstNumber,
      panNumber,
      paymentTerms,
      notes,
      isActive,
    } = req.body;

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name,
        email,
        phone,
        address,
        city,
        state,
        pincode,
        country,
        gstNumber,
        panNumber,
        paymentTerms: paymentTerms ? Number(paymentTerms) : undefined,
        notes,
        isActive,
      },
    });

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error("Update customer error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete customer
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      await prisma.customer.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Delete customer error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

export default router;
