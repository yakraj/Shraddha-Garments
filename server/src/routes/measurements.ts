import { Router } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all measurements
router.get("/", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, customerId, garmentType } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { measurementCode: { contains: String(search), mode: "insensitive" } },
        {
          customer: { name: { contains: String(search), mode: "insensitive" } },
        },
      ];
    }
    if (customerId) where.customerId = customerId;
    if (garmentType) where.garmentType = garmentType;

    const [measurements, total] = await Promise.all([
      prisma.measurement.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          customer: {
            select: { id: true, name: true, customerCode: true },
          },
          takenBy: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.measurement.count({ where }),
    ]);

    res.json({
      success: true,
      data: measurements,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get measurements error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get measurement by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const measurement = await prisma.measurement.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        takenBy: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!measurement) {
      return res
        .status(404)
        .json({ success: false, message: "Measurement not found" });
    }

    res.json({ success: true, data: measurement });
  } catch (error) {
    console.error("Get measurement error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create measurement
router.post(
  "/",
  authenticate,
  [
    body("customerId").notEmpty(),
    body("takenById").notEmpty(),
    body("garmentType").notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        customerId,
        takenById,
        garmentType,
        // Upper body
        chest,
        waist,
        hips,
        shoulder,
        sleeveLength,
        armHole,
        bicep,
        wrist,
        neckRound,
        frontLength,
        backLength,
        // Lower body
        inseam,
        outseam,
        thigh,
        knee,
        calf,
        ankle,
        rise,
        // Additional
        notes,
        customFields,
      } = req.body;

      // Generate measurement code
      const lastMeasurement = await prisma.measurement.findFirst({
        orderBy: { measurementCode: "desc" },
      });
      const nextId = lastMeasurement
        ? String(
            parseInt(lastMeasurement.measurementCode.replace("MSR", "")) + 1,
          ).padStart(5, "0")
        : "00001";
      const measurementCode = `MSR${nextId}`;

      const measurement = await prisma.measurement.create({
        data: {
          measurementCode,
          customerId,
          takenById,
          garmentType,
          // Upper body
          chest,
          waist,
          hips,
          shoulder,
          sleeveLength,
          armHole,
          bicep,
          wrist,
          neckRound,
          frontLength,
          backLength,
          // Lower body
          inseam,
          outseam,
          thigh,
          knee,
          calf,
          ankle,
          rise,
          // Additional
          notes,
          customFields,
        },
        include: {
          customer: true,
          takenBy: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      });

      res.status(201).json({ success: true, data: measurement });
    } catch (error) {
      console.error("Create measurement error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Update measurement
router.put("/:id", authenticate, async (req, res) => {
  try {
    const {
      garmentType,
      chest,
      waist,
      hips,
      shoulder,
      sleeveLength,
      armHole,
      bicep,
      wrist,
      neckRound,
      frontLength,
      backLength,
      inseam,
      outseam,
      thigh,
      knee,
      calf,
      ankle,
      rise,
      notes,
      customFields,
    } = req.body;

    const measurement = await prisma.measurement.update({
      where: { id: req.params.id },
      data: {
        garmentType,
        chest,
        waist,
        hips,
        shoulder,
        sleeveLength,
        armHole,
        bicep,
        wrist,
        neckRound,
        frontLength,
        backLength,
        inseam,
        outseam,
        thigh,
        knee,
        calf,
        ankle,
        rise,
        notes,
        customFields,
      },
      include: {
        customer: true,
        takenBy: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    res.json({ success: true, data: measurement });
  } catch (error) {
    console.error("Update measurement error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete measurement
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      await prisma.measurement.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: "Measurement deleted successfully" });
    } catch (error) {
      console.error("Delete measurement error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Get garment types
router.get("/meta/garment-types", authenticate, async (req, res) => {
  try {
    const types = await prisma.measurement.findMany({
      distinct: ["garmentType"],
      select: { garmentType: true },
    });

    // Add common garment types
    const commonTypes = [
      "Shirt",
      "Suit",
      "Blazer",
      "Trousers",
      "Dress",
      "Blouse",
      "Kurta",
      "Saree Blouse",
      "Lehenga",
      "Sherwani",
    ];

    const allTypes = [
      ...new Set([...types.map((t) => t.garmentType), ...commonTypes]),
    ];

    res.json({ success: true, data: allTypes });
  } catch (error) {
    console.error("Get garment types error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get customer measurements
router.get("/customer/:customerId", authenticate, async (req, res) => {
  try {
    const measurements = await prisma.measurement.findMany({
      where: { customerId: req.params.customerId },
      include: {
        takenBy: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: measurements });
  } catch (error) {
    console.error("Get customer measurements error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
