import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Website from "./pages/Website";
import LoginForm from "./components/LoginForm";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Invoice from "./pages/Billing";
import Staff from "./pages/Staff";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Feedback from "./pages/Feedback";
import Automation from "./pages/Automation";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import { useFirebaseStores } from "./hooks/useFirebaseStores";

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
  return (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const { user } = useAuth();
  
  // Define public routes that don't need authentication
  const publicRoutes = ['/', '/login', '/privacy-policy', '/terms-of-service', '/cookie-policy'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  // For public routes, show content immediately without waiting for auth
  if (isPublicRoute) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={
            <AnimatedRoute>
              <Website />
            </AnimatedRoute>
          } />
          <Route path="/login" element={
            <AnimatedRoute>
              <LoginForm />
            </AnimatedRoute>
          } />
          
          {/* Legal Pages */}
          <Route path="/privacy-policy" element={
            <AnimatedRoute>
              <PrivacyPolicy />
            </AnimatedRoute>
          } />
          <Route path="/terms-of-service" element={
            <AnimatedRoute>
              <TermsOfService />
            </AnimatedRoute>
          } />
          <Route path="/cookie-policy" element={
            <AnimatedRoute>
              <CookiePolicy />
            </AnimatedRoute>
          } />
        </Routes>
      </AnimatePresence>
    );
  }

  // For protected routes, show them directly
  return <ProtectedAppContent />;
}

function ProtectedAppContent() {
  const location = useLocation();
  const { user } = useAuth();
  
  // Initialize Firebase stores for protected routes
  useFirebaseStores();

  return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        {/* Protected Routes - Only accessible when user is logged in */}
        {user ? (
          <>
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
              <AnimatedRoute>
                <Dashboard />
              </AnimatedRoute>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/patients" element={
              <ProtectedRoute>
                <Layout>
              <AnimatedRoute>
                <Patients />
              </AnimatedRoute>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/invoice" element={
              <ProtectedRoute>
                <Layout>
              <AnimatedRoute>
                <Invoice />
              </AnimatedRoute>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/staff" element={
              <ProtectedRoute>
                <Layout>
              <AnimatedRoute>
                <Staff />
              </AnimatedRoute>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Layout>
              <AnimatedRoute>
                <Inventory />
              </AnimatedRoute>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
              <AnimatedRoute>
                <Reports />
              </AnimatedRoute>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/feedback" element={
              <ProtectedRoute>
                <Layout>
              <AnimatedRoute>
                <Feedback />
              </AnimatedRoute>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/automation" element={
              <ProtectedRoute>
                <Layout>
              <AnimatedRoute>
                <Automation />
              </AnimatedRoute>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
              <AnimatedRoute>
                <Settings />
              </AnimatedRoute>
                </Layout>
              </ProtectedRoute>
            } />
          </>
        ) : (
          // Redirect to website if not logged in and trying to access protected routes
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
        </Routes>
      </AnimatePresence>
  );
}

export default App;
