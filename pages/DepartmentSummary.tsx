import React, { useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { PCInfoEntry, LaptopInfoEntry, ServerInfoEntry } from '../types';
import { pcInfoData, laptopInfoData, serverInfoData } from '../data/dummyData';
import { BarChartCard } from '../components/BarChartCard';
import { DownloadIcon } from '../components/Icons';
import { exportToCSV } from '../utils/export';
import { useSort } from '../hooks/useSort';
import { SortableHeader } from '../components/SortableHeader';

interface DepartmentCounts {
  pcs: number;
  laptops: number;
  servers: number;
  total: number;
}

interface DepartmentSummaryRow {
  department: string;
  pcs: number;
  laptops: number;
  servers: number;
  total: number;
}

export const DepartmentSummary: React.FC = () => {
    const [pcs] = useLocalStorage<PCInfoEntry[]>('pcInfo', pcInfoData);
    const [laptops] = useLocalStorage<LaptopInfoEntry[]>('laptopInfo', laptopInfoData);
    const [servers] = useLocalStorage<ServerInfoEntry[]>('serverInfo', serverInfoData);

    const departmentAssetCounts = useMemo<DepartmentSummaryRow[]>(() => {
        const counts: Record<string, DepartmentCounts> = {};

        const addToDept = (dept: string, type: 'pcs' | 'laptops' | 'servers') => {
            if (!dept || dept.trim() === '') return;
            if (!counts[dept]) {
                counts[dept] = { pcs: 0, laptops: 0, servers: 0, total: 0 };
            }
            counts[dept][type]++;
            counts[dept].total++;
        };

        pcs.forEach(pc => addToDept(pc.department, 'pcs'));
        laptops.forEach(laptop => addToDept(laptop.department, 'laptops'));
        servers.forEach(server => addToDept(server.department || 'Unassigned', 'servers'));

        return Object.entries(counts).map(([department, data]) => ({
            department,
            ...data,
        }));
    }, [pcs, laptops, servers]);

    const { sortedItems: sortedSummaryData, requestSort, sortConfig } = useSort<DepartmentSummaryRow>(departmentAssetCounts, { key: 'total', direction: 'descending' });

    const chartData = useMemo(() => {
        return departmentAssetCounts
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)
            .map(d => ({ name: d.department, count: d.total }));
    }, [departmentAssetCounts]);

    const totals = useMemo(() => {
        return sortedSummaryData.reduce((acc, item) => {
            acc.pcs += item.pcs;
            acc.laptops += item.laptops;
            acc.servers += item.servers;
            acc.total += item.total;
            return acc;
        }, { pcs: 0, laptops: 0, servers: 0, total: 0 });
    }, [sortedSummaryData]);

    const handleExport = () => {
        exportToCSV(sortedSummaryData, 'department_asset_report');
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Department Asset Report</h1>
                <button
                    onClick={handleExport}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 self-start md:self-auto"
                >
                    <DownloadIcon />
                    <span>Export to CSV</span>
                </button>
            </div>
            
            <BarChartCard title="Top 10 Departments by Asset Count" data={chartData} barColor="#10b981" />

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Detailed Breakdown</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <SortableHeader<DepartmentSummaryRow> label="Department" sortKey="department" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<DepartmentSummaryRow> label="PCs" sortKey="pcs" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                                <SortableHeader<DepartmentSummaryRow> label="Laptops" sortKey="laptops" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                                <SortableHeader<DepartmentSummaryRow> label="Servers" sortKey="servers" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                                <SortableHeader<DepartmentSummaryRow> label="Total Assets" sortKey="total" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedSummaryData.map((item) => (
                                <tr key={item.department} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.pcs}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.laptops}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{item.servers}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold text-right">{item.total}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800 uppercase text-left">
                                    Grand Total
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800 text-right">
                                    {totals.pcs}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800 text-right">
                                    {totals.laptops}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800 text-right">
                                    {totals.servers}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800 text-right">
                                    {totals.total}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};
