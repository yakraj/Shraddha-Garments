import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  PrinterIcon,
  PencilSquareIcon,
  BanknotesIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { invoicesAPI } from "@/lib/api";
import { formatCurrency, formatDate, numberToWords } from "@/lib/utils";
import PaymentModal from "./PaymentModal";
import logo from "@/assets/logo.png";
import { useReactToPrint } from "react-to-print";

const statusColors: Record<string, string> = {
  DRAFT: "badge-gray",
  PENDING: "badge-warning",
  PAID: "badge-success",
  PARTIALLY_PAID: "badge-info",
  OVERDUE: "badge-error",
  CANCELLED: "badge-gray",
};

export default function InvoiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesAPI.getById(id!),
    select: (res: any) => res.data,
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: () => invoicesAPI.update(id!, { status: "CANCELLED" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      toast.success("Invoice cancelled");
    },
    onError: () => {
      toast.error("Failed to cancel invoice");
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice_${invoice?.invoiceNumber || "document"}`,
  });

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this invoice?")) {
      cancelMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium mb-2">Error loading invoice</p>
        <p className="text-gray-500 mb-4">
          {(error as any)?.response?.data?.message ||
            (error as Error)?.message ||
            "Invoice not found"}
        </p>
        <p className="text-xs text-gray-400 font-mono mb-4">ID: {id}</p>
        <button
          onClick={() => navigate("/invoices")}
          className="btn btn-primary"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  // Group items by HSN for tax breakdown
  const hsnGroups =
    invoice.items
      ?.reduce((acc: any[], item: any) => {
        const hsn = item.hsnCode || "Other";
        const itemTaxRate = Number(item.taxRate || 0);
        const existingGroup = acc.find(
          (g) => g.hsn === hsn && g.taxRate === itemTaxRate,
        );
        const amount = Number(item.amount);

        if (existingGroup) {
          existingGroup.taxableValue += amount;
        } else {
          acc.push({
            hsn,
            taxRate: itemTaxRate,
            taxableValue: amount,
          });
        }
        return acc;
      }, [])
      .map((group: any) => {
        const cRate = group.taxRate / 2;
        const sRate = group.taxRate / 2;
        const cAmount = (group.taxableValue * cRate) / 100;
        const sAmount = (group.taxableValue * sRate) / 100;
        return {
          ...group,
          cgstRate: cRate,
          sgstRate: sRate,
          cgstAmount: cAmount,
          sgstAmount: sAmount,
          totalTax: cAmount + sAmount,
        };
      }) || [];

  const cgstAmount = hsnGroups.reduce((sum, g) => sum + g.cgstAmount, 0);
  const sgstAmount = hsnGroups.reduce((sum, g) => sum + g.sgstAmount, 0);

  // Ideally use a library like 'number-to-words'
  const amountInWords = (amount: number) => {
    return `INR ${amount.toFixed(2)}`;
  };

  const balanceDue = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <div className="space-y-6 print:space-y-0 print:m-0 print:p-0">
      {/* Header Actions - Hidden on Print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            to="/invoices"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {invoice.invoiceNumber}
            </h1>
            <span className={`badge ${statusColors[invoice.status]}`}>
              {invoice.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <BanknotesIcon className="h-5 w-5" />
              Record Payment
            </button>
          )}
          <Link
            to={`/invoices/${id}/edit`}
            className="btn btn-outline inline-flex items-center gap-2"
          >
            <PencilSquareIcon className="h-5 w-5" />
            Edit
          </Link>
          <button
            onClick={handlePrint}
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <PrinterIcon className="h-5 w-5" />
            Download / Print
          </button>
          {invoice.status === "DRAFT" && (
            <button
              onClick={handleCancel}
              className="btn btn-outline text-red-600 hover:bg-red-50"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Invoice Document - Modeled after Tax Invoice Image */}
      <div
        ref={invoiceRef}
        data-invoice-container="true"
        className="bg-white text-black p-4 sm:p-6 md:p-8 max-w-[210mm] mx-auto print:max-w-none print:mx-0 print:p-[10mm] print:w-[210mm] print:h-[297mm] print:shadow-none print:border-none print:flex print:flex-col"
      >
        {/* Title */}
        <div className="text-center font-bold text-xl mb-2 uppercase border border-black border-b-0 p-1">
          Tax Invoice
        </div>

        <div className="border border-black flex flex-col sm:flex-row text-sm">
          {/* Left Column: Company & Buyer */}
          <div className="w-full sm:w-1/2 border-r border-black flex flex-col">
            {/* Company Info */}
            <div className="p-2 border-b border-black flex-grow flex justify-between items-start">
              <div>
                <h2 className="font-bold text-base">SHRADDHA GARMENT</h2>
                <p className="text-xs">Bhatwadi, Near Ghoti Bypass</p>
                <p className="text-xs">Sinnar, Nashik MH, 422103 </p>
                <p className="text-xs">GSTIN/UIN: 27CRYPP2986H1ZQ</p>
                <p className="text-xs">PAN No.: CRYPP2986H</p>
                <p className="text-xs">State: Maharashtra, Code: 27</p>
                <div className="mt-2 text-[10px] leading-tight border-t border-gray-200 pt-1">
                  <p className="font-bold border-b border-gray-100 mb-0.5 inline-block">
                    Bank Details:
                  </p>
                  <p>A/c Name: Shraddha Garments</p>
                  <p>A/c No.: 5607201000297</p>
                  <p>IFSC: CNRB0005607 (Canara Bank)</p>
                </div>
                {/* <p className="text-xs">E-Mail: support@shraddhagarments.com</p> */}
              </div>
              <img
                src={logo}
                className="h-24 w-auto object-contain"
                alt="Shraddha Garment"
              />
            </div>

            {/* Buyer Info */}
            <div className="p-2 flex-grow">
              <span className="text-[10px] text-gray-600 block leading-tight">
                Buyer (Bill to)
              </span>
              <h2 className="font-bold text-base">{invoice.customer?.name}</h2>
              <p className="text-xs whitespace-pre-line">
                {invoice.customer?.address}
              </p>
              <p className="text-xs">
                {invoice.customer?.city}, {invoice.customer?.state} -{" "}
                {invoice.customer?.pincode}
              </p>
              <p className="text-xs">
                GSTIN/UIN: {invoice.customer?.gstNumber || "N/A"}
              </p>
            </div>
          </div>

          {/* Right Column: Invoive & Transport Details */}
          <div className="w-full sm:w-1/2 flex flex-col text-xs">
            {/* Row 1 */}
            <div className="flex border-b border-black">
              <div className="w-1/2 p-1 border-r border-black">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Invoice No.
                </span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="w-1/2 p-1">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Invoice Date
                </span>
                <span className="font-bold">
                  {formatDate(invoice.issueDate || invoice.invoiceDate)}
                </span>
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex border-b border-black">
              <div className="w-1/2 p-1 border-r border-black">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Delivery Note
                </span>
                <span className="">{invoice.deliveryNote || "-"}</span>
              </div>
              <div className="w-1/2 p-1">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Mode/Terms of Payment
                </span>
                <span className="">{invoice.terms || "-"}</span>
              </div>
            </div>

            {/* Row 3 */}
            <div className="flex border-b border-black">
              <div className="w-1/2 p-1 border-r border-black">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Reference No. & Date.
                </span>
                <span className="">{invoice.otherReference || "-"}</span>
              </div>
              <div className="w-1/2 p-1">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Other References
                </span>
                <span className="">{invoice.otherReferences || "-"}</span>
              </div>
            </div>

            {/* Row 4 */}
            <div className="flex border-b border-black">
              <div className="w-1/2 p-1 border-r border-black">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Buyer's Order No.
                </span>
                <span className="">{invoice.buyersOrderNo || "-"}</span>
              </div>
              <div className="w-1/2 p-1">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Dated
                </span>
                <span className="">
                  {invoice.buyersOrderDate
                    ? formatDate(invoice.buyersOrderDate)
                    : "-"}
                </span>
              </div>
            </div>

            {/* Row 5 */}
            <div className="flex border-b border-black">
              <div className="w-1/2 p-1 border-r border-black">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Dispatch Doc No.
                </span>
                <span className="">{invoice.dispatchDocNo || "-"}</span>
              </div>
              <div className="w-1/2 p-1">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Delivery Note Date
                </span>
                <span className="">
                  {invoice.deliveryNoteDate
                    ? formatDate(invoice.deliveryNoteDate)
                    : "-"}
                </span>
              </div>
            </div>

            {/* Row 6 */}
            <div className="flex border-b border-black">
              <div className="w-1/2 p-1 border-r border-black">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Dispatched through
                </span>
                <span className="">{invoice.dispatchedThrough || "-"}</span>
              </div>
              <div className="w-1/2 p-1">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Destination
                </span>
                <span className="">{invoice.destination || "-"}</span>
              </div>
            </div>

            {/* Row 7 */}
            <div className="flex border-b border-black">
              <div className="w-full p-1">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Bill of Lading/LR-RR No.
                </span>
                <div className="flex justify-between">
                  <span>{invoice.billOfLading || "-"}</span>
                  <div className="text-right">
                    <span className="block text-[10px] text-gray-600 leading-tight">
                      Motor Vehicle No.
                    </span>
                    <span>{invoice.motorVehicleNo || "-"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 8 */}
            <div className="flex flex-grow">
              <div className="w-full p-1">
                <span className="block text-[10px] text-gray-600 leading-tight">
                  Terms of Delivery
                </span>
                <span className="leading-tight">
                  {invoice.termsOfDelivery || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Goods Table */}
        <div className="border border-black border-t-0 text-[11px] flex-grow flex flex-col">
          <div className="grid grid-cols-[30px_1fr_75px_40px_65px_75px_30px_90px] font-semibold text-center bg-gray-50 print:bg-white border-b border-black">
            <div className="p-1 border-r border-black">SI No.</div>
            <div className="p-1 border-r border-black font-bold">
              Description of Goods
            </div>
            <div className="p-1 border-r border-black">HSN</div>
            <div className="p-1 border-r border-black">GST</div>
            <div className="p-1 border-r border-black">Qty</div>
            <div className="p-1 border-r border-black flex items-center justify-center text-[10px]">
              Rate
            </div>
            <div className="p-1 border-r border-black flex items-center justify-center text-[10px]">
              per
            </div>
            <div className="p-1">Amount</div>
          </div>

          {/* Rows */}
          {invoice.items?.map((item: any, index: number) => (
            <div
              key={item.id}
              className="grid grid-cols-[30px_1fr_75px_40px_65px_75px_30px_90px] text-center min-h-[40px] items-start"
            >
              <div className="p-1 border-r border-black flex items-start justify-center h-full">
                {index + 1}
              </div>
              <div className="p-1 border-r border-black text-left font-bold leading-tight h-full">
                {item.description}
              </div>
              <div className="p-1 border-r border-black h-full">
                {item.hsnCode || "-"}
              </div>
              <div className="p-1 border-r border-black h-full">
                {item.taxRate}%
              </div>
              <div className="p-1 border-r border-black font-bold whitespace-nowrap h-full">
                {item.quantity} Nos
              </div>{" "}
              {/* Assuming Nos for now */}
              <div className="p-1 border-r border-black text-right pr-1 h-full font-mono">
                {formatCurrency(item.unitPrice).replace("₹", "")}
              </div>
              <div className="p-1 border-r border-black h-full">Nos</div>
              <div className="p-1 font-bold text-right pr-1 h-full font-mono">
                {formatCurrency(item.amount).replace("₹", "")}
              </div>
            </div>
          ))}

          {/* Spacer to fill height if needed - Reduced min-height to prevent pushing content over the page limit */}
          <div className="grid grid-cols-[30px_1fr_75px_40px_65px_75px_30px_90px] flex-grow min-h-[50px]">
            <div className="border-r border-black"></div>
            <div className="border-r border-black"></div>
            <div className="border-r border-black"></div>
            <div className="border-r border-black"></div>
            <div className="border-r border-black"></div>
            <div className="border-r border-black flex flex-col justify-end pb-2 pr-1 text-right leading-tight text-[10px]">
              {hsnGroups.map((group: any, i: number) => (
                <div key={i} className="font-bold">
                  CGST {group.cgstRate}%
                  <br />
                  SGST {group.sgstRate}%
                </div>
              ))}
              <div className="italic font-normal">Basic Amount</div>
              {Number(invoice.roundOff) !== 0 && (
                <div className="italic font-normal">Rounding</div>
              )}
              <div className="font-bold">Total Tax</div>
            </div>
            <div className="border-r border-black"></div>{" "}
            {/* Empty 'per' column */}
            <div className="text-right pr-1 flex flex-col justify-end pb-2 font-bold leading-tight text-[10px]">
              {hsnGroups.map((group: any, i: number) => (
                <div key={i}>
                  <span>
                    {formatCurrency(group.cgstAmount).replace("₹", "")}
                  </span>
                  <br />
                  <span>
                    {formatCurrency(group.sgstAmount).replace("₹", "")}
                  </span>
                </div>
              ))}
              <span>
                {formatCurrency(
                  Number(invoice.subtotal) - Number(invoice.discountAmount),
                ).replace("₹", "")}
              </span>
              {Number(invoice.roundOff) !== 0 && (
                <span>
                  {Number(invoice.roundOff) > 0 ? "+" : ""}
                  {formatCurrency(invoice.roundOff).replace("₹", "")}
                </span>
              )}
              <span>{formatCurrency(invoice.taxAmount).replace("₹", "")}</span>
            </div>
          </div>

          {/* Total */}
          <div className="grid grid-cols-[30px_1fr_75px_40px_65px_75px_30px_90px] border-t border-black font-bold h-10 items-center bg-gray-50 print:bg-white text-xs">
            <div className="col-span-2 text-right pr-2">Document Total</div>
            <div className="border-l border-r border-black h-full"></div>
            <div className="border-r border-black h-full"></div>
            <div className="border-r border-black h-full flex items-center justify-center whitespace-nowrap">
              {invoice.items?.reduce(
                (sum: number, item: any) => sum + Number(item.quantity),
                0,
              )}{" "}
              Nos
            </div>
            <div className="border-r border-black h-full"></div> {/* Rate */}
            <div className="border-r border-black h-full"></div> {/* Per */}
            <div className="text-right pr-1 h-full flex items-center justify-end whitespace-nowrap font-mono">
              ₹ {formatCurrency(invoice.totalAmount).replace("₹", "")}
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="border border-black border-t-0 p-1">
          <div className="flex items-center text-[10px]">
            <span className="text-gray-600 mr-2 whitespace-nowrap">
              Amount Chargeable (in words) :
            </span>
            <span className="font-bold uppercase italic truncate">
              {numberToWords(Number(invoice.totalAmount))}
            </span>
          </div>
        </div>

        {/* Tax Breakdown Table */}
        <div className="border border-black border-t-0 text-[10px]">
          <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr_100px] text-center border-b border-black font-semibold bg-gray-50 print:bg-white">
            <div className="p-1 border-r border-black row-span-2 flex items-center justify-center">
              HSN
            </div>
            <div className="p-1 border-r border-black row-span-2 flex items-center justify-center">
              Taxable Value
            </div>
            <div className="col-span-2 border-r border-black border-b">
              Central Tax
            </div>
            <div className="col-span-2 border-r border-black border-b">
              State Tax
            </div>
            <div className="p-1 row-span-2 flex items-center justify-center">
              Total Tax Amount
            </div>

            {/* Sub headers */}
            <div className="p-1 border-r border-black">Rate</div>
            <div className="p-1 border-r border-black">Amount</div>
            <div className="p-1 border-r border-black">Rate</div>
            <div className="p-1 border-r border-black">Amount</div>
          </div>

          {/* Tax Rows - Broken down by HSN */}
          {hsnGroups.map((group: any, index: number) => (
            <div
              key={index}
              className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr_100px] text-center"
            >
              <div className="p-1 border-r border-black">{group.hsn}</div>
              <div className="p-1 border-r border-black text-right pr-2">
                {formatCurrency(group.taxableValue).replace("₹", "")}
              </div>
              <div className="p-1 border-r border-black">{group.cgstRate}%</div>
              <div className="p-1 border-r border-black text-right pr-2">
                {formatCurrency(group.cgstAmount).replace("₹", "")}
              </div>
              <div className="p-1 border-r border-black">{group.sgstRate}%</div>
              <div className="p-1 border-r border-black text-right pr-2">
                {formatCurrency(group.sgstAmount).replace("₹", "")}
              </div>
              <div className="p-1 text-right pr-2 font-bold">
                {formatCurrency(group.totalTax).replace("₹", "")}
              </div>
            </div>
          ))}

          {/* Tax Total */}
          <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr_1fr_100px] text-center border-t border-black font-bold">
            <div className="p-1 border-r border-black text-right pr-2">
              Total
            </div>
            <div className="p-1 border-r border-black text-right pr-2">
              {formatCurrency(invoice.subtotal).replace("₹", "")}
            </div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black text-right pr-2">
              {formatCurrency(cgstAmount).replace("₹", "")}
            </div>
            <div className="p-1 border-r border-black"></div>
            <div className="p-1 border-r border-black text-right pr-2">
              {formatCurrency(sgstAmount).replace("₹", "")}
            </div>
            <div className="p-1 text-right pr-2">
              {formatCurrency(invoice.taxAmount).replace("₹", "")}
            </div>
          </div>
        </div>

        <div className="border border-black border-t-0 p-1">
          <div className="flex items-center text-[10px]">
            <span className="text-gray-600 mr-2 whitespace-nowrap">
              Tax Amount (in words) :{" "}
            </span>
            <span className="font-bold italic uppercase truncate">
              {numberToWords(Number(invoice.taxAmount))}
            </span>
          </div>
        </div>

        {/* Declaration & Signature */}
        <div className="border border-black border-t-0 flex">
          <div className="w-3/5 p-2 text-[9px] border-r border-black leading-tight">
            <p className="font-bold mb-1">Terms & Condition Declaration :</p>
            <p className="mb-1">
              We declare that this invoice shows the actual price of the goods
              described and that all particulars are true and correct.
            </p>
            <div className="space-y-0.5">
              <p>
                1) This bill should be paid as per payment terms, otherwise
                interest @ 18% per annum will be charged.
              </p>
              <p>
                2) Any discrepancy in the bill should be brought to our notice
                within 15 days.
              </p>
              <p>
                3) Our risk responsibility ceases once the goods leave our
                premises.
              </p>
              <p>4) Goods once sold will not be taken back.</p>
              <p>
                5) Any dispute regarding the claim is subject to Nasik
                Jurisdiction.
              </p>
            </div>
          </div>
          <div className="w-2/5 p-2 flex flex-col justify-between leading-tight">
            <div className="text-right text-[10px] font-bold uppercase">
              For SHRADDHA GARMENTS
            </div>
            <div className="h-12"></div>
            <div className="text-right text-[10px]">Authorised Signatory</div>
          </div>
        </div>

        {/* <div className="text-center text-xs mt-1">
          This is a Computer Generated Invoice
        </div> */}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="print:hidden">
          <PaymentModal
            invoiceId={invoice.id}
            balanceDue={balanceDue}
            onClose={() => setShowPaymentModal(false)}
          />
        </div>
      )}
    </div>
  );
}
