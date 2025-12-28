import React, { useState } from 'react';
import { ChevronDown, ChevronRight, BrainCircuit } from 'lucide-react';


interface ThinkingBubbleProps {
    content: string;
    defaultOpen?: boolean;
}

export const ThinkingBubble = ({ content, defaultOpen = false }: ThinkingBubbleProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 mr-4">
                {/* Spacer to align with avatar */}
            </div>

            <div className="flex-1 max-w-[85%] md:max-w-[75%]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors mb-2 select-none"
                >
                    <BrainCircuit size={14} />
                    <span>Thought Process</span>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {isOpen && (
                    <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl text-xs text-gray-500 font-mono leading-relaxed whitespace-pre-wrap animate-in fade-in zoom-in-95 duration-200">
                        {content}
                    </div>
                )}
            </div>
        </div>
    );
};
