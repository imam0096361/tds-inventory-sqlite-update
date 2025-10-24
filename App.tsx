import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { MenuIcon, XIcon } from './components/Icons';

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const PCInfo = lazy(() => import('./pages/PCInfo').then(module => ({ default: module.PCInfo })));
const LaptopInfo = lazy(() => import('./pages/LaptopInfo').then(module => ({ default: module.LaptopInfo })));
const ServerInfo = lazy(() => import('./pages/ServerInfo').then(module => ({ default: module.ServerInfo })));
const PeripheralLog = lazy(() => import('./pages/PeripheralLog').then(module => ({ default: module.PeripheralLog })));
const KeyboardLog = lazy(() => import('./pages/KeyboardLog').then(module => ({ default: module.KeyboardLog })));
const SSDLog = lazy(() => import('./pages/SSDLog').then(module => ({ default: module.SSDLog })));
const DepartmentSummary = lazy(() => import('./pages/DepartmentSummary').then(module => ({ default: module.DepartmentSummary })));
const ProductInventory = lazy(() => import('./pages/ProductInventory').then(module => ({ default: module.ProductInventory })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
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
              <Route path="/department-summary" element={<DepartmentSummary />} />
              <Route path="/product-inventory" element={<ProductInventory />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default App;