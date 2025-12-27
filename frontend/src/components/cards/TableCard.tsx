import type { TableCardContent } from '../../types/a2ui';

interface TableCardProps {
    id: string;
    content: TableCardContent;
}

export default function TableCard({ content }: TableCardProps) {
    return (
        <div className="flex justify-start mb-6 w-full">
            <div className="flex gap-4 w-full max-w-4xl">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex-shrink-0 flex items-center justify-center border border-indigo-50">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm hover:shadow-lg transition-all p-0 overflow-hidden w-full">
                    <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{content.title}</h3>
                                {content.message && (
                                    <p className="text-sm text-gray-500 mt-1">{content.message}</p>
                                )}
                            </div>
                            {content.ticket_reference && (
                                <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                                    Ref: {content.ticket_reference}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        {content.table.headers.map((header, idx) => (
                                            <th
                                                key={idx}
                                                className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {content.table.rows.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-gray-50/50 transition-colors">
                                            {row.map((cell, cellIdx) => (
                                                <td
                                                    key={cellIdx}
                                                    className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap first:font-medium first:text-gray-900"
                                                >
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Actions */}
                        {content.actions && content.actions.length > 0 && (
                            <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex gap-3">
                                {content.actions.map((action) => (
                                    action.url ? (
                                        <a
                                            key={action.id}
                                            href={action.url}
                                            className="flex-shrink-0 text-center bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 text-gray-600 font-medium px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md text-sm"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {action.label}
                                        </a>
                                    ) : (
                                        <button
                                            key={action.id}
                                            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm transform hover:-translate-y-0.5 ${action.type === 'primary'
                                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:shadow-md'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                }`}
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
