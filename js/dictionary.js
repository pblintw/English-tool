/**
 * Dictionary Module - Word data loading and lookup
 */

const Dictionary = (function() {
    let wordData = {};
    let isLoaded = false;

    /**
     * Load word data from JSON file
     */
    async function load() {
        try {
            const response = await fetch('data/words.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            wordData = await response.json();
            isLoaded = true;
            console.log('Dictionary loaded:', Object.keys(wordData).length, 'words');
            return true;
        } catch (error) {
            console.error('Failed to load dictionary:', error);
            // Use embedded fallback data
            wordData = getFallbackData();
            isLoaded = true;
            return true;
        }
    }

    /**
     * Fallback data if JSON fails to load
     */
    function getFallbackData() {
        return {
            "practice": {
                "translation": "練習、實踐",
                "breakdown": {
                    "root": "pract-",
                    "rootMeaning": "做、實行",
                    "suffix": "-ice",
                    "suffixMeaning": "名詞字尾"
                },
                "association": "practice = 做的行為 = 練習",
                "family": ["practical", "practically", "practitioner"]
            }
        };
    }

    /**
     * Look up a word (case-insensitive)
     * @param {string} word - Word to look up
     * @returns {Object|null} Word info or null if not found
     */
    function lookup(word) {
        if (!word) return null;

        // Normalize: lowercase, remove punctuation
        const normalized = word.toLowerCase().replace(/[^a-z]/g, '');

        // Direct match
        if (wordData[normalized]) {
            return {
                word: normalized,
                ...wordData[normalized]
            };
        }

        // Try to find base form (simple stemming)
        const baseForm = getBaseForm(normalized);
        if (baseForm && wordData[baseForm]) {
            return {
                word: baseForm,
                originalWord: normalized,
                ...wordData[baseForm]
            };
        }

        return null;
    }

    /**
     * Simple stemming to find base form
     */
    function getBaseForm(word) {
        // Common suffixes to remove
        const suffixes = [
            { suffix: 'ing', minLength: 4 },
            { suffix: 'ed', minLength: 3 },
            { suffix: 's', minLength: 3 },
            { suffix: 'es', minLength: 4 },
            { suffix: 'er', minLength: 4 },
            { suffix: 'est', minLength: 5 },
            { suffix: 'ly', minLength: 4 },
            { suffix: 'tion', minLength: 5 },
            { suffix: 'ment', minLength: 5 }
        ];

        for (const { suffix, minLength } of suffixes) {
            if (word.length >= minLength && word.endsWith(suffix)) {
                const base = word.slice(0, -suffix.length);

                // Check if base exists in dictionary
                if (wordData[base]) {
                    return base;
                }

                // Handle doubling (running -> run)
                if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
                    const undoubled = base.slice(0, -1);
                    if (wordData[undoubled]) {
                        return undoubled;
                    }
                }

                // Handle e-dropping (practicing -> practice)
                const withE = base + 'e';
                if (wordData[withE]) {
                    return withE;
                }
            }
        }

        return null;
    }

    /**
     * Check if a word exists in dictionary
     */
    function has(word) {
        return lookup(word) !== null;
    }

    /**
     * Get all words in dictionary
     */
    function getAllWords() {
        return Object.keys(wordData);
    }

    /**
     * Search words by partial match
     */
    function search(query) {
        if (!query) return [];
        const normalized = query.toLowerCase();
        return Object.keys(wordData).filter(word =>
            word.includes(normalized)
        );
    }

    /**
     * Generate HTML for word info display
     */
    function renderWordInfo(wordInfo) {
        if (!wordInfo) {
            return '<div class="not-found"><p>Word not found in dictionary</p></div>';
        }

        const { word, translation, breakdown, association, family, originalWord } = wordInfo;

        let breakdownHtml = '';
        if (breakdown) {
            const parts = [];
            if (breakdown.prefix) {
                parts.push(`
                    <div class="breakdown-item">
                        <span class="part">${breakdown.prefix}</span>
                        <span class="meaning">${breakdown.prefixMeaning}</span>
                    </div>
                `);
            }
            if (breakdown.root) {
                parts.push(`
                    <div class="breakdown-item">
                        <span class="part">${breakdown.root}</span>
                        <span class="meaning">${breakdown.rootMeaning}</span>
                    </div>
                `);
            }
            if (breakdown.suffix) {
                parts.push(`
                    <div class="breakdown-item">
                        <span class="part">${breakdown.suffix}</span>
                        <span class="meaning">${breakdown.suffixMeaning}</span>
                    </div>
                `);
            }
            breakdownHtml = parts.join('');
        }

        let familyHtml = '';
        if (family && family.length > 0) {
            familyHtml = family.map(w =>
                `<span class="family-word" data-word="${w}">${w}</span>`
            ).join('');
        }

        const displayWord = originalWord || word;

        return `
            <div class="word-info">
                <div class="word-title">
                    <span>${displayWord}</span>
                    <button class="play-word" data-word="${displayWord}" title="Play pronunciation">&#9658;</button>
                </div>

                <div class="info-row">
                    <span class="info-label">Translation</span>
                    <span class="info-value">${translation || 'N/A'}</span>
                </div>

                ${breakdownHtml ? `
                <div class="info-row">
                    <span class="info-label">Breakdown</span>
                    <div class="info-value breakdown-detail">${breakdownHtml}</div>
                </div>
                ` : ''}

                ${association ? `
                <div class="info-row">
                    <span class="info-label">Association</span>
                    <span class="info-value">${association}</span>
                </div>
                ` : ''}

                ${familyHtml ? `
                <div class="info-row">
                    <span class="info-label">Family</span>
                    <div class="info-value word-family">${familyHtml}</div>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Public API
    return {
        load,
        lookup,
        has,
        getAllWords,
        search,
        renderWordInfo
    };
})();
