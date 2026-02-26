import { Router } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get user notifications
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId: req.user!.id };
    if (isRead !== undefined) where.isRead = isRead === "true";

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: req.user!.id, isRead: false },
      }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark notification as read
router.put("/:id/read", authenticate, async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id, userId: req.user!.id },
      data: { isRead: true },
    });

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark all as read
router.put("/read-all", authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete notification
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.delete({
      where: { id: req.params.id, userId: req.user!.id },
    });

    res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create notification (admin/system)
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  [
    body("userId").notEmpty(),
    body("title").notEmpty(),
    body("message").notEmpty(),
    body("type").notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { userId, title, message, type, link } = req.body;

      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          link,
        },
      });

      res.status(201).json({ success: true, data: notification });
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Broadcast notification to all users
router.post(
  "/broadcast",
  authenticate,
  authorize(UserRole.ADMIN),
  [
    body("title").notEmpty(),
    body("message").notEmpty(),
    body("type").notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { title, message, type, link, roles } = req.body;

      const where: any = { isActive: true };
      if (roles && roles.length > 0) {
        where.role = { in: roles };
      }

      const users = await prisma.user.findMany({
        where,
        select: { id: true },
      });

      const notifications = await prisma.notification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          title,
          message,
          type,
          link,
        })),
      });

      res.status(201).json({
        success: true,
        message: `Notification sent to ${notifications.count} users`,
      });
    } catch (error) {
      console.error("Broadcast notification error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

export default router;
