import { Router } from "express";
import {
  PrismaClient,
  InvoiceStatus,
  POStatus,
  AttendanceStatus,
  MachineStatus,
} from "@prisma/client";
import { authenticate, AuthRequest } from "../middleware/auth.js";

const router = Router();
const prisma = new PrismaClient();

// Dashboard overview
router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalEmployees,
      totalMachines,
      totalMaterials,
      totalCustomers,
      todayAttendance,
      machineStatus,
      materialStatus,
      recentInvoices,
      monthlyRevenue,
      pendingPOs,
    ] = await Promise.all([
      // Counts
      prisma.employee.count({ where: { isActive: true } }),
      prisma.machine.count(),
      prisma.material.count(),
      prisma.customer.count({ where: { isActive: true } }),

      // Today's attendance
      prisma.attendance.groupBy({
        by: ["status"],
        where: { date: today },
        _count: { status: true },
      }),

      // Machine status
      prisma.machine.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // Material status
      prisma.material.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // Recent invoices
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { name: true } },
        },
      }),

      // Monthly revenue
      prisma.invoice.aggregate({
        where: {
          status: InvoiceStatus.PAID,
          issueDate: { gte: thirtyDaysAgo },
        },
        _sum: { paidAmount: true },
      }),

      // Pending POs
      prisma.purchaseOrder.count({
        where: {
          status: { in: [POStatus.PENDING_APPROVAL, POStatus.ORDERED] },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          employees: totalEmployees,
          machines: totalMachines,
          materials: totalMaterials,
          customers: totalCustomers,
          pendingPOs,
        },
        attendance: {
          today: todayAttendance,
          total: totalEmployees,
        },
        machineStatus,
        materialStatus,
        recentInvoices,
        monthlyRevenue: monthlyRevenue._sum.paidAmount || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Revenue analytics
router.get("/revenue", authenticate, async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(String(period));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: { gte: startDate },
        status: { not: InvoiceStatus.CANCELLED },
      },
      select: {
        issueDate: true,
        totalAmount: true,
        paidAmount: true,
        status: true,
      },
      orderBy: { issueDate: "asc" },
    });

    // Group by date
    const dailyRevenue: Record<
      string,
      { total: number; paid: number; count: number }
    > = {};

    invoices.forEach((inv) => {
      const dateKey = inv.issueDate.toISOString().split("T")[0];
      if (!dailyRevenue[dateKey]) {
        dailyRevenue[dateKey] = { total: 0, paid: 0, count: 0 };
      }
      dailyRevenue[dateKey].total += Number(inv.totalAmount);
      dailyRevenue[dateKey].paid += Number(inv.paidAmount);
      dailyRevenue[dateKey].count++;
    });

    // Calculate totals
    const totals = invoices.reduce(
      (acc, inv) => ({
        total: acc.total + Number(inv.totalAmount),
        paid: acc.paid + Number(inv.paidAmount),
        count: acc.count + 1,
      }),
      { total: 0, paid: 0, count: 0 }
    );

    res.json({
      success: true,
      data: {
        daily: dailyRevenue,
        totals,
        period: days,
      },
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Attendance analytics
router.get("/attendance", authenticate, async (req, res) => {
  try {
    const { period = "7" } = req.query;
    const days = parseInt(String(period));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const attendances = await prisma.attendance.findMany({
      where: {
        date: { gte: startDate },
      },
      select: {
        date: true,
        status: true,
      },
      orderBy: { date: "asc" },
    });

    // Group by date
    const dailyAttendance: Record<string, Record<string, number>> = {};

    attendances.forEach((att) => {
      const dateKey = att.date.toISOString().split("T")[0];
      if (!dailyAttendance[dateKey]) {
        dailyAttendance[dateKey] = {
          PRESENT: 0,
          ABSENT: 0,
          LATE: 0,
          HALF_DAY: 0,
          ON_LEAVE: 0,
        };
      }
      dailyAttendance[dateKey][att.status]++;
    });

    // Overall stats
    const stats = attendances.reduce((acc, att) => {
      acc[att.status] = (acc[att.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        daily: dailyAttendance,
        stats,
        period: days,
      },
    });
  } catch (error) {
    console.error("Attendance analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Machine efficiency
router.get("/machines", authenticate, async (req, res) => {
  try {
    const machines = await prisma.machine.findMany({
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            employee: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        maintenanceLogs: {
          take: 5,
          orderBy: { performedAt: "desc" },
        },
      },
    });

    const statusCount = machines.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const efficiency = {
      running: statusCount[MachineStatus.RUNNING] || 0,
      idle: statusCount[MachineStatus.IDLE] || 0,
      maintenance:
        (statusCount[MachineStatus.MAINTENANCE_REQUIRED] || 0) +
        (statusCount[MachineStatus.UNDER_MAINTENANCE] || 0),
      outOfOrder: statusCount[MachineStatus.OUT_OF_ORDER] || 0,
      total: machines.length,
      utilizationRate:
        machines.length > 0
          ? (
              ((statusCount[MachineStatus.RUNNING] || 0) / machines.length) *
              100
            ).toFixed(2)
          : 0,
    };

    res.json({
      success: true,
      data: {
        machines,
        efficiency,
        statusCount,
      },
    });
  } catch (error) {
    console.error("Machine analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Inventory analytics
router.get("/inventory", authenticate, async (req, res) => {
  try {
    const materials = await prisma.material.findMany({
      orderBy: { quantity: "asc" },
    });

    const byCategory = materials.reduce((acc, m) => {
      if (!acc[m.category]) {
        acc[m.category] = { count: 0, totalValue: 0, items: [] };
      }
      acc[m.category].count++;
      acc[m.category].totalValue += Number(m.quantity) * Number(m.unitPrice);
      acc[m.category].items.push(m);
      return acc;
    }, {} as Record<string, any>);

    const statusCount = materials.reduce((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lowStockItems = materials.filter(
      (m) => m.status === "LOW_STOCK" || m.status === "OUT_OF_STOCK"
    );

    const totalValue = materials.reduce(
      (sum, m) => sum + Number(m.quantity) * Number(m.unitPrice),
      0
    );

    res.json({
      success: true,
      data: {
        byCategory,
        statusCount,
        lowStockItems,
        totalValue,
        totalItems: materials.length,
      },
    });
  } catch (error) {
    console.error("Inventory analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Worker productivity
router.get("/productivity", authenticate, async (req, res) => {
  try {
    const { period = "30" } = req.query;
    const days = parseInt(String(period));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
        attendances: {
          where: { date: { gte: startDate } },
        },
        machineAssignments: {
          where: { isActive: true },
          include: { machine: true },
        },
        measurements: {
          where: { createdAt: { gte: startDate } },
        },
      },
    });

    const productivity = employees.map((emp) => {
      const totalDays = days;
      const presentDays = emp.attendances.filter(
        (a) =>
          a.status === AttendanceStatus.PRESENT ||
          a.status === AttendanceStatus.LATE
      ).length;
      const attendanceRate =
        totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

      return {
        id: emp.id,
        name: `${emp.user.firstName} ${emp.user.lastName}`,
        department: emp.department,
        designation: emp.designation,
        attendanceRate,
        presentDays,
        totalDays,
        measurementsTaken: emp.measurements.length,
        assignedMachine: emp.machineAssignments[0]?.machine?.name || "None",
      };
    });

    res.json({
      success: true,
      data: productivity,
    });
  } catch (error) {
    console.error("Productivity analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Financial summary
router.get("/financial", authenticate, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const startOfYear = new Date(Number(year), 0, 1);
    const endOfYear = new Date(Number(year), 11, 31);

    const [invoices, purchaseOrders] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          issueDate: { gte: startOfYear, lte: endOfYear },
          status: { not: InvoiceStatus.CANCELLED },
        },
        select: {
          issueDate: true,
          totalAmount: true,
          paidAmount: true,
        },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          orderDate: { gte: startOfYear, lte: endOfYear },
          status: { not: POStatus.CANCELLED },
        },
        select: {
          orderDate: true,
          totalAmount: true,
        },
      }),
    ]);

    // Monthly breakdown
    const monthlyData: Record<number, { revenue: number; expenses: number }> =
      {};
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = { revenue: 0, expenses: 0 };
    }

    invoices.forEach((inv) => {
      const month = inv.issueDate.getMonth();
      monthlyData[month].revenue += Number(inv.paidAmount);
    });

    purchaseOrders.forEach((po) => {
      const month = po.orderDate.getMonth();
      monthlyData[month].expenses += Number(po.totalAmount);
    });

    const totals = {
      revenue: invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0),
      invoiced: invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0),
      expenses: purchaseOrders.reduce(
        (sum, po) => sum + Number(po.totalAmount),
        0
      ),
    };

    res.json({
      success: true,
      data: {
        monthlyData,
        totals,
        year: Number(year),
        profit: totals.revenue - totals.expenses,
      },
    });
  } catch (error) {
    console.error("Financial analytics error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
