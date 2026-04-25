import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminInvitesPage from './pages/AdminInvitesPage.jsx';
import AdminAssessmentsPage from './pages/AdminAssessmentsPage.jsx';
import AdminToolsPage from './pages/AdminToolsPage.jsx';
import AdminToolHomePage from './pages/AdminToolHomePage.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import UserAssessmentsPage from './pages/UserAssessmentsPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import RodaDaVidaQuizPage from './pages/RodaDaVidaQuizPage.jsx';
import RodaDaVidaReportPage from './pages/RodaDaVidaReportPage.jsx';
import ToolHomePage from './pages/ToolHomePage.jsx';
import ToolQuizEntry from './pages/ToolQuizEntry.jsx';
import ToolReportEntry from './pages/ToolReportEntry.jsx';

function RootRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"/></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Legacy routes kept for backward compatibility */}
          <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/roda-da-vida/quiz" element={<ProtectedRoute><RodaDaVidaQuizPage /></ProtectedRoute>} />
          <Route path="/roda-da-vida/report/:id" element={<ProtectedRoute><RodaDaVidaReportPage /></ProtectedRoute>} />
          <Route path="/report/:id" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />

          {/* Generic tool routes */}
          <Route path="/tools/:slug/quiz" element={<ProtectedRoute><ToolQuizEntry /></ProtectedRoute>} />
          <Route path="/tools/:slug/report/:id" element={<ProtectedRoute><ToolReportEntry /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute requireAdmin><AppLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="tools" element={<AdminToolsPage />} />
            <Route path="tools/:slug" element={<AdminToolHomePage />} />
            <Route path="invites" element={<AdminInvitesPage />} />
          </Route>
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<UserDashboard />} />
            <Route path="assessments" element={<UserAssessmentsPage />} />
            <Route path="ferramenta/:slug" element={<ToolHomePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
