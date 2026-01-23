import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { attendanceAPI, employeesAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800 border-green-200",
  ABSENT: "bg-red-100 text-red-800 border-red-200",
  HALF_DAY: "bg-yellow-100 text-yellow-800 border-yellow-200",
  LEAVE: "bg-blue-100 text-blue-800 border-blue-200",
  HOLIDAY: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function Attendance() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const { data: employees } = useQuery({
    queryKey: ["employees", "all"],
    queryFn: () => employeesAPI.getAll({}),
  });

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: [
      "attendance",
      { year, month: month + 1, employeeId: selectedEmployee },
    ],
    queryFn: () =>
      attendanceAPI.getAll({
        year,
        month: month + 1,
        employeeId: selectedEmployee || undefined,
      }),
  });

  const markAttendanceMutation = useMutation({
    mutationFn: (data: any) => attendanceAPI.mark(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Attendance marked successfully");
      setShowModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to mark attendance");
    },
  });

  const getAttendanceForDate = (date: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      date
    ).padStart(2, "0")}`;
    const records = attendanceData?.data || [];
    return records.filter((a: any) => a.date.startsWith(dateStr));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (date: number) => {
    setSelectedDate(new Date(year, month, date));
    setShowModal(true);
  };

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Summary stats
  const allRecords = Array.isArray(attendanceData?.data)
    ? attendanceData.data
    : [];
  const presentCount = allRecords.filter(
    (a: any) => a.status === "PRESENT"
  ).length;
  const absentCount = allRecords.filter(
    (a: any) => a.status === "ABSENT"
  ).length;
  const halfDayCount = allRecords.filter(
    (a: any) => a.status === "HALF_DAY"
  ).length;
  const leaveCount = allRecords.filter((a: any) => a.status === "LEAVE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">All Employees</option>
            {Array.isArray(employees?.data) &&
              employees.data.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user?.firstName} {emp.user?.lastName}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-2xl font-bold text-green-600">
                {presentCount}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-2xl font-bold text-red-600">{absentCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <UserIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Half Day</p>
              <p className="text-2xl font-bold text-yellow-600">
                {halfDayCount}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">On Leave</p>
              <p className="text-2xl font-bold text-blue-600">{leaveCount}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="p-2" />;
              }

              const dayRecords = getAttendanceForDate(day);
              const isToday =
                new Date().toDateString() ===
                new Date(year, month, day).toDateString();

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`p-2 min-h-[80px] border rounded-lg hover:bg-gray-50 transition-colors text-left ${
                    isToday
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday ? "text-primary-600" : "text-gray-900"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayRecords.slice(0, 3).map((record: any) => (
                      <div
                        key={record.id}
                        className={`text-xs px-1.5 py-0.5 rounded border ${
                          statusColors[record.status] || "bg-gray-100"
                        } truncate`}
                      >
                        {record.employee?.user?.firstName?.charAt(0)}.
                        {record.employee?.user?.lastName?.charAt(0)} -{" "}
                        {record.status.replace("_", " ")}
                      </div>
                    ))}
                    {dayRecords.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayRecords.length - 3} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mark Attendance Modal */}
      {showModal && selectedDate && (
        <AttendanceModal
          date={selectedDate}
          employees={employees?.data || []}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => markAttendanceMutation.mutate(data)}
          isLoading={markAttendanceMutation.isPending}
        />
      )}
    </div>
  );
}

interface AttendanceModalProps {
  date: Date;
  employees: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function AttendanceModal({
  date,
  employees,
  onClose,
  onSubmit,
  isLoading,
}: AttendanceModalProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [status, setStatus] = useState("PRESENT");
  const [checkIn, setCheckIn] = useState("09:00");
  const [checkOut, setCheckOut] = useState("18:00");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      toast.error("Please select an employee");
      return;
    }
    onSubmit({
      employeeId: selectedEmployeeId,
      date: date.toISOString().split("T")[0],
      status,
      checkIn: status === "PRESENT" || status === "HALF_DAY" ? checkIn : null,
      checkOut: status === "PRESENT" ? checkOut : null,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Mark Attendance - {formatDate(date.toISOString())}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Employee *</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="input"
              required
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user?.firstName} {emp.user?.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="input"
            >
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="LEAVE">Leave</option>
              <option value="HOLIDAY">Holiday</option>
            </select>
          </div>
          {(status === "PRESENT" || status === "HALF_DAY") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Check In</label>
                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="input"
                />
              </div>
              {status === "PRESENT" && (
                <div>
                  <label className="label">Check Out</label>
                  <input
                    type="time"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="input"
                  />
                </div>
              )}
            </div>
          )}
          <div>
            <label className="label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="input"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? "Saving..." : "Mark Attendance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
