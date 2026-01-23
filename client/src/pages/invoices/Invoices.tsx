import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  EyeIcon,
  PrinterIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { invoicesAPI, customersAPI } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusColors: Record<string, string> = {
  DRAFT: "badge-gray",
  PENDING: "badge-warning",
  PAID: "badge-success",
  PARTIALLY_PAID: "badge-info",
  OVERDUE: "badge-error",
  CANCELLED: "badge-gray",
};

export default function Invoices() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState(
    searchParams.get("customerId") || "",
  );
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: [
      "invoices",
      { search, status: statusFilter, customerId: customerFilter, page, limit },
    ],
    queryFn: () =>
      invoicesAPI.getAll({
        search,
        status: statusFilter || undefined,
        customerId: customerFilter || undefined,
        page,
        limit,
      }),
  });

  const { data: customers } = useQuery({
    queryKey: ["customers-list"],
    queryFn: () => customersAPI.getAll({ limit: 100 }),
  });

  const invoices = data?.data || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.pages || Math.ceil(total / limit);

  // Calculate stats
  const stats = data?.stats || {
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <div className="flex gap-2">
          <Link
            to="/invoices/hsn"
            className="btn btn-secondary inline-flex items-center gap-2 text-sm"
          >
            Manage HSNs
          </Link>
          <Link
            to="/invoices/new"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Invoiced</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.totalAmount)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.paidAmount)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(stats.pendingAmount)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.overdueAmount)}
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
              placeholder="Search by invoice number..."
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
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
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

      {/* Invoices Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="card text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No invoices found</p>
          <Link to="/invoices/new" className="btn btn-primary mt-4">
            Create First Invoice
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice: any) => (
                  <tr key={invoice.id}>
                    <td>
                      <Link
                        to={`/invoices/${invoice.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">
                          {invoice.customer?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.customer?.code}
                        </p>
                      </div>
                    </td>
                    <td>{formatDate(invoice.invoiceDate)}</td>
                    <td>{formatDate(invoice.dueDate)}</td>
                    <td className="font-medium">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="text-green-600">
                      {formatCurrency(invoice.paidAmount)}
                    </td>
                    <td className="font-medium text-orange-600">
                      {formatCurrency(invoice.totalAmount - invoice.paidAmount)}
                    </td>
                    <td>
                      <span className={`badge ${statusColors[invoice.status]}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/invoices/${invoice.id}`}
                          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() =>
                            window.open(
                              `/invoices/${invoice.id}/print`,
                              "_blank",
                            )
                          }
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
                {Math.min(page * limit, total)} of {total} invoices
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
