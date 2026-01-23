import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  DocumentTextIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { analyticsAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Analytics() {
  const [period, setPeriod] = useState("month");
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => analyticsAPI.getDashboard().then((res) => res.data),
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["analytics-revenue", { period, year }],
    queryFn: () =>
      analyticsAPI.getRevenue({ period, year }).then((res) => res.data),
  });

  const { data: expenseData } = useQuery({
    queryKey: ["analytics-expenses", { period, year }],
    queryFn: () =>
      analyticsAPI.getExpenses({ period, year }).then((res) => res.data),
  });

  const isLoading = dashboardLoading || revenueLoading;

  // Revenue Chart Data
  const revenueChartData = {
    labels: revenueData?.labels || [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Revenue",
        data: revenueData?.data || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        fill: true,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "Expenses",
        data: expenseData?.data || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        fill: true,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
      },
    ],
  };

  // Invoice Status Chart
  const invoiceStatusData = {
    labels: ["Paid", "Pending", "Overdue", "Draft"],
    datasets: [
      {
        data: [
          dashboardData?.invoices?.paid || 0,
          dashboardData?.invoices?.pending || 0,
          dashboardData?.invoices?.overdue || 0,
          dashboardData?.invoices?.draft || 0,
        ],
        backgroundColor: [
          "rgb(34, 197, 94)",
          "rgb(234, 179, 8)",
          "rgb(239, 68, 68)",
          "rgb(156, 163, 175)",
        ],
      },
    ],
  };

  // Category Revenue Chart
  const categoryRevenueData = {
    labels: dashboardData?.categoryRevenue?.labels || [
      "Shirts",
      "Pants",
      "Suits",
      "Dresses",
      "Other",
    ],
    datasets: [
      {
        label: "Revenue by Category",
        data: dashboardData?.categoryRevenue?.data || [0, 0, 0, 0, 0],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)",
          "rgba(34, 197, 94, 0.8)",
          "rgba(168, 85, 247, 0.8)",
          "rgba(234, 179, 8, 0.8)",
          "rgba(156, 163, 175, 0.8)",
        ],
      },
    ],
  };

  // Top Customers Chart
  const topCustomersData = {
    labels: dashboardData?.topCustomers?.map((c: any) => c.name) || [],
    datasets: [
      {
        label: "Revenue",
        data: dashboardData?.topCustomers?.map((c: any) => c.revenue) || [],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input max-w-xs"
          >
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="quarter">Quarterly</option>
            <option value="year">Yearly</option>
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input max-w-xs"
          >
            {[2024, 2023, 2022].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData?.totalRevenue || 0)}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    <span>+12.5%</span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CurrencyRupeeIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(dashboardData?.totalExpenses || 0)}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    <span>+5.2%</span>
                  </div>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.totalOrders || 0}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    <span>+8.3%</span>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.activeCustomers || 0}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    <span>+3.1%</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <UsersIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue & Expense Chart */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Revenue & Expenses
            </h3>
            <div className="h-80">
              <Line
                data={revenueChartData}
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
                      ticks: {
                        callback: (value) => "₹" + Number(value) / 1000 + "K",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Status */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Invoice Status
              </h3>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={invoiceStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "right",
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Category Revenue */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Revenue by Category
              </h3>
              <div className="h-64">
                <Bar
                  data={categoryRevenueData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => "₹" + Number(value) / 1000 + "K",
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Top Customers & Production Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Customers
              </h3>
              <div className="h-64">
                <Bar
                  data={topCustomersData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: "y",
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => "₹" + Number(value) / 1000 + "K",
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Production Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Machines Operational</span>
                  <span className="font-semibold text-green-600">
                    {dashboardData?.machines?.operational || 0} /{" "}
                    {dashboardData?.machines?.total || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        ((dashboardData?.machines?.operational || 0) /
                          (dashboardData?.machines?.total || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Employee Attendance</span>
                  <span className="font-semibold text-blue-600">
                    {dashboardData?.attendance?.present || 0} /{" "}
                    {dashboardData?.attendance?.total || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        ((dashboardData?.attendance?.present || 0) /
                          (dashboardData?.attendance?.total || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Materials in Stock</span>
                  <span className="font-semibold text-purple-600">
                    {dashboardData?.materials?.inStock || 0} /{" "}
                    {dashboardData?.materials?.total || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${
                        ((dashboardData?.materials?.inStock || 0) /
                          (dashboardData?.materials?.total || 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
