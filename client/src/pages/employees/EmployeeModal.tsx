import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { employeesAPI } from "@/lib/api";
import type { Employee } from "@/types";

interface EmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
}

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  salary: number;
  address: string;
  emergencyContact: string;
}

export default function EmployeeModal({
  employee,
  onClose,
}: EmployeeModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!employee;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: employee
      ? {
          firstName: employee.user?.firstName || "",
          lastName: employee.user?.lastName || "",
          phone: employee.user?.phone || "",
          department: employee.department,
          designation: employee.designation,
          joiningDate: employee.joiningDate?.split("T")[0],
          salary: Number(employee.salary),
          address: employee.address || "",
          emergencyContact: employee.emergencyContact || "",
        }
      : {
          joiningDate: new Date().toISOString().split("T")[0],
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => employeesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee created successfully");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create employee");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => employeesAPI.update(employee!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update employee");
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Transition.Root show as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {isEditing ? "Edit Employee" : "Add New Employee"}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="p-6 space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">First Name *</label>
                      <input
                        {...register("firstName", {
                          required: "First name is required",
                        })}
                        className={`input ${
                          errors.firstName ? "input-error" : ""
                        }`}
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label">Last Name *</label>
                      <input
                        {...register("lastName", {
                          required: "Last name is required",
                        })}
                        className={`input ${
                          errors.lastName ? "input-error" : ""
                        }`}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Email *</label>
                        <input
                          type="email"
                          {...register("email", {
                            required: "Email is required",
                          })}
                          className={`input ${
                            errors.email ? "input-error" : ""
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="label">Password *</label>
                        <input
                          type="password"
                          {...register("password", {
                            required: "Password is required",
                            minLength: {
                              value: 6,
                              message: "Min 6 characters",
                            },
                          })}
                          className={`input ${
                            errors.password ? "input-error" : ""
                          }`}
                        />
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.password.message}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Phone</label>
                      <input {...register("phone")} className="input" />
                    </div>
                    <div>
                      <label className="label">Department *</label>
                      <select
                        {...register("department", {
                          required: "Department is required",
                        })}
                        className={`input ${
                          errors.department ? "input-error" : ""
                        }`}
                      >
                        <option value="">Select department</option>
                        <option value="Production">Production</option>
                        <option value="Operations">Operations</option>
                        <option value="Quality">Quality</option>
                        <option value="Admin">Admin</option>
                        <option value="Sales">Sales</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Designation *</label>
                      <input
                        {...register("designation", {
                          required: "Designation is required",
                        })}
                        className={`input ${
                          errors.designation ? "input-error" : ""
                        }`}
                      />
                    </div>
                    <div>
                      <label className="label">Salary *</label>
                      <input
                        type="number"
                        {...register("salary", {
                          required: "Salary is required",
                          min: 0,
                        })}
                        className={`input ${
                          errors.salary ? "input-error" : ""
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Joining Date</label>
                      <input
                        type="date"
                        {...register("joiningDate")}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Emergency Contact</label>
                      <input
                        {...register("emergencyContact")}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Address</label>
                    <textarea
                      {...register("address")}
                      rows={2}
                      className="input"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading
                        ? "Saving..."
                        : isEditing
                        ? "Update Employee"
                        : "Create Employee"}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
