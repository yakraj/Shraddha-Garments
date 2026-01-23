import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { customersAPI } from "@/lib/api";
import type { Customer } from "@/types";

interface CustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
}

interface FormData {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  panNumber: string;
  creditLimit: number;
  paymentTerms: number;
  isActive: boolean;
}

export default function CustomerModal({
  customer,
  onClose,
}: CustomerModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!customer;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: customer
      ? {
          name: customer.name,
          code: customer.code,
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || "",
          city: customer.city || "",
          state: customer.state || "",
          pincode: customer.pincode || "",
          gstNumber: customer.gstNumber || "",
          panNumber: customer.panNumber || "",
          creditLimit: Number(customer.creditLimit) || 0,
          paymentTerms: customer.paymentTerms || 30,
          isActive: customer.isActive ?? true,
        }
      : {
          paymentTerms: 30,
          isActive: true,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => customersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer created successfully");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create customer");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => customersAPI.update(customer!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update customer");
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
                    {isEditing ? "Edit Customer" : "Add New Customer"}
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
                  className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Customer Name *</label>
                      <input
                        {...register("name", { required: "Name is required" })}
                        className={`input ${errors.name ? "input-error" : ""}`}
                      />
                    </div>
                    <div>
                      <label className="label">Customer Code *</label>
                      <input
                        {...register("code", { required: "Code is required" })}
                        className={`input ${errors.code ? "input-error" : ""}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        {...register("email")}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input {...register("phone")} className="input" />
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

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">City</label>
                      <input {...register("city")} className="input" />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input {...register("state")} className="input" />
                    </div>
                    <div>
                      <label className="label">Pincode</label>
                      <input {...register("pincode")} className="input" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">GST Number</label>
                      <input {...register("gstNumber")} className="input" />
                    </div>
                    <div>
                      <label className="label">PAN Number</label>
                      <input {...register("panNumber")} className="input" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Credit Limit</label>
                      <input
                        type="number"
                        {...register("creditLimit")}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Payment Terms (Days)</label>
                      <input
                        type="number"
                        {...register("paymentTerms")}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("isActive")}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300"
                    />
                    <label className="text-sm text-gray-700">
                      Active Customer
                    </label>
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
                        ? "Update Customer"
                        : "Create Customer"}
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
