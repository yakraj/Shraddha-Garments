import { Router } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all employees
router.get("/", authenticate, async (req, res) => {
  try {
    const { page, limit, search, department, isActive } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { employeeId: { contains: String(search), mode: "insensitive" } },
        {
          user: {
            firstName: { contains: String(search), mode: "insensitive" },
          },
        },
        {
          user: { lastName: { contains: String(search), mode: "insensitive" } },
        },
      ];
    }
    if (department) where.department = department;
    if (isActive !== undefined) where.isActive = isActive === "true";

    // If page and limit are not provided, return all results without pagination
    if (!page && !limit) {
      const employees = await prisma.employee.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { user: { firstName: "asc" } },
      });

      return res.json({
        success: true,
        data: employees,
      });
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: currentLimit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
              role: true,
            },
          },
          attendances: {
            take: 7,
            orderBy: { date: "desc" },
          },
          machineAssignments: {
            where: { isActive: true },
            include: { machine: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({
      success: true,
      data: employees,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        pages: Math.ceil(total / currentLimit),
      },
    });
  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get employee by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        attendances: {
          take: 30,
          orderBy: { date: "desc" },
        },
        machineAssignments: {
          include: { machine: true },
        },
        measurements: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    console.error("Get employee error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create employee
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  [
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("firstName").notEmpty(),
    body("lastName").notEmpty(),
    body("department").notEmpty(),
    body("designation").notEmpty(),
    body("salary").isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        department,
        designation,
        joiningDate,
        salary,
        address,
        emergencyContact,
      } = req.body;

      // Check if email exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already registered" });
      }

      // Generate employee ID
      const lastEmployee = await prisma.employee.findFirst({
        orderBy: { employeeId: "desc" },
      });
      const nextId = lastEmployee
        ? String(
            parseInt(lastEmployee.employeeId.replace("EMP", "")) + 1,
          ).padStart(4, "0")
        : "0001";
      const employeeId = `EMP${nextId}`;

      const hashedPassword = await bcrypt.hash(password, 10);

      const employee = await prisma.employee.create({
        data: {
          employeeId,
          department,
          designation,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          salary,
          address,
          emergencyContact,
          user: {
            create: {
              email,
              password: hashedPassword,
              firstName,
              lastName,
              phone,
              role: UserRole.EMPLOYEE,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
            },
          },
        },
      });

      res.status(201).json({ success: true, data: employee });
    } catch (error) {
      console.error("Create employee error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Update employee
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        phone,
        department,
        designation,
        salary,
        address,
        emergencyContact,
        isActive,
      } = req.body;

      const employee = await prisma.employee.update({
        where: { id: req.params.id },
        data: {
          department,
          designation,
          salary,
          address,
          emergencyContact,
          isActive,
          user: {
            update: {
              firstName,
              lastName,
              phone,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
            },
          },
        },
      });

      res.json({ success: true, data: employee });
    } catch (error) {
      console.error("Update employee error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Delete employee
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res) => {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: req.params.id },
        select: { userId: true },
      });

      if (!employee) {
        return res
          .status(404)
          .json({ success: false, message: "Employee not found" });
      }

      // Delete user (cascade will delete employee)
      await prisma.user.delete({ where: { id: employee.userId } });

      res.json({ success: true, message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Delete employee error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Get departments
router.get("/meta/departments", authenticate, async (req, res) => {
  try {
    const departments = await prisma.employee.findMany({
      distinct: ["department"],
      select: { department: true },
    });

    res.json({ success: true, data: departments.map((d) => d.department) });
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
