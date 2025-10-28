import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { AutocompleteSuggestion } from '../types';

/**
 * Hook for real-time AI query suggestions with autocomplete
 */
export function useAISuggestions(query: string, enabled: boolean = true) {
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        if (!enabled || debouncedQuery.length < 2) {
            setSuggestions([]);
            return;
        }

        setLoading(true);

        // Fetch suggestions from backend
        fetch('/api/ai-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partial: debouncedQuery })
        })
            .then(res => res.json())
            .then(data => {
                setSuggestions(data.suggestions || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Suggestions failed:', err);
                setLoading(false);
            });
    }, [debouncedQuery, enabled]);

    return { suggestions, loading };
}

