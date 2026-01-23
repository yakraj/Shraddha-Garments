import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { fabricsAPI } from "@/lib/api";
import AddFabricModal from "./AddFabricModal";
import FabricViewModal from "./FabricViewModal";
import toast from "react-hot-toast";

interface Fabric {
  id: string;
  code: string;
  imageUrl: string;
  remarks: string | null;
  createdAt: string;
}

export default function Fabrics() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFabric, setSelectedFabric] = useState<Fabric | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: fabrics, isLoading } = useQuery({
    queryKey: ["fabrics"],
    queryFn: fabricsAPI.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: fabricsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fabrics"] });
      toast.success("Fabric deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete fabric");
    },
  });

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this fabric?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredFabrics = fabrics?.filter(
    (fabric: Fabric) =>
      fabric.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fabric.remarks?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">
            Fabrics Gallery
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A visual collection of all fabric types.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-5 w-5 inline-block mr-1" />
            Add Fabric
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="Search fabrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
        {isLoading ? (
          <p>Loading fabrics...</p>
        ) : filteredFabrics?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No fabrics found. Start by adding one!
          </div>
        ) : (
          filteredFabrics?.map((fabric: Fabric) => (
            <div key={fabric.id} className="relative group">
              <div
                className="aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-gray-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 ring-1 ring-gray-900/10 shadow-sm transition hover:shadow-md"
                onClick={() => setSelectedFabric(fabric)}
              >
                <img
                  src={fabric.imageUrl}
                  alt={fabric.code}
                  className="pointer-events-none h-full w-full object-cover group-hover:opacity-75 transition"
                />
                <button
                  onClick={(e) => handleDelete(e, fabric.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  title="Delete Fabric"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">
                {fabric.code}
              </p>
              <p className="pointer-events-none block text-sm font-medium text-gray-500">
                {fabric.remarks}
              </p>
            </div>
          ))
        )}
      </div>

      <AddFabricModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <FabricViewModal
        isOpen={!!selectedFabric}
        onClose={() => setSelectedFabric(null)}
        imageUrl={selectedFabric?.imageUrl || null}
        code={selectedFabric?.code || ""}
      />
    </div>
  );
}
