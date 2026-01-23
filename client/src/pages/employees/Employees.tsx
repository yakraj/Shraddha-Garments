import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { employeesAPI } from "@/lib/api";
import { formatDate, getInitials, debounce } from "@/lib/utils";
import type { Employee } from "@/types";
import EmployeeModal from "./EmployeeModal";

export default function Employees() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const { data, isLoading } = useQuery({
    queryKey: ["employees", { search, page }],
    queryFn: () => employeesAPI.getAll({ search, page, limit: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete employee");
    },
  });

  const handleSearch = debounce((value: string) => {
    setSearch(value);
    setPage(1);
  }, 300);

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedEmployee(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500">Manage your workforce</p>
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              className="input pl-10"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-outline">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                  </td>
                </tr>
              ) : data?.data?.length > 0 ? (
                data.data.map((employee: Employee) => (
                  <tr key={employee.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
                          {employee.user?.avatar ? (
                            <img
                              src={employee.user.avatar}
                              alt=""
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            getInitials(
                              employee.user?.firstName || "",
                              employee.user?.lastName || ""
                            )
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/employees/${employee.id}`}
                            className="font-medium text-gray-900 hover:text-primary-600"
                          >
                            {employee.user?.firstName} {employee.user?.lastName}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {employee.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{employee.employeeId}</td>
                    <td>{employee.department}</td>
                    <td>{employee.designation}</td>
                    <td>{formatDate(employee.joiningDate)}</td>
                    <td>
                      <span
                        className={`badge ${
                          employee.isActive ? "badge-success" : "badge-gray"
                        }`}
                      >
                        {employee.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this employee?"
                              )
                            ) {
                              deleteMutation.mutate(employee.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * 10 + 1} to{" "}
              {Math.min(page * 10, data.pagination.total)} of{" "}
              {data.pagination.total} results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-outline text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.pages}
                className="btn btn-outline text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => {
            setShowModal(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
}
