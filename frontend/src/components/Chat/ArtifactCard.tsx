import React from 'react';
import { FileCode, Download, ExternalLink, Copy, Check } from 'lucide-react';


interface ArtifactCardProps {
    title: string;
    type?: 'code' | 'file' | 'link';
    content: string;
    language?: string; // For code artifacts
    url?: string;      // For link artifacts
}

export const ArtifactCard = ({ title, type = 'file', content, language, url }: ArtifactCardProps) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 mr-4">
                {/* Spacer */}
            </div>

            <div className="max-w-[85%] md:max-w-[75%] w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                            <FileCode size={16} />
                        </div>
                        <span className="truncate">{title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {url && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors" title="Open Link">
                                <ExternalLink size={16} />
                            </a>
                        )}
                        <button
                            onClick={handleCopy}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Copy Content"
                        >
                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 text-sm font-mono bg-gray-50/30 overflow-x-auto custom-scrollbar max-h-64">
                    <pre className="whitespace-pre text-gray-600">
                        {content}
                    </pre>
                </div>

                {/* Footer Action (Optional download style) */}
                <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 flex justify-end">
                    <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        <Download size={12} />
                        Save to Brain
                    </button>
                </div>
            </div>
        </div>
    );
};
