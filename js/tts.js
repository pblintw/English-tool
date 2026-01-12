/**
 * TTS Module - Text-to-Speech using SpeechSynthesisUtterance
 */

const TTS = (function() {
    let voices = [];
    let englishVoice = null;
    let currentUtterance = null;
    let isReady = false;

    // Callbacks
    let onBoundary = null;
    let onEnd = null;
    let onStart = null;

    // Initialize voices
    function init() {
        return new Promise((resolve) => {
            const loadVoices = () => {
                voices = speechSynthesis.getVoices();

                // Find English voice (prefer en-US, fallback to any English)
                englishVoice = voices.find(v => v.lang === 'en-US') ||
                               voices.find(v => v.lang === 'en-GB') ||
                               voices.find(v => v.lang.startsWith('en'));

                if (englishVoice) {
                    isReady = true;
                    console.log('TTS ready with voice:', englishVoice.name);
                    resolve(true);
                } else if (voices.length > 0) {
                    // Use default voice if no English found
                    englishVoice = voices[0];
                    isReady = true;
                    console.log('TTS ready with fallback voice:', englishVoice.name);
                    resolve(true);
                }
            };

            // Chrome loads voices asynchronously
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = loadVoices;
            }

            // Try loading immediately (Firefox, Safari)
            loadVoices();

            // Timeout fallback
            setTimeout(() => {
                if (!isReady) {
                    loadVoices();
                    if (!isReady) {
                        console.warn('TTS: Could not load voices');
                        resolve(false);
                    }
                }
            }, 1000);
        });
    }

    /**
     * Speak text with specified rate
     * @param {string} text - Text to speak
     * @param {number} rate - Speed rate (0.1 to 2, default 1)
     * @returns {SpeechSynthesisUtterance}
     */
    function speak(text, rate = 1) {
        // Cancel any ongoing speech
        stop();

        const utterance = new SpeechSynthesisUtterance(text);

        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        utterance.lang = 'en-US';
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Event handlers
        utterance.onstart = () => {
            if (onStart) onStart();
        };

        utterance.onboundary = (event) => {
            if (event.name === 'word' && onBoundary) {
                onBoundary(event.charIndex, event.charLength);
            }
        };

        utterance.onend = () => {
            currentUtterance = null;
            if (onEnd) onEnd();
        };

        utterance.onerror = (event) => {
            console.error('TTS Error:', event.error);
            currentUtterance = null;
            if (onEnd) onEnd();
        };

        currentUtterance = utterance;
        speechSynthesis.speak(utterance);

        return utterance;
    }

    /**
     * Speak at normal speed (1.0)
     */
    function speakNormal(text) {
        return speak(text, 1.0);
    }

    /**
     * Speak at slow speed (0.7)
     */
    function speakSlow(text) {
        return speak(text, 0.7);
    }

    /**
     * Stop current speech
     */
    function stop() {
        speechSynthesis.cancel();
        currentUtterance = null;
    }

    /**
     * Pause current speech
     */
    function pause() {
        speechSynthesis.pause();
    }

    /**
     * Resume paused speech
     */
    function resume() {
        speechSynthesis.resume();
    }

    /**
     * Check if currently speaking
     */
    function isSpeaking() {
        return speechSynthesis.speaking;
    }

    /**
     * Set callback for word boundary events
     * @param {Function} callback - (charIndex, charLength) => void
     */
    function setOnBoundary(callback) {
        onBoundary = callback;
    }

    /**
     * Set callback for speech end
     * @param {Function} callback - () => void
     */
    function setOnEnd(callback) {
        onEnd = callback;
    }

    /**
     * Set callback for speech start
     * @param {Function} callback - () => void
     */
    function setOnStart(callback) {
        onStart = callback;
    }

    /**
     * Get available voices
     */
    function getVoices() {
        return voices;
    }

    /**
     * Get current English voice
     */
    function getCurrentVoice() {
        return englishVoice;
    }

    // Public API
    return {
        init,
        speak,
        speakNormal,
        speakSlow,
        stop,
        pause,
        resume,
        isSpeaking,
        setOnBoundary,
        setOnEnd,
        setOnStart,
        getVoices,
        getCurrentVoice
    };
})();
