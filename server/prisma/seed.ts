import {
  PrismaClient,
  UserRole,
  AttendanceStatus,
  MachineStatus,
  MaterialStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create Admin User
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@shraddhagarments.com" },
    update: {},
    create: {
      email: "admin@shraddhagarments.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      phone: "+91 9876543210",
      role: UserRole.ADMIN,
    },
  });
  console.log("✅ Admin user created");

  // Create Manager
  const managerPassword = await bcrypt.hash("manager123", 10);
  const manager = await prisma.user.upsert({
    where: { email: "manager@shraddhagarments.com" },
    update: {},
    create: {
      email: "manager@shraddhagarments.com",
      password: managerPassword,
      firstName: "Pablo",
      lastName: "Rodriguez",
      phone: "+91 9876543211",
      role: UserRole.FLOOR_MANAGER,
    },
  });
  console.log("✅ Manager user created");

  // Create Employees
  const employeeData = [
    {
      firstName: "Darina",
      lastName: "Sharma",
      email: "darina@shraddhagarments.com",
      department: "Production",
      designation: "Production Lead",
    },
    {
      firstName: "Andril",
      lastName: "Kawry",
      email: "andril@shraddhagarments.com",
      department: "Production",
      designation: "Production Lead",
    },
    {
      firstName: "Selena",
      lastName: "Patel",
      email: "selena@shraddhagarments.com",
      department: "Production",
      designation: "Production Lead",
    },
    {
      firstName: "Arthur",
      lastName: "Pramad",
      email: "arthur@shraddhagarments.com",
      department: "Operations",
      designation: "Machine Operator",
    },
    {
      firstName: "Jadsen",
      lastName: "Poss",
      email: "jadsen@shraddhagarments.com",
      department: "Operations",
      designation: "Machine Operator",
    },
    {
      firstName: "Michael",
      lastName: "Singh",
      email: "michael@shraddhagarments.com",
      department: "Operations",
      designation: "Machine Operator",
    },
  ];

  const employees = [];
  for (let i = 0; i < employeeData.length; i++) {
    const emp = employeeData[i];
    const empPassword = await bcrypt.hash("employee123", 10);
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        password: empPassword,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: UserRole.EMPLOYEE,
      },
    });

    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        employeeId: `EMP${String(i + 1).padStart(4, "0")}`,
        userId: user.id,
        department: emp.department,
        designation: emp.designation,
        joiningDate: new Date("2024-01-15"),
        salary: 35000 + i * 5000,
      },
    });
    employees.push(employee);
  }
  console.log("✅ Employees created");

  // Create Machines
  const machineData = [
    {
      name: "Machine #1",
      type: "Sewing Machine",
      status: MachineStatus.RUNNING,
    },
    {
      name: "Machine #2",
      type: "Cutting Machine",
      status: MachineStatus.MAINTENANCE_REQUIRED,
    },
    {
      name: "Machine #3",
      type: "Overlock Machine",
      status: MachineStatus.RUNNING,
    },
    {
      name: "Machine #4",
      type: "Button Machine",
      status: MachineStatus.RUNNING,
    },
    {
      name: "Machine #5",
      type: "Pressing Machine",
      status: MachineStatus.IDLE,
    },
  ];

  const machines = [];
  for (let i = 0; i < machineData.length; i++) {
    const m = machineData[i];
    const machine = await prisma.machine.upsert({
      where: { machineCode: `MCH${String(i + 1).padStart(4, "0")}` },
      update: {},
      create: {
        machineCode: `MCH${String(i + 1).padStart(4, "0")}`,
        name: m.name,
        type: m.type,
        manufacturer: "Industrial Corp",
        status: m.status,
        location: `Floor ${Math.ceil((i + 1) / 3)}`,
      },
    });
    machines.push(machine);
  }
  console.log("✅ Machines created");

  // Assign employees to machines
  for (let i = 0; i < Math.min(employees.length, machines.length); i++) {
    await prisma.machineAssignment.upsert({
      where: {
        machineId_employeeId_isActive: {
          machineId: machines[i].id,
          employeeId: employees[i].id,
          isActive: true,
        },
      },
      update: {},
      create: {
        machineId: machines[i].id,
        employeeId: employees[i].id,
        isActive: true,
      },
    });
  }
  console.log("✅ Machine assignments created");

  // Create Materials
  const materialData = [
    {
      name: "Cotton",
      category: "Fabric",
      quantity: 1000,
      unit: "Meters",
      unitPrice: 150,
      status: MaterialStatus.AVAILABLE,
    },
    {
      name: "Polyester",
      category: "Fabric",
      quantity: 150,
      unit: "Meters",
      unitPrice: 120,
      status: MaterialStatus.LOW_STOCK,
    },
    {
      name: "Button",
      category: "Accessories",
      quantity: 0,
      unit: "Pieces",
      unitPrice: 5,
      status: MaterialStatus.OUT_OF_STOCK,
    },
    {
      name: "Zipper",
      category: "Accessories",
      quantity: 500,
      unit: "Pieces",
      unitPrice: 25,
      status: MaterialStatus.AVAILABLE,
    },
    {
      name: "Thread",
      category: "Supplies",
      quantity: 200,
      unit: "Spools",
      unitPrice: 45,
      status: MaterialStatus.AVAILABLE,
    },
    {
      name: "Lining Fabric",
      category: "Fabric",
      quantity: 300,
      unit: "Meters",
      unitPrice: 80,
      status: MaterialStatus.AVAILABLE,
    },
  ];

  for (let i = 0; i < materialData.length; i++) {
    const m = materialData[i];
    await prisma.material.upsert({
      where: { materialCode: `MAT${String(i + 1).padStart(4, "0")}` },
      update: {},
      create: {
        materialCode: `MAT${String(i + 1).padStart(4, "0")}`,
        name: m.name,
        category: m.category,
        quantity: m.quantity,
        minQuantity: 100,
        unit: m.unit,
        unitPrice: m.unitPrice,
        status: m.status,
      },
    });
  }
  console.log("✅ Materials created");

  // Create Customers
  const customerData = [
    {
      name: "Fashion Hub Pvt Ltd",
      email: "orders@fashionhub.com",
      phone: "+91 9876543220",
      city: "Mumbai",
    },
    {
      name: "Style Mart",
      email: "purchase@stylemart.com",
      phone: "+91 9876543221",
      city: "Delhi",
    },
    {
      name: "Trendy Wear",
      email: "info@trendywear.com",
      phone: "+91 9876543222",
      city: "Bangalore",
    },
  ];

  const customers = [];
  for (let i = 0; i < customerData.length; i++) {
    const c = customerData[i];
    const customer = await prisma.customer.upsert({
      where: { customerCode: `CUST${String(i + 1).padStart(4, "0")}` },
      update: {},
      create: {
        customerCode: `CUST${String(i + 1).padStart(4, "0")}`,
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        state: "Maharashtra",
        country: "India",
      },
    });
    customers.push(customer);
  }
  console.log("✅ Customers created");

  // Create Suppliers
  const supplierData = [
    {
      name: "Fabric World",
      contactPerson: "Rajesh Kumar",
      phone: "+91 9876543230",
      city: "Surat",
    },
    {
      name: "Button & More",
      contactPerson: "Priya Sharma",
      phone: "+91 9876543231",
      city: "Mumbai",
    },
    {
      name: "Thread Masters",
      contactPerson: "Amit Patel",
      phone: "+91 9876543232",
      city: "Ahmedabad",
    },
  ];

  for (let i = 0; i < supplierData.length; i++) {
    const s = supplierData[i];
    await prisma.supplier.upsert({
      where: { supplierCode: `SUP${String(i + 1).padStart(4, "0")}` },
      update: {},
      create: {
        supplierCode: `SUP${String(i + 1).padStart(4, "0")}`,
        name: s.name,
        contactPerson: s.contactPerson,
        phone: s.phone,
        city: s.city,
        state: "Gujarat",
        country: "India",
      },
    });
  }
  console.log("✅ Suppliers created");

  // Create sample attendance records
  const today = new Date();
  const statuses = [
    AttendanceStatus.PRESENT,
    AttendanceStatus.LATE,
    AttendanceStatus.ABSENT,
  ];

  for (const employee of employees) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const status = statuses[Math.floor(Math.random() * statuses.length)];

      try {
        await prisma.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: employee.id,
              date: date,
            },
          },
          update: {},
          create: {
            employeeId: employee.id,
            date: date,
            checkIn:
              status !== AttendanceStatus.ABSENT
                ? new Date(
                    date.setHours(9, Math.floor(Math.random() * 30), 0, 0),
                  )
                : null,
            checkOut:
              status !== AttendanceStatus.ABSENT
                ? new Date(
                    date.setHours(18, Math.floor(Math.random() * 30), 0, 0),
                  )
                : null,
            status: status,
          },
        });
      } catch (e) {
        // Skip if already exists
      }
    }
  }
  console.log("✅ Attendance records created");

  // Create Settings
  const settings = [
    {
      key: "company_name",
      value: { name: "Shraddha Garments" },
      description: "Company name",
    },
    {
      key: "company_address",
      value: { address: "123 Industrial Area, Mumbai, Maharashtra 400001" },
      description: "Company address",
    },
    {
      key: "company_gst",
      value: { gst: "27AAAAA0000A1Z5" },
      description: "Company GST number",
    },
    {
      key: "invoice_prefix",
      value: { prefix: "INV" },
      description: "Invoice number prefix",
    },
    {
      key: "po_prefix",
      value: { prefix: "PO" },
      description: "Purchase order number prefix",
    },
    {
      key: "tax_rate",
      value: { rate: 18 },
      description: "Default tax rate (GST)",
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("✅ Settings created");

  // Create Default HSN Codes
  const defaultHSNs = [
    { code: "6109", description: "T-Shirts", taxRate: 5 },
    { code: "6203", description: "Men's Trousers/Suits", taxRate: 5 },
    { code: "6204", description: "Women's Dresses/Suits", taxRate: 5 },
    { code: "6111", description: "Babies Garments", taxRate: 5 },
    { code: "6205", description: "Men's Shirts", taxRate: 5 },
    { code: "6206", description: "Women's Blouses/Shirts", taxRate: 5 },
    { code: "5208", description: "Cotton Fabrics", taxRate: 12 },
    { code: "9988", description: "Stitching/Job Work", taxRate: 18 },
  ];

  for (const hsn of defaultHSNs) {
    await prisma.hSN.upsert({
      where: { code: hsn.code },
      update: { description: hsn.description, taxRate: hsn.taxRate },
      create: hsn,
    });
  }
  console.log("✅ Default HSN codes created");

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
