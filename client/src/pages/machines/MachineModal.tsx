import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { machinesAPI } from "@/lib/api";
import type { Machine } from "@/types";

interface MachineModalProps {
  machine: Machine | null;
  onClose: () => void;
}

interface FormData {
  name: string;
  code: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  location: string;
  status: string;
  purchaseDate: string;
  purchasePrice: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  notes: string;
}

export default function MachineModal({ machine, onClose }: MachineModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!machine;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: machine
      ? {
          name: machine.name,
          code: machine.code,
          type: machine.type,
          manufacturer: machine.manufacturer || "",
          model: machine.model || "",
          serialNumber: machine.serialNumber || "",
          location: machine.location || "",
          status: machine.status,
          purchaseDate: machine.purchaseDate?.split("T")[0] || "",
          purchasePrice: Number(machine.purchasePrice) || 0,
          lastMaintenanceDate: machine.lastMaintenanceDate?.split("T")[0] || "",
          nextMaintenanceDate: machine.nextMaintenanceDate?.split("T")[0] || "",
          notes: machine.notes || "",
        }
      : {
          status: "OPERATIONAL",
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => machinesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      toast.success("Machine created successfully");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create machine");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => machinesAPI.update(machine!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      toast.success("Machine updated successfully");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update machine");
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
                    {isEditing ? "Edit Machine" : "Add New Machine"}
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
                      <label className="label">Machine Name *</label>
                      <input
                        {...register("name", { required: "Name is required" })}
                        className={`input ${errors.name ? "input-error" : ""}`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label">Machine Code *</label>
                      <input
                        {...register("code", { required: "Code is required" })}
                        className={`input ${errors.code ? "input-error" : ""}`}
                      />
                      {errors.code && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.code.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Type *</label>
                      <select
                        {...register("type", { required: "Type is required" })}
                        className={`input ${errors.type ? "input-error" : ""}`}
                      >
                        <option value="">Select type</option>
                        <option value="Sewing">Sewing</option>
                        <option value="Cutting">Cutting</option>
                        <option value="Embroidery">Embroidery</option>
                        <option value="Pressing">Pressing</option>
                        <option value="Finishing">Finishing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Status *</label>
                      <select
                        {...register("status", {
                          required: "Status is required",
                        })}
                        className={`input ${
                          errors.status ? "input-error" : ""
                        }`}
                      >
                        <option value="OPERATIONAL">Operational</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="REPAIR">Repair</option>
                        <option value="IDLE">Idle</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Manufacturer</label>
                      <input {...register("manufacturer")} className="input" />
                    </div>
                    <div>
                      <label className="label">Model</label>
                      <input {...register("model")} className="input" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Serial Number</label>
                      <input {...register("serialNumber")} className="input" />
                    </div>
                    <div>
                      <label className="label">Location</label>
                      <input {...register("location")} className="input" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Purchase Date</label>
                      <input
                        type="date"
                        {...register("purchaseDate")}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Purchase Price</label>
                      <input
                        type="number"
                        {...register("purchasePrice")}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Last Maintenance</label>
                      <input
                        type="date"
                        {...register("lastMaintenanceDate")}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Next Maintenance</label>
                      <input
                        type="date"
                        {...register("nextMaintenanceDate")}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      {...register("notes")}
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
                        ? "Update Machine"
                        : "Create Machine"}
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
