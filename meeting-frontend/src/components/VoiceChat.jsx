
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Mic,
    MicOff,
    X,
    Volume2,
    Square,
    Languages,
    LoaderCircle,
    RotateCcw,
    Pause,
    Play
} from "lucide-react";

import "./VoiceChat.css";

const LANGUAGES = [
    { label: "Hindi (India)", value: "hi-IN" },
    { label: "English (India)", value: "en-IN" },
    { label: "English (US)", value: "en-US" }
];

// Clean AI response for speech.
// Original response remains unchanged in the voice box.
function cleanForSpeech(input = "") {
    let text = String(input);

    // Remove code blocks.
    text = text.replace(/```[\s\S]*?```/g, " ");

    // Keep Markdown link labels, remove URLs.
    text = text.replace(
        /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
        "$1"
    );

    // Remove raw URLs and email addresses.
    text = text.replace(/https?:\/\/[^\s)]+/gi, " ");
    text = text.replace(
        /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi,
        " "
    );

    // Remove Markdown table separator rows.
    text = text.replace(
        /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm,
        ""
    );

    // Convert table rows into readable speech.
    text = text.replace(/^\s*\|(.+)\|\s*$/gm, (_, row) => {
        const cells = row
            .split("|")
            .map(cell => cell.trim())
            .filter(Boolean);

        return cells.join(". ");
    });

    // Remove Markdown formatting.
    text = text.replace(/^#{1,6}\s*/gm, "");
    text = text.replace(/^\s*[-*+]\s+/gm, "");
    text = text.replace(/^\s*\d+[.)]\s+/gm, "");
    text = text.replace(/\*\*(.*?)\*\*/g, "$1");
    text = text.replace(/\*(.*?)\*/g, "$1");
    text = text.replace(/__(.*?)__/g, "$1");
    text = text.replace(/_(.*?)_/g, "$1");
    text = text.replace(/~~(.*?)~~/g, "$1");
    text = text.replace(/`([^`]+)`/g, "$1");

    // Remove technical IDs.
    text = text.replace(/\b[A-Za-z0-9_-]{20,}\b/g, " ");

    // Remove special formatting characters.
    text = text.replace(/[{}[\]<>@#$%^&*=\\|]/g, " ");
    text = text.replace(/[•▪►]/g, " ");

    // Normalize whitespace.
    text = text.replace(/\r/g, "\n");
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/\n{2,}/g, ". ");
    text = text.replace(/\s+([,.!?।])/g, "$1");
    text = text.replace(/([,.!?।])(?=\S)/g, "$1 ");
    text = text.replace(/[.]{2,}/g, ".");
    text = text.trim();

    return text;
}

function splitSentences(text) {
    return (
        text.match(/[^.!?।]+[.!?।]?/g)
            ?.map(sentence => sentence.trim())
            .filter(Boolean) || []
    );
}

function getRecognitionAPI() {
    return (
        window.SpeechRecognition ||
        window.webkitSpeechRecognition ||
        null
    );
}

export default function VoiceChat({ onSend, onClose }) {
    const [language, setLanguage] = useState("hi-IN");

    const [listening, setListening] = useState(false);
    const [loading, setLoading] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [conversationActive, setConversationActive] = useState(false);

    const [recognizedText, setRecognizedText] = useState("");
    const [interimText, setInterimText] = useState("");
    const [assistantText, setAssistantText] = useState("");
    const [error, setError] = useState("");

    const recognitionRef = useRef(null);
    const transcriptRef = useRef("");
    const mountedRef = useRef(false);

    const speechQueueRef = useRef([]);
    const speechRunRef = useRef(0);

    const autoConversationRef = useRef(false);
    const requestInFlightRef = useRef(false);
    const recognitionStartingRef = useRef(false);

    const restartTimerRef = useRef(null);
    const silenceTimerRef = useRef(null);

    // ------------------------------------------
    // CLEANUP
    // ------------------------------------------

    useEffect(() => {
        mountedRef.current = true;

        if ("speechSynthesis" in window) {
            window.speechSynthesis.getVoices();
        }

        return () => {
            mountedRef.current = false;
            autoConversationRef.current = false;

            clearTimeout(restartTimerRef.current);
            clearTimeout(silenceTimerRef.current);

            recognitionRef.current?.abort();

            speechRunRef.current++;

            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // ------------------------------------------
    // STOP SPEECH
    // ------------------------------------------

    const stopSpeech = useCallback(() => {
        speechRunRef.current++;
        speechQueueRef.current = [];

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        if (mountedRef.current) {
            setSpeaking(false);
        }
    }, []);

    // ------------------------------------------
    // STOP LISTENING
    // ------------------------------------------

    const stopListening = useCallback(() => {
        clearTimeout(silenceTimerRef.current);

        recognitionStartingRef.current = false;

        recognitionRef.current?.stop();

        if (mountedRef.current) {
            setListening(false);
        }
    }, []);

    // ------------------------------------------
    // GET AVAILABLE VOICE
    // ------------------------------------------

    const getVoice = useCallback(() => {
        if (!("speechSynthesis" in window)) return null;

        const voices = window.speechSynthesis.getVoices();

        const prefix = language.split("-")[0].toLowerCase();

        return (
            voices.find(
                voice =>
                    voice.lang.toLowerCase() === language.toLowerCase()
            ) ||
            voices.find(
                voice =>
                    voice.lang.toLowerCase().startsWith(prefix)
            ) ||
            null
        );
    }, [language]);

    // ------------------------------------------
    // AUTOMATIC LISTENING RESTART
    // ------------------------------------------

    const scheduleListening = useCallback((delay = 700) => {
        clearTimeout(restartTimerRef.current);

        if (!autoConversationRef.current) return;

        restartTimerRef.current = window.setTimeout(() => {
            if (
                mountedRef.current &&
                autoConversationRef.current &&
                !requestInFlightRef.current
            ) {
                startListeningRef.current?.();
            }
        }, delay);
    }, []);

    const startListeningRef = useRef(null);

    // ------------------------------------------
    // SPEECH QUEUE
    // ------------------------------------------

    const speakNext = useCallback((runId) => {
        if (
            !mountedRef.current ||
            runId !== speechRunRef.current
        ) {
            return;
        }

        const sentence = speechQueueRef.current.shift();

        // AI finished speaking.
        if (!sentence) {
            setSpeaking(false);

            // Automatically listen for the next question.
            scheduleListening(800);

            return;
        }

        const utterance = new SpeechSynthesisUtterance(sentence);

        utterance.lang = language;
        utterance.rate = 0.92;
        utterance.pitch = 1;
        utterance.volume = 1;

        const voice = getVoice();

        if (voice) {
            utterance.voice = voice;
        }

        utterance.onstart = () => {
            if (
                mountedRef.current &&
                runId === speechRunRef.current
            ) {
                setSpeaking(true);
            }
        };

        utterance.onend = () => {
            speakNext(runId);
        };

        utterance.onerror = event => {
            if (
                event.error !== "canceled" &&
                event.error !== "interrupted"
            ) {
                console.error("Speech error:", event.error);
            }

            speakNext(runId);
        };

        window.speechSynthesis.speak(utterance);
    }, [language, getVoice, scheduleListening]);

    // ------------------------------------------
    // SPEAK AI RESPONSE
    // ------------------------------------------

    const speakResponse = useCallback((response) => {
        stopSpeech();

        if (!("speechSynthesis" in window)) {
            setError("Speech output is not supported in this browser.");
            scheduleListening();
            return;
        }

        const cleanText = cleanForSpeech(response);

        if (!cleanText) {
            scheduleListening();
            return;
        }

        speechQueueRef.current = splitSentences(cleanText);

        const runId = speechRunRef.current;

        setSpeaking(true);

        window.setTimeout(() => {
            if (
                mountedRef.current &&
                runId === speechRunRef.current
            ) {
                speakNext(runId);
            }
        }, 150);
    }, [stopSpeech, speakNext, scheduleListening]);

    // ------------------------------------------
    // AUTOMATIC BACKEND REQUEST
    // ------------------------------------------

    const submitRecognizedMessage = useCallback(async () => {
        const message = transcriptRef.current.trim();

        if (!message || requestInFlightRef.current) {
            if (autoConversationRef.current && !message) {
                scheduleListening(500);
            }
            return;
        }

        requestInFlightRef.current = true;

        clearTimeout(restartTimerRef.current);

        setLoading(true);
        setError("");
        setInterimText("");
        setAssistantText("");

        try {
            // Automatically call the existing MeetingPilot backend.
            const response = await onSend(message);

            if (!mountedRef.current) return;

            if (
                typeof response === "string" &&
                response.trim()
            ) {
                setAssistantText(response);
                speakResponse(response);
            } else {
                setError(
                    "The backend did not return a response string. Check your handleSend function."
                );

                scheduleListening(1200);
            }
        } catch (err) {
            console.error("Automatic voice request failed:", err);

            if (mountedRef.current) {
                setError(
                    "Unable to fetch meeting information. Please try again."
                );

                scheduleListening(1500);
            }
        } finally {
            requestInFlightRef.current = false;

            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [onSend, speakResponse, scheduleListening]);

    // ------------------------------------------
    // START LISTENING
    // ------------------------------------------

    const startListening = useCallback(() => {
        if (
            !mountedRef.current ||
            !autoConversationRef.current ||
            requestInFlightRef.current ||
            listening ||
            speaking
        ) {
            return;
        }

        const Recognition = getRecognitionAPI();

        if (!Recognition) {
            setError(
                "Speech recognition is unavailable. Please use Chrome or Edge."
            );
            setConversationActive(false);
            autoConversationRef.current = false;
            return;
        }

        clearTimeout(restartTimerRef.current);
        clearTimeout(silenceTimerRef.current);

        const recognition = new Recognition();

        recognition.lang = language;

        // One utterance at a time.
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        transcriptRef.current = "";

        setRecognizedText("");
        setInterimText("");
        setError("");

        recognitionStartingRef.current = true;
        recognitionRef.current = recognition;

        recognition.onstart = () => {
            recognitionStartingRef.current = false;

            if (mountedRef.current) {
                setListening(true);
            }
        };

        recognition.onresult = event => {
            let interim = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                const result = event.results[i];
                const transcript = result[0].transcript;

                if (result.isFinal) {
                    transcriptRef.current += transcript + " ";
                } else {
                    interim += transcript;
                }
            }

            if (mountedRef.current) {
                setRecognizedText(transcriptRef.current.trim());
                setInterimText(interim);
            }

            // Detect a short pause in speech.
            // This helps avoid waiting unnecessarily for recognition to end.
            clearTimeout(silenceTimerRef.current);

            silenceTimerRef.current = window.setTimeout(() => {
                if (
                    recognitionRef.current === recognition &&
                    autoConversationRef.current
                ) {
                    recognition.stop();
                }
            }, 1100);
        };

        recognition.onerror = event => {
            recognitionStartingRef.current = false;

            if (!mountedRef.current) return;

            if (event.error === "not-allowed") {
                autoConversationRef.current = false;
                setConversationActive(false);
                setError("Please allow microphone permission in your browser.");
            } else if (
                event.error !== "no-speech" &&
                event.error !== "aborted"
            ) {
                setError(`Microphone error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            recognitionStartingRef.current = false;

            clearTimeout(silenceTimerRef.current);

            if (!mountedRef.current) return;

            setListening(false);

            if (autoConversationRef.current) {
                submitRecognizedMessage();
            }
        };

        try {
            recognition.start();
        } catch (err) {
            recognitionStartingRef.current = false;

            console.error("Recognition start error:", err);

            setListening(false);
            setError("Unable to start microphone. Please try again.");

            scheduleListening(1200);
        }
    }, [
        language,
        listening,
        speaking,
        submitRecognizedMessage,
        scheduleListening
    ]);

    // Keep latest function available to automatic restart callback.
    useEffect(() => {
        startListeningRef.current = startListening;
    }, [startListening]);

    // ------------------------------------------
    // START CONVERSATION
    // ------------------------------------------

    const startConversation = () => {
        setError("");

        autoConversationRef.current = true;
        setConversationActive(true);

        transcriptRef.current = "";

        startListening();
    };

    // ------------------------------------------
    // PAUSE CONVERSATION
    // ------------------------------------------

    const pauseConversation = () => {
        autoConversationRef.current = false;
        setConversationActive(false);

        clearTimeout(restartTimerRef.current);
        clearTimeout(silenceTimerRef.current);

        stopListening();
        stopSpeech();
    };

    // ------------------------------------------
    // INTERRUPT AI
    // ------------------------------------------

    const interruptSpeech = () => {
        stopSpeech();

        // Continue listening after interruption.
        if (autoConversationRef.current) {
            scheduleListening(500);
        }
    };

    // ------------------------------------------
    // LANGUAGE CHANGE
    // ------------------------------------------

    const changeLanguage = event => {
        const newLanguage = event.target.value;

        const wasActive = autoConversationRef.current;

        clearTimeout(restartTimerRef.current);

        stopListening();
        stopSpeech();

        setLanguage(newLanguage);
        setError("");

        if (wasActive) {
            scheduleListening(800);
        }
    };

    // ------------------------------------------
    // REPLAY RESPONSE
    // ------------------------------------------

    const replayResponse = () => {
        if (!assistantText) return;

        // Do not restart microphone during replay.
        autoConversationRef.current = false;
        setConversationActive(false);

        speakResponse(assistantText);
    };

    // ------------------------------------------
    // CLOSE
    // ------------------------------------------

    const closeVoiceChat = () => {
        autoConversationRef.current = false;
        setConversationActive(false);

        clearTimeout(restartTimerRef.current);
        clearTimeout(silenceTimerRef.current);

        stopListening();
        stopSpeech();

        onClose?.();
    };

    // ------------------------------------------
    // UI
    // ------------------------------------------

    return (
        <div className="voice-overlay">
            <section
                className="voice-modal"
                role="dialog"
                aria-modal="true"
                aria-label="MeetingPilot Voice Assistant"
            >

                {/* Header */}
                <header className="voice-header">

                    <div className="voice-brand">
                        <div className="voice-brand-icon">
                            <Mic size={26} />
                        </div>

                        <div>
                            <h2>MeetingPilot AI</h2>
                            <p>Automatic Voice Assistant</p>
                        </div>
                    </div>

                    <button
                        className="voice-close-button"
                        onClick={closeVoiceChat}
                        aria-label="Close voice assistant"
                    >
                        <X size={24} />
                    </button>

                </header>

                <main className="voice-body">

                    {/* Voice animation */}
                    <div
                        className={`voice-animation ${
                            speaking
                                ? "is-speaking"
                                : listening
                                    ? "is-listening"
                                    : ""
                        }`}
                    >
                        <div className="voice-animation-inner">
                            {speaking ? (
                                <Volume2 size={52} />
                            ) : listening ? (
                                <Mic size={52} />
                            ) : (
                                <MicOff size={52} />
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <h1>
                        {speaking
                            ? "MeetingPilot is speaking..."
                            : listening
                                ? "I'm listening..."
                                : loading
                                    ? "Fetching your meetings..."
                                    : conversationActive
                                        ? "Preparing microphone..."
                                        : "Talk to MeetingPilot"}
                    </h1>

                    <p className="voice-subtitle">
                        {speaking
                            ? "You can interrupt me anytime."
                            : listening
                                ? "Speak naturally. I'll automatically understand."
                                : loading
                                    ? "Getting your Google Calendar information."
                                    : conversationActive
                                        ? "Starting your voice conversation."
                                        : "Start once. Then speak naturally without pressing Send."}
                    </p>

                    {/* Sound wave */}
                    <div
                        className={`voice-wave ${
                            speaking || listening ? "active" : ""
                        }`}
                    >
                        {Array.from({ length: 19 }).map((_, index) => (
                            <span key={index} />
                        ))}
                    </div>

                    {/* Conversation box */}
                    <section className="voice-conversation">

                        <div className="voice-conversation-header">
                            <strong>Live conversation</strong>

                            <span className="voice-status">
                <span className="voice-status-dot" />

                                {listening
                                    ? "Listening"
                                    : speaking
                                        ? "Speaking"
                                        : loading
                                            ? "Processing"
                                            : conversationActive
                                                ? "Ready"
                                                : "Paused"}
              </span>
                        </div>

                        {recognizedText && (
                            <div className="voice-message voice-user-message">
                                <strong>You</strong>
                                <p>{recognizedText}</p>
                            </div>
                        )}

                        {interimText && (
                            <div className="voice-message voice-interim-message">
                                <strong>Recognizing</strong>
                                <p>{interimText}</p>
                            </div>
                        )}

                        {loading && (
                            <div className="voice-message voice-ai-message">
                                <strong>MeetingPilot AI</strong>

                                <p>
                                    <LoaderCircle
                                        className="voice-spinner"
                                        size={18}
                                    />
                                    Fetching your meeting information...
                                </p>
                            </div>
                        )}

                        {assistantText && (
                            <div className="voice-message voice-ai-message">
                                <strong>MeetingPilot AI</strong>

                                <p>{assistantText}</p>

                                <button
                                    className="voice-replay-button"
                                    onClick={replayResponse}
                                >
                                    <RotateCcw size={15} />
                                    Replay response
                                </button>
                            </div>
                        )}

                        {!recognizedText &&
                            !interimText &&
                            !assistantText &&
                            !loading && (
                                <p className="voice-empty-message">
                                    Your conversation will appear here.
                                </p>
                            )}

                    </section>

                    {/* Language */}
                    <div className="voice-language-control">
                        <Languages size={22} />

                        <select
                            value={language}
                            onChange={changeLanguage}
                            aria-label="Select voice language"
                        >
                            {LANGUAGES.map(item => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="voice-error">
                            {error}
                        </div>
                    )}

                    {/* Controls */}
                    <div className="voice-controls">

                        {!conversationActive ? (
                            <button
                                className="voice-primary-button"
                                onClick={startConversation}
                                disabled={loading}
                            >
                                <Play size={20} />
                                Start conversation
                            </button>
                        ) : (
                            <button
                                className="voice-stop-button"
                                onClick={pauseConversation}
                            >
                                <Pause size={20} />
                                Pause conversation
                            </button>
                        )}

                        {speaking && (
                            <button
                                className="voice-interrupt-button"
                                onClick={interruptSpeech}
                            >
                                <Square size={16} />
                                Interrupt
                            </button>
                        )}

                    </div>

                </main>

                <footer className="voice-footer">
                    Powered by Groq · Spring AI · Google Calendar · MCP
                </footer>

            </section>
        </div>
    );
}
