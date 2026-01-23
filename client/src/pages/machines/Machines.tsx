import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
  PencilSquareIcon,
  TrashIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { machinesAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import MachineModal from "./MachineModal";
import type { Machine } from "@/types";

const statusColors: Record<string, string> = {
  OPERATIONAL: "badge-success",
  MAINTENANCE: "badge-warning",
  REPAIR: "badge-error",
  IDLE: "badge-gray",
};

export default function Machines() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["machines", { search, status: statusFilter }],
    queryFn: () =>
      machinesAPI.getAll({ search, status: statusFilter || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => machinesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["machines"] });
      toast.success("Machine deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete machine");
    },
  });

  const handleEdit = (machine: Machine) => {
    setSelectedMachine(machine);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this machine?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedMachine(null);
  };

  const machines = data?.data || [];

  // Stats
  const operationalCount = machines.filter(
    (m: Machine) => m.status === "OPERATIONAL"
  ).length;
  const maintenanceCount = machines.filter(
    (m: Machine) => m.status === "MAINTENANCE"
  ).length;
  const repairCount = machines.filter(
    (m: Machine) => m.status === "REPAIR"
  ).length;
  const idleCount = machines.filter((m: Machine) => m.status === "IDLE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Machines</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Add Machine
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Operational</p>
              <p className="text-2xl font-bold text-green-600">
                {operationalCount}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CogIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">
                {maintenanceCount}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <WrenchScrewdriverIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Under Repair</p>
              <p className="text-2xl font-bold text-red-600">{repairCount}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <WrenchScrewdriverIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Idle</p>
              <p className="text-2xl font-bold text-gray-600">{idleCount}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <CogIcon className="h-6 w-6 text-gray-600" />
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
              placeholder="Search machines..."
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
            <option value="OPERATIONAL">Operational</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="REPAIR">Repair</option>
            <option value="IDLE">Idle</option>
          </select>
        </div>
      </div>

      {/* Machines Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : machines.length === 0 ? (
        <div className="card text-center py-12">
          <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No machines found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {machines.map((machine: Machine) => (
            <div
              key={machine.id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {machine.name}
                  </h3>
                  <p className="text-sm text-gray-500">{machine.code}</p>
                </div>
                <span className={`badge ${statusColors[machine.status]}`}>
                  {machine.status}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900">
                    {machine.type}
                  </span>
                </div>
                {machine.manufacturer && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Manufacturer</span>
                    <span className="font-medium text-gray-900">
                      {machine.manufacturer}
                    </span>
                  </div>
                )}
                {machine.model && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Model</span>
                    <span className="font-medium text-gray-900">
                      {machine.model}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-gray-900">
                    {machine.location || "Not specified"}
                  </span>
                </div>
                {machine.lastMaintenanceDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Maintenance</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(machine.lastMaintenanceDate)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleEdit(machine)}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(machine.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <MachineModal machine={selectedMachine} onClose={handleCloseModal} />
      )}
    </div>
  );
}
