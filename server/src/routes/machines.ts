import { Router } from "express";
import { PrismaClient, UserRole, MachineStatus } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// Get all machines
router.get("/", authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { machineCode: { contains: String(search), mode: "insensitive" } },
        { name: { contains: String(search), mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (type) where.type = type;

    const [machines, total] = await Promise.all([
      prisma.machine.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          assignments: {
            where: { isActive: true },
            include: {
              employee: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
          maintenanceLogs: {
            take: 5,
            orderBy: { performedAt: "desc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.machine.count({ where }),
    ]);

    res.json({
      success: true,
      data: machines,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get machines error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get machine by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id: req.params.id },
      include: {
        assignments: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { assignedAt: "desc" },
        },
        maintenanceLogs: {
          orderBy: { performedAt: "desc" },
        },
      },
    });

    if (!machine) {
      return res
        .status(404)
        .json({ success: false, message: "Machine not found" });
    }

    res.json({ success: true, data: machine });
  } catch (error) {
    console.error("Get machine error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create machine
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  [body("name").notEmpty(), body("type").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, type, manufacturer, model, purchaseDate, location, notes } =
        req.body;

      // Generate machine code
      const lastMachine = await prisma.machine.findFirst({
        orderBy: { machineCode: "desc" },
      });
      const nextId = lastMachine
        ? String(
            parseInt(lastMachine.machineCode.replace("MCH", "")) + 1
          ).padStart(4, "0")
        : "0001";
      const machineCode = `MCH${nextId}`;

      const machine = await prisma.machine.create({
        data: {
          machineCode,
          name,
          type,
          manufacturer,
          model,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          location,
          notes,
          status: MachineStatus.IDLE,
        },
      });

      res.status(201).json({ success: true, data: machine });
    } catch (error) {
      console.error("Create machine error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Update machine
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      const {
        name,
        type,
        manufacturer,
        model,
        status,
        location,
        notes,
        nextMaintenance,
      } = req.body;

      const machine = await prisma.machine.update({
        where: { id: req.params.id },
        data: {
          name,
          type,
          manufacturer,
          model,
          status,
          location,
          notes,
          nextMaintenance: nextMaintenance
            ? new Date(nextMaintenance)
            : undefined,
        },
      });

      res.json({ success: true, data: machine });
    } catch (error) {
      console.error("Update machine error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Delete machine
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res) => {
    try {
      await prisma.machine.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: "Machine deleted successfully" });
    } catch (error) {
      console.error("Delete machine error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Assign employee to machine
router.post(
  "/:id/assign",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.FLOOR_MANAGER),
  async (req, res) => {
    try {
      const { employeeId } = req.body;

      // Unassign current employee if any
      await prisma.machineAssignment.updateMany({
        where: { machineId: req.params.id, isActive: true },
        data: { isActive: false, unassignedAt: new Date() },
      });

      // Create new assignment
      const assignment = await prisma.machineAssignment.create({
        data: {
          machineId: req.params.id,
          employeeId,
          isActive: true,
        },
        include: {
          employee: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          machine: true,
        },
      });

      // Update machine status
      await prisma.machine.update({
        where: { id: req.params.id },
        data: { status: MachineStatus.RUNNING },
      });

      res.json({ success: true, data: assignment });
    } catch (error) {
      console.error("Assign machine error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Unassign employee from machine
router.post(
  "/:id/unassign",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.FLOOR_MANAGER),
  async (req, res) => {
    try {
      await prisma.machineAssignment.updateMany({
        where: { machineId: req.params.id, isActive: true },
        data: { isActive: false, unassignedAt: new Date() },
      });

      await prisma.machine.update({
        where: { id: req.params.id },
        data: { status: MachineStatus.IDLE },
      });

      res.json({ success: true, message: "Employee unassigned successfully" });
    } catch (error) {
      console.error("Unassign machine error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Add maintenance log
router.post(
  "/:id/maintenance",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  [body("type").notEmpty(), body("description").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { type, description, cost, performedBy, nextDueDate } = req.body;

      const maintenanceLog = await prisma.maintenanceLog.create({
        data: {
          machineId: req.params.id,
          type,
          description,
          cost,
          performedBy,
          nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
        },
      });

      // Update machine
      await prisma.machine.update({
        where: { id: req.params.id },
        data: {
          lastMaintenance: new Date(),
          nextMaintenance: nextDueDate ? new Date(nextDueDate) : null,
          status: MachineStatus.IDLE, // After maintenance, set to idle
        },
      });

      res.status(201).json({ success: true, data: maintenanceLog });
    } catch (error) {
      console.error("Add maintenance log error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get machine status summary
router.get("/summary/status", authenticate, async (req, res) => {
  try {
    const summary = await prisma.machine.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Machine summary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
