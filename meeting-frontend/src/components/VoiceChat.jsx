
import { useState } from "react";

import {
    Mic,
    MicOff,
    PhoneOff,
    Volume2,
    VolumeX,
    LoaderCircle,
    X,
    Languages
} from "lucide-react";

import useVoiceChat from "../hooks/useVoiceChat";

import "./VoiceChat.css";

export default function VoiceChat({ onSend, onClose }) {
    const [language, setLanguage] = useState("en-IN");

    const {
        active,
        listening,
        speaking,
        processing,
        transcript,
        error,
        startConversation,
        endConversation,
        interrupt
    } = useVoiceChat({
        onSend,
        language
    });

    const closeVoice = () => {
        endConversation();
        onClose?.();
    };

    const status = processing
        ? "MeetingPilot is thinking..."
        : speaking
            ? "MeetingPilot is speaking..."
            : listening
                ? "Listening to you..."
                : active
                    ? "Preparing microphone..."
                    : "Ready to talk";

    return (
        <div className="voice-overlay">

            <header className="voice-header">

                <div className="voice-brand">
                    <div className="voice-brand-icon">
                        <Mic size={22} />
                    </div>

                    <div>
                        <h2>MeetingPilot AI</h2>
                        <p>Real-time Voice Assistant</p>
                    </div>
                </div>

                <button
                    className="voice-close"
                    onClick={closeVoice}
                    title="Close voice chat"
                    aria-label="Close voice chat"
                >
                    <X size={23} />
                </button>

            </header>

            <main className="voice-main">

                <div
                    className={`voice-orb ${
                        listening
                            ? "listening"
                            : speaking
                                ? "speaking"
                                : processing
                                    ? "thinking"
                                    : ""
                    }`}
                >
                    {processing ? (
                        <LoaderCircle
                            size={55}
                            className="voice-loader"
                        />
                    ) : speaking ? (
                        <Volume2 size={55} />
                    ) : listening ? (
                        <Mic size={55} />
                    ) : (
                        <MicOff size={55} />
                    )}
                </div>

                <h1>{status}</h1>

                <p className="voice-description">
                    {listening
                        ? "Speak naturally. I'm listening."
                        : speaking
                            ? "You can interrupt me anytime."
                            : processing
                                ? "Processing your request..."
                                : "Start a conversation with MeetingPilot."}
                </p>

                <div className="voice-wave">
                    {Array.from({ length: 21 }).map((_, index) => (
                        <span
                            key={index}
                            className={
                                listening || speaking
                                    ? "wave-active"
                                    : ""
                            }
                            style={{
                                "--wave-index": index
                            }}
                        />
                    ))}
                </div>

                <div className="voice-transcript">

                    <div className="transcript-heading">
                        <span>Latest conversation</span>

                        {(listening || speaking) && (
                            <span className="transcript-live">
                <span />
                Live
              </span>
                        )}
                    </div>

                    {transcript ? (
                        <p>{transcript}</p>
                    ) : (
                        <p className="transcript-placeholder">
                            Your conversation will appear here...
                        </p>
                    )}

                </div>

                {error && (
                    <div className="voice-error">
                        {error}
                    </div>
                )}

                <div className="voice-language">

                    <Languages size={20} />

                    <select
                        value={language}
                        onChange={(event) =>
                            setLanguage(event.target.value)
                        }
                        disabled={active}
                        aria-label="Voice language"
                    >
                        <option value="en-IN">
                            English (India)
                        </option>

                        <option value="hi-IN">
                            Hindi (India)
                        </option>
                    </select>

                </div>

            </main>

            <footer className="voice-bottom">

                <div className="voice-controls">

                    {!active ? (

                        <button
                            className="voice-start"
                            onClick={startConversation}
                        >
                            <Mic size={23} />
                            Start conversation
                        </button>

                    ) : (
                        <>
                            <button
                                className="voice-mic"
                                onClick={interrupt}
                                disabled={!speaking}
                                title="Interrupt AI and speak"
                                aria-label="Interrupt AI"
                            >
                                <Mic size={23} />
                            </button>

                            <button
                                className="voice-end"
                                onClick={closeVoice}
                                title="End conversation"
                                aria-label="End conversation"
                            >
                                <PhoneOff size={23} />
                            </button>

                            <button
                                className="voice-speaker"
                                onClick={interrupt}
                                disabled={!speaking}
                                title="Stop AI speech"
                                aria-label="Stop AI speech"
                            >
                                <VolumeX size={23} />
                            </button>
                        </>
                    )}

                </div>

                <p className="voice-control-hint">
                    {!active
                        ? "Press Start conversation to begin"
                        : speaking
                            ? "Tap the microphone to interrupt"
                            : listening
                                ? "MeetingPilot is listening to you"
                                : "Your voice assistant is active"}
                </p>

                <p className="voice-footer-text">
                    Powered by Groq · Spring AI · Google Calendar MCP
                </p>

            </footer>

        </div>
    );
}
