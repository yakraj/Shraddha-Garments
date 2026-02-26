import { Router } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all settings
router.get("/", authenticate, async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();

    // Convert to key-value object
    const settingsObj = settings.reduce(
      (acc, s) => {
        acc[s.key] = s.value;
        return acc;
      },
      {} as Record<string, any>,
    );

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get setting by key
router.get("/:key", authenticate, async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: req.params.key },
    });

    if (!setting) {
      return res
        .status(404)
        .json({ success: false, message: "Setting not found" });
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    console.error("Get setting error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update setting
router.put(
  "/:key",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res) => {
    try {
      const { value, description } = req.body;

      const setting = await prisma.setting.upsert({
        where: { key: req.params.key },
        update: { value, description },
        create: { key: req.params.key, value, description },
      });

      res.json({ success: true, data: setting });
    } catch (error) {
      console.error("Update setting error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Bulk update settings
router.put("/", authenticate, authorize(UserRole.ADMIN), async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Settings object required" });
    }

    const results = await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: value as any },
          create: { key, value: value as any },
        }),
      ),
    );

    res.json({ success: true, data: results, message: "Settings updated" });
  } catch (error) {
    console.error("Bulk update settings error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete setting
router.delete(
  "/:key",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res) => {
    try {
      await prisma.setting.delete({ where: { key: req.params.key } });
      res.json({ success: true, message: "Setting deleted" });
    } catch (error) {
      console.error("Delete setting error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Get company info
router.get("/company/info", authenticate, async (req, res) => {
  try {
    const companySettings = await prisma.setting.findMany({
      where: {
        key: { startsWith: "company_" },
      },
    });

    const company = companySettings.reduce(
      (acc, s) => {
        const key = s.key.replace("company_", "");
        acc[key] = (s.value as any)[key] || s.value;
        return acc;
      },
      {} as Record<string, any>,
    );

    res.json({ success: true, data: company });
  } catch (error) {
    console.error("Get company info error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
