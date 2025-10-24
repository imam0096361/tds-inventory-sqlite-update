import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { CustomFieldDef } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface CustomFieldManagerProps {
  title: string;
  storageKey: string;
}

const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({ title, storageKey }) => {
    const [fields, setFields] = useLocalStorage<CustomFieldDef[]>(storageKey, []);
    const [newFieldName, setNewFieldName] = useState('');
    const [fieldToDelete, setFieldToDelete] = useState<CustomFieldDef | null>(null);

    const handleAddField = () => {
        if (newFieldName.trim() === '') return;
        
        const newField: CustomFieldDef = {
            id: newFieldName.trim().toLowerCase().replace(/\s+/g, '_'),
            name: newFieldName.trim()
        };

        if (fields.some(f => f.id === newField.id)) {
            alert('A field with this name (or a similar one) already exists.');
            return;
        }

        setFields(prev => [...prev, newField]);
        setNewFieldName('');
    };

    const handleDelete = (field: CustomFieldDef) => {
        setFieldToDelete(field);
    };

    const confirmDelete = () => {
        if (!fieldToDelete) return;
        setFields(prev => prev.filter(f => f.id !== fieldToDelete.id));
        setFieldToDelete(null);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="New field name (e.g., Warranty End Date)"
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button onClick={handleAddField} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Add Field
                </button>
            </div>
            <div>
                <h3 className="font-semibold text-gray-700 mb-2">Existing Fields:</h3>
                {fields.length > 0 ? (
                    <ul className="space-y-2">
                        {fields.map(field => (
                            <li key={field.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                <span className="text-gray-800">{field.name}</span>
                                <button onClick={() => handleDelete(field)} className="text-red-500 hover:text-red-700 font-semibold text-sm">
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-sm">No custom fields defined yet.</p>
                )}
            </div>
             <ConfirmationModal
                isOpen={!!fieldToDelete}
                onClose={() => setFieldToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirm Field Deletion"
                message={<>Are you sure you want to delete the field "<span className="font-semibold">{fieldToDelete?.name}</span>"? This will not remove the data from existing assets, but the field will no longer be visible or editable.</>}
            />
        </div>
    );
};


export const Settings: React.FC = () => {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            <div>
                <CustomFieldManager title="PC Custom Fields" storageKey="customFields_pc" />
                <CustomFieldManager title="Laptop Custom Fields" storageKey="customFields_laptop" />
                <CustomFieldManager title="Server Custom Fields" storageKey="customFields_server" />
            </div>
        </div>
    );
};
