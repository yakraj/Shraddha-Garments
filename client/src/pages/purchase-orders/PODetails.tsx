import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  PrinterIcon,
  CheckCircleIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { purchaseOrdersAPI } from "@/lib/api";
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

export default function PODetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: po, isLoading } = useQuery({
    queryKey: ["purchaseOrder", id],
    queryFn: () => purchaseOrdersAPI.getById(id!),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => purchaseOrdersAPI.update(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrder", id] });
      toast.success("Status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const handleApprove = () => {
    updateStatusMutation.mutate("APPROVED");
  };

  const handleMarkOrdered = () => {
    updateStatusMutation.mutate("ORDERED");
  };

  const handleMarkReceived = () => {
    updateStatusMutation.mutate("RECEIVED");
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Purchase Order not found</p>
        <button
          onClick={() => navigate("/purchase-orders")}
          className="btn btn-primary mt-4"
        >
          Back to Purchase Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/purchase-orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
            <span className={`badge ${statusColors[po.status]}`}>
              {po.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          {po.status === "PENDING" && (
            <button
              onClick={handleApprove}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Approve
            </button>
          )}
          {po.status === "APPROVED" && (
            <button
              onClick={handleMarkOrdered}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <TruckIcon className="h-5 w-5" />
              Mark Ordered
            </button>
          )}
          {po.status === "ORDERED" && (
            <button
              onClick={handleMarkReceived}
              className="btn btn-success inline-flex items-center gap-2"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Mark Received
            </button>
          )}
          <button
            onClick={handlePrint}
            className="btn btn-outline inline-flex items-center gap-2"
          >
            <PrinterIcon className="h-5 w-5" />
            Print
          </button>
        </div>
      </div>

      {/* PO Content */}
      <div className="card print:shadow-none print:border">
        {/* Company & Supplier Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-primary-600 mb-2">
              Shraddha Garments
            </h2>
            <p className="text-sm text-gray-600">
              123 Industrial Area, Sector 5<br />
              Surat, Gujarat - 395001
              <br />
              Phone: +91 98765 43210
              <br />
              GST: 24AAAAA0000A1Z5
            </p>
          </div>
          <div className="md:text-right">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Supplier</h3>
            <p className="font-semibold text-gray-900">{po.supplier?.name}</p>
            <p className="text-sm text-gray-600">
              {po.supplier?.address}
              <br />
              {po.supplier?.city}, {po.supplier?.state} - {po.supplier?.pincode}
              <br />
              GST: {po.supplier?.gstNumber || "N/A"}
            </p>
          </div>
        </div>

        {/* PO Meta */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-500">PO Number</p>
            <p className="font-semibold">{po.poNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-semibold">{formatDate(po.orderDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Expected Delivery</p>
            <p className="font-semibold">{formatDate(po.expectedDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`badge ${statusColors[po.status]}`}>
              {po.status}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="py-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-500">
                  #
                </th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">
                  Description
                </th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">
                  Qty
                </th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">
                  Unit Price
                </th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {po.items?.map((item: any, index: number) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3 text-sm">{index + 1}</td>
                  <td className="py-3">
                    <p className="font-medium">{item.description}</p>
                    {item.material && (
                      <p className="text-sm text-gray-500">
                        {item.material.code}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {item.quantity}
                    {item.receivedQuantity !== undefined &&
                      item.receivedQuantity > 0 && (
                        <span className="text-sm text-green-600 ml-1">
                          ({item.receivedQuantity} received)
                        </span>
                      )}
                  </td>
                  <td className="py-3 text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end border-t border-gray-200 pt-6">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(po.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax (GST)</span>
              <span>{formatCurrency(po.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
              <span>Total</span>
              <span>{formatCurrency(po.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes & Payment Terms */}
        {(po.notes || po.paymentTerms || po.shippingAddress) && (
          <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
            {po.shippingAddress && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Shipping Address
                </h4>
                <p className="text-sm text-gray-700">{po.shippingAddress}</p>
              </div>
            )}
            {po.paymentTerms && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Payment Terms
                </h4>
                <p className="text-sm text-gray-700">{po.paymentTerms}</p>
              </div>
            )}
            {po.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Notes
                </h4>
                <p className="text-sm text-gray-700">{po.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
