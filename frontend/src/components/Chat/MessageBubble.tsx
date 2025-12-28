import React from 'react';
import { cn } from '../../utils';
import { User, Bot, AlertCircle, ThumbsUp, ThumbsDown, Volume2, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

interface MessageBubbleProps {
    text?: string | { markdown: string } | { literalString: string };
    role: 'user' | 'agent' | 'system';
    error?: any;
    className?: string;
    onFeedback?: (type: 'up' | 'down') => void;
}

export const MessageBubble = ({ text, role, error, className, onFeedback }: MessageBubbleProps) => {
    const isUser = role === 'user';
    const isError = !!error;
    const { speak, stop, isSpeaking } = useTextToSpeech();

    // Extract content safely
    let content = "";
    if (text) {
        if (typeof text === 'string') content = text;
        else if ('markdown' in text) content = text.markdown;
        else if ('literalString' in text) content = text.literalString;
        else if ((text as any).text) content = (text as any).text;
    } else if (error) {
        content = error.message || JSON.stringify(error);
    }

    const handleSpeak = () => {
        if (isSpeaking) {
            stop();
        } else {
            // Strip markdown chars roughly for speech if needed, but synthetic voices usually handle plain text well.
            // For now passing raw text content.
            speak(content);
        }
    };

    return (
        <div className={cn(
            "flex w-full mb-6 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 group",
            isUser ? "flex-row-reverse" : "flex-row",
            className
        )}>
            {/* Avatar */}
            <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white",
                isUser ? "bg-indigo-600 text-white" : isError ? "bg-red-100 text-red-600" : "bg-white text-indigo-600 border-gray-100"
            )}>
                {isUser ? <User size={16} /> : isError ? <AlertCircle size={16} /> : <Bot size={16} />}
            </div>

            {/* Bubble */}
            <div className="flex flex-col max-w-[85%] md:max-w-[75%]">
                <div className={cn(
                    "px-6 py-4 rounded-3xl shadow-sm text-sm leading-relaxed overflow-hidden relative",
                    isUser
                        ? "bg-indigo-600 text-white rounded-tr-sm shadow-indigo-500/20"
                        : isError
                            ? "bg-red-50 text-red-800 border border-red-100 rounded-tl-sm"
                            : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-gray-200/50"
                )}>
                    {isError && <p className="font-bold text-xs mb-1 uppercase tracking-wider text-red-500">Error</p>}

                    <div className={cn("prose prose-sm break-words max-w-none", isUser ? "prose-invert" : "prose-slate")}>
                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                            {content}
                        </ReactMarkdown>
                    </div>

                    {/* TTS Button (Agent only) */}
                    {!isUser && !isError && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleSpeak}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                                title="Read Aloud"
                            >
                                {isSpeaking ? <StopCircle size={14} className="text-indigo-600 animate-pulse" /> : <Volume2 size={14} />}
                            </button>
                        </div>
                    )}
                </div>

                {/* Feedback Actions (Only for Agent) */}
                {!isUser && !isError && (
                    <div className="flex items-center gap-2 mt-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button onClick={() => onFeedback?.('up')} className="p-1 text-gray-400 hover:text-green-500 bg-gray-50/50 rounded hover:bg-white transition-all"><ThumbsUp size={14} /></button>
                        <button onClick={() => onFeedback?.('down')} className="p-1 text-gray-400 hover:text-red-500 bg-gray-50/50 rounded hover:bg-white transition-all"><ThumbsDown size={14} /></button>
                    </div>
                )}
            </div>
        </div>
    );
};
