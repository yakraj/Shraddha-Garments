import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { notificationsAPI } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";

const typeIcons: Record<string, any> = {
  INFO: InformationCircleIcon,
  WARNING: ExclamationTriangleIcon,
  SUCCESS: CheckCircleIcon,
  ERROR: XCircleIcon,
};

const typeColors: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-600",
  WARNING: "bg-yellow-100 text-yellow-600",
  SUCCESS: "bg-green-100 text-green-600",
  ERROR: "bg-red-100 text-red-600",
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", { unread: filter === "unread" }],
    queryFn: () => notificationsAPI.getAll({ unread: filter === "unread" }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    },
  });

  const notifications = data?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notifications`
              : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "unread")}
            className="input max-w-xs"
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="btn btn-outline"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-12">
          <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification: any) => {
            const Icon = typeIcons[notification.type] || InformationCircleIcon;
            const iconColor = typeColors[notification.type] || typeColors.INFO;

            return (
              <div
                key={notification.id}
                className={`card flex items-start gap-4 ${
                  !notification.read ? "bg-blue-50 border-blue-200" : ""
                }`}
              >
                <div className={`p-2 rounded-full ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() =>
                            markAsReadMutation.mutate(notification.id)
                          }
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(notification.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
