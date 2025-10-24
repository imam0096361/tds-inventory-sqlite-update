import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DashboardIcon, DesktopIcon, LaptopIcon, ServerIcon, MouseIcon, KeyboardIcon, SSDIcon, ChartPieIcon, SettingsIcon, BoxIcon } from './Icons';
import { Page } from '../types';

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
  ];

  const settingsItem = { to: '/settings', icon: <SettingsIcon />, label: 'Settings' as Page };

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
        <div className="p-4 border-t border-gray-700">
             <ul>
                 <NavItem
                    to={settingsItem.to}
                    icon={settingsItem.icon}
                    label={settingsItem.label}
                />
            </ul>
        </div>
        <div className="pb-4 px-4 text-center text-xs text-gray-500">
          <p>Developed by</p>
          <p className="font-semibold text-gray-400">Imam Chowdhury</p>
        </div>
    </div>
  );
};