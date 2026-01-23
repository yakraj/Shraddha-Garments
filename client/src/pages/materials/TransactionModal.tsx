import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { materialsAPI } from "@/lib/api";
import type { Material } from "@/types";

interface TransactionModalProps {
  material: Material;
  type: "IN" | "OUT";
  onClose: () => void;
}

export default function TransactionModal({
  material,
  type,
  onClose,
}: TransactionModalProps) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");

  const transactionMutation = useMutation({
    mutationFn: () =>
      materialsAPI.transaction(material.id, {
        type,
        quantity: Number(quantity),
        notes,
        reference,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success(
        `Stock ${type === "IN" ? "added" : "removed"} successfully`
      );
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Transaction failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (type === "OUT" && Number(quantity) > material.quantity) {
      toast.error("Insufficient stock");
      return;
    }
    transactionMutation.mutate();
  };

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {type === "IN" ? "Stock In" : "Stock Out"} - {material.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Current Stock</span>
                      <span className="font-semibold text-gray-900">
                        {material.quantity} {material.unit}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      Quantity to {type === "IN" ? "Add" : "Remove"} *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="input pr-16"
                        min="1"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {material.unit}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      Reference (PO/Invoice Number)
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="input"
                      placeholder="e.g., PO-2024-001"
                    />
                  </div>

                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="input"
                      placeholder="Additional notes..."
                    />
                  </div>

                  {quantity && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          New Stock After Transaction
                        </span>
                        <span
                          className={`font-semibold ${
                            type === "IN" ? "text-green-600" : "text-orange-600"
                          }`}
                        >
                          {type === "IN"
                            ? material.quantity + Number(quantity)
                            : material.quantity - Number(quantity)}{" "}
                          {material.unit}
                        </span>
                      </div>
                    </div>
                  )}

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
                      disabled={transactionMutation.isPending}
                      className={`btn ${
                        type === "IN"
                          ? "btn-primary"
                          : "bg-orange-600 hover:bg-orange-700 text-white"
                      }`}
                    >
                      {transactionMutation.isPending
                        ? "Processing..."
                        : type === "IN"
                        ? "Add Stock"
                        : "Remove Stock"}
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
