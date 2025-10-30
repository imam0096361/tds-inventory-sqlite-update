import React, { useState, useEffect } from 'react';
import { AIQueryResponse, AIQueryHistory, AIInsight, AIRecommendation } from '../types';
import { exportToCSV } from '../utils/export';
import { exportToPDF } from '../utils/advancedExport';
import { useAuth } from '../contexts/AuthContext';
import { useAISuggestions } from '../hooks/useAISuggestions';
import { buildApiUrl, apiFetch } from '../utils/api';
import { generateUUID } from '../utils/uuid';

export const AIAssistant: React.FC = () => {
    const { token } = useAuth();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<AIQueryResponse | null>(null);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<AIQueryHistory[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    // Autocomplete suggestions
    const { suggestions } = useAISuggestions(query, showSuggestions);

    // Load query history from localStorage
    useEffect(() => {
        const savedHistory = localStorage.getItem('ai_query_history');
        if (savedHistory) {
            setHistory(JSON.parse(savedHistory));
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!query.trim()) {
            setError('Please enter a query');
            return;
        }

        setLoading(true);
        setError('');
        setResponse(null);

        try {
            const data = await apiFetch('/api/ai-query', {
                method: 'POST',
                body: JSON.stringify({ query: query.trim() })
            });

            setResponse(data);

            // Save to history
            const newHistoryItem: AIQueryHistory = {
                id: generateUUID(),
                query: query.trim(),
                timestamp: new Date().toISOString(),
                resultCount: data.resultCount || 0,
                module: data.module
            };

            const updatedHistory = [newHistoryItem, ...history].slice(0, 10); // Keep last 10
            setHistory(updatedHistory);
            localStorage.setItem('ai_query_history', JSON.stringify(updatedHistory));

        } catch (err: any) {
            console.error('AI Query Error:', err);
            setError(err.message || 'Failed to process your query. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (response && response.data) {
            // Handle multi-module response
            if (response.module === 'all') {
                // Export each module separately or combine
                const data = response.data as Record<string, any[]>;
                const allData = Object.entries(data).flatMap(([module, items]) => 
                    items.map(item => ({ ...item, _module: module }))
                );
                exportToCSV(allData, `ai-query-all-results-${Date.now()}`);
            } else {
                // Single module
                exportToCSV(response.data as any[], `ai-query-results-${Date.now()}`);
            }
        }
    };

    const handleExportPDF = () => {
        if (response && response.data) {
            exportToPDF(response, {
                query: query,
                timestamp: new Date().toISOString()
            });
        }
    };

    const handleRecommendationClick = (recommendation: AIRecommendation) => {
        if (recommendation.action === 'export_pdf') {
            handleExportPDF();
        } else if (recommendation.action === 'export_csv') {
            handleExportCSV();
        } else if (recommendation.action === 'run_query' && recommendation.query) {
            setQuery(recommendation.query);
            setError('');
            setResponse(null);
        }
    };

    const handleSuggestionClick = (suggestionText: string) => {
        setQuery(suggestionText);
        setShowSuggestions(false);
        setError('');
        setResponse(null);
    };

    const handleHistoryClick = (historyQuery: string) => {
        setQuery(historyQuery);
        setError('');
        setResponse(null);
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('ai_query_history');
    };

    const exampleQueries = [
        // Cross-module queries (NEW!)
        "Show me everything about user John Doe",
        "What equipment does Sarah Wilson have",
        "Find all items for user Karim",
        "Show me all things for Michael Chen",
        // Specific queries
        "Show me all PCs with Core i7 and 8GB RAM",
        "I need core i7 all pc there 8 gb ram",
        "Find laptops in HR department with battery problems",
        "List all servers that are offline",
        "Show me all PCs that need repair",
        "Find all mice distributed in IT department",
        "Dell laptops with i5 processor",
        "PCs on floor 5 with 16GB RAM",
        "Show all headphones serviced",
        "Portable HDDs in IT department",
        "All PCs with Windows 11",
        "Lenovo laptops with good hardware"
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">AI Inventory Assistant</h1>
                        <p className="text-blue-100 mt-2">Ask me anything about your IT inventory in plain English</p>
                    </div>
                </div>
            </div>

            {/* Query Input */}
            <div className="bg-white rounded-xl shadow-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                            💬 What would you like to know?
                        </label>
                        <textarea
                            id="query"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder="e.g., Show me all PCs with Core i7 and 8GB RAM"
                            className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                            rows={3}
                            disabled={loading}
                        />
                        
                        {/* Autocomplete Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion.id}
                                        type="button"
                                        onClick={() => handleSuggestionClick(suggestion.text)}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                    >
                                        <span className="text-2xl">{suggestion.icon}</span>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">{suggestion.text}</div>
                                            <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start">
                            <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-red-800 font-semibold">{error}</p>
                                <p className="text-red-600 text-sm mt-1">Please try rephrasing your question or check the examples below.</p>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                            loading || !query.trim()
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Ask AI</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Example Queries */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">💡 Try these examples:</h3>
                    <div className="flex flex-wrap gap-2">
                        {exampleQueries.map((example, idx) => (
                            <button
                                key={idx}
                                onClick={() => setQuery(example)}
                                className="text-sm px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                                disabled={loading}
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Helpful Tips */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">✨ Tips for better results:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span><strong>Be specific:</strong> "PCs with i7 and 8GB RAM" instead of just "PCs"</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span><strong>Use natural language:</strong> "I need all laptops in HR" works great!</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span><strong>Combine filters:</strong> "Dell laptops with i5 in IT department"</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span><strong>Check status:</strong> "servers offline", "PCs need repair"</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            {response && response.success && (
                <div className="space-y-6">
                    {/* Fuzzy Search Corrections */}
                    {response.fuzzyCorrections && response.fuzzyCorrections.length > 0 && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl shadow-lg p-6 animate-fadeIn">
                            <h3 className="text-xl font-bold text-purple-800 flex items-center gap-2 mb-4">
                                <span>🎯</span> Auto-Corrected Typos
                            </h3>
                            <div className="space-y-3">
                                {response.fuzzyCorrections.map((correction, idx) => (
                                    <div 
                                        key={idx}
                                        className="p-4 bg-white rounded-lg border-l-4 border-purple-500"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">✨</span>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-semibold capitalize">{correction.field}:</span>
                                                </p>
                                                <p className="font-semibold text-gray-900 mt-1">
                                                    <span className="line-through text-red-600">{correction.original}</span>
                                                    {' → '}
                                                    <span className="text-green-600">{correction.corrected}</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Confidence: {correction.confidence}% match
                                                </p>
                                            </div>
                                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                                                CORRECTED
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-purple-700 mt-4 italic">
                                💡 The AI automatically fixed typos to find the best matches!
                            </p>
                        </div>
                    )}

                    {/* AI Insights */}
                    {response.insights && response.insights.length > 0 && (
                        <div className="bg-white rounded-xl shadow-lg p-6 animate-fadeIn">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <span>💡</span> AI Insights
                            </h3>
                            <div className="space-y-3">
                                {response.insights.map((insight: AIInsight, idx: number) => (
                                    <div 
                                        key={idx}
                                        className={`p-4 rounded-lg border-l-4 ${
                                            insight.type === 'alert' ? 'bg-red-50 border-red-500' :
                                            insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                                            insight.type === 'success' ? 'bg-green-50 border-green-500' :
                                            'bg-blue-50 border-blue-500'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{insight.icon}</span>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{insight.text}</p>
                                                {insight.recommendation && (
                                                    <p className="text-sm text-gray-700 mt-1">{insight.recommendation}</p>
                                                )}
                                                {insight.action && (
                                                    <div className="mt-2 text-sm bg-white px-3 py-1 rounded border inline-block text-gray-700">
                                                        → {insight.action}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {response.recommendations && response.recommendations.length > 0 && (
                        <div className="bg-white rounded-xl shadow-lg p-6 animate-fadeIn">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <span>✨</span> Recommended Actions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {response.recommendations.map((rec: AIRecommendation) => (
                                    <button
                                        key={rec.id}
                                        onClick={() => handleRecommendationClick(rec)}
                                        className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 rounded-lg text-left transition-all hover:shadow-md group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{rec.icon}</span>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{rec.text}</div>
                                                {rec.query && (
                                                    <div className="text-xs text-gray-600 mt-1">"{rec.query}"</div>
                                                )}
                                            </div>
                                            <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Results Data */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Results Found: {response.resultCount}
                                </h2>
                                {response.interpretation && (
                                    <p className="text-sm text-gray-600 mt-2">
                                        <span className="font-semibold">Understanding:</span> {response.interpretation}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportPDF}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    PDF
                                </button>
                                <button
                                    onClick={handleExportCSV}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    CSV
                                </button>
                            </div>
                        </div>

                    {response.data && response.resultCount > 0 ? (
                        <div className="mt-4 space-y-6">
                            {/* Multi-module results */}
                            {response.module === 'all' ? (
                                <>
                                    {/* Summary Cards */}
                                    {response.moduleBreakdown && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                            {Object.entries(response.moduleBreakdown).map(([module, count]) => (
                                                <div key={module} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                                                    <div className="text-sm text-gray-600 font-medium">{module}</div>
                                                    <div className="text-2xl font-bold text-blue-600">{count as number}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Results by Module */}
                                    {Object.entries(response.data as Record<string, any[]>).map(([moduleName, items]) => (
                                        <div key={moduleName} className="border border-gray-300 rounded-lg overflow-hidden">
                                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3">
                                                <h3 className="text-lg font-bold flex items-center gap-2">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-blue-600 font-bold">
                                                        {items.length}
                                                    </span>
                                                    {moduleName.toUpperCase()}
                                                </h3>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            {Object.keys(items[0]).filter(key => key !== 'id').map((key) => (
                                                                <th
                                                                    key={key}
                                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                                >
                                                                    {key}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {items.map((row: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-blue-50 transition-colors">
                                                                {Object.entries(row).filter(([key]) => key !== 'id').map(([key, value], cellIdx: number) => (
                                                                    <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {value !== null && value !== undefined ? String(value) : '-'}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                /* Single module results */
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {Object.keys((response.data as any[])[0]).filter(key => key !== 'id').map((key) => (
                                                    <th
                                                        key={key}
                                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                    >
                                                        {key}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {(response.data as any[]).map((row: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    {Object.entries(row).filter(([key]) => key !== 'id').map(([key, value], cellIdx: number) => (
                                                        <td key={cellIdx} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {value !== null && value !== undefined ? String(value) : '-'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-semibold">No results found</p>
                            <p className="text-sm mt-2">Try adjusting your query or search criteria</p>
                        </div>
                    )}
                    </div>
                </div>
            )}

            {/* Query History */}
            {history.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">📜 Recent Queries</h2>
                        <button
                            onClick={clearHistory}
                            className="text-sm text-red-600 hover:text-red-700 font-semibold"
                        >
                            Clear History
                        </button>
                    </div>
                    <div className="space-y-2">
                        {history.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleHistoryClick(item.query)}
                                className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
                                disabled={loading}
                            >
                                <div className="flex justify-between items-start">
                                    <p className="text-sm text-gray-800 font-medium">{item.query}</p>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                                        {item.resultCount} results
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(item.timestamp).toLocaleString()} • {item.module || 'Unknown'}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

