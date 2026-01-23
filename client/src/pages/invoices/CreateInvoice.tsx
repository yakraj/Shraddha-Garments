import { useState, useEffect, Fragment } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Combobox, Transition } from "@headlessui/react";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useForm, useFieldArray } from "react-hook-form";
import toast from "react-hot-toast";
import { invoicesAPI, customersAPI, hsnAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  amount: number;
  hsnCode?: string;
}

interface FormData {
  customerId: string;
  // Customer Details (for display or new creation)
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerPincode?: string;
  customerGst?: string;
  customerPan?: string;

  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
  notes: string;
  terms: string;
  shippingAddress: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  taxRate: number;
  // Transport fields
  deliveryNote?: string;
  deliveryNoteDate?: string;
  otherReference?: string;
  otherReferences?: string;
  buyersOrderNo?: string;
  buyersOrderDate?: string;
  dispatchDocNo?: string;
  dispatchedThrough?: string;
  destination?: string;
  billOfLading?: string;
  motorVehicleNo?: string;
  termsOfDelivery?: string;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId") || "";
  const [query, setQuery] = useState("");

  const isEdit = Boolean(id);

  const { data: customers } = useQuery({
    queryKey: ["customers-list"],
    queryFn: () => customersAPI.getAll({ limit: 1000 }), // Increased limit
  });

  const filteredCustomers =
    query === ""
      ? customers?.data || []
      : customers?.data?.filter((customer: any) =>
          customer.name
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, "")),
        ) || [];

  const { data: invoice } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoicesAPI.getById(id!),
    enabled: isEdit,
    select: (res: any) => res.data,
  });

  const { data: hsns } = useQuery({
    queryKey: ["hsn"],
    queryFn: hsnAPI.getAll,
    select: (res: any) => res.data,
  });

  const { register, control, handleSubmit, watch, setValue, reset } =
    useForm<FormData>({
      defaultValues: {
        customerId: preselectedCustomerId,
        customerName: "",
        invoiceDate: new Date(
          Date.now() - new Date().getTimezoneOffset() * 60000,
        )
          .toISOString()
          .split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        items: [
          {
            description: "",
            quantity: 1,
            unitPrice: 0,
            discount: 0,
            taxRate: 18,
            amount: 0,
            hsnCode: "",
          },
        ],
        discountType: "percentage",
        discountValue: 0,
        taxRate: 18,
        deliveryNote: "",
        deliveryNoteDate: "",
        otherReference: "",
        otherReferences: "",
        buyersOrderNo: "",
        buyersOrderDate: "",
        dispatchDocNo: "",
        dispatchedThrough: "",
        destination: "",
        billOfLading: "",
        motorVehicleNo: "",
        termsOfDelivery: "",
      },
    });

  useEffect(() => {
    if (invoice) {
      // Pre-populate form with invoice data
      console.log("Invoice data loaded:", invoice);
      reset({
        customerId: invoice.customerId,
        customerName: invoice.customer?.name || "",
        customerEmail: invoice.customer?.email || "",
        customerPhone: invoice.customer?.phone || "",
        customerAddress: invoice.customer?.address || "",
        customerCity: invoice.customer?.city || "",
        customerState: invoice.customer?.state || "",
        customerPincode: invoice.customer?.pincode || "",
        customerGst: invoice.customer?.gstNumber || "",
        customerPan: invoice.customer?.panNumber || "",

        invoiceDate: (invoice.invoiceDate || "").split("T")[0],
        dueDate: (invoice.dueDate || "").split("T")[0],
        notes: invoice.notes || "",
        terms: invoice.terms || "",
        shippingAddress: invoice.shippingAddress || "",
        discountType: invoice.discountType || "percentage",
        discountValue: invoice.discountValue || 0,
        taxRate: invoice.taxRate || 18,
        deliveryNote: invoice.deliveryNote || "",
        deliveryNoteDate: invoice.deliveryNoteDate
          ? invoice.deliveryNoteDate.split("T")[0]
          : "",
        otherReference: invoice.otherReference || "",
        otherReferences: invoice.otherReferences || "",
        buyersOrderNo: invoice.buyersOrderNo || "",
        buyersOrderDate: invoice.buyersOrderDate
          ? invoice.buyersOrderDate.split("T")[0]
          : "",
        dispatchDocNo: invoice.dispatchDocNo || "",
        dispatchedThrough: invoice.dispatchedThrough || "",
        destination: invoice.destination || "",
        billOfLading: invoice.billOfLading || "",
        motorVehicleNo: invoice.motorVehicleNo || "",
        termsOfDelivery: invoice.termsOfDelivery || "",
        items: (invoice.items || []).map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount || 0),
          taxRate: Number(item.taxRate || 18),
        })),
      });
    }
  }, [invoice, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const watchDiscountType = watch("discountType");
  const watchDiscountValue = watch("discountValue");

  // Calculate totals
  const subtotal = watchItems.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
    const itemDiscount = itemTotal * ((item.discount || 0) / 100);
    return sum + (itemTotal - itemDiscount);
  }, 0);

  const discountAmount =
    watchDiscountType === "percentage"
      ? subtotal * ((watchDiscountValue || 0) / 100)
      : watchDiscountValue || 0;

  const taxableAmount = subtotal - discountAmount;

  const taxAmount = watchItems.reduce((sum, item) => {
    const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
    const itemDiscount = itemTotal * ((item.discount || 0) / 100);
    const itemTaxable = itemTotal - itemDiscount;
    return sum + itemTaxable * ((item.taxRate || 0) / 100);
  }, 0);

  const totalAmount = taxableAmount + taxAmount;

  const createMutation = useMutation({
    mutationFn: (data: any) => invoicesAPI.create(data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
      const invoiceId = response?.data?.id;
      if (invoiceId) {
        navigate(`/invoices/${invoiceId}`);
      } else {
        console.error("Invoice created but no ID returned", response);
        toast.error("Invoice created but failed to redirect");
        navigate("/invoices");
      }
    },
    onError: (error: any) => {
      console.error("Create invoice error:", error);
      toast.error(error.response?.data?.message || "Failed to create invoice");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => invoicesAPI.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated successfully");
      navigate(`/invoices/${id}`);
    },
    onError: (error: any) => {
      console.error("Update invoice error:", error);
      toast.error(error.response?.data?.message || "Failed to update invoice");
    },
  });

  const handleCustomerSelect = (customer: any) => {
    setValue("customerId", customer.id);
    setValue("customerName", customer.name);
    setValue("customerEmail", customer.email || "");
    setValue("customerPhone", customer.phone || "");
    setValue("customerAddress", customer.address || "");
    setValue("customerCity", customer.city || "");
    setValue("customerState", customer.state || "");
    setValue("customerPincode", customer.pincode || "");
    setValue("customerGst", customer.gstNumber || "");
    setValue("customerPan", customer.panNumber || "");

    // Auto-fill other fields
    if (customer.address) {
      setValue(
        "shippingAddress",
        `${customer.address}, ${customer.city || ""}, ${customer.state || ""} - ${customer.pincode || ""}`,
      );
    }
    if (customer.paymentTerms) {
      setValue("terms", `Payment Terms: ${customer.paymentTerms} Days`);
    } else {
      setValue("terms", "Payment Terms: 30 Days");
    }
  };

  const onSubmit = async (data: FormData) => {
    if (
      data.items.length === 0 ||
      data.items.every((item) => !item.description)
    ) {
      toast.error("Please add at least one item");
      return;
    }

    let finalCustomerId = data.customerId;

    // Create new customer if needed
    if (!finalCustomerId) {
      if (!data.customerName) {
        toast.error("Customer Name is required");
        return;
      }
      try {
        // Generate a random code if not provided by user (we don't have a field for it yet)
        const randomCode = `CUST${Math.floor(1000 + Math.random() * 9000)}`;
        const newCustomerData = {
          name: data.customerName,
          code: randomCode,
          email: data.customerEmail,
          phone: data.customerPhone,
          address: data.customerAddress,
          city: data.customerCity,
          state: data.customerState,
          pincode: data.customerPincode,
          gstNumber: data.customerGst,
          panNumber: data.customerPan,
        };

        const res = await customersAPI.create(newCustomerData);
        if (res.data && res.data.id) {
          finalCustomerId = res.data.id;
          queryClient.invalidateQueries({ queryKey: ["customers-list"] });
          toast.success("New customer created!");
        } else {
          toast.error("Failed to create customer record");
          return;
        }
      } catch (err: any) {
        console.error(err);
        toast.error(
          err.response?.data?.message || "Failed to create new customer",
        );
        return;
      }
    }

    const invoiceData = {
      ...data,
      customerId: finalCustomerId,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      items: data.items.map((item) => ({
        ...item,
        amount:
          (item.quantity || 0) *
          (item.unitPrice || 0) *
          (1 - (item.discount || 0) / 100),
      })),
    };

    if (isEdit) {
      updateMutation.mutate(invoiceData);
    } else {
      createMutation.mutate(invoiceData);
    }
  };

  const addItem = () => {
    append({
      description: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 18,
      amount: 0,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/invoices")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? "Edit Invoice" : "Create Invoice"}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Customer & Date Info */}
        <div className="card">
          <h2 className="text-md font-semibold text-gray-900 mb-2 pb-2 border-b">
            Customer & Invoice Details
          </h2>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Invoice Date */}
              <div>
                <label className="label text-xs">Invoice Date *</label>
                <input
                  type="date"
                  {...register("invoiceDate", {
                    required: "Invoice date is required",
                  })}
                  className="input h-8 text-sm py-0"
                />
              </div>
              {/* Due Date */}
              <div>
                <label className="label text-xs">Due Date *</label>
                <input
                  type="date"
                  {...register("dueDate", { required: "Due date is required" })}
                  className="input h-8 text-sm py-0"
                />
              </div>
            </div>

            <div className="border-t pt-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Customer Autocomplete */}
                <div className="md:col-span-1 relative z-20">
                  <label className="label text-xs">Customer Name *</label>
                  <Combobox
                    value={watch("customerName")}
                    onChange={(val: any) => {
                      if (val && typeof val !== "string") {
                        handleCustomerSelect(val);
                      }
                    }}
                  >
                    <div className="relative mt-1">
                      <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 sm:text-sm">
                        <Combobox.Input
                          className="w-full border-none py-1.5 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
                          displayValue={(person: any) => {
                            return typeof person === "string"
                              ? person
                              : person?.name || watch("customerName");
                          }}
                          onChange={(event) => {
                            setQuery(event.target.value);
                            setValue("customerName", event.target.value);
                            // Only clear ID if the user changes the name manually to something not selected
                            // But logic typically is: typing = clearing ID until selected.
                            if (watch("customerId")) setValue("customerId", "");
                          }}
                          placeholder="Search or enter new..."
                        />
                        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                        </Combobox.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setQuery("")}
                      >
                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                          {filteredCustomers.length === 0 && query !== "" ? (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                              New Customer "{query}"
                            </div>
                          ) : (
                            filteredCustomers.map((person: any) => (
                              <Combobox.Option
                                key={person.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active
                                      ? "bg-primary-600 text-white"
                                      : "text-gray-900"
                                  }`
                                }
                                value={person}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span
                                      className={`block truncate ${
                                        selected ? "font-medium" : "font-normal"
                                      }`}
                                    >
                                      {person.name} ({person.code})
                                    </span>
                                    {selected ? (
                                      <span
                                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                          active
                                            ? "text-white"
                                            : "text-primary-600"
                                        }`}
                                      >
                                        <CheckIcon
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Combobox.Option>
                            ))
                          )}
                        </Combobox.Options>
                      </Transition>
                    </div>
                  </Combobox>
                </div>

                {/* Email */}
                <div>
                  <label className="label text-xs">Email</label>
                  <input
                    {...register("customerEmail")}
                    className="input h-8 text-sm py-0"
                    placeholder="Email"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="label text-xs">Phone</label>
                  <input
                    {...register("customerPhone")}
                    className="input h-8 text-sm py-0"
                    placeholder="Phone"
                  />
                </div>

                {/* Address */}
                <div className="md:col-span-3">
                  <label className="label text-xs">Address</label>
                  <input
                    {...register("customerAddress")}
                    className="input h-8 text-sm py-0"
                    placeholder="Address"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="label text-xs">City</label>
                  <input
                    {...register("customerCity")}
                    className="input h-8 text-sm py-0"
                    placeholder="City"
                  />
                </div>

                {/* State */}
                <div>
                  <label className="label text-xs">State</label>
                  <input
                    {...register("customerState")}
                    className="input h-8 text-sm py-0"
                    placeholder="State"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="label text-xs">Pincode</label>
                  <input
                    {...register("customerPincode")}
                    className="input h-8 text-sm py-0"
                    placeholder="Pincode"
                  />
                </div>

                {/* GST */}
                <div>
                  <label className="label text-xs">GST Number</label>
                  <input
                    {...register("customerGst")}
                    className="input h-8 text-sm py-0"
                    placeholder="GST Example: 27ABCDE1234F1Z5"
                  />
                </div>

                {/* PAN */}
                <div>
                  <label className="label text-xs">PAN Number</label>
                  <input
                    {...register("customerPan")}
                    className="input h-8 text-sm py-0"
                    placeholder="PAN Number"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transport & Delivery Info */}
        <div className="card">
          <h2 className="text-md font-semibold text-gray-900 mb-2 pb-2 border-b">
            Transport & Delivery Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <label className="label text-xs">Delivery Note</label>
              <input
                type="text"
                {...register("deliveryNote")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div>
              <label className="label text-xs">Mode/Terms of Payment</label>
              <input
                type="text"
                {...register("terms")}
                className="input h-8 text-sm py-0"
                placeholder="e.g. 30 Days Credit"
              />
            </div>
            <div>
              <label className="label text-xs">Reference No. & Date</label>
              <input
                type="text"
                {...register("otherReference")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div>
              <label className="label text-xs">Other References</label>
              <input
                type="text"
                {...register("otherReferences")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div>
              <label className="label text-xs">Buyer's Order No.</label>
              <input
                type="text"
                {...register("buyersOrderNo")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div>
              <label className="label text-xs">Buyer's Order Date</label>
              <input
                type="date"
                {...register("buyersOrderDate")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div>
              <label className="label text-xs">Dispatch Doc No.</label>
              <input
                type="text"
                {...register("dispatchDocNo")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div>
              <label className="label text-xs">Delivery Note Date</label>
              <input
                type="date"
                {...register("deliveryNoteDate")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div>
              <label className="label text-xs">Dispatched through</label>
              <input
                type="text"
                {...register("dispatchedThrough")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div>
              <label className="label text-xs">Destination</label>
              <input
                type="text"
                {...register("destination")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div>
              <label className="label text-xs">Bill of Lading/LR-RR No.</label>
              <input
                type="text"
                {...register("billOfLading")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div>
              <label className="label text-xs">Motor Vehicle No.</label>
              <input
                type="text"
                {...register("motorVehicleNo")}
                className="input h-8 text-sm py-0"
              />
            </div>
            <div className="md:col-span-4">
              <label className="label text-xs">Terms of Delivery</label>
              <textarea
                {...register("termsOfDelivery")}
                rows={2}
                className="input text-sm py-1"
              />
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoice Items
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="btn btn-outline btn-sm gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">
                    Description
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500 w-24">
                    HSN/SAC
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500 w-24">
                    Qty
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500 w-32">
                    Unit Price
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500 w-24">
                    Disc %
                  </th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500 w-24">
                    Tax %
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-500 w-32">
                    Amount
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const item = watchItems[index];
                  const itemTotal =
                    (item?.quantity || 0) * (item?.unitPrice || 0);
                  const itemDiscount =
                    itemTotal * ((item?.discount || 0) / 100);
                  const itemAmount = itemTotal - itemDiscount;

                  return (
                    <tr key={field.id} className="border-b border-gray-100">
                      <td className="py-2 pr-2">
                        <input
                          {...register(`items.${index}.description` as const, {
                            required: "Required",
                          })}
                          placeholder="Item description"
                          className="input text-sm"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          {...register(`items.${index}.hsnCode` as const)}
                          onChange={(e) => {
                            const code = e.target.value;
                            setValue(`items.${index}.hsnCode`, code);
                            const selectedHsn = hsns?.find(
                              (h: any) => h.code === code,
                            );
                            if (selectedHsn) {
                              setValue(
                                `items.${index}.taxRate`,
                                Number(selectedHsn.taxRate),
                              );
                            }
                          }}
                          className="input text-sm"
                        >
                          <option value="">Select HSN</option>
                          {hsns?.map((hsn: any) => (
                            <option key={hsn.code} value={hsn.code}>
                              {hsn.code} - {hsn.description} ({hsn.taxRate}%)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          {...register(`items.${index}.quantity` as const, {
                            valueAsNumber: true,
                            min: 1,
                          })}
                          className="input text-sm"
                          min="1"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice` as const, {
                            valueAsNumber: true,
                            min: 0,
                          })}
                          className="input text-sm"
                          min="0"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          {...register(`items.${index}.discount` as const, {
                            valueAsNumber: true,
                            min: 0,
                            max: 100,
                          })}
                          className="input text-sm"
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          {...register(`items.${index}.taxRate` as const, {
                            valueAsNumber: true,
                            min: 0,
                          })}
                          className="input text-sm"
                          min="0"
                        />
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(itemAmount)}
                      </td>
                      <td className="py-2 pl-2">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary & Additional Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes & Terms */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Shipping Address</label>
                <textarea
                  {...register("shippingAddress")}
                  rows={2}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  {...register("notes")}
                  rows={2}
                  className="input"
                  placeholder="Notes visible on invoice"
                />
              </div>
              <div>
                <label className="label">Terms & Conditions</label>
                <textarea
                  {...register("terms")}
                  rows={2}
                  className="input"
                  placeholder="Payment terms, return policy, etc."
                />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Discount</span>
                <select
                  {...register("discountType")}
                  className="input text-sm py-1 px-2 w-24"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">Fixed</option>
                </select>
                <input
                  type="number"
                  {...register("discountValue", { valueAsNumber: true })}
                  className="input text-sm py-1 px-2 w-20"
                  min="0"
                />
                <span className="ml-auto font-medium text-red-600">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/invoices")}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="btn btn-primary"
          >
            {createMutation.isPending || updateMutation.isPending
              ? isEdit
                ? "Updating..."
                : "Creating..."
              : isEdit
                ? "Update Invoice"
                : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}
