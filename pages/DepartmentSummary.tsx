import React, { useMemo, useState, useEffect } from 'react';
import { PCInfoEntry, LaptopInfoEntry, ServerInfoEntry } from '../types';
import { BarChartCard } from '../components/BarChartCard';
import { DownloadIcon } from '../components/Icons';
import { exportToCSV } from '../utils/export';
import { useSort } from '../hooks/useSort';
import { SortableHeader } from '../components/SortableHeader';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';
import { cachedFetch, CACHE_CONFIG } from '../utils/cache';

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
    const [pcs, setPcs] = useState<PCInfoEntry[]>([]);
    const [laptops, setLaptops] = useState<LaptopInfoEntry[]>([]);
    const [servers, setServers] = useState<ServerInfoEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    // Fetch all data from API with smart caching
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                
                // Use smart cache with stale-while-revalidate
                // First load: Fetch from API
                // Second load: Instant from cache!
                const [pcsData, laptopsData, serversData] = await Promise.all([
                    cachedFetch<PCInfoEntry[]>('/api/pcs', { 
                        ttl: CACHE_CONFIG.REPORTS,
                        staleWhileRevalidate: true 
                    }),
                    cachedFetch<LaptopInfoEntry[]>('/api/laptops', { 
                        ttl: CACHE_CONFIG.REPORTS,
                        staleWhileRevalidate: true 
                    }),
                    cachedFetch<ServerInfoEntry[]>('/api/servers', { 
                        ttl: CACHE_CONFIG.REPORTS,
                        staleWhileRevalidate: true 
                    })
                ]);

                setPcs(pcsData);
                setLaptops(laptopsData);
                setServers(serversData);
            } catch (error) {
                console.error('Error fetching department summary data:', error);
                toast.error('Failed to load department data');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

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

    // Show loading skeleton while fetching data
    if (loading) {
        return (
            <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Department Asset Report</h1>
                    <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="h-6 bg-gray-300 rounded w-1/3 mb-6 animate-pulse"></div>
                    <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
                </div>
                <TableSkeleton rows={6} columns={5} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Department Asset Report</h1>
                <button
                    onClick={handleExport}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 self-start md:self-auto shadow-lg hover:shadow-xl hover-lift"
                >
                    <DownloadIcon />
                    <span>Export to CSV</span>
                </button>
            </div>
            
            <BarChartCard title="Top 10 Departments by Asset Count" data={chartData} barColor="#10b981" />

            <div className="bg-white p-6 rounded-xl shadow-lg hover-lift">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Detailed Breakdown</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 table-striped">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <SortableHeader<DepartmentSummaryRow> label="Department" sortKey="department" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<DepartmentSummaryRow> label="PCs" sortKey="pcs" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                                <SortableHeader<DepartmentSummaryRow> label="Laptops" sortKey="laptops" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                                <SortableHeader<DepartmentSummaryRow> label="Servers" sortKey="servers" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                                <SortableHeader<DepartmentSummaryRow> label="Total Assets" sortKey="total" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedSummaryData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-semibold">No department data available</p>
                                            <p className="text-sm">Add PCs, Laptops, or Servers to see department summary</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedSummaryData.map((item) => (
                                    <tr key={item.department} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {item.department}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-mono">{item.pcs}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-mono">{item.laptops}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-mono">{item.servers}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold text-right font-mono">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-green-100 text-green-800">
                                                {item.total}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-gray-300">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 uppercase text-left">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                        Grand Total
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right font-mono">
                                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                                        {totals.pcs}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right font-mono">
                                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                                        {totals.laptops}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right font-mono">
                                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
                                        {totals.servers}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right font-mono">
                                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-600 text-white shadow-lg">
                                        {totals.total}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};
