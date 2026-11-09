import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreatorWorkspacePage } from './pages/CreatorWorkspacePage';
import { InspectionStudioPage } from './pages/InspectionStudioPage';
import { KnowledgeManagementPage } from './pages/KnowledgeManagementPage';
import { ReviewerConsolePage } from './pages/ReviewerConsolePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        Initializing Brand Sentinel...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/creator"
            element={
              <ProtectedLayout>
                <CreatorWorkspacePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/inspection/:id"
            element={
              <ProtectedLayout>
                <InspectionStudioPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reviewer"
            element={
              <ProtectedLayout>
                <ReviewerConsolePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/knowledge"
            element={
              <ProtectedLayout>
                <KnowledgeManagementPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedLayout>
                <AnalyticsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedLayout>
                <AuditLogsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedLayout>
                <SettingsPage />
              </ProtectedLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
