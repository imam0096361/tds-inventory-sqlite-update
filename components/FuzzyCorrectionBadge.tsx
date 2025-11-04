/**
 * Fuzzy Correction Badge Component
 * Displays auto-corrections with confidence scores and match methods
 */

import React from 'react';

interface FuzzyCorrection {
    field: string;
    original: string;
    corrected: string;
    confidence: number;
    method?: string;
}

interface FuzzyCorrectionBadgeProps {
    corrections: FuzzyCorrection[];
}

export const FuzzyCorrectionBadge: React.FC<FuzzyCorrectionBadgeProps> = ({ corrections }) => {
    if (!corrections || corrections.length === 0) return null;

    const getMethodIcon = (method?: string) => {
        const icons: { [key: string]: string } = {
            'exact_case_fix': '✏️',
            'database_trigram': '🎯',
            'bengali_normalization': '🇧🇩',
            'phonetic': '🔊',
            'fuzzy': '🔍',
            'contains': '📝',
        };
        return icons[method || 'fuzzy'] || '🔄';
    };

    const getMethodName = (method?: string) => {
        const names: { [key: string]: string } = {
            'exact_case_fix': 'Case Fix',
            'database_trigram': 'Fuzzy Match',
            'bengali_normalization': 'Bengali Name',
            'phonetic': 'Sounds Like',
            'fuzzy': 'Similar',
            'contains': 'Partial Match',
        };
        return names[method || 'fuzzy'] || 'Auto-correct';
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 90) return 'bg-green-100 text-green-800 border-green-300';
        if (confidence >= 70) return 'bg-blue-100 text-blue-800 border-blue-300';
        if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        return 'bg-gray-100 text-gray-800 border-gray-300';
    };

    return (
        <div className="mb-4 space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">
                ✨ Auto-corrections applied:
            </div>
            {corrections.map((correction, index) => (
                <div
                    key={index}
                    className={`
                        p-3 rounded-lg border-2 transition-all duration-200
                        ${getConfidenceColor(correction.confidence)}
                        hover:shadow-md
                    `}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">
                                    {getMethodIcon(correction.method)}
                                </span>
                                <span className="font-semibold capitalize">
                                    {correction.field}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">
                                    {getMethodName(correction.method)}
                                </span>
                            </div>
                            <div className="text-sm ml-7">
                                <span className="line-through opacity-60">
                                    "{correction.original}"
                                </span>
                                <span className="mx-2">→</span>
                                <span className="font-medium">
                                    "{correction.corrected}"
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="text-lg font-bold">
                                {correction.confidence}%
                            </div>
                            <div className="text-xs opacity-75">
                                confidence
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * Alternative Queries Component
 * Shows when no results found
 */
interface AlternativeQueriesProps {
    message: string;
    suggestions: string[];
    alternativeQueries: string[];
    onSelectQuery: (query: string) => void;
}

export const AlternativeQueries: React.FC<AlternativeQueriesProps> = ({
    message,
    suggestions,
    alternativeQueries,
    onSelectQuery,
}) => {
    return (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl">🔍</div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Results Found
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line">
                        {message}
                    </p>
                </div>
            </div>

            {alternativeQueries.length > 0 && (
                <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                        💡 Try these instead:
                    </div>
                    <div className="space-y-2">
                        {alternativeQueries.map((altQuery, index) => (
                            <button
                                key={index}
                                onClick={() => onSelectQuery(altQuery)}
                                className="
                                    w-full text-left px-4 py-2 rounded-lg
                                    bg-white border border-orange-200
                                    hover:bg-orange-50 hover:border-orange-300
                                    transition-all duration-150
                                    text-sm text-gray-700
                                "
                            >
                                <span className="mr-2">→</span>
                                {altQuery}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Query Intent Badge
 * Shows detected query intent
 */
interface QueryIntentBadgeProps {
    intent: string;
    confidence: number;
}

export const QueryIntentBadge: React.FC<QueryIntentBadgeProps> = ({ intent, confidence }) => {
    const getIntentIcon = (intent: string) => {
        const icons: { [key: string]: string } = {
            'user_search': '👤',
            'equipment_search': '💻',
            'status_check': '🔧',
            'department_search': '🏢',
            'unknown': '❓',
        };
        return icons[intent] || '❓';
    };

    const getIntentLabel = (intent: string) => {
        const labels: { [key: string]: string } = {
            'user_search': 'User Search',
            'equipment_search': 'Equipment Search',
            'status_check': 'Status Check',
            'department_search': 'Department Search',
            'unknown': 'General Query',
        };
        return labels[intent] || 'Query';
    };

    if (confidence < 30) return null; // Don't show if low confidence

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium">
            <span>{getIntentIcon(intent)}</span>
            <span>{getIntentLabel(intent)}</span>
            <span className="opacity-60">({confidence}%)</span>
        </div>
    );
};
