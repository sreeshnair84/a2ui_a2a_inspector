import type { TicketCardContent } from '../../types/a2ui';

interface TicketCardProps {
    id: string;
    content: TicketCardContent;
}

const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
};

const statusColors = {
    submitted: 'bg-gray-100 text-gray-800',
    pending_approval: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
};

export default function TicketCard({ content }: TicketCardProps) {
    return (
        <div className="flex justify-start mb-6 w-full">
            <div className="flex gap-4 w-full max-w-2xl">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex-shrink-0 flex items-center justify-center border border-indigo-50">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm hover:shadow-lg transition-all p-0 overflow-hidden w-full max-w-xl">
                    <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-gray-800">{content.title}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${priorityColors[content.priority]}`}>
                                    {content.priority}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 font-mono">ID: {content.ticket_id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[content.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                            {content.status.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>

                    <div className="p-6">
                        {/* Ticket Details */}
                        <div className="bg-gray-50/50 rounded-xl p-4 mb-6 border border-gray-100">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Specifications</h4>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                {Object.entries(content.details).map(([key, value]) => (
                                    <div key={key} className="flex flex-col">
                                        <span className="text-xs text-gray-400">{key.replace('_', ' ')}</span>
                                        <span className="font-medium text-gray-800 truncate" title={String(value)}>{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Timeline */}
                        {content.timeline && content.timeline.length > 0 && (
                            <div className="mb-6 relative">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">History</h4>
                                <div className="space-y-0 relative border-l-2 border-gray-100 ml-2 pl-4 py-1">
                                    {content.timeline.map((event, idx) => (
                                        <div key={idx} className="relative mb-4 last:mb-0">
                                            <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white ring-1 ring-gray-100"></div>
                                            <p className="text-sm font-medium text-gray-800">{event.message || event.status}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 flex gap-1">
                                                <span>{new Date(event.timestamp).toLocaleString()}</span>
                                                {event.actor && <span className="text-indigo-600 font-medium">• {event.actor}</span>}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        {content.actions && content.actions.length > 0 && (
                            <div className="flex gap-3 pt-2">
                                {content.actions.map((action) => (
                                    action.url ? (
                                        <a
                                            key={action.id}
                                            href={action.url}
                                            className="flex-1 text-center bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-600 font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md text-sm"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {action.label}
                                        </a>
                                    ) : (
                                        <button
                                            key={action.id}
                                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                                        >
                                            {action.label}
                                        </button>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
