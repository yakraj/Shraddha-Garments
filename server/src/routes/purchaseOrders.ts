import { Router } from "express";
import { UserRole, POStatus } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get all purchase orders
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      supplierId,
      startDate,
      endDate,
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { poNumber: { contains: String(search), mode: "insensitive" } },
        {
          supplier: { name: { contains: String(search), mode: "insensitive" } },
        },
      ];
    }
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(String(startDate));
      if (endDate) where.orderDate.lte = new Date(String(endDate));
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          supplier: {
            select: { id: true, name: true, supplierCode: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          items: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({
      success: true,
      data: purchaseOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get purchase orders error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get purchase order by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: {
          include: {
            material: {
              select: { id: true, name: true, materialCode: true },
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase order not found" });
    }

    res.json({ success: true, data: purchaseOrder });
  } catch (error) {
    console.error("Get purchase order error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create purchase order
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT),
  [body("supplierId").notEmpty(), body("items").isArray({ min: 1 })],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        supplierId,
        expectedDate,
        items,
        taxRate,
        shippingCost,
        notes,
        terms,
        status,
      } = req.body;

      // Generate PO number
      const prefix = "PO";
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      const lastPO = await prisma.purchaseOrder.findFirst({
        where: {
          poNumber: { startsWith: `${prefix}${year}${month}` },
        },
        orderBy: { poNumber: "desc" },
      });

      let sequence = "0001";
      if (lastPO) {
        const lastSeq = parseInt(lastPO.poNumber.slice(-4));
        sequence = String(lastSeq + 1).padStart(4, "0");
      }
      const poNumber = `${prefix}${year}${month}${sequence}`;

      // Calculate totals
      const subtotal = items.reduce((sum: number, item: any) => {
        return sum + Number(item.quantity) * Number(item.unitPrice);
      }, 0);

      const taxAmount = subtotal * (Number(taxRate || 0) / 100);
      const totalAmount = subtotal + taxAmount + Number(shippingCost || 0);

      const purchaseOrder = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          createdById: req.user!.id,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          subtotal,
          taxRate: taxRate || 0,
          taxAmount,
          shippingCost: shippingCost || 0,
          totalAmount,
          status: status || POStatus.DRAFT,
          notes,
          terms,
          items: {
            create: items.map((item: any) => ({
              materialId: item.materialId || null,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: Number(item.quantity) * Number(item.unitPrice),
            })),
          },
        },
        include: {
          supplier: true,
          items: true,
        },
      });

      res.status(201).json({ success: true, data: purchaseOrder });
    } catch (error) {
      console.error("Create purchase order error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Update purchase order
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      const {
        expectedDate,
        items,
        taxRate,
        shippingCost,
        notes,
        terms,
        status,
      } = req.body;

      const existingPO = await prisma.purchaseOrder.findUnique({
        where: { id: req.params.id },
      });

      if (!existingPO) {
        return res
          .status(404)
          .json({ success: false, message: "Purchase order not found" });
      }

      if (
        [POStatus.RECEIVED, POStatus.CANCELLED].includes(
          existingPO.status as POStatus
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Cannot edit completed or cancelled PO",
          });
      }

      let updateData: any = {
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        taxRate,
        shippingCost,
        notes,
        terms,
        status,
      };

      if (items && items.length > 0) {
        await prisma.pOItem.deleteMany({
          where: { purchaseOrderId: req.params.id },
        });

        const subtotal = items.reduce((sum: number, item: any) => {
          return sum + Number(item.quantity) * Number(item.unitPrice);
        }, 0);

        const taxAmount =
          subtotal * (Number(taxRate || existingPO.taxRate) / 100);
        const totalAmount =
          subtotal +
          taxAmount +
          Number(shippingCost || existingPO.shippingCost);

        updateData = {
          ...updateData,
          subtotal,
          taxAmount,
          totalAmount,
          items: {
            create: items.map((item: any) => ({
              materialId: item.materialId || null,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: Number(item.quantity) * Number(item.unitPrice),
            })),
          },
        };
      }

      const purchaseOrder = await prisma.purchaseOrder.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          supplier: true,
          items: true,
        },
      });

      res.json({ success: true, data: purchaseOrder });
    } catch (error) {
      console.error("Update purchase order error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Delete purchase order
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  async (req, res) => {
    try {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: req.params.id },
      });

      if (!po) {
        return res
          .status(404)
          .json({ success: false, message: "Purchase order not found" });
      }

      if (po.status !== POStatus.DRAFT) {
        return res
          .status(400)
          .json({ success: false, message: "Can only delete draft POs" });
      }

      await prisma.purchaseOrder.delete({ where: { id: req.params.id } });
      res.json({
        success: true,
        message: "Purchase order deleted successfully",
      });
    } catch (error) {
      console.error("Delete purchase order error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Receive items
router.post(
  "/:id/receive",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res
          .status(400)
          .json({ success: false, message: "Items array required" });
      }

      const purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: req.params.id },
        include: { items: true },
      });

      if (!purchaseOrder) {
        return res
          .status(404)
          .json({ success: false, message: "Purchase order not found" });
      }

      // Update received quantities
      let allReceived = true;
      for (const receiveItem of items) {
        const poItem = purchaseOrder.items.find((i) => i.id === receiveItem.id);
        if (poItem) {
          const newReceivedQty =
            Number(poItem.receivedQty) + Number(receiveItem.quantity);

          await prisma.pOItem.update({
            where: { id: poItem.id },
            data: { receivedQty: newReceivedQty },
          });

          if (newReceivedQty < Number(poItem.quantity)) {
            allReceived = false;
          }

          // Update material stock if linked
          if (poItem.materialId) {
            await prisma.material.update({
              where: { id: poItem.materialId },
              data: {
                quantity: { increment: Number(receiveItem.quantity) },
              },
            });

            // Create transaction
            await prisma.materialTransaction.create({
              data: {
                materialId: poItem.materialId,
                type: "IN",
                quantity: receiveItem.quantity,
                reference: purchaseOrder.poNumber,
                notes: `Received from PO ${purchaseOrder.poNumber}`,
              },
            });
          }
        }
      }

      // Update PO status
      const newStatus = allReceived
        ? POStatus.RECEIVED
        : POStatus.PARTIALLY_RECEIVED;
      await prisma.purchaseOrder.update({
        where: { id: req.params.id },
        data: {
          status: newStatus,
          receivedDate: allReceived ? new Date() : undefined,
        },
      });

      res.json({ success: true, message: "Items received successfully" });
    } catch (error) {
      console.error("Receive items error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Approve purchase order
router.post(
  "/:id/approve",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res) => {
    try {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: req.params.id },
      });

      if (!po) {
        return res
          .status(404)
          .json({ success: false, message: "Purchase order not found" });
      }

      if (po.status !== POStatus.PENDING_APPROVAL) {
        return res
          .status(400)
          .json({ success: false, message: "PO is not pending approval" });
      }

      const updated = await prisma.purchaseOrder.update({
        where: { id: req.params.id },
        data: { status: POStatus.APPROVED },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error("Approve PO error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get PO summary
router.get("/summary/stats", authenticate, async (req, res) => {
  try {
    const [byStatus, totalSpent, recentPOs] = await Promise.all([
      prisma.purchaseOrder.groupBy({
        by: ["status"],
        _count: { status: true },
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.aggregate({
        where: {
          status: { in: [POStatus.RECEIVED, POStatus.PARTIALLY_RECEIVED] },
        },
        _sum: { totalAmount: true },
      }),
      prisma.purchaseOrder.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        byStatus,
        totalSpent: totalSpent._sum.totalAmount || 0,
        recentPOs,
      },
    });
  } catch (error) {
    console.error("PO summary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
