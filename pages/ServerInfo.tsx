import React, { useState, useEffect, useMemo } from 'react';
import { ServerInfoEntry, CustomFieldDef } from '../types';
import { Modal } from '../components/Modal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import useLocalStorage from '../hooks/useLocalStorage';
import { DownloadIcon, ImportIcon } from '../components/Icons';
import { exportToCSV } from '../utils/export';
import { DetailModal } from '../components/DetailModal';
import { useDebounce } from '../hooks/useDebounce';
import { ImportModal } from '../components/ImportModal';
import { useSort } from '../hooks/useSort';
import { SortableHeader } from '../components/SortableHeader';

const emptyFormState: Omit<ServerInfoEntry, 'id'> = {
    serverID: '',
    brand: '',
    model: '',
    department: '',
    cpu: '',
    totalCores: 0,
    ram: '',
    storage: '',
    raid: '',
    status: 'Online',
    customFields: {},
};

export const ServerInfo: React.FC = () => {
    const [servers, setServers] = useState<ServerInfoEntry[]>([]);
    const [serverCustomFields] = useLocalStorage<CustomFieldDef[]>('customFields_server', []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingServer, setEditingServer] = useState<ServerInfoEntry | null>(null);
    const [formData, setFormData] = useState<Omit<ServerInfoEntry, 'id'>>(emptyFormState);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [brandFilter, setBrandFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [serverToDelete, setServerToDelete] = useState<ServerInfoEntry | null>(null);
    const [viewingServer, setViewingServer] = useState<ServerInfoEntry | null>(null);

    useEffect(() => {
        fetch('http://localhost:3001/api/servers')
            .then(res => res.json())
            .then(data => setServers(data));
    }, []);

     useEffect(() => {
        if (editingServer) {
            setFormData(editingServer);
        } else {
            setFormData(emptyFormState);
        }
    }, [editingServer]);

    const handleAddNew = () => {
        setEditingServer(null);
        setFormData(emptyFormState);
        setIsModalOpen(true);
    };

    const handleEdit = (server: ServerInfoEntry) => {
        setEditingServer(server);
        setFormData(server);
        setIsModalOpen(true);
    };
    
    const handleViewDetails = (server: ServerInfoEntry) => {
        setViewingServer(server);
    };

    const handleDeleteRequest = (server: ServerInfoEntry) => {
        setServerToDelete(server);
    };

    const handleConfirmDelete = async () => {
        if (!serverToDelete) return;
        await fetch(`http://localhost:3001/api/servers/${serverToDelete.id}`, { method: 'DELETE' });
        setServers(servers.filter(server => server.id !== serverToDelete.id));
        setServerToDelete(null);
    };

    const handleCancelDelete = () => {
        setServerToDelete(null);
    };

    const handleSave = async () => {
        if (editingServer) {
            await fetch(`http://localhost:3001/api/servers/${editingServer.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            setServers(servers.map(server => (server.id === editingServer.id ? { ...formData, id: editingServer.id } : server)));
        } else {
            const newServer = { ...formData, id: crypto.randomUUID() };
            await fetch('http://localhost:3001/api/servers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newServer),
            });
            setServers([...servers, newServer]);
        }
        setIsModalOpen(false);
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
         if (name.startsWith('custom_')) {
            const fieldId = name.replace('custom_', '');
            setFormData(prev => ({
                ...prev,
                customFields: {
                    ...(prev.customFields || {}),
                    [fieldId]: value
                }
            }));
            return;
        }
        const isNumber = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };
    
    const brandOptions = useMemo(() => ['All', ...new Set(servers.map(s => s.brand))], [servers]);
    const statusOptions: Array<'All' | ServerInfoEntry['status']> = ['All', 'Online', 'Offline', 'Maintenance'];
    
    const filteredServers = useMemo(() => {
        const searchWords = debouncedSearchTerm.toLowerCase().split(' ').filter(word => word);

        return servers.filter(server => {
            const passesFilters = (brandFilter === 'All' || server.brand === brandFilter) &&
                (statusFilter === 'All' || server.status === statusFilter);

            if (!passesFilters) return false;

            if (searchWords.length === 0) return true;

            const searchableString = [
                server.serverID,
                server.brand,
                server.model,
                server.cpu,
                server.ram,
                server.storage,
                server.raid,
                server.department,
            ].join(' ').toLowerCase();

            return searchWords.every(word => searchableString.includes(word));
        });
    }, [servers, debouncedSearchTerm, brandFilter, statusFilter]);

    const { sortedItems: sortedServers, requestSort, sortConfig } = useSort<ServerInfoEntry>(filteredServers, { key: 'serverID', direction: 'ascending' });

    const handleExport = () => {
        exportToCSV(sortedServers, 'server-info');
    };

    const handleImportServers = async (data: Partial<ServerInfoEntry>[]): Promise<{ success: boolean, message: string }> => {
        try {
            const newServers: ServerInfoEntry[] = data.map((server, index) => {
                if (!server.serverID || !server.brand) {
                    throw new Error(`Row ${index + 1}: Missing required field (serverID, brand).`);
                }
                const status = server.status && ['Online', 'Offline', 'Maintenance'].includes(server.status) ? server.status : 'Online';
                
                return {
                    ...emptyFormState,
                    ...server,
                    id: crypto.randomUUID(),
                    totalCores: server.totalCores ? Number(server.totalCores) : 0,
                    status
                };
            });

            const addPromises = newServers.map(server => fetch('http://localhost:3001/api/servers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(server),
            }));
            await Promise.all(addPromises);
            setServers([...servers, ...newServers]);
            return { success: true, message: `Successfully imported ${newServers.length} servers.` };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to import servers.' };
        }
    };

    const getStatusBadge = (status: 'Online' | 'Offline' | 'Maintenance') => {
        switch (status) {
            case 'Online': return 'bg-green-100 text-green-800';
            case 'Offline': return 'bg-red-100 text-red-800';
            case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                 <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Server Information</h1>
                    <div className="flex flex-col sm:flex-row gap-2 self-start md:self-auto">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
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
                            Add New Server
                        </button>
                    </div>
                </div>
                <div className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Search by ID, brand, model..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                        <select
                            value={brandFilter}
                            onChange={(e) => setBrandFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                        >
                            <option value="All">All Brands</option>
                            {brandOptions.filter(o => o !== 'All').map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                        >
                            <option value="All">All Statuses</option>
                            {statusOptions.filter(o => o !== 'All').map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <SortableHeader<ServerInfoEntry> label="Server ID" sortKey="serverID" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<ServerInfoEntry> label="Brand" sortKey="brand" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<ServerInfoEntry> label="Department" sortKey="department" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<ServerInfoEntry> label="RAM" sortKey="ram" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<ServerInfoEntry> label="Status" sortKey="status" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedServers.map((server) => (
                                <tr key={server.id} onClick={() => handleViewDetails(server)} className="hover:bg-gray-50 cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{server.serverID}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{server.brand}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{server.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{server.ram}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(server.status)}`}>
                                            {server.status}
                                        </span>
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => handleEdit(server)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => handleDeleteRequest(server)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedServers.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No servers found matching your search.
                        </div>
                    )}
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingServer ? "Edit Server Information" : "Add New Server"}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="serverID" value={formData.serverID} onChange={handleChange} placeholder="Server ID" className="p-2 border rounded" />
                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand" className="p-2 border rounded" />
                    <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="Model" className="p-2 border rounded" />
                    <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Department" className="p-2 border rounded" />
                    <input type="text" name="cpu" value={formData.cpu} onChange={handleChange} placeholder="CPU" className="p-2 border rounded" />
                    <input type="number" name="totalCores" value={formData.totalCores} onChange={handleChange} placeholder="Total Cores" className="p-2 border rounded" />
                    <input type="text" name="ram" value={formData.ram} onChange={handleChange} placeholder="RAM" className="p-2 border rounded" />
                    <input type="text" name="storage" value={formData.storage} onChange={handleChange} placeholder="Storage" className="p-2 border rounded" />
                    <input type="text" name="raid" value={formData.raid} onChange={handleChange} placeholder="RAID" className="p-2 border rounded" />
                     <select name="status" value={formData.status} onChange={handleChange} className="p-2 border rounded md:col-span-2">
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                </div>

                {serverCustomFields.length > 0 && (
                    <>
                        <hr className="my-6" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Custom Fields</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {serverCustomFields.map(field => (
                                <div key={field.id}>
                                    <label htmlFor={`custom_${field.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.name}
                                    </label>
                                    <input
                                        type="text"
                                        id={`custom_${field.id}`}
                                        name={`custom_${field.id}`}
                                        value={formData.customFields?.[field.id] || ''}
                                        onChange={handleChange}
                                        placeholder={field.name}
                                        className="p-2 border rounded w-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                 <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingServer ? 'Save Changes' : 'Add Server'}</button>
                </div>
            </Modal>
            
            <ConfirmationModal
                isOpen={!!serverToDelete}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirm Server Deletion"
                message={<p>Are you sure you want to delete the server entry for <span className="font-semibold">{serverToDelete?.serverID}</span>? This action cannot be undone.</p>}
            />
            
            <ImportModal<Partial<ServerInfoEntry>>
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportServers}
                assetName="Servers"
                templateHeaders={['serverID', 'brand', 'model', 'department', 'cpu', 'totalCores', 'ram', 'storage', 'raid', 'status']}
                exampleRow={['192.168.150.130', 'DELL', 'PowerEdge R740', 'IT DC', 'Intel Xeon Gold', '32', '128 GB', '4TB x 4', 'RAID10', 'Online']}
            />

            <DetailModal 
                isOpen={!!viewingServer} 
                onClose={() => setViewingServer(null)} 
                title={`${viewingServer?.serverID || 'Server'} Details`}
                data={viewingServer} 
            />
        </>
    );
};
