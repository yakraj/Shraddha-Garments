import { Router } from "express";
import { PrismaClient, UserRole, InvoiceStatus } from "@prisma/client";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// Get all invoices
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      customerId,
      startDate,
      endDate,
    } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: String(search), mode: "insensitive" } },
        {
          customer: { name: { contains: String(search), mode: "insensitive" } },
        },
      ];
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = new Date(String(startDate));
      if (endDate) where.issueDate.lte = new Date(String(endDate));
    }

    const [invoices, total, statsResult] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          customer: {
            select: { id: true, name: true, customerCode: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          items: true,
          _count: { select: { payments: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.invoice.count({ where }),
      prisma.invoice.groupBy({
        by: ["status"],
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
        where: customerId ? { customerId: String(customerId) } : undefined,
      }),
    ]);

    const stats = {
      totalAmount: statsResult.reduce(
        (sum, s) => sum + (Number(s._sum.totalAmount) || 0),
        0,
      ),
      paidAmount: statsResult.reduce(
        (sum, s) => sum + (Number(s._sum.paidAmount) || 0),
        0,
      ),
      pendingAmount: statsResult.reduce(
        (sum, s) =>
          s.status === "PENDING" || s.status === "PARTIALLY_PAID"
            ? sum +
              ((Number(s._sum.totalAmount) || 0) -
                (Number(s._sum.paidAmount) || 0))
            : sum,
        0,
      ),
      overdueAmount: statsResult.reduce(
        (sum, s) =>
          s.status === "OVERDUE"
            ? sum +
              ((Number(s._sum.totalAmount) || 0) -
                (Number(s._sum.paidAmount) || 0))
            : sum,
        0,
      ),
    };

    res.json({
      success: true,
      data: invoices,
      stats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get invoice by ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: true,
        payments: {
          orderBy: { paidAt: "desc" },
        },
      },
    });

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create invoice
router.post(
  "/",
  authenticate,
  [
    body("customerId").notEmpty(),
    body("dueDate").notEmpty(),
    body("items").isArray({ min: 1 }),
  ],
  async (req: AuthRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const {
        customerId,
        invoiceDate,
        dueDate,
        items,
        taxRate,
        discountRate,
        roundOff,
        notes,
        terms,
        status,
        deliveryNote,
        deliveryNoteDate,
        otherReference,
        otherReferences,
        buyersOrderNo,
        buyersOrderDate,
        dispatchDocNo,
        dispatchedThrough,
        destination,
        billOfLading,
        motorVehicleNo,
        termsOfDelivery,
      } = req.body;

      // Generate invoice number
      const prefix = "INV";
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      const lastInvoice = await prisma.invoice.findFirst({
        where: {
          invoiceNumber: { startsWith: `${prefix}${year}${month}` },
        },
        orderBy: { invoiceNumber: "desc" },
      });

      let sequence = "0001";
      if (lastInvoice) {
        const lastSeq = parseInt(lastInvoice.invoiceNumber.slice(-4));
        sequence = String(lastSeq + 1).padStart(4, "0");
      }
      const invoiceNumber = `${prefix}${year}${month}${sequence}`;

      // Calculate totals
      let subtotal = 0;
      let totalTaxAmount = 0;

      const processedItems = items.map((item: any) => {
        const amount = Number(item.quantity) * Number(item.unitPrice);
        const itemTax = amount * (Number(item.taxRate || 0) / 100);
        subtotal += amount;
        totalTaxAmount += itemTax;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: amount,
          hsnCode: item.hsnCode,
          taxRate: item.taxRate || 0,
        };
      });

      const discountRateNum = Number(discountRate || 0);
      const discountAmount = subtotal * (discountRateNum / 100);
      const roundOffNum = Number(roundOff || 0);
      const totalAmount =
        subtotal + totalTaxAmount - discountAmount + roundOffNum;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId,
          createdById: req.user!.id,
          issueDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          dueDate: new Date(dueDate),
          subtotal,
          taxRate: 0, // No longer used globally, but kept for schema compatibility
          taxAmount: totalTaxAmount,
          discountRate: discountRateNum,
          discountAmount,
          roundOff: roundOffNum,
          totalAmount,
          status: status || InvoiceStatus.DRAFT,
          notes,
          terms,
          deliveryNote,
          deliveryNoteDate: deliveryNoteDate
            ? new Date(deliveryNoteDate)
            : null,
          otherReference,
          otherReferences,
          buyersOrderNo,
          buyersOrderDate: buyersOrderDate ? new Date(buyersOrderDate) : null,
          dispatchDocNo,
          dispatchedThrough,
          destination,
          billOfLading,
          motorVehicleNo,
          termsOfDelivery,
          items: {
            create: processedItems,
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      console.error("Create invoice error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Update invoice
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      invoiceDate,
      dueDate,
      items,
      taxRate,
      discountRate,
      roundOff,
      notes,
      terms,
      status,
    } = req.body;

    // Check if invoice can be edited
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
    });

    if (!existingInvoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    if (existingInvoice.status === InvoiceStatus.PAID) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot edit a paid invoice" });
    }

    // Calculate new totals if items provided
    let updateData: any = {
      issueDate: invoiceDate ? new Date(invoiceDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      taxRate,
      discountRate,
      roundOff,
      notes,
      terms,
      status,
      deliveryNote: req.body.deliveryNote,
      deliveryNoteDate: req.body.deliveryNoteDate
        ? new Date(req.body.deliveryNoteDate)
        : null,
      otherReference: req.body.otherReference,
      otherReferences: req.body.otherReferences,
      buyersOrderNo: req.body.buyersOrderNo,
      buyersOrderDate: req.body.buyersOrderDate
        ? new Date(req.body.buyersOrderDate)
        : null,
      dispatchDocNo: req.body.dispatchDocNo,
      dispatchedThrough: req.body.dispatchedThrough,
      destination: req.body.destination,
      billOfLading: req.body.billOfLading,
      motorVehicleNo: req.body.motorVehicleNo,
      termsOfDelivery: req.body.termsOfDelivery,
    };

    if (items && items.length > 0) {
      // Delete existing items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: req.params.id },
      });

      let subtotal = 0;
      let totalTaxAmount = 0;

      const processedItems = items.map((item: any) => {
        const amount = Number(item.quantity) * Number(item.unitPrice);
        const itemTax = amount * (Number(item.taxRate || 0) / 100);
        subtotal += amount;
        totalTaxAmount += itemTax;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: amount,
          hsnCode: item.hsnCode,
          taxRate: item.taxRate || 0,
        };
      });

      const currentDiscountRate =
        discountRate !== undefined
          ? Number(discountRate)
          : Number(existingInvoice.discountRate);

      const currentRoundOff =
        roundOff !== undefined
          ? Number(roundOff)
          : Number(existingInvoice.roundOff);

      const discountAmount = subtotal * (currentDiscountRate / 100);
      const totalAmount =
        subtotal + totalTaxAmount - discountAmount + currentRoundOff;

      updateData = {
        ...updateData,
        subtotal,
        taxAmount: totalTaxAmount,
        discountAmount,
        roundOff: currentRoundOff,
        totalAmount,
        items: {
          create: processedItems,
        },
      };
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete invoice
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.ACCOUNTANT),
  async (req, res) => {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: req.params.id },
      });

      if (!invoice) {
        return res
          .status(404)
          .json({ success: false, message: "Invoice not found" });
      }

      if (
        invoice.status === InvoiceStatus.PAID ||
        Number(invoice.paidAmount) > 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete invoice with payments",
        });
      }

      await prisma.invoice.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Delete invoice error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Add payment to invoice
router.post(
  "/:id/payments",
  authenticate,
  [body("amount").isNumeric(), body("method").notEmpty()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { amount, method, reference, notes, paymentDate } = req.body;

      const invoice = await prisma.invoice.findUnique({
        where: { id: req.params.id },
      });

      if (!invoice) {
        return res
          .status(404)
          .json({ success: false, message: "Invoice not found" });
      }

      const currentPaidAmount = Number(invoice.paidAmount || 0);
      const totalAmount = Number(invoice.totalAmount);
      const paymentAmount = Number(amount);
      const newPaidAmount = currentPaidAmount + paymentAmount;

      if (newPaidAmount > totalAmount + 0.01) {
        // Allow small precision diff
        return res.status(400).json({
          success: false,
          message: `Payment exceeds invoice balance. Remaining: ${
            totalAmount - currentPaidAmount
          }`,
        });
      }

      // Determine new status
      let newStatus = invoice.status;
      if (newPaidAmount >= totalAmount - 0.01) {
        newStatus = InvoiceStatus.PAID;
      } else if (newPaidAmount > 0) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      }

      const [payment, updatedInvoice] = await Promise.all([
        prisma.payment.create({
          data: {
            invoiceId: req.params.id,
            amount: paymentAmount,
            method,
            reference,
            notes,
            paidAt: paymentDate ? new Date(paymentDate) : new Date(),
          },
        }),
        prisma.invoice.update({
          where: { id: req.params.id },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        }),
      ]);

      res
        .status(201)
        .json({ success: true, data: { payment, invoice: updatedInvoice } });
    } catch (error) {
      console.error("Add payment error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },
);

// Get invoice summary
router.get("/summary/stats", authenticate, async (req, res) => {
  try {
    const [byStatus, totalRevenue, recentInvoices] = await Promise.all([
      prisma.invoice.groupBy({
        by: ["status"],
        _count: { status: true },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: InvoiceStatus.PAID },
        _sum: { paidAmount: true },
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        byStatus,
        totalRevenue: totalRevenue._sum.paidAmount || 0,
        recentInvoices,
      },
    });
  } catch (error) {
    console.error("Invoice summary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
