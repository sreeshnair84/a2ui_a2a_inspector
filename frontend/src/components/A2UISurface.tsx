import React, { useEffect, useRef } from 'react';
import '@a2ui/lit'; // Keeping import to ensure custom element is defined if needed later
import { MessageBubble } from './Chat/MessageBubble';
import { ThinkingBubble } from './Chat/ThinkingBubble';
import { ArtifactCard } from './Chat/ArtifactCard';

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
    /**
     * If true, new agent messages will automatically be read aloud.
     */
    talkBackEnabled?: boolean;
    selectedVoiceURI?: string;
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
    onAction,
    talkBackEnabled = false,
    selectedVoiceURI
}) => {
    const surfaceRef = useRef<HTMLElement>(null);

    // --- React Renderer Implementation ---

    const renderComponent = (compId: string): React.ReactNode => {
        const comp = components?.find(c => c.id === compId);
        if (!comp) return null;

        switch (comp.component) {
            case 'Text':
                return (
                    <MessageBubble
                        key={comp.id}
                        text={comp.text}
                        role={comp.metadata?.role || 'agent'}
                        autoSpeak={talkBackEnabled}
                        selectedVoiceURI={selectedVoiceURI}
                    />
                );

            case 'Error':
                return (
                    <MessageBubble
                        key={comp.id}
                        role="system"
                        error={comp.error}
                    />
                );

            case 'Thinking':
                return (
                    <ThinkingBubble
                        key={comp.id}
                        content={comp.content || comp.text}
                    />
                );

            case 'Artifact':
                return (
                    <ArtifactCard
                        key={comp.id}
                        title={comp.title || "Generated Artifact"}
                        type={comp.artifactType || "file"}
                        content={comp.content}
                        language={comp.language}
                        url={comp.url}
                    />
                );

            case 'Column':
                return (
                    <div key={comp.id} className="flex flex-col w-full gap-2">
                        {(comp.children?.explicitList || []).map((childId: string) => renderComponent(childId))}
                    </div>
                );
            case 'Row':
                return (
                    <div key={comp.id} className="flex flex-row gap-2 w-full flex-wrap">
                        {(comp.children?.explicitList || []).map((childId: string) => renderComponent(childId))}
                    </div>
                );
            default:
                // Legacy Card Support
                if (comp.type && comp.type.endsWith('_card')) {
                    if (comp.type === 'text_card') {
                        return <MessageBubble key={comp.id} text={comp.content?.text} role="agent" />;
                    }
                    if (comp.type === 'exception_card') {
                        return <MessageBubble key={comp.id} error={comp.content?.text} role="system" />;
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
