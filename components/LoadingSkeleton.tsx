import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 6 }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {Array.from({ length: columns }).map((_, i) => (
                                <th key={i} className="px-6 py-3">
                                    <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const CardSkeleton: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
        </div>
    );
};

export const DashboardCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
    );
};

export const ChartSkeleton: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="h-6 bg-gray-300 rounded w-1/3 mb-6 animate-pulse"></div>
            <div className="h-64 bg-gray-100 rounded animate-pulse flex items-end justify-around p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-300 rounded-t"
                        style={{ height: `${Math.random() * 80 + 20}%`, width: '15%' }}
                    ></div>
                ))}
            </div>
        </div>
    );
};

export const FormSkeleton: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-4 animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/4 mb-6"></div>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                    <div className="h-4 bg-gray-300 rounded w-1/6 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>
            ))}
            <div className="flex justify-end gap-2 mt-6">
                <div className="h-10 bg-gray-300 rounded w-20"></div>
                <div className="h-10 bg-gray-300 rounded w-24"></div>
            </div>
        </div>
    );
};

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 5 }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg divide-y divide-gray-200">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 bg-gray-300 rounded w-20"></div>
                </div>
            ))}
        </div>
    );
};

export const PageLoadingSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-300 rounded w-1/4 animate-pulse"></div>
                <div className="h-10 bg-gray-300 rounded w-32 animate-pulse"></div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCardSkeleton />
                <DashboardCardSkeleton />
                <DashboardCardSkeleton />
            </div>
            
            {/* Main Content */}
            <TableSkeleton />
        </div>
    );
};

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({ 
    size = 'md', 
    color = 'border-blue-600' 
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-3'
    };

    return (
        <div className="flex items-center justify-center">
            <div className={`${sizeClasses[size]} ${color} border-t-transparent rounded-full animate-spin`}></div>
        </div>
    );
};

