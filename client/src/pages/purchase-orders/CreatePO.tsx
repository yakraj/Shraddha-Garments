import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useForm, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import { purchaseOrdersAPI, suppliersAPI, materialsAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface POItem {
  materialId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface FormData {
  supplierId: string;
  orderDate: string;
  expectedDate: string;
  items: POItem[];
  notes: string;
  shippingAddress: string;
  paymentTerms: string;
}

export default function CreatePO() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSupplierId = searchParams.get("supplierId") || "";

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: () => suppliersAPI.getAll({ limit: 100 }),
  });

  const { data: materials } = useQuery({
    queryKey: ["materials-list"],
    queryFn: () => materialsAPI.getAll({ limit: 100 }),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      supplierId: preselectedSupplierId,
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      items: [
        {
          materialId: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          amount: 0,
        },
      ],
      paymentTerms: "Net 30",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  // Calculate totals
  const subtotal = watchItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  const taxAmount = subtotal * 0.18; // 18% GST
  const totalAmount = subtotal + taxAmount;

  const createMutation = useMutation({
    mutationFn: (data: any) => purchaseOrdersAPI.create(data),
    onSuccess: (data) => {
      toast.success("Purchase Order created successfully");
      navigate(`/purchase-orders/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create PO");
    },
  });

  const onSubmit = (data: FormData) => {
    if (
      data.items.length === 0 ||
      data.items.every((item) => !item.description)
    ) {
      toast.error("Please add at least one item");
      return;
    }

    const poData = {
      ...data,
      subtotal,
      taxAmount,
      totalAmount,
      items: data.items.map((item) => ({
        ...item,
        amount: (item.quantity || 0) * (item.unitPrice || 0),
      })),
    };

    createMutation.mutate(poData);
  };

  const handleMaterialSelect = (index: number, materialId: string) => {
    const material = materials?.data?.find((m: any) => m.id === materialId);
    if (material) {
      setValue(`items.${index}.description`, material.name);
      setValue(`items.${index}.unitPrice`, Number(material.unitPrice));
    }
  };

  const addItem = () => {
    append({
      materialId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/purchase-orders")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Create Purchase Order
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Supplier & Date Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            PO Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Supplier *</label>
              <select
                {...register("supplierId", {
                  required: "Supplier is required",
                })}
                className={`input ${errors.supplierId ? "input-error" : ""}`}
              >
                <option value="">Select supplier</option>
                {suppliers?.data?.map((supplier: any) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Order Date *</label>
              <input
                type="date"
                {...register("orderDate", {
                  required: "Order date is required",
                })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Expected Delivery *</label>
              <input
                type="date"
                {...register("expectedDate", {
                  required: "Expected date is required",
                })}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* PO Items */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn btn-outline btn-sm gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">
                    Material
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">
                    Description
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500 w-24">
                    Qty
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500 w-32">
                    Unit Price
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500 w-32">
                    Amount
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const item = watchItems[index];
                  const itemAmount =
                    (item?.quantity || 0) * (item?.unitPrice || 0);

                  return (
                    <tr key={field.id} className="border-b border-gray-100">
                      <td className="py-2 pr-2">
                        <select
                          {...register(`items.${index}.materialId` as const)}
                          onChange={(e) =>
                            handleMaterialSelect(index, e.target.value)
                          }
                          className="input text-sm"
                        >
                          <option value="">Select material</option>
                          {materials?.data?.map((material: any) => (
                            <option key={material.id} value={material.id}>
                              {material.code} - {material.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          {...register(`items.${index}.description` as const, {
                            required: "Required",
                          })}
                          placeholder="Item description"
                          className="input text-sm"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          {...register(`items.${index}.quantity` as const, {
                            valueAsNumber: true,
                            min: 1,
                          })}
                          className="input text-sm"
                          min="1"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice` as const, {
                            valueAsNumber: true,
                            min: 0,
                          })}
                          className="input text-sm"
                          min="0"
                        />
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(itemAmount)}
                      </td>
                      <td className="py-2 pl-2">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary & Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Shipping Address</label>
                <textarea
                  {...register("shippingAddress")}
                  rows={2}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Payment Terms</label>
                <input
                  {...register("paymentTerms")}
                  className="input"
                  placeholder="e.g., Net 30"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea {...register("notes")} rows={2} className="input" />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (18% GST)</span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/purchase-orders")}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn btn-primary"
          >
            {createMutation.isPending ? "Creating..." : "Create Purchase Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
