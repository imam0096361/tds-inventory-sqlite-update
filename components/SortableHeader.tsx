import React from 'react';
import { SortConfig } from '../hooks/useSort';
import { ArrowUpIcon, ArrowDownIcon } from './Icons';

interface SortableHeaderProps<T> {
    label: string;
    sortKey: keyof T;
    sortConfig: SortConfig<T> | null;
    requestSort: (key: keyof T) => void;
    className?: string;
}

export const SortableHeader = <T extends object>({
    label,
    sortKey,
    sortConfig,
    requestSort,
    className = '',
}: SortableHeaderProps<T>) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : undefined;

    return (
        <th
            scope="col"
            className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className}`}
            onClick={() => requestSort(sortKey)}
            aria-sort={isSorted ? (direction === 'ascending' ? 'ascending' : 'descending') : 'none'}
        >
            <div className="flex items-center gap-1">
                <span>{label}</span>
                <span className="w-4 h-4 text-gray-400">
                  {isSorted && (direction === 'ascending' ? <ArrowUpIcon /> : <ArrowDownIcon />)}
                </span>
            </div>
        </th>
    );
};
