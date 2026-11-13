
export function isSpeechRecognitionSupported() {
    return Boolean(
        window.SpeechRecognition ||
        window.webkitSpeechRecognition
    );
}

export function createRecognition(language) {
    const Recognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!Recognition) {
        throw new Error(
            "Speech recognition is unavailable. Please use Chrome."
        );
    }

    const recognition = new Recognition();

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    return recognition;
}

export function speakText(text, language, callbacks = {}) {
    if (!window.speechSynthesis) {
        callbacks.onError?.("Speech synthesis is unavailable.");
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = language;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = callbacks.onStart;
    utterance.onend = callbacks.onEnd;

    utterance.onerror = (event) => {
        callbacks.onError?.(event.error);
    };

    window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}
