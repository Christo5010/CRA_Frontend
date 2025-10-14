
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import AppLayout from '@/components/layout/AppLayout';
import CRAPage from '@/pages/CRAPage';
import ManagementCRAPage from '@/pages/ManagementCRAPage';
import DashboardPage from '@/pages/DashboardPage';
import MyDocumentsPage from '@/pages/MyDocumentsPage';
import AccountsPage from '@/pages/AccountsPage';
import AccountSettingsPage from '@/pages/AccountSettingsPage';
import { useAuth } from '@/contexts/AuthContext';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import NewPasswordPage from '@/pages/NewPasswordPage';
import SignatureLinkPage from '@/pages/SignatureLinkPage';
import MyAbsencesPage from '@/pages/MyAbsencesPage';
import AbsenceManagementPage from '@/pages/AbsenceManagementPage';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();



  if (loading) {

    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-800"></div>
      </div>
    );
  }

  if (!isAuthenticated) {

    return <Navigate to="/" replace />;
  }
  
  if (!user) {

     return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-800"></div>
      </div>
    );
  }

  if (roles && !roles.map(role => role.toLowerCase()).includes(user.role?.toLowerCase())) {

    // Redirect based on user role
    switch (user.role?.toLowerCase()) {
      case 'consultant':
        return <Navigate to="/mon-cra" replace />;
      case 'manager':
        return <Navigate to="/dashboard" replace />;
      case 'admin':
        return <Navigate to="/accounts" replace />;
      default:
        return <Navigate to="/mon-cra" replace />;
    }
  }


  return children;
};

const AppRoutes = () => {
    const { isAuthenticated, user, loading } = useAuth();
    

    
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/new-password" element={<NewPasswordPage />} />
            <Route 
                path="/mon-cra" 
                element={<PrivateRoute roles={['consultant', 'manager', 'admin']}><AppLayout><CRAPage /></AppLayout></PrivateRoute>} 
            />
            <Route path="/cra/sign" element={<SignatureLinkPage />} />
            <Route 
                path="/mes-absences"
                element={<PrivateRoute roles={['consultant']}><AppLayout><MyAbsencesPage /></AppLayout></PrivateRoute>}
            />
            <Route 
                path="/gestion-absences"
                element={<PrivateRoute roles={['manager', 'admin']}><AppLayout><AbsenceManagementPage /></AppLayout></PrivateRoute>}
            />
            <Route 
                path="/cra" 
                element={<PrivateRoute roles={['manager', 'admin']}><AppLayout><ManagementCRAPage /></AppLayout></PrivateRoute>} 
            />
            <Route 
                path="/dashboard" 
                element={<PrivateRoute roles={['manager', 'admin']}><AppLayout><DashboardPage /></AppLayout></PrivateRoute>} 
            />
            <Route 
                path="/mes-documents" 
                element={<PrivateRoute roles={['consultant', 'manager', 'admin']}><AppLayout><MyDocumentsPage /></AppLayout></PrivateRoute>} 
            />
            <Route 
                path="/mes-documents/mes-cra" 
                element={<PrivateRoute roles={['consultant', 'manager', 'admin']}><AppLayout><MyDocumentsPage /></AppLayout></PrivateRoute>} 
            />
            <Route 
                path="/accounts" 
                element={<PrivateRoute roles={['admin']}><AppLayout><AccountsPage /></AppLayout></PrivateRoute>} 
            />
            <Route 
                path="/account-settings" 
                element={<PrivateRoute roles={['consultant', 'manager', 'admin']}><AppLayout><AccountSettingsPage /></AppLayout></PrivateRoute>} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return <AppRoutes />;
}

export default App;
