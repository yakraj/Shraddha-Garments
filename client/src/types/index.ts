// Common types used throughout the application

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  employee?: Employee;
}

export type UserRole =
  | "ADMIN"
  | "MANAGER"
  | "FLOOR_MANAGER"
  | "EMPLOYEE"
  | "ACCOUNTANT";

export interface Employee {
  id: string;
  employeeId: string;
  userId: string;
  user: User;
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  address?: string;
  emergencyContact?: string;
  isActive: boolean;
  createdAt: string;
  attendances?: Attendance[];
  machineAssignments?: MachineAssignment[];
}

export interface Attendance {
  id: string;
  employeeId: string;
  employee?: Employee;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  notes?: string;
}

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "ON_LEAVE";

export interface Machine {
  id: string;
  machineCode: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  purchaseDate?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  status: MachineStatus;
  location?: string;
  notes?: string;
  assignments?: MachineAssignment[];
  maintenanceLogs?: MaintenanceLog[];
}

export type MachineStatus =
  | "RUNNING"
  | "IDLE"
  | "MAINTENANCE_REQUIRED"
  | "UNDER_MAINTENANCE"
  | "OUT_OF_ORDER";

export interface MachineAssignment {
  id: string;
  machineId: string;
  machine?: Machine;
  employeeId: string;
  employee?: Employee;
  assignedAt: string;
  unassignedAt?: string;
  isActive: boolean;
}

export interface MaintenanceLog {
  id: string;
  machineId: string;
  type: MaintenanceType;
  description: string;
  cost?: number;
  performedAt: string;
  performedBy?: string;
  nextDueDate?: string;
}

export type MaintenanceType = "ROUTINE" | "REPAIR" | "EMERGENCY" | "UPGRADE";

export interface Material {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  supplier?: string;
  location?: string;
  status: MaterialStatus;
  transactions?: MaterialTransaction[];
}

export type MaterialStatus =
  | "AVAILABLE"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "DISCONTINUED";

export interface MaterialTransaction {
  id: string;
  materialId: string;
  type: TransactionType;
  quantity: number;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export type TransactionType = "IN" | "OUT" | "ADJUSTMENT" | "RETURN";

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstNumber?: string;
  panNumber?: string;
  paymentTerms?: number;
  notes?: string;
  isActive: boolean;
  invoices?: Invoice[];
  measurements?: Measurement[];
  _count?: {
    invoices: number;
    measurements: number;
  };
}

export interface Supplier {
  id: string;
  supplierCode: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gstNumber?: string;
  panNumber?: string;
  bankDetails?: any;
  isActive: boolean;
  purchaseOrders?: PurchaseOrder[];
  _count?: {
    purchaseOrders: number;
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  createdById: string;
  createdBy?: User;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  // Transport & Delivery Details
  deliveryNote?: string;
  deliveryNoteDate?: string;
  otherReference?: string;
  otherReferences?: string;
  buyersOrderNo?: string;
  buyersOrderDate?: string;
  dispatchDocNo?: string;
  dispatchedThrough?: string;
  destination?: string;
  billOfLading?: string;
  motorVehicleNo?: string;
  termsOfDelivery?: string;

  items: InvoiceItem[];
  payments?: Payment[];
}

export type InvoiceStatus =
  | "DRAFT"
  | "PENDING"
  | "SENT"
  | "PAID"
  | "PARTIALLY_PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  hsnCode?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
  notes?: string;
}

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "UPI"
  | "CHEQUE"
  | "CARD"
  | "OTHER";

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  createdById: string;
  createdBy?: User;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  status: POStatus;
  notes?: string;
  terms?: string;
  items: POItem[];
}

export type POStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "ORDERED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export interface POItem {
  id: string;
  purchaseOrderId: string;
  materialId?: string;
  material?: Material;
  description: string;
  quantity: number;
  unitPrice: number;
  receivedQty: number;
  amount: number;
}

export interface Measurement {
  id: string;
  measurementCode: string;
  customerId: string;
  customer?: Customer;
  takenById: string;
  takenBy?: Employee;
  garmentType: string;
  // Upper body
  chest?: number;
  waist?: number;
  hips?: number;
  shoulder?: number;
  sleeveLength?: number;
  armHole?: number;
  bicep?: number;
  wrist?: number;
  neckRound?: number;
  frontLength?: number;
  backLength?: number;
  // Lower body
  inseam?: number;
  outseam?: number;
  thigh?: number;
  knee?: number;
  calf?: number;
  ankle?: number;
  rise?: number;
  // Additional
  notes?: string;
  customFields?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export type NotificationType =
  | "INFO"
  | "WARNING"
  | "ERROR"
  | "SUCCESS"
  | "REMINDER";

export interface Setting {
  id: string;
  key: string;
  value: any;
  description?: string;
}

// Dashboard analytics types
export interface DashboardData {
  counts: {
    employees: number;
    machines: number;
    materials: number;
    customers: number;
    pendingPOs: number;
  };
  attendance: {
    today: Array<{ status: string; _count: { status: number } }>;
    total: number;
  };
  machineStatus: Array<{ status: string; _count: { status: number } }>;
  materialStatus: Array<{ status: string; _count: { status: number } }>;
  recentInvoices: Invoice[];
  monthlyRevenue: number;
}
