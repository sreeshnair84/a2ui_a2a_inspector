import type { TextCardContent } from '../../types/a2ui';

interface TextCardProps {
    id: string;
    content: TextCardContent;
}

export default function TextCard({ id, content }: TextCardProps) {
    const isUser = id.startsWith('user_');

    if (isUser) {
        return (
            <div className="flex justify-end mb-6 animate-fadeIn">
                <div className="flex flex-col items-end max-w-[80%]">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tr-sm px-6 py-4 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">{content.text}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-start mb-6 animate-fadeIn">
            <div className="flex gap-4 max-w-[85%] items-start">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ring-2 ring-gray-50 transform hover:scale-110 transition-transform duration-200">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-6 py-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <p className="text-gray-800 whitespace-pre-wrap text-[15px] leading-relaxed">{content.text}</p>
                        {content.metadata && (
                            <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400 flex flex-wrap gap-2">
                                {Object.entries(content.metadata).map(([key, value]) => (
                                    <span key={key} className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                        <span className="font-semibold text-gray-500">{key}:</span> {String(value)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
