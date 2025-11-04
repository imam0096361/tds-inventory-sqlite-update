/**
 * Query Intent Classification & Smart Suggestions
 * Analyzes user input and provides intelligent autocomplete suggestions
 */

export interface QueryIntent {
    type: 'user_search' | 'equipment_search' | 'status_check' | 'department_search' | 'unknown';
    confidence: number;
    suggestedModule?: string;
    extractedEntities: {
        usernames?: string[];
        departments?: string[];
        hardware?: string[];
        statuses?: string[];
    };
}

// Keywords for intent detection
const INTENT_PATTERNS = {
    user_search: [
        /\b(user|person|employee|staff|member|who)\b/i,
        /\b(show|find|get|list).*\b(for|about|of)\b.*\b(name|username)\b/i,
        /\b(karim|john|sarah|mohammad|ahmed)\b/i, // Common names
    ],
    equipment_search: [
        /\b(pc|laptop|server|mouse|keyboard|ssd|headphone|monitor)\b/i,
        /\b(core\s*i[357]|ryzen|intel|amd)\b/i,
        /\b(\d+\s*gb|ram|storage|memory)\b/i,
        /\b(dell|hp|lenovo|asus|apple|msi)\b/i,
    ],
    status_check: [
        /\b(repair|broken|faulty|need|problem|issue|offline|online)\b/i,
        /\b(status|condition|health|working)\b/i,
        /\b(battery\s*problem|platform\s*problem)\b/i,
    ],
    department_search: [
        /\b(department|dept|division|team|office)\b/i,
        /\b(it|hr|finance|sales|marketing|operations)\b/i,
        /\b(floor\s*[567])\b/i,
    ],
};

/**
 * Classify user query intent
 */
export function classifyQueryIntent(query: string): QueryIntent {
    const normalizedQuery = query.toLowerCase().trim();

    const scores = {
        user_search: 0,
        equipment_search: 0,
        status_check: 0,
        department_search: 0,
    };

    // Calculate scores for each intent type
    Object.keys(INTENT_PATTERNS).forEach(intentType => {
        const patterns = INTENT_PATTERNS[intentType as keyof typeof INTENT_PATTERNS];
        patterns.forEach(pattern => {
            if (pattern.test(normalizedQuery)) {
                scores[intentType as keyof typeof scores] += 1;
            }
        });
    });

    // Find highest scoring intent
    const maxScore = Math.max(...Object.values(scores));
    const topIntent = Object.keys(scores).find(
        key => scores[key as keyof typeof scores] === maxScore
    ) as keyof typeof scores;

    const confidence = maxScore > 0 ? Math.min(100, maxScore * 30) : 0;

    // Extract entities
    const extractedEntities: QueryIntent['extractedEntities'] = {};

    // Extract hardware specs
    const cpuMatch = normalizedQuery.match(/\b(core\s*i[357]|i[357]|ryzen\s*[3579])\b/i);
    if (cpuMatch) {
        extractedEntities.hardware = [cpuMatch[0]];
    }

    const ramMatch = normalizedQuery.match(/\b(\d+)\s*gb/i);
    if (ramMatch) {
        extractedEntities.hardware = [...(extractedEntities.hardware || []), ramMatch[0]];
    }

    // Extract departments
    const deptMatch = normalizedQuery.match(/\b(it|hr|finance|sales|marketing|operations)\b/i);
    if (deptMatch) {
        extractedEntities.departments = [deptMatch[0].toUpperCase()];
    }

    // Extract statuses
    const statusMatch = normalizedQuery.match(/\b(repair|broken|offline|online|ok|no)\b/i);
    if (statusMatch) {
        extractedEntities.statuses = [statusMatch[0]];
    }

    // Suggest module based on intent
    let suggestedModule: string | undefined;
    if (topIntent === 'user_search') {
        suggestedModule = 'all'; // Cross-module search
    } else if (normalizedQuery.includes('laptop')) {
        suggestedModule = 'laptops';
    } else if (normalizedQuery.includes('server')) {
        suggestedModule = 'servers';
    } else if (normalizedQuery.includes('pc') || normalizedQuery.includes('computer')) {
        suggestedModule = 'pcs';
    } else if (normalizedQuery.includes('mouse')) {
        suggestedModule = 'mouselogs';
    } else if (normalizedQuery.includes('keyboard')) {
        suggestedModule = 'keyboardlogs';
    }

    return {
        type: confidence > 0 ? topIntent : 'unknown',
        confidence,
        suggestedModule,
        extractedEntities,
    };
}

/**
 * Generate smart suggestions based on partial query
 */
export function generateSmartSuggestions(
    partialQuery: string,
    recentUsernames: string[],
    recentDepartments: string[]
): string[] {
    const intent = classifyQueryIntent(partialQuery);
    const suggestions: string[] = [];

    if (intent.type === 'user_search') {
        // Suggest user-based queries
        recentUsernames.slice(0, 3).forEach(username => {
            suggestions.push(`Show me everything about user ${username}`);
            suggestions.push(`Find all equipment for ${username}`);
        });
    }

    if (intent.type === 'equipment_search') {
        // Suggest equipment-based queries
        if (intent.extractedEntities.hardware) {
            const hardware = intent.extractedEntities.hardware.join(' and ');
            suggestions.push(`PCs with ${hardware}`);
            suggestions.push(`Laptops with ${hardware}`);
        } else {
            suggestions.push('PCs with Core i7 and 16GB RAM');
            suggestions.push('Laptops with battery problems');
            suggestions.push('All Dell laptops');
        }
    }

    if (intent.type === 'status_check') {
        suggestions.push('PCs that need repair');
        suggestions.push('Laptops with battery problems');
        suggestions.push('Servers that are offline');
    }

    if (intent.type === 'department_search') {
        recentDepartments.slice(0, 3).forEach(dept => {
            suggestions.push(`All equipment in ${dept} department`);
            suggestions.push(`PCs in ${dept} with Core i7`);
        });
    }

    // Add generic helpful suggestions if none match
    if (suggestions.length === 0) {
        suggestions.push('Show me all PCs');
        suggestions.push('Find laptops in IT department');
        suggestions.push('PCs with Core i7 and 16GB RAM');
    }

    return suggestions.slice(0, 5); // Return top 5
}

/**
 * Validate query before sending to AI
 */
export function validateQuery(query: string): { valid: boolean; reason?: string } {
    if (!query || query.trim().length === 0) {
        return { valid: false, reason: 'Query cannot be empty' };
    }

    if (query.trim().length < 3) {
        return { valid: false, reason: 'Query too short. Please be more specific.' };
    }

    if (query.length > 500) {
        return { valid: false, reason: 'Query too long. Please keep it under 500 characters.' };
    }

    // Check for SQL injection attempts (basic)
    const suspiciousPatterns = [
        /drop\s+table/i,
        /delete\s+from/i,
        /insert\s+into/i,
        /update\s+.*\s+set/i,
        /;\s*drop/i,
        /union\s+select/i,
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(query)) {
            return { valid: false, reason: 'Invalid query format' };
        }
    }

    return { valid: true };
}

/**
 * Get query complexity score (for rate limiting/caching decisions)
 */
export function getQueryComplexity(query: string): number {
    let complexity = 1; // Base complexity

    // Cross-module search
    if (/\b(all|everything|every)\b/i.test(query)) {
        complexity += 3;
    }

    // Multiple filters
    const filterWords = ['and', 'with', 'in', 'that', 'where'];
    filterWords.forEach(word => {
        if (query.toLowerCase().includes(word)) complexity += 1;
    });

    // Specific hardware
    if (/\b(core\s*i[357]|ryzen|\d+\s*gb)\b/i.test(query)) {
        complexity += 1;
    }

    return Math.min(10, complexity); // Cap at 10
}
