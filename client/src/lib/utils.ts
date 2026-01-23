import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(
  amount: number | string | undefined | null
): string {
  if (amount === undefined || amount === null) return "₹ 0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹ 0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(d);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName) return "";

  // If we have both names explicitly
  if (lastName && lastName.trim() !== "") {
    return (firstName.charAt(0) + lastName.trim().charAt(0)).toUpperCase();
  }

  // Handle as full name in firstName parameter
  const parts = firstName.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Attendance
    PRESENT: "badge-success",
    ABSENT: "badge-danger",
    LATE: "badge-warning",
    HALF_DAY: "badge-warning",
    ON_LEAVE: "badge-info",
    // Machine
    RUNNING: "badge-success",
    IDLE: "badge-gray",
    MAINTENANCE_REQUIRED: "badge-warning",
    UNDER_MAINTENANCE: "badge-info",
    OUT_OF_ORDER: "badge-danger",
    // Material
    AVAILABLE: "badge-success",
    LOW_STOCK: "badge-warning",
    OUT_OF_STOCK: "badge-danger",
    DISCONTINUED: "badge-gray",
    // Invoice
    DRAFT: "badge-gray",
    PENDING: "badge-warning",
    SENT: "badge-info",
    PAID: "badge-success",
    PARTIALLY_PAID: "badge-warning",
    OVERDUE: "badge-danger",
    CANCELLED: "badge-gray",
    // PO
    PENDING_APPROVAL: "badge-warning",
    APPROVED: "badge-info",
    ORDERED: "badge-info",
    PARTIALLY_RECEIVED: "badge-warning",
    RECEIVED: "badge-success",
  };
  return colors[status] || "badge-gray";
}

export function formatStatus(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function generateCode(prefix: string, number: number): string {
  return `${prefix}${String(number).padStart(4, "0")}`;
}

export function numberToWords(num: number): string {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convert = (n: number): string => {
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + convert(n % 100) : "")
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + convert(n % 100000) : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "")
    );
  };

  if (num === 0) return "Zero Rupees Only";

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let res = convert(integerPart).trim() + " Rupees";
  if (decimalPart > 0) {
    res += " and " + convert(decimalPart).trim() + " Paise";
  }

  return res + " Only";
}
