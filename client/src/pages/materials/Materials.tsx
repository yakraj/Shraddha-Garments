import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { materialsAPI } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import MaterialModal from "./MaterialModal";
import TransactionModal from "./TransactionModal";
import type { Material } from "@/types";

export default function Materials() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [transactionType, setTransactionType] = useState<"IN" | "OUT">("IN");

  const { data, isLoading } = useQuery({
    queryKey: ["materials", { search, category: categoryFilter }],
    queryFn: () =>
      materialsAPI.getAll({ search, category: categoryFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => materialsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Material deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete material");
    },
  });

  const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleTransaction = (material: Material, type: "IN" | "OUT") => {
    setSelectedMaterial(material);
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMaterial(null);
  };

  const materials = data?.data || [];

  // Get unique categories
  const categories = Array.from(
    new Set(materials.map((m: Material) => m.category))
  );

  // Stats
  const totalValue = materials.reduce(
    (sum: number, m: Material) =>
      sum + Number(m.quantity) * Number(m.unitPrice),
    0
  );
  const lowStockCount = materials.filter(
    (m: Material) => m.quantity <= m.minQuantity
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Materials</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Material
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Materials</p>
              <p className="text-2xl font-bold text-gray-900">
                {materials.length}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <ArchiveBoxIcon className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {categories.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ArchiveBoxIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">All Categories</option>
            {categories.map((cat: string) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : materials.length === 0 ? (
        <div className="card text-center py-12">
          <ArchiveBoxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No materials found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material: Material) => {
                  const isLowStock = material.quantity <= material.minQuantity;
                  const totalValue =
                    Number(material.quantity) * Number(material.unitPrice);

                  return (
                    <tr key={material.id}>
                      <td className="font-mono text-sm">{material.code}</td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900">
                            {material.name}
                          </p>
                          {material.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {material.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gray">
                          {material.category}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            isLowStock ? "text-red-600 font-semibold" : ""
                          }
                        >
                          {material.quantity} {material.unit}
                        </span>
                        {isLowStock && (
                          <p className="text-xs text-red-500">
                            Min: {material.minQuantity}
                          </p>
                        )}
                      </td>
                      <td>{formatCurrency(material.unitPrice)}</td>
                      <td className="font-medium">
                        {formatCurrency(totalValue)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isLowStock ? "badge-error" : "badge-success"
                          }`}
                        >
                          {isLowStock ? "Low Stock" : "In Stock"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTransaction(material, "IN")}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Stock In"
                          >
                            <ArrowTrendingUpIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleTransaction(material, "OUT")}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Stock Out"
                          >
                            <ArrowTrendingDownIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(material)}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(material.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <MaterialModal material={selectedMaterial} onClose={handleCloseModal} />
      )}
      {showTransactionModal && selectedMaterial && (
        <TransactionModal
          material={selectedMaterial}
          type={transactionType}
          onClose={() => {
            setShowTransactionModal(false);
            setSelectedMaterial(null);
          }}
        />
      )}
    </div>
  );
}
