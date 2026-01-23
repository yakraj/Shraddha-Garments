import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CogIcon,
  BuildingOfficeIcon,
  BellIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { settingsAPI, authAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type SettingsTab =
  | "company"
  | "invoice"
  | "notifications"
  | "profile"
  | "security";

export default function Settings() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");

  const tabs = [
    { id: "company", label: "Company", icon: BuildingOfficeIcon },
    { id: "invoice", label: "Invoice", icon: DocumentTextIcon },
    { id: "notifications", label: "Notifications", icon: BellIcon },
    { id: "profile", label: "Profile", icon: UserCircleIcon },
    { id: "security", label: "Security", icon: ShieldCheckIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your application preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-64 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "company" && <CompanySettings />}
          {activeTab === "invoice" && <InvoiceSettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "profile" && <ProfileSettings user={user} />}
          {activeTab === "security" && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
}

function CompanySettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings", "company"],
    queryFn: () => settingsAPI.getByCategory("company"),
  });

  const { register, handleSubmit } = useForm({
    defaultValues: {
      companyName: settings?.companyName || "Shraddha Garments",
      address: settings?.address || "",
      city: settings?.city || "",
      state: settings?.state || "",
      pincode: settings?.pincode || "",
      phone: settings?.phone || "",
      email: settings?.email || "",
      gstNumber: settings?.gstNumber || "",
      panNumber: settings?.panNumber || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsAPI.update("company", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Company settings saved");
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="card animate-pulse h-96" />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Company Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">Company Name</label>
          <input {...register("companyName")} className="input" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Address</label>
          <textarea {...register("address")} rows={2} className="input" />
        </div>
        <div>
          <label className="label">City</label>
          <input {...register("city")} className="input" />
        </div>
        <div>
          <label className="label">State</label>
          <input {...register("state")} className="input" />
        </div>
        <div>
          <label className="label">Pincode</label>
          <input {...register("pincode")} className="input" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input {...register("phone")} className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" {...register("email")} className="input" />
        </div>
        <div>
          <label className="label">GST Number</label>
          <input {...register("gstNumber")} className="input" />
        </div>
        <div>
          <label className="label">PAN Number</label>
          <input {...register("panNumber")} className="input" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="btn btn-primary"
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function InvoiceSettings() {
  const queryClient = useQueryClient();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      invoicePrefix: "INV-",
      poPrefix: "PO-",
      defaultTaxRate: 18,
      defaultPaymentTerms: 30,
      invoiceNotes: "",
      invoiceTerms: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => settingsAPI.update("invoice", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Invoice settings saved");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
      className="card space-y-6"
    >
      <h2 className="text-lg font-semibold text-gray-900">Invoice Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Invoice Number Prefix</label>
          <input {...register("invoicePrefix")} className="input" />
        </div>
        <div>
          <label className="label">PO Number Prefix</label>
          <input {...register("poPrefix")} className="input" />
        </div>
        <div>
          <label className="label">Default Tax Rate (%)</label>
          <input
            type="number"
            {...register("defaultTaxRate")}
            className="input"
          />
        </div>
        <div>
          <label className="label">Default Payment Terms (Days)</label>
          <input
            type="number"
            {...register("defaultPaymentTerms")}
            className="input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Default Invoice Notes</label>
          <textarea {...register("invoiceNotes")} rows={3} className="input" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Default Terms & Conditions</label>
          <textarea {...register("invoiceTerms")} rows={3} className="input" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="btn btn-primary"
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    lowStockAlerts: true,
    paymentReminders: true,
    maintenanceAlerts: true,
    dailyReport: false,
    weeklyReport: true,
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
    toast.success("Setting updated");
  };

  return (
    <div className="card space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Notification Preferences
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">Email Notifications</p>
            <p className="text-sm text-gray-500">
              Receive email for important updates
            </p>
          </div>
          <button
            onClick={() => handleToggle("emailNotifications")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.emailNotifications ? "bg-primary-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.emailNotifications ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">Low Stock Alerts</p>
            <p className="text-sm text-gray-500">
              Get notified when materials are running low
            </p>
          </div>
          <button
            onClick={() => handleToggle("lowStockAlerts")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.lowStockAlerts ? "bg-primary-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.lowStockAlerts ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">Payment Reminders</p>
            <p className="text-sm text-gray-500">
              Reminders for pending and overdue payments
            </p>
          </div>
          <button
            onClick={() => handleToggle("paymentReminders")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.paymentReminders ? "bg-primary-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.paymentReminders ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">Maintenance Alerts</p>
            <p className="text-sm text-gray-500">
              Machine maintenance schedule reminders
            </p>
          </div>
          <button
            onClick={() => handleToggle("maintenanceAlerts")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.maintenanceAlerts ? "bg-primary-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.maintenanceAlerts ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-200">
          <div>
            <p className="font-medium text-gray-900">Daily Report</p>
            <p className="text-sm text-gray-500">
              Receive daily summary report
            </p>
          </div>
          <button
            onClick={() => handleToggle("dailyReport")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.dailyReport ? "bg-primary-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.dailyReport ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-gray-900">Weekly Report</p>
            <p className="text-sm text-gray-500">
              Receive weekly analytics report
            </p>
          </div>
          <button
            onClick={() => handleToggle("weeklyReport")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.weeklyReport ? "bg-primary-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.weeklyReport ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ user }: { user: any }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit } = useForm({
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => authAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Profile updated");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
      className="card space-y-6"
    >
      <h2 className="text-lg font-semibold text-gray-900">
        Profile Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">First Name</label>
          <input {...register("firstName")} className="input" />
        </div>
        <div>
          <label className="label">Last Name</label>
          <input {...register("lastName")} className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            {...register("email")}
            className="input"
            disabled
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input {...register("phone")} className="input" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="btn btn-primary"
        >
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function SecuritySettings() {
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = watch("newPassword");

  const updateMutation = useMutation({
    mutationFn: (data: any) => authAPI.changePassword(data),
    onSuccess: () => {
      toast.success("Password changed successfully");
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to change password");
    },
  });

  const onSubmit = (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    updateMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>

      <div className="max-w-md space-y-4">
        <div>
          <label className="label">Current Password</label>
          <input
            type="password"
            {...register("currentPassword", { required: true })}
            className="input"
          />
        </div>
        <div>
          <label className="label">New Password</label>
          <input
            type="password"
            {...register("newPassword", { required: true, minLength: 6 })}
            className="input"
          />
        </div>
        <div>
          <label className="label">Confirm New Password</label>
          <input
            type="password"
            {...register("confirmPassword", {
              required: true,
              validate: (value) =>
                value === newPassword || "Passwords do not match",
            })}
            className="input"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="btn btn-primary"
        >
          {updateMutation.isPending ? "Changing..." : "Change Password"}
        </button>
      </div>
    </form>
  );
}
