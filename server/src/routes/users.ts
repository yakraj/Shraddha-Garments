import { Router } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all users
router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, search, role, isActive } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (search) {
        where.OR = [
          { firstName: { contains: String(search), mode: "insensitive" } },
          { lastName: { contains: String(search), mode: "insensitive" } },
          { email: { contains: String(search), mode: "insensitive" } },
        ];
      }
      if (role) where.role = role;
      if (isActive !== undefined) where.isActive = isActive === "true";

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            role: true,
            isActive: true,
            createdAt: true,
            employee: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Get user by ID
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        employee: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update user
router.put(
  "/:id",
  authenticate,
  [
    body("firstName").optional().notEmpty(),
    body("lastName").optional().notEmpty(),
    body("email").optional().isEmail(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Only admin can update other users, users can update themselves
      if (req.user!.id !== req.params.id && req.user!.role !== UserRole.ADMIN) {
        return res
          .status(403)
          .json({ success: false, message: "Not authorized" });
      }

      const { firstName, lastName, phone, avatar, role, isActive } = req.body;

      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (avatar !== undefined) updateData.avatar = avatar;

      // Only admin can change role and status
      if (req.user!.role === UserRole.ADMIN) {
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
      }

      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
        },
      });

      res.json({ success: true, data: user });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Delete user (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res) => {
    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

export default router;
