import { Router } from "express";
import { UserRole, AttendanceStatus } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { body, validationResult } from "express-validator";
import { authenticate, authorize, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Get attendance records
router.get("/", authenticate, async (req, res) => {
  try {
    const {
      page,
      limit,
      employeeId,
      status,
      startDate,
      endDate,
      date,
      year,
      month,
    } = req.query;

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;
    if (date) {
      const d = new Date(String(date));
      d.setHours(0, 0, 0, 0);
      where.date = d;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(String(startDate));
      if (endDate) where.date.lte = new Date(String(endDate));
    }

    // Support year and month filtering for calendar
    if (year && month) {
      const startOfMonth = new Date(Number(year), Number(month) - 1, 1);
      const endOfMonth = new Date(Number(year), Number(month), 0, 23, 59, 59);
      where.date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    // If page and limit are not provided, return all matches for calendar view
    if (!page && !limit) {
      const attendances = await prisma.attendance.findMany({
        where,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: [{ date: "asc" }],
      });

      return res.json({
        success: true,
        data: attendances,
      });
    }

    const currentPage = Number(page) || 1;
    const currentLimit = Number(limit) || 10;
    const skip = (currentPage - 1) * currentLimit;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: currentLimit,
        include: {
          employee: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.attendance.count({ where }),
    ]);

    res.json({
      success: true,
      data: attendances,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        pages: Math.ceil(total / currentLimit),
      },
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get today's attendance
router.get("/today", authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendances = await prisma.attendance.findMany({
      where: { date: today },
      include: {
        employee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Get all employees count
    const totalEmployees = await prisma.employee.count({
      where: { isActive: true },
    });

    const present = attendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT
    ).length;
    const late = attendances.filter(
      (a) => a.status === AttendanceStatus.LATE
    ).length;
    const absent = totalEmployees - attendances.length;

    res.json({
      success: true,
      data: {
        attendances,
        summary: {
          total: totalEmployees,
          present,
          late,
          absent,
          onLeave: attendances.filter(
            (a) => a.status === AttendanceStatus.ON_LEAVE
          ).length,
        },
      },
    });
  } catch (error) {
    console.error("Get today attendance error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark attendance
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.FLOOR_MANAGER),
  [
    body("employeeId").notEmpty(),
    body("date").notEmpty(),
    body("status").isIn(Object.values(AttendanceStatus)),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { employeeId, date, checkIn, checkOut, status, notes } = req.body;

      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      const attendance = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: attendanceDate,
          },
        },
        update: {
          checkIn: checkIn ? new Date(checkIn) : undefined,
          checkOut: checkOut ? new Date(checkOut) : undefined,
          status,
          notes,
        },
        create: {
          employeeId,
          date: attendanceDate,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          status,
          notes,
        },
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
      });

      res.json({ success: true, data: attendance });
    } catch (error) {
      console.error("Mark attendance error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Bulk mark attendance
router.post(
  "/bulk",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.FLOOR_MANAGER),
  async (req, res) => {
    try {
      const { records } = req.body;

      if (!Array.isArray(records) || records.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Records array is required" });
      }

      const results = await Promise.all(
        records.map(async (record: any) => {
          const attendanceDate = new Date(record.date);
          attendanceDate.setHours(0, 0, 0, 0);

          return prisma.attendance.upsert({
            where: {
              employeeId_date: {
                employeeId: record.employeeId,
                date: attendanceDate,
              },
            },
            update: {
              checkIn: record.checkIn ? new Date(record.checkIn) : undefined,
              checkOut: record.checkOut ? new Date(record.checkOut) : undefined,
              status: record.status,
              notes: record.notes,
            },
            create: {
              employeeId: record.employeeId,
              date: attendanceDate,
              checkIn: record.checkIn ? new Date(record.checkIn) : null,
              checkOut: record.checkOut ? new Date(record.checkOut) : null,
              status: record.status,
              notes: record.notes,
            },
          });
        })
      );

      res.json({
        success: true,
        data: results,
        message: `${results.length} records updated`,
      });
    } catch (error) {
      console.error("Bulk attendance error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Get attendance report
router.get("/report", authenticate, async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ success: false, message: "Start and end date required" });
    }

    const where: any = {
      date: {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate)),
      },
    };
    if (employeeId) where.employeeId = employeeId;

    const attendances = await prisma.attendance.findMany({
      where,
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
      orderBy: { date: "asc" },
    });

    // Group by employee
    const byEmployee = attendances.reduce((acc: any, att) => {
      if (!acc[att.employeeId]) {
        acc[att.employeeId] = {
          employee: att.employee,
          records: [],
          summary: {
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            onLeave: 0,
          },
        };
      }
      acc[att.employeeId].records.push(att);
      acc[att.employeeId].summary[att.status.toLowerCase()]++;
      return acc;
    }, {});

    res.json({ success: true, data: Object.values(byEmployee) });
  } catch (error) {
    console.error("Attendance report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
