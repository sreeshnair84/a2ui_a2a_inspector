import { useState, useCallback, useEffect } from 'react';

export function useSpeechRecognition(language: string = 'en-US') {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognition, setRecognition] = useState<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recog = new SpeechRecognition();
            recog.continuous = true;
            recog.interimResults = true;
            recog.lang = language; // Use the passed language

            recog.onresult = (event: any) => {
                let currentTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcriptPart = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        currentTranscript += transcriptPart;
                    } else {
                        currentTranscript += transcriptPart;
                    }
                }
                setTranscript(currentTranscript);
            };

            recog.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recog.onend = () => {
                setIsListening(false);
            };

            setRecognition(recog);
        }
    }, [language]); // Re-create if language changes

    const startListening = useCallback(() => {
        if (recognition) {
            try {
                // Ensure lang is updated if relying on ref or recreation
                recognition.lang = language;
                recognition.start();
                setIsListening(true);
                setTranscript('');
            } catch (e) {
                console.error("Failed to start recognition", e);
            }
        } else {
            alert("Speech Recognition is not supported in this browser.");
        }
    }, [recognition, language]);

    const stopListening = useCallback(() => {
        if (recognition) {
            recognition.stop();
            setIsListening(false);
        }
    }, [recognition]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript: () => setTranscript('')
    };
}
