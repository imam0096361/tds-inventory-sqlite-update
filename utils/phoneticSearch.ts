/**
 * Phonetic Search Algorithms
 * For matching names that sound similar but spelled differently
 * Examples: "Mohammad" vs "Muhammad", "John" vs "Jon"
 */

/**
 * Simplified Soundex algorithm for phonetic matching
 */
export function soundex(str: string): string {
    if (!str) return '';

    const s = str.toLowerCase().replace(/[^a-z]/g, '');
    if (s.length === 0) return '';

    const firstLetter = s[0].toUpperCase();

    // Soundex mapping
    const codes: { [key: string]: string } = {
        'b': '1', 'f': '1', 'p': '1', 'v': '1',
        'c': '2', 'g': '2', 'j': '2', 'k': '2', 'q': '2', 's': '2', 'x': '2', 'z': '2',
        'd': '3', 't': '3',
        'l': '4',
        'm': '5', 'n': '5',
        'r': '6'
    };

    let code = firstLetter;
    let prevCode = codes[s[0]] || '0';

    for (let i = 1; i < s.length && code.length < 4; i++) {
        const currentCode = codes[s[i]] || '0';
        if (currentCode !== '0' && currentCode !== prevCode) {
            code += currentCode;
        }
        prevCode = currentCode;
    }

    // Pad with zeros
    return code.padEnd(4, '0');
}

/**
 * Check if two strings sound similar
 */
export function soundsLike(str1: string, str2: string): boolean {
    return soundex(str1) === soundex(str2);
}

/**
 * Enhanced fuzzy match combining Levenshtein + Phonetic
 */
export function hybridMatch(
    input: string,
    options: string[],
    minConfidence: number = 60
): Array<{ match: string; confidence: number; matchType: 'exact' | 'fuzzy' | 'phonetic' }> {
    const results: Array<{ match: string; confidence: number; matchType: 'exact' | 'fuzzy' | 'phonetic' }> = [];

    const inputLower = input.toLowerCase();
    const inputSoundex = soundex(input);

    options.forEach(option => {
        const optionLower = option.toLowerCase();

        // 1. Exact match (case-insensitive)
        if (inputLower === optionLower) {
            results.push({ match: option, confidence: 100, matchType: 'exact' });
            return;
        }

        // 2. Contains match
        if (optionLower.includes(inputLower) || inputLower.includes(optionLower)) {
            const lengthRatio = Math.min(input.length, option.length) / Math.max(input.length, option.length);
            const confidence = Math.round(lengthRatio * 90); // Max 90% for partial match
            results.push({ match: option, confidence, matchType: 'fuzzy' });
            return;
        }

        // 3. Phonetic match (sounds similar)
        if (soundsLike(input, option)) {
            results.push({ match: option, confidence: 85, matchType: 'phonetic' });
            return;
        }

        // 4. Levenshtein distance
        const distance = levenshteinDistance(inputLower, optionLower);
        const maxThreshold = Math.min(3, Math.ceil(input.length * 0.3));

        if (distance <= maxThreshold) {
            const confidence = Math.round((1 - distance / maxThreshold) * 100);
            if (confidence >= minConfidence) {
                results.push({ match: option, confidence, matchType: 'fuzzy' });
            }
        }
    });

    // Sort by confidence (highest first)
    return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Calculate Levenshtein distance (re-export for convenience)
 */
function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len2; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
        for (let j = 1; j <= len1; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[len2][len1];
}
