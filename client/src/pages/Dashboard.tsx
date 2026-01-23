import { useQuery } from "@tanstack/react-query";
import {
  UsersIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  ClipboardDocumentListIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { analyticsAPI } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  formatStatus,
} from "@/lib/utils";
import type { DashboardData } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await analyticsAPI.getDashboard();
      return response.data as DashboardData;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const stats = [
    {
      name: "Total Employees",
      value: data?.counts.employees || 0,
      icon: UsersIcon,
      href: "/employees",
      color: "bg-blue-500",
    },
    {
      name: "Active Machines",
      value: data?.counts.machines || 0,
      icon: WrenchScrewdriverIcon,
      href: "/machines",
      color: "bg-green-500",
    },
    {
      name: "Materials",
      value: data?.counts.materials || 0,
      icon: CubeIcon,
      href: "/materials",
      color: "bg-purple-500",
    },
    {
      name: "Customers",
      value: data?.counts.customers || 0,
      icon: UserGroupIcon,
      href: "/customers",
      color: "bg-orange-500",
    },
  ];

  // Attendance chart data
  const attendanceData = {
    labels: ["Present", "Late", "Absent", "On Leave"],
    datasets: [
      {
        data: [
          data?.attendance.today.find((a) => a.status === "PRESENT")?._count
            .status || 0,
          data?.attendance.today.find((a) => a.status === "LATE")?._count
            .status || 0,
          (data?.attendance.total || 0) -
            (data?.attendance.today.reduce(
              (sum, a) => sum + a._count.status,
              0
            ) || 0),
          data?.attendance.today.find((a) => a.status === "ON_LEAVE")?._count
            .status || 0,
        ],
        backgroundColor: ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"],
      },
    ],
  };

  // Machine status data
  const machineStatusData = {
    labels: data?.machineStatus.map((m) => formatStatus(m.status)) || [],
    datasets: [
      {
        data: data?.machineStatus.map((m) => m._count.status) || [],
        backgroundColor: [
          "#22c55e",
          "#9ca3af",
          "#f59e0b",
          "#3b82f6",
          "#ef4444",
        ],
      },
    ],
  };

  // Weekly productivity data (mock)
  const weeklyData = {
    labels: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
    datasets: [
      {
        label: "Machine Efficiency",
        data: [52, 48, 65, 58, 72, 68, 78],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
      },
      {
        label: "Material Flow",
        data: [48, 55, 58, 52, 65, 62, 70],
        backgroundColor: "rgba(34, 197, 94, 0.8)",
      },
      {
        label: "Worker Productivity",
        data: [65, 60, 78, 72, 85, 80, 88],
        backgroundColor: "rgba(249, 115, 22, 0.8)",
      },
    ],
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            {formatDate(new Date(), {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn btn-outline">
            <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Revenue card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Monthly Revenue
          </h2>
          <Link
            to="/invoices"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            View all invoices →
          </Link>
        </div>
        <div className="flex items-center">
          <CurrencyRupeeIcon className="h-8 w-8 text-green-500" />
          <span className="ml-2 text-3xl font-bold text-gray-900">
            {formatCurrency(data?.monthlyRevenue || 0)}
          </span>
          <span className="ml-4 flex items-center text-sm text-green-600">
            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            +12.5% from last month
          </span>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Attendance */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Today's Attendance
            </h2>
            <Link
              to="/attendance"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </Link>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center h-48">
              <Doughnut
                data={attendanceData}
                options={{
                  plugins: {
                    legend: {
                      position: "right",
                    },
                  },
                  maintainAspectRatio: false,
                }}
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {data?.attendance.today.find((a) => a.status === "PRESENT")
                    ?._count.status || 0}
                </p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {data?.attendance.today.find((a) => a.status === "LATE")
                    ?._count.status || 0}
                </p>
                <p className="text-xs text-gray-500">Late</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {(data?.attendance.total || 0) -
                    (data?.attendance.today.reduce(
                      (sum, a) => sum + a._count.status,
                      0
                    ) || 0)}
                </p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {data?.attendance.today.find((a) => a.status === "ON_LEAVE")
                    ?._count.status || 0}
                </p>
                <p className="text-xs text-gray-500">Leave</p>
              </div>
            </div>
          </div>
        </div>

        {/* Machine Overview */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Machine Status
            </h2>
            <Link
              to="/machines"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </Link>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center h-48">
              <Doughnut
                data={machineStatusData}
                options={{
                  plugins: {
                    legend: {
                      position: "right",
                    },
                  },
                  maintainAspectRatio: false,
                }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {data?.machineStatus.map((status) => (
                <div
                  key={status.status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className={`badge ${getStatusColor(status.status)}`}>
                    {formatStatus(status.status)}
                  </span>
                  <span className="font-medium">
                    {status._count.status} machines
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Material Overview */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Material Status
            </h2>
            <Link
              to="/materials"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all →
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {data?.materialStatus.map((status) => {
                const total = data.counts.materials || 1;
                const percentage = (status._count.status / total) * 100;
                return (
                  <div key={status.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`badge ${getStatusColor(status.status)}`}
                      >
                        {formatStatus(status.status)}
                      </span>
                      <span className="text-sm font-medium">
                        {status._count.status} items
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          status.status === "AVAILABLE"
                            ? "bg-green-500"
                            : status.status === "LOW_STOCK"
                            ? "bg-yellow-500"
                            : status.status === "OUT_OF_STOCK"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weekly Analytics */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Weekly Analytics
            </h2>
            <Link
              to="/analytics"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View details →
            </Link>
          </div>
          <div className="p-6">
            <div className="h-64">
              <Bar
                data={weeklyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Invoices
          </h2>
          <Link
            to="/invoices"
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.recentInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td>{invoice.customer?.name}</td>
                  <td className="font-medium">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(invoice.status)}`}>
                      {formatStatus(invoice.status)}
                    </span>
                  </td>
                  <td className="text-gray-500">
                    {formatDate(invoice.issueDate)}
                  </td>
                </tr>
              ))}
              {(!data?.recentInvoices || data.recentInvoices.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
