import type { StatusCardContent } from '../../types/a2ui';

interface StatusCardProps {
    id: string;
    content: StatusCardContent;
}

const statusIcons = {
    pending: '⏳',
    in_progress: '🔄',
    complete: '✅',
    failed: '❌',
};

export default function StatusCard({ content }: StatusCardProps) {
    return (
        <div className="flex justify-start mb-6 w-full">
            <div className="flex gap-4 w-full max-w-2xl">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex-shrink-0 flex items-center justify-center border border-indigo-50">
                    <span className="text-xl">{statusIcons[content.status]}</span>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm hover:shadow-lg transition-all p-0 overflow-hidden w-full max-w-xl">
                    <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800">{content.title}</h3>
                            {content.progress !== undefined && (
                                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{content.progress}%</span>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Progress Bar */}
                        {content.progress !== undefined && (
                            <div className="mb-6">
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out relative"
                                        style={{ width: `${content.progress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Current Step */}
                        {content.current_step && (
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
                                <p className="text-sm text-indigo-900">
                                    <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide block mb-1">Current Activity</span>
                                    <span className="font-medium text-lg">{content.current_step}</span>
                                </p>
                            </div>
                        )}

                        {/* Steps */}
                        {content.steps && content.steps.length > 0 && (
                            <div className="space-y-4 relative">
                                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                                {content.steps.map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-4 relative">
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ring-4 ring-white z-10 
                                            ${step.status === 'complete' ? 'bg-green-500 text-white shadow-md shadow-green-200' :
                                                step.status === 'in_progress' ? 'bg-indigo-600 text-white animate-pulse shadow-md shadow-indigo-200' :
                                                    step.status === 'failed' ? 'bg-red-500 text-white shadow-md shadow-red-200' :
                                                        'bg-gray-100 text-gray-400 border border-gray-200'}`}
                                        >
                                            {step.status === 'complete' ? '✓' :
                                                step.status === 'failed' ? '✗' :
                                                    idx + 1}
                                        </div>
                                        <div className="flex-1 pt-0.5">
                                            <div className="flex justify-between items-start">
                                                <p className={`text-sm font-medium ${step.status === 'in_progress' ? 'text-indigo-700' :
                                                    step.status === 'complete' ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {step.name}
                                                </p>
                                                {step.duration && (
                                                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">{step.duration}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Metadata */}
                        {content.metadata && Object.keys(content.metadata).length > 0 && (
                            <div className="mt-6 pt-5 border-t border-gray-50">
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(content.metadata).map(([key, value]) => (
                                        <div key={key} className="bg-gray-50 rounded-lg p-2.5">
                                            <span className="text-xs text-gray-500 block mb-0.5 capitalize">{key.replace('_', ' ')}</span>
                                            <span className="text-sm font-semibold text-gray-800 word-break-all">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
