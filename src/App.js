import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import TestCases from './pages/TestCases';
import Defects from './pages/Defects';
import TestSchedules from './pages/TestSchedules';
import Reports from './pages/Reports';
import Organizations from './pages/Organizations';
import Projects from './pages/Projects';
import UserManagement from './pages/UserManagement';
import SuperUserDashboard from './components/SuperUserDashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './utils/setupAppAdmin'; // Import to make setup function available globally
import './utils/verifyDeployment'; // Import to make verification function available globally
import './utils/resetUserPassword'; // Import to make reset password function available globally
import './utils/testUser'; // Import to make test user function available globally

function AppRoutes() {
  const { currentUser, currentUserData } = useAuth();

  return (
    <div className="min-h-screen bg-slate-light">
      {currentUser && <Navigation />}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                {currentUserData?.roles?.includes('APP_ADMIN') ? (
                  <Navigate to="/super-admin" replace />
                ) : (
                  <Dashboard />
                )}
              </ProtectedRoute>
            } />
            <Route path="/test-cases" element={
              <ProtectedRoute>
                <TestCases />
              </ProtectedRoute>
            } />
            <Route path="/defects" element={
              <ProtectedRoute>
                <Defects />
              </ProtectedRoute>
            } />
            <Route path="/schedules" element={
              <ProtectedRoute>
                <TestSchedules />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/organizations" element={
              <ProtectedRoute>
                <Organizations />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/user-management" element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/super-admin" element={
              <ProtectedRoute>
                <SuperUserDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </motion.div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App; 