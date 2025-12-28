import React from 'react';
import { MessageBubble } from './Chat/MessageBubble';
import { FormCard } from './Chat/FormCard';

interface A2UISurfaceProps {
    id?: string;
    className?: string;
    components?: any[];
    onAction?: (action: any) => void;
}

export const A2UISurface: React.FC<A2UISurfaceProps> = ({
    className = '',
    components = [],
    onAction
}) => {
    // Create a map for quick lookup
    const componentMap = new Map(components.map(c => [c.id, c]));

    // Find root component
    const root = componentMap.get('root');
    if (!root) {
        return <div className={className}>No content</div>;
    }

    // Get children IDs from root
    let childIds: string[] = [];

    // Handle v0.8 format: {component: {Column: {children: {explicitList: [...]}}}}
    if (root.component && typeof root.component === 'object' && root.component.Column) {
        childIds = root.component.Column.children?.explicitList || [];
    }
    // Handle v0.9 format: {component: "Column", children: {explicitList: [...]}}
    else if (root.children) {
        childIds = root.children.explicitList || [];
    }

    const renderComponent = (compId: string): React.ReactNode => {
        const comp = componentMap.get(compId);
        if (!comp) return null;

        // Extract component type and props
        let componentType = '';
        let componentProps: any = {};

        if (typeof comp.component === 'string') {
            // v0.9 format
            componentType = comp.component;
            componentProps = comp;
        } else if (typeof comp.component === 'object') {
            // v0.8 format
            const keys = Object.keys(comp.component);
            if (keys.length > 0) {
                componentType = keys[0];
                componentProps = comp.component[componentType];
            }
        }

        // Render based on type
        switch (componentType) {
            case 'Text':
                // Extract text - handle both v0.8 and v0.9 formats
                let text = '';

                if (typeof comp.component === 'string') {
                    // v0.9 format: text is at comp.text
                    text = comp.text?.literalString || comp.text?.markdown || comp.text || '';
                } else {
                    // v0.8 format: text is at componentProps.text
                    text = componentProps.text?.literalString ||
                        componentProps.text?.markdown ||
                        componentProps.text || '';
                }

                const role = comp.metadata?.role || componentProps.metadata?.role || 'agent';
                const usageHint = componentProps.usageHint;

                return (
                    <MessageBubble
                        key={comp.id}
                        text={text}
                        role={role}
                        usageHint={usageHint}
                    />
                );

            case 'FormCard':
                console.log('Rendering FormCard:', comp.id, 'content:', componentProps.content || componentProps);
                return (
                    <FormCard
                        key={comp.id}
                        id={comp.id}
                        content={componentProps.content || componentProps}
                        onAction={onAction}
                    />
                );

            default:
                return (
                    <div key={comp.id} className="p-2 text-sm text-gray-500">
                        Unknown component: {componentType}
                    </div>
                );
        }
    };

    return (
        <div className={className}>
            {childIds.map(id => renderComponent(id))}
        </div>
    );
};
