import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      id: string;
      email: string;
      role: UserRole;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "User not found or inactive" });
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    next();
  };
};
