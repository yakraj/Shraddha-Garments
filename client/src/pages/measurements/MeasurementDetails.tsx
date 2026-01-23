import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  PrinterIcon,
  PencilSquareIcon,
  ScissorsIcon,
  UserIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { measurementsAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";

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

export default function MeasurementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: measurement, isLoading } = useQuery({
    queryKey: ["measurement", id],
    queryFn: () => measurementsAPI.getById(id!),
  });

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

  if (!measurement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Measurement not found</p>
        <button
          onClick={() => navigate("/measurements")}
          className="btn btn-primary mt-4"
        >
          Back to Measurements
        </button>
      </div>
    );
  }

  const measurementData = measurement.measurements || {};
  const standardFields = Object.entries(measurementData).filter(
    ([key]) => !key.startsWith("custom") && fieldLabels[key]
  );
  const customFields = [];
  if (measurementData.custom1Name && measurementData.custom1Value) {
    customFields.push({
      name: measurementData.custom1Name,
      value: measurementData.custom1Value,
    });
  }
  if (measurementData.custom2Name && measurementData.custom2Value) {
    customFields.push({
      name: measurementData.custom2Name,
      value: measurementData.custom2Value,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/measurements"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {measurement.name}
            </h1>
            <span className={`badge ${categoryColors[measurement.category]}`}>
              {measurement.category}
            </span>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="btn btn-outline inline-flex items-center gap-2"
          >
            <PrinterIcon className="h-5 w-5" />
            Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="card lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer Details
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-full">
                <UserIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {measurement.customer?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {measurement.customer?.code}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <CalendarIcon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Recorded On</p>
                <p className="font-medium text-gray-900">
                  {formatDate(measurement.createdAt)}
                </p>
              </div>
            </div>
            {measurement.updatedAt !== measurement.createdAt && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <CalendarIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(measurement.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {measurement.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
              <p className="text-sm text-gray-700">{measurement.notes}</p>
            </div>
          )}
        </div>

        {/* Measurements */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <ScissorsIcon className="h-6 w-6 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Measurements
            </h3>
          </div>

          {standardFields.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {standardFields.map(([key, value]) => (
                <div
                  key={key}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center"
                >
                  <p className="text-sm text-gray-500">
                    {fieldLabels[key] || key}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{value}"</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No measurements recorded
            </p>
          )}

          {customFields.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Custom Measurements
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {customFields.map((field, index) => (
                  <div
                    key={index}
                    className="bg-primary-50 border border-primary-200 rounded-lg p-4 text-center"
                  >
                    <p className="text-sm text-primary-600">{field.name}</p>
                    <p className="text-2xl font-bold text-primary-700">
                      {field.value}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Version */}
      <div className="hidden print:block">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Shraddha Garments</h1>
          <p className="text-gray-600">Measurement Card</p>
        </div>
        <div className="border-2 border-gray-300 p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <strong>Customer:</strong> {measurement.customer?.name}
            </div>
            <div>
              <strong>Category:</strong> {measurement.category}
            </div>
            <div>
              <strong>Name:</strong> {measurement.name}
            </div>
            <div>
              <strong>Date:</strong> {formatDate(measurement.createdAt)}
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 text-left">
                  Measurement
                </th>
                <th className="border border-gray-300 p-2 text-center">
                  Value (inches)
                </th>
              </tr>
            </thead>
            <tbody>
              {standardFields.map(([key, value]) => (
                <tr key={key}>
                  <td className="border border-gray-300 p-2">
                    {fieldLabels[key] || key}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-bold">
                    {value}"
                  </td>
                </tr>
              ))}
              {customFields.map((field, index) => (
                <tr key={`custom-${index}`}>
                  <td className="border border-gray-300 p-2">{field.name}</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">
                    {field.value}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {measurement.notes && (
            <div className="mt-4">
              <strong>Notes:</strong> {measurement.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
