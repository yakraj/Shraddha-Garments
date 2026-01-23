import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  BuildingOfficeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { employeesAPI, attendanceAPI } from "@/lib/api";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => employeesAPI.getById(id!),
  });

  const { data: attendanceData } = useQuery({
    queryKey: ["attendance", { employeeId: id, limit: 10 }],
    queryFn: () => attendanceAPI.getAll({ employeeId: id, limit: 10 }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Employee not found</p>
        <button
          onClick={() => navigate("/employees")}
          className="btn btn-primary mt-4"
        >
          Back to Employees
        </button>
      </div>
    );
  }

  const recentAttendance = attendanceData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/employees"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Employee Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card lg:col-span-1">
          <div className="flex flex-col items-center py-6">
            {employee.user?.avatar ? (
              <img
                src={employee.user.avatar}
                alt={employee.user.firstName}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-2xl font-semibold text-primary-700">
                  {getInitials(
                    `${employee.user?.firstName} ${employee.user?.lastName}`
                  )}
                </span>
              </div>
            )}
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {employee.user?.firstName} {employee.user?.lastName}
            </h2>
            <p className="text-gray-500">{employee.designation}</p>
            <span
              className={`mt-2 badge ${
                employee.user?.isActive ? "badge-success" : "badge-error"
              }`}
            >
              {employee.user?.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {employee.user?.email}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {employee.user?.phone || "Not provided"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {employee.department}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {employee.address || "Not provided"}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employment Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Employment Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-medium text-gray-900">
                  {employee.employeeCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-900">
                  {employee.department}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Designation</p>
                <p className="font-medium text-gray-900">
                  {employee.designation}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Joining Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(employee.joiningDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CurrencyRupeeIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Salary</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(employee.salary)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Emergency Contact</p>
                <p className="font-medium text-gray-900">
                  {employee.emergencyContact || "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Machine Assignments */}
          {employee.machineAssignments &&
            employee.machineAssignments.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Machine Assignments
                </h3>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Machine</th>
                        <th>Shift</th>
                        <th>Assigned Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.machineAssignments.map((assignment: any) => (
                        <tr key={assignment.id}>
                          <td className="font-medium">
                            {assignment.machine?.name} (
                            {assignment.machine?.code})
                          </td>
                          <td>{assignment.shift}</td>
                          <td>{formatDate(assignment.assignedAt)}</td>
                          <td>
                            <span
                              className={`badge ${
                                assignment.isActive
                                  ? "badge-success"
                                  : "badge-gray"
                              }`}
                            >
                              {assignment.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* Recent Attendance */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Attendance
              </h3>
              <Link
                to={`/attendance?employeeId=${id}`}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            {recentAttendance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttendance.map((record: any) => (
                      <tr key={record.id}>
                        <td>{formatDate(record.date)}</td>
                        <td>{record.checkIn || "-"}</td>
                        <td>{record.checkOut || "-"}</td>
                        <td>
                          <span
                            className={`badge ${
                              record.status === "PRESENT"
                                ? "badge-success"
                                : record.status === "ABSENT"
                                ? "badge-error"
                                : record.status === "HALF_DAY"
                                ? "badge-warning"
                                : "badge-gray"
                            }`}
                          >
                            {record.status.replace("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No attendance records found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
