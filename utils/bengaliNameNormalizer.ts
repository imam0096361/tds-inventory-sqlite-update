/**
 * Bengali Name Normalization & Transliteration
 * For The Daily Star Bangladesh IT Inventory
 *
 * Handles common variations in Bengali names written in English:
 * - "Mohammad" vs "Muhammad" vs "Mohammed"
 * - "Hossain" vs "Hossein" vs "Husain"
 * - "Rahman" vs "Rahaman"
 * - "Karim" vs "Kareem"
 */

/**
 * Common Bengali name variations mapping
 */
const BENGALI_NAME_VARIATIONS: { [key: string]: string[] } = {
    // Mohammad variations
    'mohammad': ['muhammad', 'mohammed', 'muhammed', 'mohamed', 'mohammad'],

    // Hossain variations
    'hossain': ['hossein', 'husain', 'hussain', 'hossain', 'hosen'],

    // Rahman variations
    'rahman': ['rahaman', 'rahaman', 'rahman'],

    // Karim variations
    'karim': ['kareem', 'karem', 'karim'],

    // Ahmed variations
    'ahmed': ['ahmad', 'ahmmed', 'ahamed', 'ahmed'],

    // Abdul variations
    'abdul': ['abdal', 'abdool', 'abdul'],

    // Other common names
    'islam': ['eslam', 'islam'],
    'alam': ['aalam', 'alam'],
    'kabir': ['kabeer', 'kabir'],
    'rafiq': ['rafique', 'rafik', 'rafiq'],
    'sadiq': ['saddiq', 'sadique', 'sadiq'],
    'shakil': ['shakeel', 'shaquil', 'shakil'],
    'taslim': ['tasleem', 'taslim'],
    'nasir': ['naseer', 'naser', 'nasir'],
};

/**
 * Build reverse mapping for fast lookup
 */
const VARIATION_TO_CANONICAL: { [key: string]: string } = {};
Object.keys(BENGALI_NAME_VARIATIONS).forEach(canonical => {
    BENGALI_NAME_VARIATIONS[canonical].forEach(variation => {
        VARIATION_TO_CANONICAL[variation.toLowerCase()] = canonical;
    });
});

/**
 * Normalize a Bengali name to its canonical form
 */
export function normalizeBengaliName(name: string): string {
    const words = name.toLowerCase().trim().split(/\s+/);

    const normalized = words.map(word => {
        // Check if this word has a canonical form
        const canonical = VARIATION_TO_CANONICAL[word];
        return canonical || word;
    });

    return normalized.join(' ');
}

/**
 * Check if two Bengali names are equivalent (despite spelling variations)
 */
export function areBengaliNamesEquivalent(name1: string, name2: string): boolean {
    const normalized1 = normalizeBengaliName(name1);
    const normalized2 = normalizeBengaliName(name2);

    return normalized1 === normalized2;
}

/**
 * Find all possible variations of a Bengali name
 */
export function getBengaliNameVariations(name: string): string[] {
    const words = name.toLowerCase().trim().split(/\s+/);
    const allVariations: string[][] = [];

    words.forEach(word => {
        const canonical = VARIATION_TO_CANONICAL[word];
        if (canonical && BENGALI_NAME_VARIATIONS[canonical]) {
            allVariations.push(BENGALI_NAME_VARIATIONS[canonical]);
        } else {
            allVariations.push([word]);
        }
    });

    // Generate all combinations
    function cartesianProduct(arrays: string[][]): string[][] {
        if (arrays.length === 0) return [[]];
        const [first, ...rest] = arrays;
        const restProduct = cartesianProduct(rest);
        return first.flatMap(item =>
            restProduct.map(combo => [item, ...combo])
        );
    }

    const combinations = cartesianProduct(allVariations);
    return combinations.map(combo =>
        combo.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    );
}

/**
 * Enhanced search that includes Bengali name variations
 */
export function searchWithBengaliVariations(
    searchTerm: string,
    namesList: string[]
): string[] {
    const normalizedSearch = normalizeBengaliName(searchTerm);

    const matches = namesList.filter(name => {
        const normalizedName = normalizeBengaliName(name);

        // Exact match after normalization
        if (normalizedName === normalizedSearch) return true;

        // Partial match (one word matches)
        const searchWords = normalizedSearch.split(/\s+/);
        const nameWords = normalizedName.split(/\s+/);

        return searchWords.some(searchWord =>
            nameWords.some(nameWord => nameWord === searchWord)
        );
    });

    return matches;
}

/**
 * Example usage and test
 */
export function testBengaliNameMatcher() {
    const testCases = [
        { input: 'Mohammad Hossain', variations: getBengaliNameVariations('Mohammad Hossain') },
        { input: 'Abdul Karim', variations: getBengaliNameVariations('Abdul Karim') },
        { input: 'Ahmed Rahman', variations: getBengaliNameVariations('Ahmed Rahman') },
    ];

    console.log('=== Bengali Name Variations Test ===');
    testCases.forEach(test => {
        console.log(`\nInput: "${test.input}"`);
        console.log(`Variations (${test.variations.length}):`, test.variations.slice(0, 5));
    });

    // Test equivalence
    console.log('\n=== Equivalence Tests ===');
    console.log('Mohammad Hossain == Muhammad Husain:',
        areBengaliNamesEquivalent('Mohammad Hossain', 'Muhammad Husain'));
    console.log('Abdul Karim == Abdal Kareem:',
        areBengaliNamesEquivalent('Abdul Karim', 'Abdal Kareem'));
}
