/**
 * Smart Response Generator
 * Generates helpful error messages and suggestions when no results are found
 */

export interface SmartResponse {
    hasResults: boolean;
    message: string;
    suggestions: string[];
    alternativeQueries: string[];
}

/**
 * Generate helpful response when no results found
 */
export function generateNoResultsResponse(
    query: string,
    filters: any,
    module: string,
    allUsernames: string[],
    allDepartments: string[]
): SmartResponse {
    const suggestions: string[] = [];
    const alternativeQueries: string[] = [];

    // Analyze why no results were found
    if (filters?.username) {
        const searchedUser = filters.username.value;
        suggestions.push(`No equipment found for user "${searchedUser}"`);

        // Suggest similar usernames
        const similarUsers = allUsernames
            .filter(u => u.toLowerCase().includes(searchedUser.toLowerCase().substring(0, 3)))
            .slice(0, 3);

        if (similarUsers.length > 0) {
            suggestions.push('Did you mean one of these users?');
            similarUsers.forEach(u => {
                alternativeQueries.push(`Show me everything about user ${u}`);
            });
        } else {
            suggestions.push('Try searching by department instead');
            alternativeQueries.push('Show me all PCs');
            alternativeQueries.push('Find laptops in IT department');
        }
    }

    if (filters?.department) {
        const searchedDept = filters.department.value;
        suggestions.push(`No equipment found in "${searchedDept}" department`);

        // Suggest other departments
        const otherDepts = allDepartments.filter(d => d !== searchedDept).slice(0, 3);
        if (otherDepts.length > 0) {
            suggestions.push('Try these departments:');
            otherDepts.forEach(dept => {
                alternativeQueries.push(`Find equipment in ${dept} department`);
            });
        }
    }

    if (filters?.cpu && filters?.ram) {
        suggestions.push(`No ${module} found with ${filters.cpu.value} CPU and ${filters.ram.value} RAM`);
        suggestions.push('Try relaxing your search criteria:');
        alternativeQueries.push(`PCs with ${filters.cpu.value}`);
        alternativeQueries.push(`PCs with ${filters.ram.value} RAM`);
    }

    if (filters?.status) {
        const status = filters.status.value;
        suggestions.push(`No ${module} with status "${status}"`);
        alternativeQueries.push(`Show all ${module}`);
        alternativeQueries.push(`${module} with any status`);
    }

    // Generic fallback
    if (suggestions.length === 0) {
        suggestions.push('No results found for your query');
        suggestions.push('Try:');
        alternativeQueries.push('Show me all PCs');
        alternativeQueries.push('Find laptops with Core i7');
        alternativeQueries.push('PCs that need repair');
    }

    return {
        hasResults: false,
        message: suggestions.join('\n'),
        suggestions,
        alternativeQueries,
    };
}

/**
 * Generate insights about successful query results
 */
export function generateSuccessInsights(
    results: any[],
    module: string,
    filters: any
): string[] {
    const insights: string[] = [];

    if (results.length === 0) return insights;

    // Overall count
    insights.push(`Found ${results.length} ${module}`);

    // Status breakdown (for PCs/Laptops)
    if (module === 'pcs' || module === 'laptops') {
        const statusField = module === 'pcs' ? 'status' : 'hardwareStatus';
        const statusCounts: { [key: string]: number } = {};

        results.forEach(item => {
            const status = item[statusField] || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        Object.keys(statusCounts).forEach(status => {
            if (statusCounts[status] > 0) {
                insights.push(`${statusCounts[status]} with status: ${status}`);
            }
        });
    }

    // RAM distribution (for PCs/Laptops)
    if ((module === 'pcs' || module === 'laptops') && !filters?.ram) {
        const ramCounts: { [key: string]: number } = {};

        results.forEach(item => {
            const ram = item.ram || 'Unknown';
            ramCounts[ram] = (ramCounts[ram] || 0) + 1;
        });

        const topRam = Object.entries(ramCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (topRam.length > 0) {
            insights.push('RAM distribution:');
            topRam.forEach(([ram, count]) => {
                insights.push(`  - ${ram}: ${count} units`);
            });
        }
    }

    // Department distribution (if not filtering by department)
    if (!filters?.department) {
        const deptCounts: { [key: string]: number } = {};

        results.forEach(item => {
            const dept = item.department || 'Unknown';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });

        const topDepts = Object.entries(deptCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (topDepts.length > 1) {
            insights.push('Top departments:');
            topDepts.forEach(([dept, count]) => {
                insights.push(`  - ${dept}: ${count} units`);
            });
        }
    }

    return insights;
}

/**
 * Generate contextual recommendations
 */
export function generateRecommendations(
    results: any[],
    module: string,
    filters: any
): string[] {
    const recommendations: string[] = [];

    if (results.length === 0) return recommendations;

    // Check for items needing attention
    if (module === 'pcs') {
        const needsRepair = results.filter(pc => pc.status === 'Repair').length;
        if (needsRepair > 0) {
            recommendations.push(`⚠️ ${needsRepair} PC(s) need repair attention`);
        }

        const lowRam = results.filter(pc => pc.ram && pc.ram.includes('4')).length;
        if (lowRam > 0) {
            recommendations.push(`💡 Consider upgrading ${lowRam} PC(s) with 4GB RAM`);
        }
    }

    if (module === 'laptops') {
        const batteryIssues = results.filter(
            lap => lap.hardwareStatus === 'Battery Problem'
        ).length;

        if (batteryIssues > 0) {
            recommendations.push(`🔋 ${batteryIssues} laptop(s) have battery issues`);
        }
    }

    if (module === 'servers') {
        const offline = results.filter(srv => srv.status === 'Offline').length;
        if (offline > 0) {
            recommendations.push(`🚨 ${offline} server(s) are offline - immediate action required`);
        }
    }

    // Suggest follow-up queries
    if (filters?.username && results.length > 0) {
        recommendations.push('💡 Export this user\'s equipment list for records');
    }

    if (filters?.department && results.length > 5) {
        recommendations.push('💡 Consider filtering by floor or status for better organization');
    }

    return recommendations;
}

/**
 * Format fuzzy corrections for user display
 */
export function formatFuzzyCorrection(correction: {
    field: string;
    original: string;
    corrected: string;
    confidence: number;
    method?: string;
}): string {
    const methodEmoji = {
        exact_case_fix: '✏️',
        database_trigram: '🎯',
        bengali_normalization: '🇧🇩',
        phonetic: '🔊',
        fuzzy: '🔍',
    };

    const emoji = methodEmoji[correction.method as keyof typeof methodEmoji] || '🔄';

    return `${emoji} Auto-corrected "${correction.original}" → "${correction.corrected}" (${correction.confidence}% match)`;
}
