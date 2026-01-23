import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { customersAPI, invoicesAPI } from "@/lib/api";
import { formatDate, formatCurrency, getInitials } from "@/lib/utils";

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersAPI.getById(id!),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ["invoices", { customerId: id, limit: 10 }],
    queryFn: () => invoicesAPI.getAll({ customerId: id, limit: 10 }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <button
          onClick={() => navigate("/customers")}
          className="btn btn-primary mt-4"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const recentInvoices = invoicesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/customers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
        </div>
        <Link
          to={`/invoices/create?customerId=${id}`}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Create Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card lg:col-span-1">
          <div className="flex flex-col items-center py-6">
            <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary-700">
                {getInitials(customer.name)}
              </span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {customer.name}
            </h2>
            <p className="text-gray-500">{customer.code}</p>
            <span
              className={`mt-2 badge ${
                customer.isActive ? "badge-success" : "badge-gray"
              }`}
            >
              {customer.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {customer.email || "Not provided"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {customer.phone || "Not provided"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {customer.address
                  ? `${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}`
                  : "Not provided"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                GST: {customer.gstNumber || "Not provided"}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Info */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Financial Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Outstanding Balance</p>
                <p className="text-xl font-bold text-primary-600">
                  {formatCurrency(customer.outstandingBalance || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Credit Limit</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(customer.creditLimit || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Terms</p>
                <p className="text-xl font-bold text-gray-900">
                  {customer.paymentTerms} days
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Invoices</p>
                <p className="text-xl font-bold text-gray-900">
                  {customer._count?.invoices || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Tax Details */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tax Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">GST Number</p>
                <p className="font-medium text-gray-900">
                  {customer.gstNumber || "Not provided"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">PAN Number</p>
                <p className="font-medium text-gray-900">
                  {customer.panNumber || "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Invoices
              </h3>
              <Link
                to={`/invoices?customerId=${id}`}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            {recentInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice: any) => (
                      <tr key={invoice.id}>
                        <td>
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </td>
                        <td>{formatDate(invoice.invoiceDate)}</td>
                        <td className="font-medium">
                          {formatCurrency(invoice.totalAmount)}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              invoice.status === "PAID"
                                ? "badge-success"
                                : invoice.status === "PENDING"
                                ? "badge-warning"
                                : invoice.status === "OVERDUE"
                                ? "badge-error"
                                : "badge-gray"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No invoices found</p>
                <Link
                  to={`/invoices/create?customerId=${id}`}
                  className="btn btn-primary mt-4"
                >
                  Create First Invoice
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
