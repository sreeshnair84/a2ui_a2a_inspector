import React, { useEffect, useRef } from 'react';
import '@a2ui/lit'; // Keeping import to ensure custom element is defined if needed later

/**
 * React wrapper for A2UI Surface.
 * Uses a CUSTOM REACT RENDERER to support "Professional" chat bubble styling and reliability.
 */

interface A2UISurfaceProps {
    id?: string;
    className?: string;
    /**
     * List of components to render (Adjacency List values)
     */
    components?: any[];
    /**
     * Callback for user actions
     */
    onAction?: (action: any) => void;
}

// Extend JSX IntrinsicElements to avoid TS errors for the hidden element
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'a2ui-surface': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                components?: any[];
                cards?: any[];
            };
        }
    }
}

export const A2UISurface: React.FC<A2UISurfaceProps> = ({
    id = 'main',
    className,
    components = [],
    onAction
}) => {
    const surfaceRef = useRef<HTMLElement>(null);

    // --- React Renderer Implementation ---

    const renderComponent = (compId: string): React.ReactNode => {
        const comp = components?.find(c => c.id === compId);
        if (!comp) return null;

        switch (comp.component) {
            case 'Text':
                // Check metadata for role to style as User vs Agent
                const isUser = comp.metadata?.role === 'user';

                return (
                    <div key={comp.id} className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm
                            ${isUser
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}
                        `}>
                            <div className={`prose text-sm max-w-none break-words ${isUser ? 'prose-invert' : ''}`}>
                                {comp.text?.literalString || comp.text?.markdown || (typeof comp.text === 'string' ? comp.text : JSON.stringify(comp.text))}
                            </div>
                        </div>
                    </div>
                );

            case 'Error':
                return (
                    <div key={comp.id} className="flex w-full mb-4 justify-start">
                        <div className="max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm bg-red-50 text-red-700 border border-red-100 rounded-bl-none">
                            <div className="flex items-center gap-2 mb-1 font-semibold">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                System Error
                            </div>
                            <div className="break-words font-mono text-xs">
                                {comp.error?.message || JSON.stringify(comp.error)}
                            </div>
                        </div>
                    </div>
                );

            case 'Column':
                return (
                    <div key={comp.id} className="flex flex-col w-full">
                        {(comp.children?.explicitList || []).map((childId: string) => renderComponent(childId))}
                    </div>
                );
            case 'Row':
                return (
                    <div key={comp.id} className="flex flex-row gap-2 w-full">
                        {(comp.children?.explicitList || []).map((childId: string) => renderComponent(childId))}
                    </div>
                );
            default:
                // Check if it's a legacy card or just a fallback
                if (comp.type && comp.type.endsWith('_card')) {
                    // Legacy card support - Wrap in Bubble-ish container
                    if (comp.type === 'text_card') {
                        return (
                            <div key={comp.id} className="flex w-full mb-4 justify-start">
                                <div className="max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm bg-white text-gray-800 border border-gray-100 rounded-bl-none">
                                    <div className="prose text-sm text-gray-800 whitespace-pre-wrap">
                                        {comp.content?.text || JSON.stringify(comp.content)}
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    if (comp.type === 'exception_card') {
                        return (
                            <div key={comp.id} className="flex w-full mb-4 justify-start">
                                <div className="max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm bg-red-50 text-red-700 border border-red-100 rounded-bl-none">
                                    <strong>Error (Legacy):</strong> {comp.content?.text || JSON.stringify(comp.content)}
                                </div>
                            </div>
                        );
                    }
                }

                return (
                    <div key={comp.id} className="mx-auto my-2 p-2 border border-gray-300 rounded text-xs text-gray-500 mb-1">
                        Unknown component: {JSON.stringify(comp)}
                    </div>
                );
        }
    };

    // Find root component or fallback to rendering all if no root
    const root = components?.find(c => c.id === 'root');

    let content: React.ReactNode;
    if (root) {
        content = renderComponent('root');
    } else {
        content = components?.map(c => renderComponent(c.id));
    }

    // Effect to keep web component updated just in case (for debug)
    useEffect(() => {
        const surface = surfaceRef.current;
        if (surface && components) {
            (surface as any).components = [...components];
            // POLYFILL: Map to legacy 'cards' for v0.8/older support
            const cards = components.map(comp => {
                if (comp.component === 'Text' && comp.text) {
                    return {
                        id: comp.id,
                        type: 'text_card',
                        content: {
                            text: comp.text.literalString || comp.text.markdown || JSON.stringify(comp.text)
                        }
                    };
                }
                return null;
            }).filter(Boolean);
            if (cards.length) (surface as any).cards = cards;
        }
    }, [components]);


    return (
        <div className={className}>
            <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                {content}
            </div>

            {/* Keeping the web component hidden */}
            <a2ui-surface ref={surfaceRef} id={id} style={{ display: 'none' }}></a2ui-surface>
        </div>
    );
};
