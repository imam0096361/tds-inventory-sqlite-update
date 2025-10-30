import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { CustomFieldDef } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl } from '../utils/api';

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


const PasswordChangeSection: React.FC = () => {
    const { user, token } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validatePassword = (password: string): string | null => {
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (!/[A-Za-z]/.test(password)) {
            return 'Password must contain at least one letter';
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            return;
        }

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(buildApiUrl('/api/auth/change-password'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to change password');
            }

            setSuccess('✅ Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(''), 5000);
        } catch (err: any) {
            setError(err.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <div className="flex items-center mb-6">
                <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
                    <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg flex items-start">
                    <svg className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                        <p className="text-green-800 font-semibold text-sm">{success}</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg flex items-start">
                    <svg className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                        <p className="text-red-800 font-semibold text-sm">{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password *
                    </label>
                    <input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        placeholder="Enter your current password"
                        disabled={loading}
                        required
                    />
                </div>

                {/* New Password */}
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password *
                    </label>
                    <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        placeholder="Enter your new password"
                        disabled={loading}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Must be at least 6 characters with letters and numbers
                    </p>
                </div>

                {/* Confirm Password */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password *
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        placeholder="Confirm your new password"
                        disabled={loading}
                        required
                    />
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Changing...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Change Password
                            </>
                        )}
                    </button>
                    
                    {(currentPassword || newPassword || confirmPassword) && !loading && (
                        <button
                            type="button"
                            onClick={() => {
                                setCurrentPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                                setError('');
                                setSuccess('');
                            }}
                            className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            {/* User Info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                    Logged in as: <span className="font-semibold text-gray-800">{user?.fullName}</span> ({user?.username})
                </p>
            </div>
        </div>
    );
};

export const Settings: React.FC = () => {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
            
            {/* Password Change Section */}
            <PasswordChangeSection />

            {/* Custom Fields Section */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Custom Fields Management</h2>
                <CustomFieldManager title="PC Custom Fields" storageKey="customFields_pc" />
                <CustomFieldManager title="Laptop Custom Fields" storageKey="customFields_laptop" />
                <CustomFieldManager title="Server Custom Fields" storageKey="customFields_server" />
            </div>
        </div>
    );
};
