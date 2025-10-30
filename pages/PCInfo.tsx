import React, { useState, useEffect, useMemo } from 'react';
import { PCInfoEntry, CustomFieldDef } from '../types';
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
import { cachedFetch, CACHE_CONFIG, invalidateCache } from '../utils/cache';
import { buildApiUrl } from '../utils/api';

const emptyFormState: Omit<PCInfoEntry, 'id'> = {
    department: '',
    ip: '',
    pcName: '',
    username: '',
    motherboard: '',
    cpu: '',
    ram: '',
    storage: '',
    monitor: '',
    os: '',
    status: 'OK',
    floor: 7,
    customFields: {},
};

export const PCInfo: React.FC = () => {
    const [pcs, setPcs] = useState<PCInfoEntry[]>([]);
    const [pcCustomFields] = useLocalStorage<CustomFieldDef[]>('customFields_pc', []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingPC, setEditingPC] = useState<PCInfoEntry | null>(null);
    const [formData, setFormData] = useState<Omit<PCInfoEntry, 'id'>>(emptyFormState);
    const [formErrors, setFormErrors] = useState<{ pcName?: string; ip?: string }>({});
    const [activeTab, setActiveTab] = useState<5 | 6 | 7>(7);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [ramFilter, setRamFilter] = useState('All');
    const [storageFilter, setStorageFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [pcToDelete, setPcToDelete] = useState<PCInfoEntry | null>(null);
    const [selectedPcIds, setSelectedPcIds] = useState<string[]>([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState<PCInfoEntry['status']>('OK');
    const [viewingPC, setViewingPC] = useState<PCInfoEntry | null>(null);

    // Load PCs with smart caching - INSTANT on 2nd visit!
    useEffect(() => {
        cachedFetch<PCInfoEntry[]>('/api/pcs', {
            ttl: CACHE_CONFIG.STATIC_DATA,
            staleWhileRevalidate: true
        }).then(data => setPcs(data));
    }, []);

    useEffect(() => {
        if (editingPC) {
            setFormData(editingPC);
        }
    }, [editingPC]);

    useEffect(() => {
        setSelectedPcIds([]);
    }, [activeTab, debouncedSearchTerm, ramFilter, storageFilter, statusFilter]);

    const ramOptions = useMemo(() => ['All', ...new Set(pcs.map(pc => pc.ram))], [pcs]);
    const storageOptions = useMemo(() => ['All', ...new Set(pcs.map(pc => pc.storage))], [pcs]);
    const statusOptions: Array<'All' | PCInfoEntry['status']> = ['All', 'OK', 'NO', 'Repair'];

    const handleAddNew = () => {
        setEditingPC(null);
        setFormData({ ...emptyFormState, floor: activeTab });
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleEdit = (pc: PCInfoEntry) => {
        setEditingPC(pc);
        setFormData(pc);
        setFormErrors({});
        setIsModalOpen(true);
    };

    const handleDeleteRequest = (pc: PCInfoEntry) => {
        setPcToDelete(pc);
    };

    const handleConfirmDelete = async () => {
        if (!pcToDelete) return;
        await fetch(`/api/pcs/${pcToDelete.id}`, { method: 'DELETE' });
        setPcs(pcs.filter(pc => pc.id !== pcToDelete.id));
        setPcToDelete(null);
        // Invalidate cache so next visit gets fresh data
        invalidateCache(['/api/pcs']);
    };

    const handleCancelDelete = () => {
        setPcToDelete(null);
    };
    
    const handleViewDetails = (pc: PCInfoEntry) => {
        setViewingPC(pc);
    };

    const validateForm = (): boolean => {
        const errors: { pcName?: string; ip?: string } = {};
        if (!formData.pcName.trim()) {
            errors.pcName = "PC Name is required.";
        }
        if (!formData.ip.trim()) {
            errors.ip = "IP Address is required.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }
        if (editingPC) {
            await fetch(`/api/pcs/${editingPC.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            setPcs(pcs.map(pc => (pc.id === editingPC.id ? { ...formData, id: editingPC.id } : pc)));
        } else {
            const newPC = { ...formData, id: crypto.randomUUID() };
            await fetch(buildApiUrl('/api/pcs'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPC),
            });
            setPcs([...pcs, newPC]);
        }
        setIsModalOpen(false);
        // Invalidate cache so next visit gets fresh data
        invalidateCache(['/api/pcs']);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

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

        const isNumber = e.target.type === 'select-one' && name === 'floor';
        setFormData(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));

        if ((name === 'pcName' || name === 'ip') && formErrors[name as keyof typeof formErrors]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof typeof newErrors];
                return newErrors;
            });
        }
    };
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };
    
    const filteredPcs = useMemo(() => {
        const searchWords = debouncedSearchTerm.toLowerCase().split(' ').filter(word => word);
        
        return pcs.filter(pc => {
            const passesFilters = (ramFilter === 'All' || pc.ram === ramFilter) &&
                (storageFilter === 'All' || pc.storage === storageFilter) &&
                (statusFilter === 'All' || pc.status === statusFilter) &&
                pc.floor === activeTab;

            if (!passesFilters) return false;

            if (searchWords.length === 0) return true;

            const searchableString = [
                pc.pcName,
                pc.department,
                pc.ip,
                pc.cpu,
                pc.motherboard,
                pc.monitor,
                pc.os,
                pc.storage,
                pc.ram
            ].join(' ').toLowerCase();

            return searchWords.every(word => searchableString.includes(word));
        });
    }, [pcs, debouncedSearchTerm, ramFilter, storageFilter, statusFilter, activeTab]);
    
    const { sortedItems: sortedPcs, requestSort, sortConfig } = useSort<PCInfoEntry>(filteredPcs, { key: 'pcName', direction: 'ascending' });

    const handleExport = () => {
        exportToCSV(sortedPcs, `pc-info-floor-${activeTab}`);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedPcIds(sortedPcs.map(pc => pc.id));
        } else {
            setSelectedPcIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedPcIds(prev =>
            prev.includes(id) ? prev.filter(pcId => pcId !== id) : [...prev, id]
        );
    };

    const handleBulkDeleteRequest = () => {
        setIsBulkDeleteModalOpen(true);
    };

    const handleConfirmBulkDelete = async () => {
        const deletePromises = selectedPcIds.map(id => fetch(`/api/pcs/${id}`, { method: 'DELETE' }));
        await Promise.all(deletePromises);
        setPcs(pcs.filter(pc => !selectedPcIds.includes(pc.id)));
        setSelectedPcIds([]);
        setIsBulkDeleteModalOpen(false);
    };

    const handleConfirmStatusUpdate = async () => {
        const updatePromises = selectedPcIds.map(id => fetch(`/api/pcs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        }));
        await Promise.all(updatePromises);
        setPcs(pcs.map(pc => (selectedPcIds.includes(pc.id) ? { ...pc, status: newStatus } : pc)));
        setSelectedPcIds([]);
        setIsStatusModalOpen(false);
    };

    const handleImportPcs = async (data: Partial<PCInfoEntry>[]): Promise<{ success: boolean, message: string }> => {
        try {
            const newPcs: PCInfoEntry[] = data.map((pc, index) => {
                if (!pc.pcName || !pc.ip || !pc.department) {
                    throw new Error(`Row ${index + 1}: Missing required field (pcName, ip, department).`);
                }
                const floor = pc.floor && [5, 6, 7].includes(Number(pc.floor)) ? Number(pc.floor) as 5 | 6 | 7 : 7;
                const status = pc.status && ['OK', 'NO', 'Repair'].includes(pc.status) ? pc.status : 'OK';

                return {
                    ...emptyFormState,
                    ...pc,
                    id: crypto.randomUUID(),
                    floor,
                    status,
                };
            });
            
            const addPromises = newPcs.map(pc => fetch('/api/pcs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pc),
            }));
            await Promise.all(addPromises);
            setPcs([...pcs, ...newPcs]);

            return { success: true, message: `Successfully imported ${newPcs.length} PCs.` };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to import PCs.' };
        }
    };

    const getStatusBadge = (status: 'OK' | 'NO' | 'Repair') => {
        switch (status) {
            case 'OK': return 'bg-green-100 text-green-800';
            case 'NO': return 'bg-red-100 text-red-800';
            case 'Repair': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const floors: (5 | 6 | 7)[] = [7, 6, 5];

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">PC Information</h1>
                    <div className="flex flex-col sm:flex-row gap-2 order-first md:order-last">
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
                            Add New PC
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search by PC name, department, IP..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                        <select
                            value={ramFilter}
                            onChange={(e) => setRamFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                        >
                             <option value="All">All RAM</option>
                             {ramOptions.filter(o => o !== 'All').map(option => (
                                <option key={option} value={option}>{option}</option>
                             ))}
                        </select>
                        <select
                            value={storageFilter}
                            onChange={(e) => setStorageFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                        >
                            <option value="All">All Storage</option>
                            {storageOptions.filter(o => o !== 'All').map(option => (
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
                
                {selectedPcIds.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-blue-800">
                            {selectedPcIds.length} item(s) selected
                        </p>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setIsStatusModalOpen(true)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 font-semibold"
                            >
                                Update Status
                            </button>
                            <button
                                onClick={handleBulkDeleteRequest}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 font-semibold"
                            >
                                Delete Selected
                            </button>
                        </div>
                    </div>
                )}

                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {floors.map(floor => (
                             <button
                                key={floor}
                                onClick={() => setActiveTab(floor)}
                                className={`${
                                    activeTab === floor
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                {floor}th Floor
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        onChange={handleSelectAll}
                                        checked={sortedPcs.length > 0 && selectedPcIds.length === sortedPcs.length}
                                        aria-label="Select all PCs on this page"
                                    />
                                </th>
                                <SortableHeader<PCInfoEntry> label="IP Address" sortKey="ip" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<PCInfoEntry> label="PC Name" sortKey="pcName" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<PCInfoEntry> label="User Name" sortKey="username" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<PCInfoEntry> label="Department" sortKey="department" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<PCInfoEntry> label="Status" sortKey="status" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedPcs.map((pc) => (
                                <tr key={pc.id} onClick={() => handleViewDetails(pc)} className={`hover:bg-gray-50 cursor-pointer ${selectedPcIds.includes(pc.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            checked={selectedPcIds.includes(pc.id)}
                                            onChange={() => handleSelectOne(pc.id)}
                                            aria-label={`Select PC ${pc.pcName}`}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pc.ip}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pc.pcName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pc.username || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pc.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(pc.status)}`}>
                                            {pc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => handleEdit(pc)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => handleDeleteRequest(pc)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedPcs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No PC information found matching your criteria.
                        </div>
                    )}
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPC ? "Edit PC Information" : "Add New PC"}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <input
                            type="text"
                            name="pcName"
                            value={formData.pcName}
                            onChange={handleChange}
                            placeholder="PC Name"
                            className={`w-full p-2 border rounded-lg transition ${formErrors.pcName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        />
                        {formErrors.pcName && <p className="text-red-500 text-xs mt-1">{formErrors.pcName}</p>}
                    </div>
                    <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Department" className="p-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition" />
                    <div>
                        <input
                            type="text"
                            name="ip"
                            value={formData.ip}
                            onChange={handleChange}
                            placeholder="IP Address"
                            className={`w-full p-2 border rounded-lg transition ${formErrors.ip ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                        />
                        {formErrors.ip && <p className="text-red-500 text-xs mt-1">{formErrors.ip}</p>}
                    </div>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="User Name" className="p-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition" />
                    <input type="text" name="cpu" value={formData.cpu} onChange={handleChange} placeholder="CPU" className="p-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition" />
                    <input type="text" name="motherboard" value={formData.motherboard} onChange={handleChange} placeholder="Motherboard" className="p-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition" />
                    <input type="text" name="ram" value={formData.ram} onChange={handleChange} placeholder="RAM" className="p-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition" />
                    <input type="text" name="storage" value={formData.storage} onChange={handleChange} placeholder="Storage" className="p-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition" />
                    <input type="text" name="monitor" value={formData.monitor} onChange={handleChange} placeholder="Monitor" className="p-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition" />
                    <input type="text" name="os" value={formData.os} onChange={handleChange} placeholder="Operating System" className="p-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition" />
                    <select name="status" value={formData.status} onChange={handleChange} className="p-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white transition">
                        <option value="OK">OK</option>
                        <option value="NO">NO</option>
                        <option value="Repair">Repair</option>
                    </select>
                     <select name="floor" value={formData.floor} onChange={handleChange} className="p-2 border rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white transition">
                        <option value={7}>7th Floor</option>
                        <option value={6}>6th Floor</option>
                        <option value={5}>5th Floor</option>
                    </select>
                </div>

                {pcCustomFields.length > 0 && (
                    <>
                        <hr className="my-6" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Custom Fields</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pcCustomFields.map(field => (
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
                                        className="p-2 border rounded-lg w-full border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition"
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}
                
                 <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingPC ? 'Save Changes' : 'Add PC'}</button>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={!!pcToDelete}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirm PC Deletion"
                message={<p>Are you sure you want to delete the PC entry for <span className="font-semibold">{pcToDelete?.pcName}</span>? This action cannot be undone.</p>}
            />
            
            <ConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleConfirmBulkDelete}
                title="Confirm Bulk Deletion"
                message={<p>Are you sure you want to delete the selected <span className="font-semibold">{selectedPcIds.length}</span> PC entries? This action cannot be undone.</p>}
            />

            <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title={`Update Status for ${selectedPcIds.length} PC(s)`}>
                <div>
                    <label htmlFor="bulk-status-select" className="block text-sm font-medium text-gray-700 mb-2">
                        Select new status:
                    </label>
                    <select
                        id="bulk-status-select"
                        name="status"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as PCInfoEntry['status'])}
                        className="p-2 border rounded w-full"
                    >
                        <option value="OK">OK</option>
                        <option value="NO">NO</option>
                        <option value="Repair">Repair</option>
                    </select>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleConfirmStatusUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Status</button>
                </div>
            </Modal>
            
            <ImportModal<Partial<PCInfoEntry>>
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportPcs}
                assetName="PCs"
                templateHeaders={['department', 'ip', 'pcName', 'username', 'motherboard', 'cpu', 'ram', 'storage', 'monitor', 'os', 'status', 'floor']}
                exampleRow={['IT', '192.168.1.100', 'IT-DEV-01', 'john.doe', 'ASUS B550', 'Ryzen 5 5600X', '16 GB DDR4', '1 TB NVMe SSD', 'Dell 27"', 'Win 11', 'OK', '7']}
            />

            <DetailModal 
                isOpen={!!viewingPC} 
                onClose={() => setViewingPC(null)} 
                title={`${viewingPC?.pcName || 'PC'} Details`}
                data={viewingPC} 
            />
        </>
    );
};
