import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { upload } from "../middleware/upload.js";
import { uploadToCloudinary } from "../lib/cloudinary.js";
import fs from "fs";

const router = Router();
const prisma = new PrismaClient();

// Get all fabric types
router.get("/", async (req, res) => {
  try {
    const fabrics = await prisma.fabricType.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(fabrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch fabric types" });
  }
});

// Create new fabric type
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { code, remarks } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Image is required" });
    }

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file.path);

    const fabric = await prisma.fabricType.create({
      data: {
        code,
        remarks,
        imageUrl,
      },
    });

    res.status(201).json(fabric);
  } catch (error: any) {
    console.error("Create fabric error:", error);
    if (error.code === "P2002") {
      res.status(400).json({ error: "Fabric code already exists" });
    } else {
      res.status(500).json({ error: "Failed to create fabric type" });
    }
  }
});

// Delete fabric type
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fabricType.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete fabric type" });
  }
});

export default router;
