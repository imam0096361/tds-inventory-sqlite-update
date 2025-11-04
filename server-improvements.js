/**
 * Enhanced AI Query Endpoint with Advanced Fuzzy Matching
 *
 * IMPROVEMENTS:
 * 1. Phonetic matching (Soundex) for names
 * 2. Bengali name normalization
 * 3. PostgreSQL trigram similarity
 * 4. Multiple suggestion fallbacks
 * 5. Confidence scoring with match type
 */

// Add these imports at the top of server-postgres.cjs:
// const { hybridMatch } = require('./utils/phoneticSearch');
// const { searchWithBengaliVariations, normalizeBengaliName } = require('./utils/bengaliNameNormalizer');

// Replace the fuzzy matching section (lines 1561-1665) with this enhanced version:

async function enhancedFuzzySearch(filters, pool) {
    const fuzzyCorrections = [];

    // ==================== ENHANCED USERNAME FUZZY SEARCH ====================
    if (filters && filters.username) {
        try {
            const inputUsername = filters.username.value;
            console.log(`🔍 Enhanced fuzzy search for: "${inputUsername}"`);

            // METHOD 1: PostgreSQL Trigram Similarity (fastest, database-level)
            const trigramQuery = await pool.query(`
                SELECT DISTINCT username,
                       similarity(username, $1) as score,
                       'trigram' as method
                FROM (
                    SELECT username FROM pcs WHERE username IS NOT NULL
                    UNION
                    SELECT username FROM laptops WHERE username IS NOT NULL
                    UNION
                    SELECT "pcUsername" as username FROM "mouseLogs" WHERE "pcUsername" IS NOT NULL
                    UNION
                    SELECT "pcUsername" as username FROM "keyboardLogs" WHERE "pcUsername" IS NOT NULL
                    UNION
                    SELECT "pcUsername" as username FROM "ssdLogs" WHERE "ssdLogs"."pcUsername" IS NOT NULL
                    UNION
                    SELECT "pcUsername" as username FROM "headphoneLogs" WHERE "pcUsername" IS NOT NULL
                    UNION
                    SELECT "pcUsername" as username FROM "portableHDDLogs" WHERE "pcUsername" IS NOT NULL
                ) AS all_usernames
                WHERE similarity(username, $1) > 0.3
                ORDER BY score DESC
                LIMIT 5;
            `, [inputUsername]);

            if (trigramQuery.rows.length > 0) {
                const bestMatch = trigramQuery.rows[0];
                const confidence = Math.round(bestMatch.score * 100);

                console.log(`✅ Trigram match: "${inputUsername}" → "${bestMatch.username}" (${confidence}%)`);

                if (confidence >= 60) {
                    filters.username.value = bestMatch.username;
                    fuzzyCorrections.push({
                        field: 'username',
                        original: inputUsername,
                        corrected: bestMatch.username,
                        confidence: confidence,
                        method: 'database_trigram'
                    });
                    return fuzzyCorrections;
                }
            }

            // METHOD 2: Bengali Name Normalization (for Bangladesh names)
            const allUsernamesQuery = await pool.query(`
                SELECT DISTINCT username FROM (
                    SELECT username FROM pcs WHERE username IS NOT NULL
                    UNION
                    SELECT username FROM laptops WHERE username IS NOT NULL
                    UNION
                    SELECT "pcUsername" as username FROM "mouseLogs" WHERE "pcUsername" IS NOT NULL
                    UNION
                    SELECT "pcUsername" as username FROM "keyboardLogs" WHERE "pcUsername" IS NOT NULL
                    UNION
                    SELECT "pcUsername" as username FROM "ssdLogs" WHERE "pcUsername" IS NOT NULL
                    UNION
                    SELECT "pcUsername" as username FROM "headphoneLogs" WHERE "pcUsername" IS NOT NULL
                    UNION
                    SELECT "pcUsername" as username FROM "portableHDDLogs" WHERE "pcUsername" IS NOT NULL
                ) AS all_usernames
            `);

            const allUsernames = allUsernamesQuery.rows.map(row => row.username);

            // Check for exact match (case-insensitive)
            const exactMatch = allUsernames.find(u =>
                u.toLowerCase() === inputUsername.toLowerCase()
            );

            if (exactMatch) {
                if (exactMatch !== inputUsername) {
                    filters.username.value = exactMatch;
                    fuzzyCorrections.push({
                        field: 'username',
                        original: inputUsername,
                        corrected: exactMatch,
                        confidence: 100,
                        method: 'exact_case_fix'
                    });
                }
                return fuzzyCorrections;
            }

            // Bengali name variations check
            const bengaliMatches = searchWithBengaliVariations(inputUsername, allUsernames);
            if (bengaliMatches.length > 0) {
                const bestBengaliMatch = bengaliMatches[0];
                console.log(`✅ Bengali name match: "${inputUsername}" → "${bestBengaliMatch}" (95%)`);

                filters.username.value = bestBengaliMatch;
                fuzzyCorrections.push({
                    field: 'username',
                    original: inputUsername,
                    corrected: bestBengaliMatch,
                    confidence: 95,
                    method: 'bengali_normalization'
                });
                return fuzzyCorrections;
            }

            // METHOD 3: Hybrid Fuzzy Match (Levenshtein + Phonetic + Contains)
            const hybridResults = hybridMatch(inputUsername, allUsernames, 60);

            if (hybridResults.length > 0) {
                const bestMatch = hybridResults[0];
                console.log(`✅ Hybrid match: "${inputUsername}" → "${bestMatch.match}" (${bestMatch.confidence}%, type: ${bestMatch.matchType})`);

                filters.username.value = bestMatch.match;
                fuzzyCorrections.push({
                    field: 'username',
                    original: inputUsername,
                    corrected: bestMatch.match,
                    confidence: bestMatch.confidence,
                    method: bestMatch.matchType
                });
                return fuzzyCorrections;
            }

            console.log(`⚠️ No match found for "${inputUsername}"`);

        } catch (error) {
            console.error('Enhanced fuzzy search error:', error);
        }
    }

    // ==================== ENHANCED DEPARTMENT FUZZY SEARCH ====================
    if (filters && filters.department) {
        try {
            const inputDept = filters.department.value;

            // Use PostgreSQL trigram for departments
            const deptTrigramQuery = await pool.query(`
                SELECT DISTINCT department,
                       similarity(department, $1) as score
                FROM (
                    SELECT department FROM pcs WHERE department IS NOT NULL
                    UNION
                    SELECT department FROM laptops WHERE department IS NOT NULL
                    UNION
                    SELECT department FROM servers WHERE department IS NOT NULL
                ) AS all_depts
                WHERE similarity(department, $1) > 0.3
                ORDER BY score DESC
                LIMIT 3;
            `, [inputDept]);

            if (deptTrigramQuery.rows.length > 0) {
                const bestMatch = deptTrigramQuery.rows[0];
                const confidence = Math.round(bestMatch.score * 100);

                if (confidence >= 60) {
                    console.log(`✅ Department match: "${inputDept}" → "${bestMatch.department}" (${confidence}%)`);
                    filters.department.value = bestMatch.department;
                    fuzzyCorrections.push({
                        field: 'department',
                        original: inputDept,
                        corrected: bestMatch.department,
                        confidence: confidence,
                        method: 'database_trigram'
                    });
                }
            }
        } catch (error) {
            console.error('Department fuzzy search error:', error);
        }
    }

    return fuzzyCorrections;
}

// Usage in /api/ai-query endpoint:
// Replace lines 1561-1665 with:
//
// const fuzzyCorrections = await enhancedFuzzySearch(filters, pool);
// if (fuzzyCorrections.length > 0) {
//     fuzzyCorrections.forEach(correction => {
//         interpretation += ` (corrected "${correction.original}" to "${correction.corrected}" using ${correction.method})`;
//     });
// }

module.exports = { enhancedFuzzySearch };
