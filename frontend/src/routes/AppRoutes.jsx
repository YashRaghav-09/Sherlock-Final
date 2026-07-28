import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Cases from "../pages/Cases";
import CaseDetails from "../pages/CaseDetails";
import Missing from "../pages/Missing";
import PersonDetails from "../pages/PersonDetails";
import Vehicles from "../pages/Vehicles";
import VehicleResult from "../pages/VehicleResult";
import Criminals from "../pages/Criminals";
import CriminalDetails from "../pages/CriminalDetails";
import SmartScan from "../pages/SmartScan";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";

export default function AppRoutes() {
  return (
    <Routes>

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <Cases />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute>
            <CaseDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/missing"
        element={
          <ProtectedRoute>
            <Missing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/missing/:id"
        element={
          <ProtectedRoute>
            <PersonDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vehicles"
        element={
          <ProtectedRoute>
            <Vehicles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/vehicle/:id"
        element={
          <ProtectedRoute>
            <VehicleResult />
          </ProtectedRoute>
        }
      />

      <Route
        path="/criminals"
        element={
          <ProtectedRoute>
            <Criminals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/criminal/:id"
        element={
          <ProtectedRoute>
            <CriminalDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <SmartScan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />

    </Routes>
  );
}