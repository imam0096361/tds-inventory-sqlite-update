import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { MenuIcon, XIcon } from './components/Icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const PCInfo = lazy(() => import('./pages/PCInfo').then(module => ({ default: module.PCInfo })));
const LaptopInfo = lazy(() => import('./pages/LaptopInfo').then(module => ({ default: module.LaptopInfo })));
const ServerInfo = lazy(() => import('./pages/ServerInfo').then(module => ({ default: module.ServerInfo })));
const PeripheralLog = lazy(() => import('./pages/PeripheralLog').then(module => ({ default: module.PeripheralLog })));
const KeyboardLog = lazy(() => import('./pages/KeyboardLog').then(module => ({ default: module.KeyboardLog })));
const SSDLog = lazy(() => import('./pages/SSDLog').then(module => ({ default: module.SSDLog })));
const HeadphoneLog = lazy(() => import('./pages/HeadphoneLog').then(module => ({ default: module.HeadphoneLog })));
const PortableHDDLog = lazy(() => import('./pages/PortableHDDLog').then(module => ({ default: module.PortableHDDLog })));
const DepartmentSummary = lazy(() => import('./pages/DepartmentSummary').then(module => ({ default: module.DepartmentSummary })));
const ProductInventory = lazy(() => import('./pages/ProductInventory').then(module => ({ default: module.ProductInventory })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Login = lazy(() => import('./pages/Login'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AIAssistant = lazy(() => import('./pages/AIAssistant').then(module => ({ default: module.AIAssistant })));
const CostManagement = lazy(() => import('./pages/CostManagement'));

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppContent: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Suspense fallback={<div>Loading...</div>}><Login /></Suspense>} />
      
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="flex h-screen bg-gray-100 font-sans">
              <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
                <Sidebar />
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex justify-between items-center p-4 bg-white border-b border-gray-200 md:hidden">
                  <h1 className="text-xl font-semibold text-gray-800">TDS IT Inventory</h1>
                  <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 focus:outline-none focus:text-gray-700">
                    {isSidebarOpen ? <XIcon /> : <MenuIcon />}
                  </button>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-8">
                  <Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/pc-info" element={<PCInfo />} />
                      <Route path="/laptop-info" element={<LaptopInfo />} />
                      <Route path="/server-info" element={<ServerInfo />} />
                      <Route path="/mouse-log" element={<PeripheralLog />} />
                      <Route path="/keyboard-log" element={<KeyboardLog />} />
                      <Route path="/ssd-log" element={<SSDLog />} />
                      <Route path="/headphone-log" element={<HeadphoneLog />} />
                      <Route path="/portable-hdd-log" element={<PortableHDDLog />} />
                      <Route path="/department-summary" element={<DepartmentSummary />} />
                      <Route path="/product-inventory" element={<ProductInventory />} />
                      <Route path="/ai-assistant" element={<AIAssistant />} />
                      <Route path="/cost-management" element={<CostManagement />} />
                      <Route path="/user-management" element={<UserManagement />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;