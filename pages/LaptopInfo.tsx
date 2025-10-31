import React, { useState, useEffect, useMemo } from 'react';
import { LaptopInfoEntry, CustomFieldDef } from '../types';
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
import { buildApiUrl, apiFetch } from '../utils/api';
import { generateUUID } from '../utils/uuid';

const emptyFormState: Omit<LaptopInfoEntry, 'id'> = {
    pcName: '',
    username: '',
    brand: '',
    model: '',
    cpu: '',
    serialNumber: '',
    ram: '',
    storage: '',
    userStatus: '',
    department: '',
    date: '',
    hardwareStatus: 'Good',
    customFields: {},
    depreciation_years: 3
};

export const LaptopInfo: React.FC = () => {
    const [laptops, setLaptops] = useState<LaptopInfoEntry[]>([]);
    const [laptopCustomFields] = useLocalStorage<CustomFieldDef[]>('customFields_laptop', []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingLaptop, setEditingLaptop] = useState<LaptopInfoEntry | null>(null);
    const [formData, setFormData] = useState<Omit<LaptopInfoEntry, 'id'>>(emptyFormState);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [ramFilter, setRamFilter] = useState('All');
    const [storageFilter, setStorageFilter] = useState('All');
    const [brandFilter, setBrandFilter] = useState('All');
    const [laptopToDelete, setLaptopToDelete] = useState<LaptopInfoEntry | null>(null);
    const [selectedLaptopIds, setSelectedLaptopIds] = useState<string[]>([]);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusTypeToUpdate, setStatusTypeToUpdate] = useState<'hardwareStatus' | 'userStatus'>('hardwareStatus');
    const [newStatusValue, setNewStatusValue] = useState<LaptopInfoEntry['hardwareStatus'] | string>('Good');
    const [viewingLaptop, setViewingLaptop] = useState<LaptopInfoEntry | null>(null);

    // Load Laptops with smart caching - INSTANT on 2nd visit!
    useEffect(() => {
        cachedFetch<LaptopInfoEntry[]>('/api/laptops', {
            ttl: CACHE_CONFIG.STATIC_DATA,
            staleWhileRevalidate: true
        }).then(data => setLaptops(data));
    }, []);

    useEffect(() => {
        if (editingLaptop) {
            setFormData(editingLaptop);
        } else {
            setFormData(emptyFormState);
        }
    }, [editingLaptop]);
    
    useEffect(() => {
        setSelectedLaptopIds([]);
    }, [debouncedSearchTerm, ramFilter, storageFilter, brandFilter]);

    const ramOptions = useMemo(() => ['All', ...new Set(laptops.map(laptop => laptop.ram))], [laptops]);
    const storageOptions = useMemo(() => ['All', ...new Set(laptops.map(laptop => laptop.storage))], [laptops]);
    const brandOptions = useMemo(() => ['All', ...new Set(laptops.map(laptop => laptop.brand))], [laptops]);
    
    const handleAddNew = () => {
        setEditingLaptop(null);
        setFormData(emptyFormState);
        setIsModalOpen(true);
    };

    const handleEdit = (laptop: LaptopInfoEntry) => {
        setEditingLaptop(laptop);
        setFormData(laptop);
        setIsModalOpen(true);
    };
    
    const handleViewDetails = (laptop: LaptopInfoEntry) => {
        setViewingLaptop(laptop);
    };

    const handleDeleteRequest = (laptop: LaptopInfoEntry) => {
        setLaptopToDelete(laptop);
    };

    const handleConfirmDelete = async () => {
        if (!laptopToDelete) return;
        await apiFetch(`/api/laptops/${laptopToDelete.id}`, { method: 'DELETE' });
        setLaptops(laptops.filter(laptop => laptop.id !== laptopToDelete.id));
        setLaptopToDelete(null);
        // Invalidate cache so next visit gets fresh data
        invalidateCache(['/api/laptops']);
    };

    const handleCancelDelete = () => {
        setLaptopToDelete(null);
    };

    const handleSave = async () => {
        if (editingLaptop) {
            await apiFetch(`/api/laptops/${editingLaptop.id}`, {
                method: 'PUT',
                body: JSON.stringify(formData),
            });
            setLaptops(laptops.map(laptop => (laptop.id === editingLaptop.id ? { ...formData, id: editingLaptop.id } : laptop)));
        } else {
            const newLaptop = { ...formData, id: generateUUID() };
            await apiFetch('/api/laptops', {
                method: 'POST',
                body: JSON.stringify(newLaptop),
            });
            setLaptops([...laptops, newLaptop]);
        }
        setIsModalOpen(false);
        // Invalidate cache so next visit gets fresh data
        invalidateCache(['/api/laptops']);
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
        const isNumber = e.target.type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumber ? (value ? Number(value) : '') : value }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };
    
    const filteredLaptops = useMemo(() => {
        const searchWords = debouncedSearchTerm.toLowerCase().split(' ').filter(word => word);

        return laptops.filter(laptop => {
            const passesFilters = (ramFilter === 'All' || laptop.ram === ramFilter) &&
                (storageFilter === 'All' || laptop.storage === storageFilter) &&
                (brandFilter === 'All' || laptop.brand === brandFilter);

            if (!passesFilters) return false;

            if (searchWords.length === 0) return true;

            const searchableString = [
                laptop.pcName,
                laptop.brand,
                laptop.model,
                laptop.cpu,
                laptop.serialNumber,
                laptop.department
            ].join(' ').toLowerCase();

            return searchWords.every(word => searchableString.includes(word));
        });
    }, [laptops, debouncedSearchTerm, ramFilter, storageFilter, brandFilter]);
    
    const { sortedItems: sortedLaptops, requestSort, sortConfig } = useSort<LaptopInfoEntry>(filteredLaptops, { key: 'pcName', direction: 'ascending' });
        
    const handleExport = () => {
        exportToCSV(sortedLaptops, 'laptop-info');
    };
    
    const handleImportLaptops = async (data: Partial<LaptopInfoEntry>[]): Promise<{ success: boolean, message: string }> => {
        try {
            const newLaptops: LaptopInfoEntry[] = data.map((laptop, index) => {
                if (!laptop.pcName || !laptop.brand || !laptop.serialNumber) {
                    throw new Error(`Row ${index + 1}: Missing required field (pcName, brand, serialNumber).`);
                }
                 const hardwareStatus = laptop.hardwareStatus && ['Good', 'Battery Problem', 'Platform Problem'].includes(laptop.hardwareStatus) ? laptop.hardwareStatus : 'Good';

                return {
                    ...emptyFormState,
                    ...laptop,
                    id: generateUUID(),
                    hardwareStatus
                };
            });
            
            const addPromises = newLaptops.map(laptop => fetch('/api/laptops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(laptop),
            }));
            await Promise.all(addPromises);
            setLaptops([...laptops, ...newLaptops]);

            return { success: true, message: `Successfully imported ${newLaptops.length} laptops.` };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to import laptops.' };
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedLaptopIds(sortedLaptops.map(laptop => laptop.id));
        } else {
            setSelectedLaptopIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedLaptopIds(prev =>
            prev.includes(id) ? prev.filter(laptopId => laptopId !== id) : [...prev, id]
        );
    };

    const handleBulkDeleteRequest = () => {
        setIsBulkDeleteModalOpen(true);
    };

    const handleConfirmBulkDelete = async () => {
        const deletePromises = selectedLaptopIds.map(id => fetch(`/api/laptops/${id}`, { method: 'DELETE' }));
        await Promise.all(deletePromises);
        setLaptops(laptops.filter(laptop => !selectedLaptopIds.includes(laptop.id)));
        setSelectedLaptopIds([]);
        setIsBulkDeleteModalOpen(false);
    };

    const handleConfirmStatusUpdate = async () => {
        const updatePromises = selectedLaptopIds.map(id => fetch(`/api/laptops/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [statusTypeToUpdate]: newStatusValue }),
        }));
        await Promise.all(updatePromises);
        setLaptops(laptops.map(laptop => (selectedLaptopIds.includes(laptop.id) ? { ...laptop, [statusTypeToUpdate]: newStatusValue } : laptop)));
        setSelectedLaptopIds([]);
        setIsStatusModalOpen(false);
        setStatusTypeToUpdate('hardwareStatus');
        setNewStatusValue('Good');
    };

    const getStatusBadge = (status: 'Good' | 'Battery Problem' | 'Platform Problem') => {
        switch (status) {
            case 'Good': return 'bg-green-100 text-green-800';
            case 'Battery Problem': return 'bg-yellow-100 text-yellow-800';
            case 'Platform Problem': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Laptop Information</h1>
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
                            Add New Laptop
                        </button>
                    </div>
                </div>
                 <div className="mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Search by name, brand, department..."
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
                            value={brandFilter}
                            onChange={(e) => setBrandFilter(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                        >
                             <option value="All">All Brands</option>
                             {brandOptions.filter(o => o !== 'All').map(option => (
                                <option key={option} value={option}>{option}</option>
                             ))}
                        </select>
                    </div>
                </div>

                {selectedLaptopIds.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 my-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-blue-800">
                            {selectedLaptopIds.length} item(s) selected
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

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        onChange={handleSelectAll}
                                        checked={sortedLaptops.length > 0 && selectedLaptopIds.length === sortedLaptops.length}
                                        aria-label="Select all laptops on this page"
                                    />
                                </th>
                                <SortableHeader<LaptopInfoEntry> label="PC Name" sortKey="pcName" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<LaptopInfoEntry> label="User Name" sortKey="username" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<LaptopInfoEntry> label="Brand" sortKey="brand" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<LaptopInfoEntry> label="Department" sortKey="department" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<LaptopInfoEntry> label="Hardware Status" sortKey="hardwareStatus" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedLaptops.map((laptop) => (
                                <tr key={laptop.id} onClick={() => handleViewDetails(laptop)} className={`hover:bg-gray-50 cursor-pointer ${selectedLaptopIds.includes(laptop.id) ? 'bg-blue-50' : ''}`}>
                                     <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            checked={selectedLaptopIds.includes(laptop.id)}
                                            onChange={() => handleSelectOne(laptop.id)}
                                            aria-label={`Select laptop ${laptop.pcName}`}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{laptop.pcName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laptop.username || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laptop.brand}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{laptop.department}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(laptop.hardwareStatus)}`}>
                                            {laptop.hardwareStatus}
                                        </span>
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => handleEdit(laptop)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                        <button onClick={() => handleDeleteRequest(laptop)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedLaptops.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No laptops found matching your criteria.
                        </div>
                    )}
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLaptop ? "Edit Laptop Information" : "Add New Laptop"}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" name="pcName" value={formData.pcName} onChange={handleChange} placeholder="PC Name" className="p-2 border rounded" />
                    <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="User Name" className="p-2 border rounded" />
                    <input type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Brand" className="p-2 border rounded" />
                    <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="Model" className="p-2 border rounded" />
                    <input type="text" name="cpu" value={formData.cpu} onChange={handleChange} placeholder="CPU" className="p-2 border rounded" />
                    <input type="text" name="serialNumber" value={formData.serialNumber} onChange={handleChange} placeholder="Serial Number" className="p-2 border rounded" />
                    <input type="text" name="ram" value={formData.ram} onChange={handleChange} placeholder="RAM" className="p-2 border rounded" />
                    <input type="text" name="storage" value={formData.storage} onChange={handleChange} placeholder="Storage" className="p-2 border rounded" />
                    <input type="text" name="userStatus" value={formData.userStatus} onChange={handleChange} placeholder="User Status" className="p-2 border rounded" />
                    <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Department" className="p-2 border rounded" />
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="p-2 border rounded" />
                    <select name="hardwareStatus" value={formData.hardwareStatus} onChange={handleChange} className="p-2 border rounded md:col-span-2">
                        <option value="Good">Good</option>
                        <option value="Battery Problem">Battery Problem</option>
                        <option value="Platform Problem">Platform Problem</option>
                    </select>
                </div>

                {/* Cost Management Fields */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">💰 Cost Information (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="number" name="purchase_cost" value={formData.purchase_cost || ''} onChange={handleChange} placeholder="Purchase Cost (৳)" className="p-2 border rounded" />
                        <input type="date" name="purchase_date" value={formData.purchase_date || ''} onChange={handleChange} className="p-2 border rounded" />
                        <input type="date" name="warranty_end" value={formData.warranty_end || ''} onChange={handleChange} placeholder="Warranty End Date" className="p-2 border rounded" />
                        <input type="text" name="supplier" value={formData.supplier || ''} onChange={handleChange} placeholder="Supplier/Vendor" className="p-2 border rounded" />
                    </div>
                </div>

                {laptopCustomFields.length > 0 && (
                    <>
                        <hr className="my-6" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Custom Fields</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {laptopCustomFields.map(field => (
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
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingLaptop ? 'Save Changes' : 'Add Laptop'}</button>
                </div>
            </Modal>

            <ConfirmationModal
                isOpen={!!laptopToDelete}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                title="Confirm Laptop Deletion"
                message={<p>Are you sure you want to delete the laptop entry for <span className="font-semibold">{laptopToDelete?.pcName}</span>? This action cannot be undone.</p>}
            />

            <ConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={handleConfirmBulkDelete}
                title="Confirm Bulk Deletion"
                message={<p>Are you sure you want to delete the selected <span className="font-semibold">{selectedLaptopIds.length}</span> laptop entries? This action cannot be undone.</p>}
            />

            <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title={`Update Status for ${selectedLaptopIds.length} Laptop(s)`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="status-type-select" className="block text-sm font-medium text-gray-700 mb-2">
                            Status Type to Update:
                        </label>
                        <select
                            id="status-type-select"
                            value={statusTypeToUpdate}
                            onChange={(e) => {
                                const newType = e.target.value as 'hardwareStatus' | 'userStatus';
                                setStatusTypeToUpdate(newType);
                                setNewStatusValue(newType === 'hardwareStatus' ? 'Good' : '');
                            }}
                            className="p-2 border rounded w-full bg-white"
                        >
                            <option value="hardwareStatus">Hardware Status</option>
                            <option value="userStatus">User Status</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="bulk-status-value" className="block text-sm font-medium text-gray-700 mb-2">
                            New Status:
                        </label>
                        {statusTypeToUpdate === 'hardwareStatus' ? (
                            <select
                                id="bulk-status-value"
                                value={newStatusValue}
                                onChange={(e) => setNewStatusValue(e.target.value)}
                                className="p-2 border rounded w-full bg-white"
                            >
                                <option value="Good">Good</option>
                                <option value="Battery Problem">Battery Problem</option>
                                <option value="Platform Problem">Platform Problem</option>
                            </select>
                        ) : (
                            <input
                                id="bulk-status-value"
                                type="text"
                                value={newStatusValue}
                                onChange={(e) => setNewStatusValue(e.target.value)}
                                placeholder="Enter user status"
                                className="p-2 border rounded w-full"
                            />
                        )}
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleConfirmStatusUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Status</button>
                </div>
            </Modal>
            
            <ImportModal<Partial<LaptopInfoEntry>>
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportLaptops}
                assetName="Laptops"
                templateHeaders={['pcName', 'username', 'brand', 'model', 'cpu', 'serialNumber', 'ram', 'storage', 'userStatus', 'department', 'date', 'hardwareStatus']}
                exampleRow={['LT-HR-05', 'jane.smith', 'HP', 'Elitebook 840', 'Core i7-11th Gen', 'SN12345XYZ', '16 GB', '512 GB SSD', 'GOOD', 'HR', '2023-10-26', 'Good']}
            />
            
            <DetailModal 
                isOpen={!!viewingLaptop} 
                onClose={() => setViewingLaptop(null)} 
                title={`${viewingLaptop?.pcName || 'Laptop'} Details`}
                data={viewingLaptop} 
            />
        </>
    );
};
