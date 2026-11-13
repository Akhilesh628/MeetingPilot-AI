
import { useCallback, useEffect, useRef, useState } from "react";

import {
    createRecognition,
    speakText,
    stopSpeech
} from "../services/voiceService";

export default function useVoiceChat({
                                         onSend,
                                         language = "en-IN"
                                     }) {
    const [active, setActive] = useState(false);
    const [listening, setListening] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState("");

    const activeRef = useRef(false);
    const listeningRef = useRef(false);
    const processingRef = useRef(false);
    const recognitionRef = useRef(null);
    const languageRef = useRef(language);
    const onSendRef = useRef(onSend);
    const speechTokenRef = useRef(0);
    const restartTimerRef = useRef(null);

    useEffect(() => {
        languageRef.current = language;
    }, [language]);

    useEffect(() => {
        onSendRef.current = onSend;
    }, [onSend]);

    const stopListening = useCallback(() => {
        clearTimeout(restartTimerRef.current);

        const recognition = recognitionRef.current;
        recognitionRef.current = null;

        listeningRef.current = false;
        setListening(false);

        if (recognition) {
            try {
                recognition.abort();
            } catch {
                // Recognition may already have stopped.
            }
        }
    }, []);

    const startListening = useCallback(() => {
        if (
            !activeRef.current ||
            processingRef.current ||
            listeningRef.current
        ) {
            return;
        }

        try {
            const recognition = createRecognition(
                languageRef.current
            );

            recognitionRef.current = recognition;

            let finalTranscript = "";

            recognition.onstart = () => {
                listeningRef.current = true;
                setListening(true);
                setError("");
            };

            recognition.onresult = (event) => {
                let interimTranscript = "";

                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {
                    const result = event.results[i];
                    const text = result[0].transcript;

                    if (result.isFinal) {
                        finalTranscript += text + " ";
                    } else {
                        interimTranscript += text;
                    }
                }

                setTranscript(
                    (finalTranscript + interimTranscript).trim()
                );
            };

            recognition.onerror = (event) => {
                if (
                    event.error !== "aborted" &&
                    event.error !== "no-speech"
                ) {
                    setError(
                        `Microphone error: ${event.error}`
                    );
                }
            };

            recognition.onend = () => {
                if (recognitionRef.current !== recognition) {
                    return;
                }

                recognitionRef.current = null;
                listeningRef.current = false;
                setListening(false);

                const message = finalTranscript.trim();

                if (!activeRef.current) return;

                if (message) {
                    processMessage(message);
                } else {
                    scheduleListening();
                }
            };

            recognition.start();

        } catch (err) {
            setError(err.message || "Unable to start microphone.");
            listeningRef.current = false;
            setListening(false);
        }
    }, []);

    const scheduleListening = useCallback(() => {
        clearTimeout(restartTimerRef.current);

        if (!activeRef.current) return;

        restartTimerRef.current = setTimeout(() => {
            if (activeRef.current) {
                startListening();
            }
        }, 500);
    }, [startListening]);

    const processMessage = async (message) => {
        if (
            !activeRef.current ||
            processingRef.current
        ) {
            return;
        }

        stopListening();

        processingRef.current = true;
        setProcessing(true);
        setTranscript(message);

        try {
            const result = await onSendRef.current(message);

            if (!activeRef.current) return;

            const answer =
                typeof result === "string"
                    ? result
                    : result?.response;

            if (!answer?.trim()) {
                processingRef.current = false;
                setProcessing(false);
                scheduleListening();
                return;
            }

            processingRef.current = false;
            setProcessing(false);

            setSpeaking(true);

            const token = ++speechTokenRef.current;

            speakText(answer, languageRef.current, {
                onEnd: () => {
                    if (token !== speechTokenRef.current) return;

                    setSpeaking(false);
                    scheduleListening();
                },

                onError: () => {
                    if (token !== speechTokenRef.current) return;

                    setSpeaking(false);
                    scheduleListening();
                }
            });

        } catch (err) {
            processingRef.current = false;
            setProcessing(false);

            setError(
                err.message || "MeetingPilot could not respond."
            );

            scheduleListening();
        }
    };

    const startConversation = useCallback(() => {
        if (activeRef.current) return;

        activeRef.current = true;
        setActive(true);
        setError("");
        setTranscript("");

        startListening();
    }, [startListening]);

    const interrupt = useCallback(() => {
        speechTokenRef.current++;

        stopSpeech();
        setSpeaking(false);

        if (activeRef.current) {
            startListening();
        }
    }, [startListening]);

    const endConversation = useCallback(() => {
        activeRef.current = false;
        processingRef.current = false;

        speechTokenRef.current++;

        clearTimeout(restartTimerRef.current);

        stopListening();
        stopSpeech();

        setActive(false);
        setListening(false);
        setSpeaking(false);
        setProcessing(false);
        setTranscript("");
        setError("");
    }, [stopListening]);

    useEffect(() => {
        return () => {
            activeRef.current = false;
            processingRef.current = false;

            speechTokenRef.current++;

            clearTimeout(restartTimerRef.current);

            recognitionRef.current?.abort();
            stopSpeech();
        };
    }, []);

    return {
        active,
        listening,
        speaking,
        processing,
        transcript,
        error,
        startConversation,
        endConversation,
        interrupt
    };
}
