import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { hsnAPI } from "@/lib/api";
import HSNModal from "./HSNModal";
import toast from "react-hot-toast";

export default function HSNList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHSN, setSelectedHSN] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: hsns, isLoading } = useQuery({
    queryKey: ["hsn"],
    queryFn: hsnAPI.getAll,
    select: (res: any) => res.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hsnAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hsn"] });
      toast.success("HSN code deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete HSN code");
    },
  });

  const handleEdit = (hsn: any) => {
    setSelectedHSN(hsn);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this HSN code?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdd = () => {
    setSelectedHSN(null);
    setIsModalOpen(true);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            HSN Codes
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage HSN codes and descriptions for invoices.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleAdd}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon
              className="-ml-0.5 mr-1.5 h-5 w-5 inline-block"
              aria-hidden="true"
            />
            Add HSN
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Code
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      GST Rate (%)
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                    >
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="py-10 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                      </td>
                    </tr>
                  ) : hsns?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-10 text-center text-gray-500"
                      >
                        No HSN codes found. Add your first HSN code.
                      </td>
                    </tr>
                  ) : (
                    hsns?.map((hsn: any) => (
                      <tr key={hsn.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {hsn.code}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {hsn.description || "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {hsn.taxRate}%
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleEdit(hsn)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(hsn.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <HSNModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        hsn={selectedHSN}
      />
    </div>
  );
}
