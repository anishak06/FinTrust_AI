import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DataCollection from './pages/DataCollection';
import MonthlyExpenseManager from './pages/MonthlyExpenseManager';
import AdminDashboard from './pages/AdminDashboard';


// Route Guards
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#010308] flex items-center justify-center text-white">
        <div className="animate-pulse">Loading secure session...</div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#010308] flex items-center justify-center text-white">
        <div className="animate-pulse">Loading secure session...</div>
      </div>
    );
  }
  
  return isAuthenticated && isAdmin ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Secured Borrower Routes */}
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/monthly-expense" 
            element={
              <PrivateRoute>
                <MonthlyExpenseManager />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/check-eligibility" 
            element={
              <PrivateRoute>
                <DataCollection />
              </PrivateRoute>
            } 
          />


          {/* Secured Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />

          {/* Fallback Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
