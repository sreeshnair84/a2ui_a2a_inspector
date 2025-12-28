import { useRef, useState, useEffect } from 'react';
import { Paperclip, Send, Loader2, Mic, StopCircle } from 'lucide-react';
import { cn } from '../../utils';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface ChatInputProps {
    onSendMessage: (text: string) => void;
    onFileUpload: (file: File) => void;
    loading: boolean;
    placeholder?: string;
    speechLanguage?: string;
}

export const ChatInput = ({ onSendMessage, onFileUpload, loading, placeholder = "Type a message...", speechLanguage = 'en-US' }: ChatInputProps) => {
    const [inputText, setInputText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const { isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition(speechLanguage);

    useEffect(() => {
        if (isListening && transcript) {
            setInputText((_prev: any) => {
                // To avoid duplication if speech recognition sends partials
                // we might need a smarter diff, but for now simple replacement or append
                // Let's assume transcript is the *current session's* full transcript
                return transcript;
            });
        }
    }, [isListening, transcript]);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const textToSend = inputText.trim() || transcript.trim();
        if (!textToSend || loading) return;

        onSendMessage(textToSend);
        setInputText('');
        resetTranscript();
        if (isListening) stopListening();
    };

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            setInputText(''); // Clear input for new speech
            startListening();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(file);
            e.target.value = '';
        }
    };

    // Drag and Drop
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileUpload(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div
                className={cn(
                    "relative flex items-end gap-2 p-2 bg-white rounded-3xl border shadow-lg shadow-indigo-50/50 transition-all duration-300",
                    dragActive ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50" : "border-gray-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100",
                    loading && "opacity-80 grayscale-[0.5]",
                    isListening && "border-indigo-400 ring-4 ring-indigo-100"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {/* Drag Overlay */}
                {dragActive && (
                    <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl flex items-center justify-center pointer-events-none z-10 backdrop-blur-sm">
                        <span className="text-indigo-600 font-bold">Drop file to upload</span>
                    </div>
                )}

                {/* File Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all disabled:opacity-50"
                    disabled={loading || isListening}
                    title="Upload File"
                >
                    <Paperclip size={20} />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

                {/* Text Area (or Input) */}
                <input
                    value={isListening ? (transcript || "Listening...") : inputText}
                    onChange={e => !isListening && setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
                    placeholder={loading ? "Agent is thinking..." : placeholder}
                    className={cn(
                        "flex-1 py-3 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 resize-none max-h-32 text-base disabled:bg-transparent transition-colors",
                        isListening && "text-indigo-600 italic"
                    )}
                    disabled={loading}
                    autoComplete="off"
                />

                {/* Mic Button (SST) */}
                <button
                    onClick={handleMicClick}
                    className={cn(
                        "p-3 rounded-2xl transition-all duration-200 font-medium flex items-center justify-center transform active:scale-95",
                        isListening
                            ? "bg-red-50 text-red-500 hover:bg-red-100 animate-pulse"
                            : "text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                    )}
                    disabled={loading}
                    title={isListening ? "Stop Listening" : "Speak to Type"}
                >
                    {isListening ? <StopCircle size={20} fill="currentColor" /> : <Mic size={20} />}
                </button>

                {/* Send Button */}
                <button
                    onClick={() => handleSubmit()}
                    disabled={loading || (!inputText.trim() && !transcript.trim())}
                    className={cn(
                        "p-3 rounded-2xl transition-all duration-200 font-medium flex items-center justify-center transform active:scale-95",
                        loading || (!inputText.trim() && !transcript.trim())
                            ? "bg-gray-100 text-gray-400"
                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-indigo-200"
                    )}
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className={(inputText.trim() || transcript.trim()) ? "ml-0.5" : ""} />}
                </button>
            </div>

            <div className="text-center mt-2 flex items-center justify-center gap-2">
                <p className="text-xs text-gray-400 font-medium">
                    AI can make mistakes. Please verify important information.
                </p>
            </div>
        </div>
    );
};
