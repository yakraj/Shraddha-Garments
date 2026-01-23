import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EyeIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";
import { purchaseOrdersAPI, suppliersAPI } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  DRAFT: "badge-gray",
  PENDING: "badge-warning",
  APPROVED: "badge-info",
  ORDERED: "badge-primary",
  PARTIAL: "badge-warning",
  RECEIVED: "badge-success",
  CANCELLED: "badge-gray",
};

export default function PurchaseOrders() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState(
    searchParams.get("supplierId") || ""
  );
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: [
      "purchaseOrders",
      { search, status: statusFilter, supplierId: supplierFilter, page, limit },
    ],
    queryFn: () =>
      purchaseOrdersAPI.getAll({
        search,
        status: statusFilter || undefined,
        supplierId: supplierFilter || undefined,
        page,
        limit,
      }),
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: () => suppliersAPI.getAll({ limit: 100 }),
  });

  const purchaseOrders = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <Link
          to="/purchase-orders/new"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create PO
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="ORDERED">Ordered</option>
            <option value="PARTIAL">Partial</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="input max-w-xs"
          >
            <option value="">All Suppliers</option>
            {suppliers?.data?.map((supplier: any) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : purchaseOrders.length === 0 ? (
        <div className="card text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No purchase orders found</p>
          <Link to="/purchase-orders/new" className="btn btn-primary mt-4">
            Create First PO
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Expected Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po: any) => (
                  <tr key={po.id}>
                    <td>
                      <Link
                        to={`/purchase-orders/${po.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {po.poNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">
                          {po.supplier?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {po.supplier?.code}
                        </p>
                      </div>
                    </td>
                    <td>{formatDate(po.orderDate)}</td>
                    <td>{formatDate(po.expectedDate)}</td>
                    <td>{po.items?.length || 0} items</td>
                    <td className="font-medium">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[po.status]}`}>
                        {po.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/purchase-orders/${po.id}`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => window.print()}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <PrinterIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} purchase orders
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
        </div>
      )}
    </div>
  );
}
