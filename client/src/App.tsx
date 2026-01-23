import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/employees/Employees";
import EmployeeDetails from "./pages/employees/EmployeeDetails";
import Machines from "./pages/machines/Machines";
import Materials from "./pages/materials/Materials";
import Customers from "./pages/customers/Customers";
import CustomerDetails from "./pages/customers/CustomerDetails";
import Invoices from "./pages/invoices/Invoices";
import InvoiceDetails from "./pages/invoices/InvoiceDetails";
import CreateInvoice from "./pages/invoices/CreateInvoice";
import HSNList from "./pages/invoices/HSNList";
import PurchaseOrders from "./pages/purchase-orders/PurchaseOrders";
import PODetails from "./pages/purchase-orders/PODetails";
import CreatePO from "./pages/purchase-orders/CreatePO";
import Measurements from "./pages/measurements/Measurements";
import MeasurementDetails from "./pages/measurements/MeasurementDetails";
import CreateMeasurement from "./pages/measurements/CreateMeasurement";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Attendance from "./pages/attendance/Attendance";
import Fabrics from "./pages/fabrics/Fabrics";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeDetails />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="machines" element={<Machines />} />
        <Route path="materials" element={<Materials />} />
        <Route path="fabrics" element={<Fabrics />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<CreateInvoice />} />
        <Route path="invoices/hsn" element={<HSNList />} />
        <Route path="invoices/:id" element={<InvoiceDetails />} />
        <Route path="invoices/:id/edit" element={<CreateInvoice />} />
        <Route path="purchase-orders" element={<PurchaseOrders />} />
        <Route path="purchase-orders/new" element={<CreatePO />} />
        <Route path="purchase-orders/:id" element={<PODetails />} />
        <Route path="measurements" element={<Measurements />} />
        <Route path="measurements/new" element={<CreateMeasurement />} />
        <Route path="measurements/:id" element={<MeasurementDetails />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
