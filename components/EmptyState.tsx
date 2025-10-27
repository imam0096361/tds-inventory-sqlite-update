import React from 'react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    secondaryAction
}) => {
    const defaultIcon = (
        <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
    );

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl shadow-lg min-h-[400px]">
            <div className="mb-4">
                {icon || defaultIcon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-6 max-w-md">{description}</p>
            <div className="flex gap-3">
                {action && (
                    <button
                        onClick={action.onClick}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                        {action.label}
                    </button>
                )}
                {secondaryAction && (
                    <button
                        onClick={secondaryAction.onClick}
                        className="bg-gray-200 text-gray-800 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        {secondaryAction.label}
                    </button>
                )}
            </div>
        </div>
    );
};

export const NoDataIcon: React.FC = () => (
    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const NoSearchResultsIcon: React.FC = () => (
    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const NoInventoryIcon: React.FC = () => (
    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

export const NoLogsIcon: React.FC = () => (
    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);

export const ErrorStateIcon: React.FC = () => (
    <svg className="w-16 h-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Pre-built empty states for common scenarios
export const EmptyInventoryState: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => (
    <EmptyState
        icon={<NoInventoryIcon />}
        title="No inventory items yet"
        description="Get started by adding your first item to the inventory. You can add items manually or import them from a CSV file."
        action={{ label: "Add First Item", onClick: onAddClick }}
    />
);

export const EmptySearchState: React.FC<{ onClearSearch: () => void }> = ({ onClearSearch }) => (
    <EmptyState
        icon={<NoSearchResultsIcon />}
        title="No results found"
        description="We couldn't find any items matching your search criteria. Try adjusting your filters or search terms."
        action={{ label: "Clear Search", onClick: onClearSearch }}
    />
);

export const EmptyLogsState: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => (
    <EmptyState
        icon={<NoLogsIcon />}
        title="No service logs yet"
        description="Start tracking your peripheral distributions and service history by adding your first log entry."
        action={{ label: "Add First Log", onClick: onAddClick }}
    />
);

export const ErrorState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
    <EmptyState
        icon={<ErrorStateIcon />}
        title="Something went wrong"
        description="We encountered an error while loading the data. Please try again or contact support if the problem persists."
        action={onRetry ? { label: "Try Again", onClick: onRetry } : undefined}
    />
);

