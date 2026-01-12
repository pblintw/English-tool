/**
 * Main Application - English Shadowing Tool
 */

(function() {
    // DOM Elements
    const textInput = document.getElementById('textInput');
    const btnPlay = document.getElementById('btnPlay');
    const btnSlow = document.getElementById('btnSlow');
    const btnShadowing = document.getElementById('btnShadowing');
    const btnStop = document.getElementById('btnStop');
    const shadowingDisplay = document.getElementById('shadowingDisplay');
    const breakdownDisplay = document.getElementById('breakdownDisplay');
    const statusText = document.getElementById('statusText');

    // State
    let currentText = '';
    let words = [];
    let wordElements = [];
    let currentWordIndex = -1;
    let isShadowingMode = false;
    let selectedWord = null;
    let highlightTimer = null;
    let boundaryFired = false;
    let isSingleWordMode = false;

    /**
     * Initialize the application
     */
    async function init() {
        updateStatus('Loading...');

        // Initialize TTS
        await TTS.init();

        // Load dictionary
        await Dictionary.load();

        // Setup event listeners
        setupEventListeners();

        updateStatus('Ready');
        console.log('App initialized');
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        btnPlay.addEventListener('click', handlePlay);
        btnSlow.addEventListener('click', handleSlow);
        btnShadowing.addEventListener('click', handleShadowing);
        btnStop.addEventListener('click', handleStop);

        // Word click in breakdown display
        breakdownDisplay.addEventListener('click', handleBreakdownClick);

        // TTS callbacks
        TTS.setOnBoundary(handleWordBoundary);
        TTS.setOnEnd(handleSpeechEnd);
        TTS.setOnStart(handleSpeechStart);
    }

    /**
     * Get current text from input
     */
    function getCurrentText() {
        return textInput.value.trim();
    }

    /**
     * Parse text into words and render in display
     */
    function prepareDisplay(text) {
        currentText = text;

        // Split into words (keep punctuation attached)
        words = text.match(/[\w']+|[^\w\s]+|\s+/g) || [];

        // Create word elements
        shadowingDisplay.innerHTML = '';
        wordElements = [];

        words.forEach((word, index) => {
            if (/^\s+$/.test(word)) {
                // Whitespace
                shadowingDisplay.appendChild(document.createTextNode(' '));
            } else if (/^[^\w]+$/.test(word)) {
                // Punctuation
                const span = document.createElement('span');
                span.textContent = word;
                span.className = 'punctuation';
                shadowingDisplay.appendChild(span);
            } else {
                // Word
                const span = document.createElement('span');
                span.textContent = word;
                span.className = 'word';
                span.dataset.index = wordElements.length;
                span.dataset.word = word;
                span.addEventListener('click', () => handleWordClick(word, span));
                shadowingDisplay.appendChild(span);
                wordElements.push(span);
            }
        });

        currentWordIndex = -1;
        boundaryFired = false;
    }

    /**
     * Handle Play button click
     */
    function handlePlay() {
        const text = getCurrentText();
        if (!text) {
            updateStatus('Please enter some text');
            return;
        }

        prepareDisplay(text);
        disableButtons(true);
        updateStatus('Playing...');
        startHighlighting(1.0);
        TTS.speakNormal(text);
    }

    /**
     * Handle Slow button click
     */
    function handleSlow() {
        const text = getCurrentText();
        if (!text) {
            updateStatus('Please enter some text');
            return;
        }

        prepareDisplay(text);
        disableButtons(true);
        updateStatus('Playing (slow)...');
        startHighlighting(0.7);
        TTS.speakSlow(text);
    }

    /**
     * Handle Shadowing button click
     */
    function handleShadowing() {
        const text = getCurrentText();
        if (!text) {
            updateStatus('Please enter some text');
            return;
        }

        prepareDisplay(text);
        startShadowingMode(text);
    }

    /**
     * Start Shadowing mode
     * 1. Play at normal speed
     * 2. Pause 1 second
     * 3. Play at slow speed with word highlighting
     */
    function startShadowingMode(text) {
        isShadowingMode = true;
        disableButtons(true);
        updateStatus('Shadowing: Listen first...', 'shadowing');

        // Phase 1: Normal speed playback (no highlighting)
        TTS.setOnEnd(() => {
            if (!isShadowingMode) return;

            updateStatus('Shadowing: Get ready to follow...', 'shadowing');

            // Pause 1 second
            setTimeout(() => {
                if (!isShadowingMode) return;

                updateStatus('Shadowing: Follow along!', 'shadowing');

                // Phase 2: Slow playback with highlighting
                TTS.setOnEnd(() => {
                    handleShadowingComplete();
                });

                boundaryFired = false;
                startHighlighting(0.7);
                TTS.speakSlow(text);
            }, 1000);
        });

        TTS.speakNormal(text);
    }

    /**
     * Start time-based word highlighting
     * This runs as a fallback/supplement to onboundary events
     */
    function startHighlighting(rate) {
        stopHighlighting();

        if (wordElements.length === 0) return;

        // Estimate speech duration: ~150 words per minute at rate 1.0
        // Adjusted for rate and add buffer
        const wordsPerMinute = 150 * rate;
        const totalDuration = (wordElements.length / wordsPerMinute) * 60 * 1000;
        const intervalPerWord = totalDuration / wordElements.length;

        let wordIndex = 0;

        // Start first word immediately
        highlightWord(0);
        wordIndex = 1;

        highlightTimer = setInterval(() => {
            // If boundary events are working, let them handle it
            if (boundaryFired) {
                return;
            }

            if (wordIndex < wordElements.length) {
                highlightWord(wordIndex);
                wordIndex++;
            } else {
                stopHighlighting();
            }
        }, intervalPerWord);
    }

    /**
     * Stop time-based highlighting
     */
    function stopHighlighting() {
        if (highlightTimer) {
            clearInterval(highlightTimer);
            highlightTimer = null;
        }
    }

    /**
     * Handle shadowing mode complete
     */
    function handleShadowingComplete() {
        isShadowingMode = false;
        stopHighlighting();
        clearHighlights();
        disableButtons(false);
        updateStatus('Shadowing complete! Click words to learn more.');

        // Reset TTS callbacks
        TTS.setOnEnd(handleSpeechEnd);
    }

    /**
     * Handle Stop button click
     */
    function handleStop() {
        TTS.stop();
        isShadowingMode = false;
        stopHighlighting();
        clearHighlights();
        disableButtons(false);
        updateStatus('Stopped');

        // Reset TTS callbacks
        TTS.setOnEnd(handleSpeechEnd);
    }

    /**
     * Handle word boundary event from TTS
     */
    function handleWordBoundary(charIndex, charLength) {
        // Ignore boundary events for single word playback
        if (isSingleWordMode) return;

        boundaryFired = true;

        // Find which word is being spoken
        let charCount = 0;
        let wordIdx = 0;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (/^\s+$/.test(word) || /^[^\w]+$/.test(word)) {
                charCount += word.length;
                continue;
            }

            if (charCount <= charIndex && charIndex < charCount + word.length) {
                highlightWord(wordIdx);
                return;
            }

            charCount += word.length;
            // Account for space
            if (i < words.length - 1) {
                charCount += 1; // space between words
            }
            wordIdx++;
        }
    }

    /**
     * Highlight a word by index
     */
    function highlightWord(index) {
        // Clear previous highlight
        if (currentWordIndex >= 0 && currentWordIndex < wordElements.length) {
            wordElements[currentWordIndex].classList.remove('active');
        }

        // Set new highlight
        currentWordIndex = index;
        if (index >= 0 && index < wordElements.length) {
            wordElements[index].classList.add('active');
        }
    }

    /**
     * Clear all word highlights
     */
    function clearHighlights() {
        wordElements.forEach(el => {
            el.classList.remove('active');
        });
        currentWordIndex = -1;
    }

    /**
     * Handle word click in shadowing display
     */
    function handleWordClick(word, element) {
        // Clear previous selection
        wordElements.forEach(el => el.classList.remove('selected'));

        // Select this word
        element.classList.add('selected');
        selectedWord = word;

        // Look up and display word info
        const wordInfo = Dictionary.lookup(word);
        if (wordInfo) {
            breakdownDisplay.innerHTML = Dictionary.renderWordInfo(wordInfo);
        } else {
            breakdownDisplay.innerHTML = `
                <div class="not-found">
                    <p class="word-display">${word}</p>
                    <p>This word is not in the dictionary yet.</p>
                    <p>Try adding it to words.json!</p>
                </div>
            `;
        }
    }

    /**
     * Handle clicks in breakdown display (for play button and family words)
     */
    function handleBreakdownClick(event) {
        const target = event.target;

        // Play word button
        if (target.classList.contains('play-word')) {
            const word = target.dataset.word;
            if (word) {
                isSingleWordMode = true;
                TTS.speakNormal(word);
            }
        }

        // Family word click
        if (target.classList.contains('family-word')) {
            const word = target.dataset.word;
            if (word) {
                const wordInfo = Dictionary.lookup(word);
                breakdownDisplay.innerHTML = Dictionary.renderWordInfo(wordInfo);
                // Also speak the word
                isSingleWordMode = true;
                TTS.speakNormal(word);
            }
        }
    }

    /**
     * Handle TTS speech start
     */
    function handleSpeechStart() {
        // Don't update UI for single word playback
        if (isSingleWordMode) return;
        document.querySelector('.status-bar').classList.add('playing');
    }

    /**
     * Handle TTS speech end
     */
    function handleSpeechEnd() {
        // Reset single word mode
        if (isSingleWordMode) {
            isSingleWordMode = false;
            return;
        }

        stopHighlighting();
        clearHighlights();
        disableButtons(false);
        document.querySelector('.status-bar').classList.remove('playing');
        document.querySelector('.status-bar').classList.remove('shadowing');
        updateStatus('Done. Click words to learn more.');
    }

    /**
     * Update status text
     */
    function updateStatus(message, mode = '') {
        statusText.textContent = message;
        const statusBar = document.querySelector('.status-bar');
        statusBar.classList.remove('playing', 'shadowing');
        if (mode) {
            statusBar.classList.add(mode);
        }
    }

    /**
     * Enable/disable buttons during playback
     */
    function disableButtons(disabled) {
        btnPlay.disabled = disabled;
        btnSlow.disabled = disabled;
        btnShadowing.disabled = disabled;
        btnStop.disabled = !disabled;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
