import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';

/**
 * Generator that yields history items as envelopes.
 */
async function* historyGenerator(history: any[]) {
    for (const msg of history) {
        if (msg.role === 'agent') {
            try {
                // Determine format: is it old 'cards' list or new 'envelopes' list?
                const content = JSON.parse(msg.content);

                if (Array.isArray(content)) {
                    // It's a list. Could be cards or envelopes.
                    // If items have 'surfaceUpdate', it's envelopes.
                    for (const item of content) {
                        yield item;
                    }
                } else if (content.surfaceUpdate) {
                    // Single envelope
                    yield content;
                }
            } catch (e) {
                console.error("Error parsing history message", e);
            }
        } else if (msg.role === 'user') {
            // Yield a synthetic envelope for the user message
            yield {
                surfaceUpdate: {
                    components: [{
                        id: `user_msg_${msg.timestamp || Math.random().toString(36).substr(2, 9)}`,
                        component: "Text",
                        text: { markdown: msg.content },
                        metadata: { role: 'user' }
                    }]
                }
            };
        }
    }
}

export function useChat() {
    const [components, setComponents] = useState<Map<string, any>>(new Map());
    const [loading, setLoading] = useState(false);

    // Helper to merge new components into the map, preserving history in 'root'
    const mergeComponents = useCallback((newComponents: any[], isUserMsg: boolean = false) => {
        setComponents(prev => {
            const next = new Map(prev);

            // 1. Add all non-root components
            const nonRootUpdates = newComponents.filter(c => c.id !== 'root');
            nonRootUpdates.forEach(c => next.set(c.id, c));

            // 2. Handle Root Merging
            const newRoot = newComponents.find(c => c.id === 'root');

            let currentRoot = next.get('root');
            if (!currentRoot) {
                currentRoot = { id: 'root', component: 'Column', children: { explicitList: [] } };
                next.set('root', currentRoot);
            }

            const existingList = currentRoot.children?.explicitList || [];
            let newIdsToAdd: string[] = [];

            if (isUserMsg) {
                newIdsToAdd = nonRootUpdates.map(c => c.id);
            } else if (newRoot) {
                const newChildren = newRoot.children?.explicitList || [];
                newIdsToAdd = newChildren;
            }

            // Append unique new IDs
            const finalIds = [...existingList];
            newIdsToAdd.forEach(id => {
                if (!finalIds.includes(id)) {
                    finalIds.push(id);
                }
            });

            next.set('root', {
                ...currentRoot,
                children: { explicitList: finalIds }
            });

            return next;
        });
    }, []);

    const consumeStream = useCallback(async (stream: AsyncGenerator<any, void, unknown>) => {
        try {
            for await (const chunk of stream) {
                if (chunk.surfaceUpdate) {
                    const components = chunk.surfaceUpdate.components || [];
                    const isUser = components.some((c: any) => c.metadata?.role === 'user');
                    mergeComponents(components, isUser);

                } else if (chunk.cards) {
                    const cardComponents = chunk.cards.map((c: any) => ({ ...c, component: 'CardWrapper' }));
                    mergeComponents(chunk.cards, true);
                }
            }
        } catch (error) {
            console.error('Error consuming stream:', error);
        }
    }, [mergeComponents]);

    const loadHistory = useCallback(async (sessionId: string) => {
        setLoading(true);
        setComponents(new Map()); // Clear view
        try {
            const history = await apiClient.getSessionHistory(sessionId);
            await consumeStream(historyGenerator(history));
        } catch (error) {
            console.error('Failed to load session history:', error);
        } finally {
            setLoading(false);
        }
    }, [consumeStream]);

    const streamMessage = useCallback(async (text: string, sessionId: string, agentUrl: string) => {
        setLoading(true);
        try {
            const stream = apiClient.streamMessage(text, sessionId, agentUrl);
            await consumeStream(stream);
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [consumeStream]);

    const addOptimisticMessage = useCallback((text: string) => {
        const userMsgId = `user_msg_${Date.now()}`;
        const userEnvelope = {
            id: userMsgId,
            component: "Text",
            text: { markdown: text },
            metadata: { role: 'user' }
        };
        mergeComponents([userEnvelope], true);
        return userMsgId;
    }, [mergeComponents]);

    const reset = useCallback(() => {
        setComponents(new Map());
        setLoading(false);
    }, []);

    return {
        components: Array.from(components.values()),
        loading,
        mergeComponents, // Exposed if needed for other file types
        loadHistory,
        streamMessage,
        addOptimisticMessage,
        reset
    };
}
