import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ScissorsIcon,
  EyeIcon,
  TrashIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { measurementsAPI, customersAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const categoryColors: Record<string, string> = {
  SHIRT: "badge-info",
  PANT: "badge-primary",
  SUIT: "badge-success",
  BLOUSE: "badge-warning",
  SAREE_BLOUSE: "badge-error",
  KURTA: "badge-gray",
  DRESS: "badge-info",
  OTHER: "badge-gray",
};

export default function Measurements() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: [
      "measurements",
      {
        search,
        category: categoryFilter,
        customerId: customerFilter,
        page,
        limit,
      },
    ],
    queryFn: () =>
      measurementsAPI.getAll({
        search,
        category: categoryFilter || undefined,
        customerId: customerFilter || undefined,
        page,
        limit,
      }),
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-list"],
    queryFn: () => customersAPI.getAll({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => measurementsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["measurements"] });
      toast.success("Measurement deleted");
    },
    onError: () => {
      toast.error("Failed to delete measurement");
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this measurement?")) {
      deleteMutation.mutate(id);
    }
  };

  const measurements = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Measurements</h1>
          <p className="text-gray-500">
            Digital measurement records for customers
          </p>
        </div>
        <Link
          to="/measurements/new"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Measurement
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Measurements</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Shirts</p>
          <p className="text-2xl font-bold text-blue-600">
            {measurements.filter((m: any) => m.category === "SHIRT").length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pants</p>
          <p className="text-2xl font-bold text-primary-600">
            {measurements.filter((m: any) => m.category === "PANT").length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Suits</p>
          <p className="text-2xl font-bold text-green-600">
            {measurements.filter((m: any) => m.category === "SUIT").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search measurements..."
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
            <option value="SHIRT">Shirt</option>
            <option value="PANT">Pant</option>
            <option value="SUIT">Suit</option>
            <option value="BLOUSE">Blouse</option>
            <option value="SAREE_BLOUSE">Saree Blouse</option>
            <option value="KURTA">Kurta</option>
            <option value="DRESS">Dress</option>
            <option value="OTHER">Other</option>
          </select>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">All Customers</option>
            {customers?.data?.map((customer: any) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Measurements Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : measurements.length === 0 ? (
        <div className="card text-center py-12">
          <ScissorsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No measurements found</p>
          <Link to="/measurements/new" className="btn btn-primary mt-4">
            Create First Measurement
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {measurements.map((measurement: any) => (
              <div
                key={measurement.id}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {measurement.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {measurement.customer?.name}
                    </p>
                  </div>
                  <span
                    className={`badge ${categoryColors[measurement.category]}`}
                  >
                    {measurement.category}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  {measurement.measurements?.chest && (
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-gray-500 text-xs">Chest</p>
                      <p className="font-medium">
                        {measurement.measurements.chest}"
                      </p>
                    </div>
                  )}
                  {measurement.measurements?.waist && (
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-gray-500 text-xs">Waist</p>
                      <p className="font-medium">
                        {measurement.measurements.waist}"
                      </p>
                    </div>
                  )}
                  {measurement.measurements?.length && (
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-gray-500 text-xs">Length</p>
                      <p className="font-medium">
                        {measurement.measurements.length}"
                      </p>
                    </div>
                  )}
                  {measurement.measurements?.shoulder && (
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-gray-500 text-xs">Shoulder</p>
                      <p className="font-medium">
                        {measurement.measurements.shoulder}"
                      </p>
                    </div>
                  )}
                  {measurement.measurements?.sleeve && (
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-gray-500 text-xs">Sleeve</p>
                      <p className="font-medium">
                        {measurement.measurements.sleeve}"
                      </p>
                    </div>
                  )}
                  {measurement.measurements?.hip && (
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-gray-500 text-xs">Hip</p>
                      <p className="font-medium">
                        {measurement.measurements.hip}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>{formatDate(measurement.createdAt)}</span>
                  <div className="flex gap-2">
                    <Link
                      to={`/measurements/${measurement.id}`}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(measurement.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-outline btn-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-outline btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
