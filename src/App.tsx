import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Invoice from "./pages/Billing";
import Staff from "./pages/Staff";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Feedback from "./pages/Feedback";
import Automation from "./pages/Automation";
import Settings from "./pages/Settings";

// Animated route wrapper
function AnimatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <AnimatedRoute>
                <Dashboard />
              </AnimatedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <AnimatedRoute>
                <Patients />
              </AnimatedRoute>
            }
          />
          <Route
            path="/invoice"
            element={
              <AnimatedRoute>
                <Invoice />
              </AnimatedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <AnimatedRoute>
                <Staff />
              </AnimatedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <AnimatedRoute>
                <Inventory />
              </AnimatedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <AnimatedRoute>
                <Reports />
              </AnimatedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <AnimatedRoute>
                <Feedback />
              </AnimatedRoute>
            }
          />
          <Route
            path="/automation"
            element={
              <AnimatedRoute>
                <Automation />
              </AnimatedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AnimatedRoute>
                <Settings />
              </AnimatedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
