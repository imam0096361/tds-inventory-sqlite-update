import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DashboardIcon, DesktopIcon, LaptopIcon, ServerIcon, MouseIcon, KeyboardIcon, SSDIcon, ChartPieIcon, SettingsIcon, BoxIcon } from './Icons';
import { Page } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: Page;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <li className="mb-1">
      <Link
        to={to}
        className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
      >
        {icon}
        <span className="ml-3">{label}</span>
      </Link>
    </li>
  );
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'Main',
      items: [
        { to: '/', icon: <DashboardIcon />, label: 'Dashboard' as Page },
        { to: '/pc-info', icon: <DesktopIcon />, label: 'PC Info' as Page },
        { to: '/laptop-info', icon: <LaptopIcon />, label: 'Laptop Info' as Page },
        { to: '/server-info', icon: <ServerIcon />, label: 'Server Info' as Page },
      ],
    },
    {
      title: 'Peripherals',
      items: [
        { to: '/mouse-log', icon: <MouseIcon />, label: 'Mouse Log' as Page },
        { to: '/keyboard-log', icon: <KeyboardIcon />, label: 'Keyboard Log' as Page },
        { to: '/ssd-log', icon: <SSDIcon />, label: 'SSD Log' as Page },
        { to: '/product-inventory', icon: <BoxIcon />, label: 'Product Inventory' as Page },
      ],
    },
    {
      title: 'Reports',
      items: [
        { to: '/department-summary', icon: <ChartPieIcon />, label: 'Department Summary' as Page },
      ],
    },
    {
      title: 'AI Tools',
      items: [
        { 
          to: '/ai-assistant', 
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ), 
          label: 'AI Assistant' as Page 
        },
      ],
    },
  ];

  const settingsItem = { to: '/settings', icon: <SettingsIcon />, label: 'Settings' as Page };
  const userManagementItem = { 
    to: '/user-management', 
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ), 
    label: 'User Management' as Page 
  };

  return (
    <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-700 flex items-center justify-center">
            <h1 className="text-2xl font-bold text-white">TDS IT Inventory</h1>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto space-y-6">
            {navSections.map((section) => (
              <div key={section.title}>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">{section.title}</h2>
                <ul>
                  {section.items.map(item => (
                    <NavItem
                      key={item.label}
                      to={item.to}
                      icon={item.icon}
                      label={item.label}
                    />
                  ))}
                </ul>
              </div>
            ))}
        </nav>
        
        {/* Settings and Admin Section */}
        <div className="p-4 border-t border-gray-700">
             <ul>
                 {user?.role === 'admin' && (
                   <NavItem
                      to={userManagementItem.to}
                      icon={userManagementItem.icon}
                      label={userManagementItem.label}
                  />
                 )}
                 <NavItem
                    to={settingsItem.to}
                    icon={settingsItem.icon}
                    label={settingsItem.label}
                />
            </ul>
        </div>

        {/* User Profile Section */}
        {user && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.fullName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">{user.fullName}</p>
                <p className="text-xs text-gray-400">{user.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}

        <div className="pb-4 px-4 text-center text-xs text-gray-500">
          <p>Developed by</p>
          <p className="font-semibold text-gray-400">Imam Chowdhury</p>
        </div>
    </div>
  );
};