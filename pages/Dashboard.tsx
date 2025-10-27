import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { InventorySummaryCard } from '../components/InventorySummaryCard';
import { BarChartCard } from '../components/BarChartCard';
import { RecentActivityCard } from '../components/RecentActivityCard';
import { StatusSummaryCard } from '../components/StatusSummaryCard';
import { DesktopIcon, LaptopIcon, ServerIcon, MouseIcon, KeyboardIcon, SSDIcon, ChartPieIcon } from '../components/Icons';
import { PCInfoEntry, LaptopInfoEntry, ServerInfoEntry, PeripheralLogEntry } from '../types';

interface DashboardCardProps {
    icon: React.ReactNode;
    title: string;
    to: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, to }) => (
    <Link
        to={to}
        className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center text-center w-full h-full"
    >
        <div className="bg-blue-100 text-blue-600 rounded-full p-4 mb-4">
            {icon}
        </div>
        <h4 className="font-semibold text-gray-700">{title}</h4>
    </Link>
);


export const Dashboard: React.FC = () => {
    const [pcs, setPcs] = useState<PCInfoEntry[]>([]);
    const [laptops, setLaptops] = useState<LaptopInfoEntry[]>([]);
    const [servers, setServers] = useState<ServerInfoEntry[]>([]);
    const [mouseLogs, setMouseLogs] = useState<PeripheralLogEntry[]>([]);
    const [keyboardLogs, setKeyboardLogs] = useState<PeripheralLogEntry[]>([]);
    const [ssdLogs, setSsdLogs] = useState<PeripheralLogEntry[]>([]);
    const [headphoneLogs, setHeadphoneLogs] = useState<PeripheralLogEntry[]>([]);
    const [hddLogs, setHddLogs] = useState<PeripheralLogEntry[]>([]);

    useEffect(() => {
        fetch('/api/pcs').then(res => res.json()).then(data => setPcs(data));
        fetch('/api/laptops').then(res => res.json()).then(data => setLaptops(data));
        fetch('/api/servers').then(res => res.json()).then(data => setServers(data));
        fetch('/api/mouselogs').then(res => res.json()).then(data => setMouseLogs(data));
        fetch('/api/keyboardlogs').then(res => res.json()).then(data => setKeyboardLogs(data));
        fetch('/api/ssdlogs').then(res => res.json()).then(data => setSsdLogs(data));
        fetch('/api/headphonelogs').then(res => res.json()).then(data => setHeadphoneLogs(data));
        fetch('/api/portablehddlogs').then(res => res.json()).then(data => setHddLogs(data));
    }, []);

    const inventoryItems = [
        { to: '/pc-info', icon: <DesktopIcon />, title: 'PC Information' },
        { to: '/laptop-info', icon: <LaptopIcon />, title: 'Laptop Information' },
        { to: '/server-info', icon: <ServerIcon />, title: 'Server Information' },
        { to: '/mouse-log', icon: <MouseIcon />, title: 'Mouse Service Log' },
        { to: '/keyboard-log', icon: <KeyboardIcon />, title: 'Keyboard Log' },
        { to: '/ssd-log', icon: <SSDIcon />, title: 'SSD Log' },
        { 
            to: '/headphone-log', 
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            ), 
            title: 'Headphone Log' 
        },
        { 
            to: '/portable-hdd-log', 
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
            ), 
            title: 'Portable HDD Log' 
        },
        { to: '/department-summary', icon: <ChartPieIcon />, title: 'Department Summary' },
    ];

    const totalAssetsData = [
        { name: 'PCs', count: pcs.length },
        { name: 'Laptops', count: laptops.length },
        { name: 'Servers', count: servers.length },
    ];
    
    const calculateUsage = (logs: PeripheralLogEntry[]) => {
        if (!logs || logs.length === 0) {
            return [{ name: 'Used', value: 0 }, { name: 'In Stock', value: 0 }];
        }
        // IMPROVED: Check for non-empty pcName OR pcUsername (trim to handle spaces)
        const used = logs.filter(log => {
            const hasPcName = log.pcName && log.pcName.trim() !== '';
            const hasUsername = log.pcUsername && log.pcUsername.trim() !== '';
            return hasPcName || hasUsername;
        }).length;
        const inStock = logs.length - used;
        return [{ name: 'Used', value: used }, { name: 'In Stock', value: inStock }];
    };

    const peripheralUsageStats = {
        mouse: calculateUsage(mouseLogs),
        keyboard: calculateUsage(keyboardLogs),
        ssd: calculateUsage(ssdLogs),
        headphone: calculateUsage(headphoneLogs),
        hdd: calculateUsage(hddLogs),
    };

    const allLogs = [...mouseLogs, ...keyboardLogs, ...ssdLogs, ...headphoneLogs, ...hddLogs];
    const recentLogs = allLogs
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, 5);

    const { pcStatuses, laptopStatuses, serverStatuses } = useMemo(() => {
        const pcStatusCounts = pcs.reduce((acc, pc) => {
            acc[pc.status] = (acc[pc.status] || 0) + 1;
            return acc;
        }, {} as Record<PCInfoEntry['status'], number>);

        const pcStatuses = [
            { name: 'OK', count: pcStatusCounts.OK || 0, color: 'bg-green-500' },
            { name: 'Repair', count: pcStatusCounts.Repair || 0, color: 'bg-yellow-500' },
            { name: 'NO', count: pcStatusCounts.NO || 0, color: 'bg-red-500' },
        ];

        const laptopStatusCounts = laptops.reduce((acc, laptop) => {
            acc[laptop.hardwareStatus] = (acc[laptop.hardwareStatus] || 0) + 1;
            return acc;
        }, {} as Record<LaptopInfoEntry['hardwareStatus'], number>);

        const laptopStatuses = [
            { name: 'Good', count: laptopStatusCounts.Good || 0, color: 'bg-green-500' },
            { name: 'Battery Problem', count: laptopStatusCounts['Battery Problem'] || 0, color: 'bg-yellow-500' },
            { name: 'Platform Problem', count: laptopStatusCounts['Platform Problem'] || 0, color: 'bg-red-500' },
        ];

        const serverStatusCounts = servers.reduce((acc, server) => {
            acc[server.status] = (acc[server.status] || 0) + 1;
            return acc;
        }, {} as Record<ServerInfoEntry['status'], number>);

        const serverStatuses = [
            { name: 'Online', count: serverStatusCounts.Online || 0, color: 'bg-green-500' },
            { name: 'Maintenance', count: serverStatusCounts.Maintenance || 0, color: 'bg-yellow-500' },
            { name: 'Offline', count: serverStatusCounts.Offline || 0, color: 'bg-red-500' },
        ];

        return { pcStatuses, laptopStatuses, serverStatuses };
    }, [pcs, laptops, servers]);


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

             <section>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Inventory Overview</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <BarChartCard title="Total Assets by Category" data={totalAssetsData} barColor="#3b82f6" />
                    </div>
                    <RecentActivityCard title="Recent Service Logs" logs={recentLogs} />
                </div>
            </section>
            
            <section>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Asset Status Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatusSummaryCard
                        title="PC Status"
                        icon={<DesktopIcon />}
                        total={pcs.length}
                        statuses={pcStatuses}
                    />
                    <StatusSummaryCard
                        title="Laptop Status"
                        icon={<LaptopIcon />}
                        total={laptops.length}
                        statuses={laptopStatuses}
                    />
                    <StatusSummaryCard
                        title="Server Status"
                        icon={<ServerIcon />}
                        total={servers.length}
                        statuses={serverStatuses}
                    />
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Peripheral Usage</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InventorySummaryCard title="Mouse Inventory" data={peripheralUsageStats.mouse} icon={<MouseIcon />} />
                    <InventorySummaryCard title="Keyboard Inventory" data={peripheralUsageStats.keyboard} icon={<KeyboardIcon />} />
                    <InventorySummaryCard title="SSD Inventory" data={peripheralUsageStats.ssd} icon={<SSDIcon />} />
                </div>
            </section>

            <section>
                 <h2 className="text-2xl font-semibold text-gray-700 mb-4">Quick Access</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {inventoryItems.map(item => (
                        <DashboardCard
                            key={item.title}
                            icon={item.icon}
                            title={item.title}
                            to={item.to}
                        />
                    ))}
                 </div>
            </section>
        </div>
    );
};