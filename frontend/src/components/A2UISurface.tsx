import React, { useEffect, useRef } from 'react';
import '@a2ui/lit'; // Keeping import to ensure custom element is defined if needed later
import { MessageBubble } from './Chat/MessageBubble';
import { ThinkingBubble } from './Chat/ThinkingBubble';
import { ArtifactCard } from './Chat/ArtifactCard';
import { FormCard } from './Chat/FormCard';


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
        if (!comp) {
            console.log(`Component ${compId} not found`);
            return null;
        }

        console.log(`Rendering component ${compId}:`, comp);

        // A2UI v0.8 format: component is an object like {"Text": {...props...}}
        // Extract component type and properties
        let componentType: string | undefined;
        let componentProps: any = {};

        if (typeof comp.component === 'string') {
            // Legacy v0.9 format support
            componentType = comp.component;
            componentProps = comp;
            console.log(`v0.9 format detected: ${componentType}`);
        } else if (typeof comp.component === 'object') {
            // v0.8 format: {"Text": {...props...}}
            const keys = Object.keys(comp.component);
            if (keys.length > 0) {
                componentType = keys[0];
                componentProps = comp.component[componentType];
                console.log(`v0.8 format detected: ${componentType}`, componentProps);
            }
        }

        if (!componentType) {
            console.log('No component type found for:', comp);
            return null;
        }

        switch (componentType) {
            case 'Text':
                // Check usageHint for special types
                const usageHint = componentProps.usageHint;
                const textContent = componentProps.text?.literalString || componentProps.text?.markdown || componentProps.text || "";

                console.log(`Text component ${comp.id}: textContent="${textContent}", usageHint="${usageHint}"`);

                if (usageHint === 'subtle') {
                    return (
                        <ThinkingBubble
                            key={comp.id}
                            content={textContent}
                        />
                    );
                }

                return (
                    <MessageBubble
                        key={comp.id}
                        text={textContent}
                        role={comp.metadata?.role || 'agent'}
                        autoSpeak={talkBackEnabled}
                        selectedVoiceURI={selectedVoiceURI}
                        usageHint={usageHint}
                    />
                );

            case 'Error':
                return (
                    <MessageBubble
                        key={comp.id}
                        role="system"
                        error={componentProps.error || comp.error}
                    />
                );

            case 'Thinking':
                return (
                    <ThinkingBubble
                        key={comp.id}
                        content={componentProps.content || componentProps.text || comp.content || comp.text}
                    />
                );

            case 'Artifact':
                return (
                    <ArtifactCard
                        key={comp.id}
                        title={componentProps.title || comp.title || "Generated Artifact"}
                        type={componentProps.artifactType || comp.artifactType || "file"}
                        content={componentProps.content || comp.content}
                        language={componentProps.language || comp.language}
                        url={componentProps.url || comp.url}
                    />
                );

            case 'FormCard':
                return (
                    <FormCard
                        key={comp.id}
                        id={comp.id}
                        content={componentProps.content || componentProps}
                        onAction={onAction}
                    />
                );

            case 'Column':
                const columnChildren = componentProps.children?.explicitList || comp.children?.explicitList || [];
                return (
                    <div key={comp.id} className="flex flex-col w-full gap-2">
                        {columnChildren.map((childId: string) => renderComponent(childId))}
                    </div>
                );

            case 'Row':
                const rowChildren = componentProps.children?.explicitList || comp.children?.explicitList || [];
                return (
                    <div key={comp.id} className="flex flex-row gap-2 w-full flex-wrap">
                        {rowChildren.map((childId: string) => renderComponent(childId))}
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

    console.log('A2UISurface rendering. Total components:', components?.length);
    console.log('Root component:', root);

    let content: React.ReactNode;
    if (root) {
        console.log('Rendering from root');
        content = renderComponent('root');
    } else {
        console.log('No root found, rendering all components');
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
