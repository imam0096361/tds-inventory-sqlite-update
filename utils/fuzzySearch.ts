/**
 * Fuzzy Search & Typo Tolerance Utility
 * Implements Levenshtein Distance algorithm for intelligent string matching
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed to transform one string into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
    }

    // Calculate distances
    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[len2][len1];
}

/**
 * Check if two strings match within a fuzzy threshold
 */
export function fuzzyMatch(input: string, target: string, threshold: number = 2): boolean {
    const distance = levenshteinDistance(input.toLowerCase(), target.toLowerCase());
    return distance <= threshold;
}

/**
 * Find the best matching string from a list of options
 */
export function findBestMatch(input: string, options: string[]): { match: string | null; confidence: number } {
    let bestMatch: string | null = null;
    let lowestDistance = Infinity;
    const maxThreshold = Math.min(3, Math.ceil(input.length * 0.3)); // Max 30% of input length

    options.forEach(option => {
        const distance = levenshteinDistance(input.toLowerCase(), option.toLowerCase());
        if (distance < lowestDistance && distance <= maxThreshold) {
            lowestDistance = distance;
            bestMatch = option;
        }
    });

    // Calculate confidence percentage (inverse of distance)
    const confidence = bestMatch 
        ? Math.round((1 - lowestDistance / maxThreshold) * 100)
        : 0;

    return { match: bestMatch, confidence };
}

/**
 * Find all fuzzy matches above a confidence threshold
 */
export function findAllMatches(
    input: string, 
    options: string[], 
    minConfidence: number = 60
): Array<{ match: string; confidence: number }> {
    const matches: Array<{ match: string; confidence: number }> = [];
    const maxThreshold = Math.min(3, Math.ceil(input.length * 0.3));

    options.forEach(option => {
        const distance = levenshteinDistance(input.toLowerCase(), option.toLowerCase());
        const confidence = Math.round((1 - distance / maxThreshold) * 100);
        
        if (confidence >= minConfidence) {
            matches.push({ match: option, confidence });
        }
    });

    // Sort by confidence (highest first)
    return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Highlight the differences between input and matched string
 */
export function highlightDifferences(input: string, match: string): string {
    if (input.toLowerCase() === match.toLowerCase()) {
        return match;
    }
    
    // Simple highlighting - wrap corrections in markers
    return `${match} (corrected from "${input}")`;
}

