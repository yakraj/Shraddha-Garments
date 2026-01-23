import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeftIcon, ScissorsIcon } from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { measurementsAPI, customersAPI } from "@/lib/api";

interface MeasurementFields {
  // Upper body
  chest?: number;
  bust?: number;
  shoulder?: number;
  sleeve?: number;
  armhole?: number;
  bicep?: number;
  wrist?: number;
  neck?: number;
  collar?: number;
  shirtLength?: number;

  // Lower body
  waist?: number;
  hip?: number;
  inseam?: number;
  outseam?: number;
  thigh?: number;
  knee?: number;
  calf?: number;
  ankle?: number;
  pantLength?: number;
  rise?: number;

  // Full body
  fullLength?: number;
  backLength?: number;
  frontLength?: number;

  // Custom
  custom1Name?: string;
  custom1Value?: number;
  custom2Name?: string;
  custom2Value?: number;
}

interface FormData {
  customerId: string;
  name: string;
  category: string;
  measurements: MeasurementFields;
  notes: string;
}

const measurementCategories = [
  {
    value: "SHIRT",
    label: "Shirt",
    fields: [
      "chest",
      "shoulder",
      "sleeve",
      "neck",
      "shirtLength",
      "armhole",
      "bicep",
      "wrist",
    ],
  },
  {
    value: "PANT",
    label: "Pant",
    fields: [
      "waist",
      "hip",
      "inseam",
      "outseam",
      "thigh",
      "knee",
      "calf",
      "ankle",
      "pantLength",
      "rise",
    ],
  },
  {
    value: "SUIT",
    label: "Suit",
    fields: [
      "chest",
      "shoulder",
      "sleeve",
      "neck",
      "shirtLength",
      "waist",
      "hip",
      "inseam",
      "pantLength",
    ],
  },
  {
    value: "BLOUSE",
    label: "Blouse",
    fields: ["bust", "shoulder", "sleeve", "neck", "backLength", "armhole"],
  },
  {
    value: "SAREE_BLOUSE",
    label: "Saree Blouse",
    fields: [
      "bust",
      "shoulder",
      "sleeve",
      "backLength",
      "frontLength",
      "armhole",
    ],
  },
  {
    value: "KURTA",
    label: "Kurta",
    fields: ["chest", "shoulder", "sleeve", "neck", "fullLength", "armhole"],
  },
  {
    value: "DRESS",
    label: "Dress",
    fields: ["bust", "waist", "hip", "shoulder", "sleeve", "fullLength"],
  },
  { value: "OTHER", label: "Other", fields: [] },
];

const fieldLabels: Record<string, string> = {
  chest: "Chest",
  bust: "Bust",
  shoulder: "Shoulder",
  sleeve: "Sleeve Length",
  armhole: "Armhole",
  bicep: "Bicep",
  wrist: "Wrist",
  neck: "Neck",
  collar: "Collar",
  shirtLength: "Shirt Length",
  waist: "Waist",
  hip: "Hip",
  inseam: "Inseam",
  outseam: "Outseam",
  thigh: "Thigh",
  knee: "Knee",
  calf: "Calf",
  ankle: "Ankle",
  pantLength: "Pant Length",
  rise: "Rise",
  fullLength: "Full Length",
  backLength: "Back Length",
  frontLength: "Front Length",
};

export default function CreateMeasurement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId") || "";

  const [selectedCategory, setSelectedCategory] = useState("SHIRT");

  const { data: customers } = useQuery({
    queryKey: ["customers-list"],
    queryFn: () => customersAPI.getAll({ limit: 100 }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      customerId: preselectedCustomerId,
      category: "SHIRT",
      measurements: {},
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => measurementsAPI.create(data),
    onSuccess: (data) => {
      toast.success("Measurement saved successfully");
      navigate(`/measurements/${data.id}`);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to save measurement"
      );
    },
  });

  const onSubmit = (data: FormData) => {
    // Filter out empty measurements
    const filteredMeasurements = Object.fromEntries(
      Object.entries(data.measurements).filter(
        ([_, v]) => v !== undefined && v !== null && v !== ""
      )
    );

    createMutation.mutate({
      ...data,
      measurements: filteredMeasurements,
    });
  };

  const currentCategory = measurementCategories.find(
    (c) => c.value === selectedCategory
  );
  const fieldsToShow = currentCategory?.fields || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/measurements")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Measurement</h1>
          <p className="text-gray-500">Record customer body measurements</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Customer *</label>
              <select
                {...register("customerId", {
                  required: "Customer is required",
                })}
                className={`input ${errors.customerId ? "input-error" : ""}`}
              >
                <option value="">Select customer</option>
                {customers?.data?.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Measurement Name *</label>
              <input
                {...register("name", { required: "Name is required" })}
                className={`input ${errors.name ? "input-error" : ""}`}
                placeholder="e.g., Formal Shirt - Blue"
              />
            </div>
            <div>
              <label className="label">Category *</label>
              <select
                {...register("category", { required: "Category is required" })}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input"
              >
                {measurementCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Measurements */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <ScissorsIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {currentCategory?.label} Measurements
            </h2>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            All measurements are in inches. Enter only the measurements you
            need.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fieldsToShow.map((field) => (
              <div key={field}>
                <label className="label">{fieldLabels[field]}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.25"
                    {...register(`measurements.${field}` as any, {
                      valueAsNumber: true,
                    })}
                    className="input pr-10"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    in
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Measurements */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Custom Measurements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <input
                  {...register("measurements.custom1Name")}
                  className="input flex-1"
                  placeholder="Custom field name"
                />
                <div className="relative w-32">
                  <input
                    type="number"
                    step="0.25"
                    {...register("measurements.custom1Value" as any, {
                      valueAsNumber: true,
                    })}
                    className="input pr-10"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    in
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  {...register("measurements.custom2Name")}
                  className="input flex-1"
                  placeholder="Custom field name"
                />
                <div className="relative w-32">
                  <input
                    type="number"
                    step="0.25"
                    {...register("measurements.custom2Value" as any, {
                      valueAsNumber: true,
                    })}
                    className="input pr-10"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    in
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            {...register("notes")}
            rows={3}
            className="input"
            placeholder="Additional notes about fitting preferences, alterations, etc."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/measurements")}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="btn btn-primary"
          >
            {createMutation.isPending ? "Saving..." : "Save Measurement"}
          </button>
        </div>
      </form>
    </div>
  );
}
