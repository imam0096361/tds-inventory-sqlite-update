import React, { useState, useMemo, useEffect } from 'react';
import { PeripheralLogEntry } from '../types';
import { Modal } from '../components/Modal';
import { BoxIcon, ImportIcon } from '../components/Icons';
import { ImportModal } from '../components/ImportModal';
import { useSort } from '../hooks/useSort';
import { SortableHeader } from '../components/SortableHeader';
import { buildApiUrl, apiFetch } from '../utils/api';

type Category = 'Mouse' | 'Keyboard' | 'SSD' | 'Headphone' | 'Portable HDD';

interface ProductSummary {
    name: string;
    category: Category;
    total: number;
    used: number;
    available: number;
}

interface AddStockFormData {
    category: Category;
    productName: string;
    serialNumbers: string;
    comment: string;
}

const emptyStockForm: AddStockFormData = {
    category: 'Mouse',
    productName: '',
    serialNumbers: '',
    comment: 'New stock registration'
};

export const ProductInventory: React.FC = () => {
    const [mouseLogs, setMouseLogs] = useState<PeripheralLogEntry[]>([]);
    const [keyboardLogs, setKeyboardLogs] = useState<PeripheralLogEntry[]>([]);
    const [ssdLogs, setSsdLogs] = useState<PeripheralLogEntry[]>([]);
    const [headphoneLogs, setHeadphoneLogs] = useState<PeripheralLogEntry[]>([]);
    const [hddLogs, setHddLogs] = useState<PeripheralLogEntry[]>([]);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [stockFormData, setStockFormData] = useState<AddStockFormData>(emptyStockForm);
    const [formErrors, setFormErrors] = useState<{productName?: string, serialNumbers?: string}>({});
    const [loading, setLoading] = useState(true);

    // Fetch all peripheral logs from API
    useEffect(() => {
        const fetchAllLogs = async () => {
            try {
                const [mouseData, keyboardData, ssdData, headphoneData, hddData] = await Promise.all([
                    apiFetch('/api/mouselogs'),
                    apiFetch('/api/keyboardlogs'),
                    apiFetch('/api/ssdlogs'),
                    apiFetch('/api/headphonelogs'),
                    apiFetch('/api/portablehddlogs')
                ]);

                setMouseLogs(mouseData);
                setKeyboardLogs(keyboardData);
                setSsdLogs(ssdData);
                setHeadphoneLogs(headphoneData);
                setHddLogs(hddData);
            } catch (error) {
                console.error('Error fetching peripheral logs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllLogs();
    }, []);

    const productSummaries = useMemo<ProductSummary[]>(() => {
        const allLogs = [
            ...mouseLogs.map(log => ({ ...log, category: 'Mouse' as Category })),
            ...keyboardLogs.map(log => ({ ...log, category: 'Keyboard' as Category })),
            ...ssdLogs.map(log => ({ ...log, category: 'SSD' as Category })),
            ...headphoneLogs.map(log => ({ ...log, category: 'Headphone' as Category })),
            ...hddLogs.map(log => ({ ...log, category: 'Portable HDD' as Category })),
        ];

        const groupedByName = allLogs.reduce((acc, log) => {
            if (!acc[log.productName]) {
                acc[log.productName] = [];
            }
            acc[log.productName].push(log);
            return acc;
        }, {} as Record<string, (PeripheralLogEntry & { category: Category })[]>);

        return Object.entries(groupedByName).map(([name, logs]) => {
            const total = logs.length;
            // FIXED: An item is "used" only if it's assigned to a PC/User (has pcName OR pcUsername with actual values)
            // Items with empty pcName AND empty pcUsername are "available" (in stock, not assigned)
            const used = logs.filter(log => {
                const hasPcName = log.pcName && log.pcName.trim() !== '';
                const hasUsername = log.pcUsername && log.pcUsername.trim() !== '';
                return hasPcName || hasUsername;
            }).length;
            return {
                name,
                category: logs[0].category, // Assume all products with the same name have the same category
                total,
                used,
                available: total - used,
            };
        });
    }, [mouseLogs, keyboardLogs, ssdLogs, headphoneLogs, hddLogs]);

    const { sortedItems: sortedSummaries, requestSort, sortConfig } = useSort<ProductSummary>(productSummaries, { key: 'name', direction: 'ascending' });
    
    const handleAddStockClick = () => {
        setStockFormData(emptyStockForm);
        setFormErrors({});
        setIsStockModalOpen(true);
    };

    const handleStockFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setStockFormData(prev => ({ ...prev, [name]: value }));
        if(formErrors[name as keyof typeof formErrors] && value.trim()){
            setFormErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[name as keyof typeof newErrors];
                return newErrors;
            });
        }
    };
    
    const validateStockForm = (): boolean => {
        const errors: {productName?: string, serialNumbers?: string} = {};
        if(!stockFormData.productName.trim()){
            errors.productName = "Product name is required.";
        }
        if(!stockFormData.serialNumbers.trim()){
            errors.serialNumbers = "At least one serial number is required.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }

    const handleSaveStock = async () => {
        if(!validateStockForm()) return;

        const serials = stockFormData.serialNumbers.split('\n').map(s => s.trim()).filter(Boolean);

        const newEntries: PeripheralLogEntry[] = serials.map((serial, index) => ({
            id: crypto.randomUUID(),
            productName: stockFormData.productName,
            serialNumber: serial,
            pcName: '',
            pcUsername: '',
            department: '',
            date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
            time: '',
            servicedBy: 'Admin',
            comment: stockFormData.comment,
        }));

        try {
            let apiEndpoint = '';
            switch (stockFormData.category) {
                case 'Mouse':
                    apiEndpoint = '/api/mouselogs';
                    break;
                case 'Keyboard':
                    apiEndpoint = '/api/keyboardlogs';
                    break;
                case 'SSD':
                    apiEndpoint = '/api/ssdlogs';
                    break;
                case 'Headphone':
                    apiEndpoint = '/api/headphonelogs';
                    break;
                case 'Portable HDD':
                    apiEndpoint = '/api/portablehddlogs';
                    break;
            }

            // Add each entry via API
            for (const entry of newEntries) {
                await apiFetch(apiEndpoint, {
                    method: 'POST',
                    body: JSON.stringify(entry),
                });
            }

            // Update local state
            switch (stockFormData.category) {
                case 'Mouse':
                    setMouseLogs(prev => [...prev, ...newEntries]);
                    break;
                case 'Keyboard':
                    setKeyboardLogs(prev => [...prev, ...newEntries]);
                    break;
                case 'SSD':
                    setSsdLogs(prev => [...prev, ...newEntries]);
                    break;
                case 'Headphone':
                    setHeadphoneLogs(prev => [...prev, ...newEntries]);
                    break;
                case 'Portable HDD':
                    setHddLogs(prev => [...prev, ...newEntries]);
                    break;
            }

            setIsStockModalOpen(false);
        } catch (error) {
            console.error('Error adding stock:', error);
            alert('Failed to add stock. Please try again.');
        }
    };
    
    const handleImportStock = async (data: { productName: string; serialNumber: string; category: string; comment: string }[]): Promise<{ success: boolean, message: string }> => {
        try {
            const newMouseEntries: PeripheralLogEntry[] = [];
            const newKeyboardEntries: PeripheralLogEntry[] = [];
            const newSsdEntries: PeripheralLogEntry[] = [];
            const newHeadphoneEntries: PeripheralLogEntry[] = [];
            const newHddEntries: PeripheralLogEntry[] = [];

            data.forEach((item, index) => {
                if (!item.productName || !item.serialNumber || !item.category) {
                    throw new Error(`Row ${index + 1}: Missing required field (productName, serialNumber, category).`);
                }

                const category = item.category.trim();
                if (!['Mouse', 'Keyboard', 'SSD', 'Headphone', 'Portable HDD'].includes(category)) {
                    throw new Error(`Row ${index + 1}: Invalid category "${category}". Must be one of 'Mouse', 'Keyboard', 'SSD', 'Headphone', 'Portable HDD'.`);
                }

                const newEntry: PeripheralLogEntry = {
                    id: crypto.randomUUID(),
                    productName: item.productName.trim(),
                    serialNumber: item.serialNumber.trim(),
                    pcName: '',
                    pcUsername: '',
                    department: '',
                    date: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD
                    time: '',
                    servicedBy: 'Admin',
                    comment: item.comment?.trim() || 'Imported via CSV',
                };

                if (category === 'Mouse') newMouseEntries.push(newEntry);
                if (category === 'Keyboard') newKeyboardEntries.push(newEntry);
                if (category === 'SSD') newSsdEntries.push(newEntry);
                if (category === 'Headphone') newHeadphoneEntries.push(newEntry);
                if (category === 'Portable HDD') newHddEntries.push(newEntry);
            });

            // Add all entries via API
            const addPromises: Promise<any>[] = [];
            
            newMouseEntries.forEach(entry => {
                addPromises.push(fetch('/api/mouselogs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry),
                }));
            });

            newKeyboardEntries.forEach(entry => {
                addPromises.push(fetch('/api/keyboardlogs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry),
                }));
            });

            newSsdEntries.forEach(entry => {
                addPromises.push(fetch('/api/ssdlogs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry),
                }));
            });

            newHeadphoneEntries.forEach(entry => {
                addPromises.push(fetch('/api/headphonelogs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry),
                }));
            });

            newHddEntries.forEach(entry => {
                addPromises.push(fetch('/api/portablehddlogs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry),
                }));
            });

            await Promise.all(addPromises);

            // Update local state
            if (newMouseEntries.length > 0) setMouseLogs(prev => [...prev, ...newMouseEntries]);
            if (newKeyboardEntries.length > 0) setKeyboardLogs(prev => [...prev, ...newKeyboardEntries]);
            if (newSsdEntries.length > 0) setSsdLogs(prev => [...prev, ...newSsdEntries]);
            if (newHeadphoneEntries.length > 0) setHeadphoneLogs(prev => [...prev, ...newHeadphoneEntries]);
            if (newHddEntries.length > 0) setHddLogs(prev => [...prev, ...newHddEntries]);

            return { success: true, message: `Successfully imported ${data.length} items.` };
        } catch (error: any) {
            return { success: false, message: error.message || 'Failed to import stock.' };
        }
    };

    const getCategoryBadgeColor = (category: Category) => {
        switch (category) {
            case 'Mouse': return 'bg-blue-100 text-blue-800';
            case 'Keyboard': return 'bg-purple-100 text-purple-800';
            case 'SSD': return 'bg-green-100 text-green-800';
            case 'Headphone': return 'bg-yellow-100 text-yellow-800';
            case 'Portable HDD': return 'bg-indigo-100 text-indigo-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading product inventory...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">Product Inventory</h1>
                    <div className="flex flex-col sm:flex-row gap-2 self-start md:self-auto">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <ImportIcon />
                            <span>Import Stock</span>
                        </button>
                        <button
                            onClick={handleAddStockClick}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <BoxIcon />
                            <span>Add New Stock</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <SortableHeader<ProductSummary> label="Product Name" sortKey="name" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<ProductSummary> label="Category" sortKey="category" sortConfig={sortConfig} requestSort={requestSort} className="text-left" />
                                <SortableHeader<ProductSummary> label="Total" sortKey="total" sortConfig={sortConfig} requestSort={requestSort} className="text-center" />
                                <SortableHeader<ProductSummary> label="Used" sortKey="used" sortConfig={sortConfig} requestSort={requestSort} className="text-center" />
                                <SortableHeader<ProductSummary> label="Available" sortKey="available" sortConfig={sortConfig} requestSort={requestSort} className="text-center" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedSummaries.map((product) => (
                                <tr key={product.name} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCategoryBadgeColor(product.category)}`}>
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center font-semibold">{product.total}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 text-center font-semibold">{product.used}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-center font-bold">{product.available}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedSummaries.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No peripheral products found. Add some stock to get started.
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title="Add New Stock in Bulk">
                <div className="space-y-4">
                     <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            id="category"
                            name="category"
                            value={stockFormData.category}
                            onChange={handleStockFormChange}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Mouse">Mouse</option>
                            <option value="Keyboard">Keyboard</option>
                            <option value="SSD">SSD</option>
                            <option value="Headphone">Headphone</option>
                            <option value="Portable HDD">Portable HDD</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="productName" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input
                            type="text"
                            id="productName"
                            name="productName"
                            value={stockFormData.productName}
                            onChange={handleStockFormChange}
                            placeholder="e.g., A4TECH OP-330 USB Wired Mouse"
                            className={`w-full p-2 border rounded-lg transition ${formErrors.productName ? 'border-red-500' : 'border-gray-300'}`}
                        />
                         {formErrors.productName && <p className="text-red-500 text-xs mt-1">{formErrors.productName}</p>}
                    </div>
                     <div>
                        <label htmlFor="serialNumbers" className="block text-sm font-medium text-gray-700 mb-1">Serial Numbers</label>
                        <textarea
                            id="serialNumbers"
                            name="serialNumbers"
                            value={stockFormData.serialNumbers}
                            onChange={handleStockFormChange}
                            placeholder="Enter one serial number per line"
                            className={`w-full p-2 border rounded-lg transition ${formErrors.serialNumbers ? 'border-red-500' : 'border-gray-300'}`}
                            rows={5}
                        ></textarea>
                        {formErrors.serialNumbers && <p className="text-red-500 text-xs mt-1">{formErrors.serialNumbers}</p>}
                    </div>
                     <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Comment (Optional)</label>
                        <input
                            type="text"
                            id="comment"
                            name="comment"
                            value={stockFormData.comment}
                            onChange={handleStockFormChange}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSaveStock} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Stock</button>
                </div>
            </Modal>
            
            <ImportModal<{ productName: string; serialNumber: string; category: string; comment: string }>
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImportStock}
                assetName="Product Stock"
                templateHeaders={['productName', 'serialNumber', 'category', 'comment']}
                exampleRow={['A4TECH OP-330 Mouse', 'SNMOUSE12345', 'Mouse', 'New stock registration']}
            />
        </>
    );
};
