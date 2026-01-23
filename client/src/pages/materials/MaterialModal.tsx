import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { materialsAPI } from "@/lib/api";
import type { Material } from "@/types";

interface MaterialModalProps {
  material: Material | null;
  onClose: () => void;
}

interface FormData {
  name: string;
  code: string;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  supplierId: string;
}

export default function MaterialModal({
  material,
  onClose,
}: MaterialModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!material;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: material
      ? {
          name: material.name,
          code: material.code,
          category: material.category,
          description: material.description || "",
          unit: material.unit,
          quantity: Number(material.quantity),
          minQuantity: Number(material.minQuantity),
          unitPrice: Number(material.unitPrice),
          supplierId: material.supplierId || "",
        }
      : {
          unit: "meters",
          quantity: 0,
          minQuantity: 10,
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => materialsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material created successfully");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create material");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => materialsAPI.update(material!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material updated successfully");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update material");
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {isEditing ? "Edit Material" : "Add New Material"}
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
                  className="p-6 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Material Code *</label>
                      <input
                        {...register("code", { required: "Code is required" })}
                        className={`input ${errors.code ? "input-error" : ""}`}
                      />
                    </div>
                    <div>
                      <label className="label">Name *</label>
                      <input
                        {...register("name", { required: "Name is required" })}
                        className={`input ${errors.name ? "input-error" : ""}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Category *</label>
                      <select
                        {...register("category", {
                          required: "Category is required",
                        })}
                        className={`input ${
                          errors.category ? "input-error" : ""
                        }`}
                      >
                        <option value="">Select category</option>
                        <option value="Fabric">Fabric</option>
                        <option value="Thread">Thread</option>
                        <option value="Button">Button</option>
                        <option value="Zipper">Zipper</option>
                        <option value="Lining">Lining</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Packaging">Packaging</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Unit *</label>
                      <select
                        {...register("unit", { required: "Unit is required" })}
                        className={`input ${errors.unit ? "input-error" : ""}`}
                      >
                        <option value="meters">Meters</option>
                        <option value="yards">Yards</option>
                        <option value="pieces">Pieces</option>
                        <option value="kg">Kilograms</option>
                        <option value="rolls">Rolls</option>
                        <option value="boxes">Boxes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">Description</label>
                    <textarea
                      {...register("description")}
                      rows={2}
                      className="input"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">Quantity</label>
                      <input
                        type="number"
                        {...register("quantity", { min: 0 })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Min Quantity</label>
                      <input
                        type="number"
                        {...register("minQuantity", { min: 0 })}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Unit Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("unitPrice", {
                          required: "Price is required",
                          min: 0,
                        })}
                        className={`input ${
                          errors.unitPrice ? "input-error" : ""
                        }`}
                      />
                    </div>
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
                        ? "Update Material"
                        : "Create Material"}
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
