import React, { useState, useEffect, useMemo } from 'react';
import { PeripheralLogEntry } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { DownloadIcon, ImportIcon } from '../components/Icons';
import { exportToCSV } from '../utils/export';
import { DetailModal } from '../components/DetailModal';
import { useDebounce } from '../hooks/useDebounce';
import { useSort } from '../hooks/useSort';
import { SortableHeader } from '../components/SortableHeader';
import { ImportModal } from '../components/ImportModal';
import { buildApiUrl } from '../utils/api';

const emptyFormState: Omit<PeripheralLogEntry, 'id'> = {
    productName: '',
    serialNumber: '',
    pcName: '',
    pcUsername: '',
    department: '',
    date: '',
    time: '',
    servicedBy: '',
    comment: '',
};

export const SSDLog: React.FC = () => {
    const [logs, setLogs] = useState<PeripheralLogEntry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<PeripheralLogEntry | null>(null);
    const [formData, setFormData] = useState(emptyFormState);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [logToDelete, setLogToDelete] = useState<PeripheralLogEntry | null>(null);
    const [viewingLog, setViewingLog] = useState<PeripheralLogEntry | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        fetch(buildApiUrl('/api/ssdlogs'))
            .then(res => res.json())
            .then(data => setLogs(data));
    }, []);

    useEffect(() => {
        if (editingLog) {
            setFormData(editingLog);
        } else {
            setFormData(emptyFormState);
        }
    }, [editingLog]);

    const handleAddNew = () => {
        setEditingLog(null);
        setFormData(emptyFormState);
        setIsModalOpen(true);
    };

    const handleEdit = (log: PeripheralLogEntry) => {
        setEditingLog(log);
        setFormData(log);
        setIsModalOpen(true);
    };
    
    const handleViewDetails = (log: PeripheralLogEntry) => {
        setViewingLog(log);
    };

    const handleDeleteRequest = (log: PeripheralLogEntry) => {
        setLogToDelete(log);
    };

    const handleConfirmDelete = async () => {
        if (!logToDelete) return;
        await fetch(buildApiUrl(`/api/ssdlogs/${logToDelete.id}`), { method: 'DELETE' });
        setLogs(logs.filter(log => log.id !== logToDelete.id));
        setLogToDelete(null);
    };

    const handleCancelDelete = () => {
        setLogToDelete(null);
    };

    const handleSave = async () => {
        if (editingLog) {
            await fetch(buildApiUrl(`/api/ssdlogs/${editingLog.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            setLogs(logs.map(log => (log.id === editingLog.id ? { ...formData, id: editingLog.id } : log)));
        } else {
            const newLog = { ...formData, id: crypto.randomUUID() };
            await fetch(buildApiUrl('/api/ssdlogs'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLog),
            });
            setLogs([...logs, newLog]);
        }
        setIsModalOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredLogs = useMemo(() => {
        const parseDate = (dateStr: string): Date | null => {
            if (!dateStr) return null;
    
            let date;
            // Handles yyyy-mm-dd
            if (dateStr.includes('-')) {
                const parts = dateStr.split('T')[0].split('-');
                if(parts.length === 3){
                    date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                }
            } 
            // Handles dd/mm/yyyy
            else if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                }
            }
    
            if (date && !isNaN(date.getTime())) {
                date.setHours(0, 0, 0, 0); // Normalize to midnight
                return date;
            }
            return null;
        };
        
        const start = startDate ? parseDate(startDate) : null;
        const end = endDate ? parseDate(endDate) : null;

        const searchWords = debouncedSearchTerm.toLowerCase().split(' ').filter(word => word);

        return logs.filter(log => {
            // Date filter
            const logDate = parseDate(log.date);
            if (start && (!logDate || logDate < start)) {
                return false;
            }
            if (end && (!logDate || logDate > end)) {
                return false;
            }

            // Search filter
            if (searchWords.length === 0) return true;

            const searchableString = [
                log.productName,
                log.serialNumber,
                log.pcName,
                log.pcUsername,
                log.department,
                log.servicedBy,
                log.comment
            ].join(' ').toLowerCase();

            return searchWords.every(word => searchableString.includes(word));
        });
    }, [logs, debouncedSearchTerm, startDate, endDate]);

    const { sortedItems: sortedLogs, requestSort, sortConfig } = useSort<PeripheralLogEntry>(filteredLogs, { key: 'date', direction: 'descending' });

    const handleExport = () => {
        exportToCSV(sortedLogs, 'ssd-service-logs');
    };

    const handleImportLogs = async (newLogs: Partial<PeripheralLogEntry>[]) => {
        const logsToAdd = newLogs.map(log => ({
            ...log,
            id: crypto.randomUUID()
        }));

        const addPromises = logsToAdd.map(log => fetch(buildApiUrl('/api/ssdlogs'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(log),
        }));
        
        await Promise.all(addPromises);
        setLogs([...logs, ...logsToAdd] as PeripheralLogEntry[]);
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">SSD Service Log</h1>
                    <div className="flex flex-col sm:flex-row gap-2 self-start md:self-auto">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <ImportIcon />
                            <span>Import</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <DownloadIcon />
                            <span>Export</span>
                        </button>
                        <button
                            onClick={handleAddNew}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Add New Log
                        </button>
                    </div>
                </div>
                <div className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                        <div className="flex items-center gap-2 md:col-span-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
                                aria-label="Start date"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
                                aria-label="End date"
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <SortableHeader<PeripheralLogEntry> label="Product Name" sortKey="productName" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<PeripheralLogEntry> label="Serial Number" sortKey="serialNumber" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<PeripheralLogEntry> label="Department" sortKey="department" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<PeripheralLogEntry> label="User" sortKey="pcUsername" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<PeripheralLogEntry> label="Date" sortKey="date" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<PeripheralLogEntry> label="Serviced By" sortKey="servicedBy" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedLogs.map((log) => (
                                <tr key={log.id} onClick={() => handleViewDetails(log)} className="hover:bg-gray-50 cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.productName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.serialNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.department || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.pcUsername || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.servicedBy || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => handleEdit(log)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => handleDeleteRequest(log)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedLogs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No logs found matching your criteria.
                        </div>
                    )}
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLog ? "Edit Log Entry" : "Add New Log Entry"}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="productName" value={formData.productName} onChange={handleChange} placeholder="Product Name" className="p-2 border rounded" />
                    <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="Serial Number" className="p-2 border rounded" />
                    <input type="text" name="pcName" value={formData.pcName} onChange={handleChange} placeholder="PC Name" className="p-2 border rounded" />
                    <input type="text" name="pcUsername" value={formData.pcUsername} onChange={handleChange} placeholder="PC Username" className="p-2 border rounded" />
                    <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Department" className="p-2 border rounded" />
                    <input type="date" name="date" value={formData.date} onChange={handleChange} placeholder="Date" className="p-2 border rounded" />
                    <input type="text" name="time" value={formData.time} onChange={handleChange} placeholder="Time" className="p-2 border rounded" />
                    <input type="text" name="servicedBy" value={formData.servicedBy} onChange={handleChange} placeholder="Serviced By" className="p-2 border rounded" />
                    <textarea name="comment" value={formData.comment} onChange={handleChange} placeholder="Comment" className="p-2 border rounded md:col-span-2" rows={3}></textarea>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingLog ? 'Save Changes' : 'Add Entry'}</button>
                </div>
            </Modal>
            
            <ConfirmationModal
                isOpen={!!logToDelete}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirm Log Deletion"
                message={<p>Are you sure you want to delete the log for <span className="font-semibold">{logToDelete?.productName} (S/N: {logToDelete?.serialNumber})</span>? This action cannot be undone.</p>}
            />
            
            <DetailModal 
                isOpen={!!viewingLog} 
                onClose={() => setViewingLog(null)} 
                title={`${viewingLog?.productName || 'Log'} Details`}
                data={viewingLog} 
            />

            <ImportModal<Partial<PeripheralLogEntry>>
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportLogs}
                assetName="SSD Logs"
                templateHeaders={['productName', 'serialNumber', 'pcName', 'pcUsername', 'department', 'date', 'time', 'servicedBy', 'comment']}
                exampleRow={['Samsung 980 Pro 1TB', 'SN789012', 'IT-PC-03', 'alex.brown', 'IT', '2024-10-24', '16:30', 'Tech Support', 'SSD installation']}
            />
        </>
    );
};
