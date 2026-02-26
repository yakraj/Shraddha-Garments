import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// Get all HSN codes
router.get("/", async (req, res) => {
  try {
    const hsns = await prisma.hSN.findMany({
      orderBy: { code: "asc" },
    });
    res.json({
      success: true,
      data: hsns,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch HSN codes" });
  }
});

// Create HSN code
router.post("/", async (req, res) => {
  try {
    const { code, description, taxRate } = req.body;
    const hsn = await prisma.hSN.create({
      data: { code, description, taxRate },
    });
    res.status(201).json({
      success: true,
      data: hsn,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(400).json({ error: "HSN code already exists" });
    } else {
      res.status(500).json({ error: "Failed to create HSN code" });
    }
  }
});

// Update HSN code
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description, taxRate } = req.body;
    const hsn = await prisma.hSN.update({
      where: { id },
      data: { code, description, taxRate },
    });
    res.json({
      success: true,
      data: hsn,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update HSN code" });
  }
});

// Delete HSN code
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.hSN.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete HSN code" });
  }
});

export default router;
