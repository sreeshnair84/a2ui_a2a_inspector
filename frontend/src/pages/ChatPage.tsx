import { useState, useRef, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';
import { apiClient } from '../services/api';
import { A2UISurface } from '../components/A2UISurface';

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

export default function ChatPage() {
    // State for A2UI Components (Adjacency List)
    const [components, setComponents] = useState<Map<string, any>>(new Map());

    // UI State
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [agentUrl, setAgentUrl] = useState('http://localhost:8001');
    const [showSettings, setShowSettings] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);

    // Title Editing State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const user = authService.getUser();

    // --- Helper Logic ---

    // Helper to merge new components into the map, preserving history in 'root'
    const mergeComponents = useCallback((newComponents: any[], isUserMsg: boolean = false) => {
        setComponents(prev => {
            const next = new Map(prev);

            // 1. Add all non-root components
            const nonRootUpdates = newComponents.filter(c => c.id !== 'root');
            nonRootUpdates.forEach(c => next.set(c.id, c));

            // 2. Handle Root Merging
            const newRoot = newComponents.find(c => c.id === 'root');

            // Logic: We treat the visible "Chat" as one giant 'Column' mapped to 'root'.
            // If we receive a User Message, we need to append its ID to 'root'.
            // If we receive an Agent Response (which might come with its own 'root'), we append its children to OUR 'root'.

            let currentRoot = next.get('root');
            if (!currentRoot) {
                currentRoot = { id: 'root', component: 'Column', children: { explicitList: [] } };
                next.set('root', currentRoot);
            }

            const existingList = currentRoot.children?.explicitList || [];
            let newIdsToAdd: string[] = [];

            if (isUserMsg) {
                // User messages don't usually come with a 'root' wrapper from our synthetic generator
                // So we just take all the new component IDs (which is just the user text)
                newIdsToAdd = nonRootUpdates.map(c => c.id);
            } else if (newRoot) {
                // Agent response HAS a root. We want to take its children and append them to ours.
                // We do NOT want to overwrite our root with theirs, because theirs only contains the latest turn.
                const newChildren = newRoot.children?.explicitList || [];
                // Filter out duplicates just in case
                newIdsToAdd = newChildren;
            } else if (!newRoot && !isUserMsg) {
                // Agent might send loose components without root (streaming chunks).
                // Usually these are updates to existing components, or new components referenced by a PREVIOUS root update.
                // If they are orphaned, we might want to add them to root?
                // For now, assume if no root provided in update, it's just component data updates (e.g. streaming text).
                // do nothing to root.
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


    // --- Stream Consumption Logic ---

    const consumeStream = async (stream: AsyncGenerator<any, void, unknown>) => {
        console.log("Starting stream consumption...");
        try {
            for await (const chunk of stream) {
                // console.log("ChatPage received chunk:", chunk);
                if (chunk.surfaceUpdate) {
                    // Check if this chunk is purely for a user message (synthetic)
                    // We can check metadata or just assume standard merge
                    const components = chunk.surfaceUpdate.components || [];
                    const isUser = components.some((c: any) => c.metadata?.role === 'user');

                    mergeComponents(components, isUser);

                } else if (chunk.cards) {
                    // Legacy support: Treat cards as new items to append to root
                    // Transform cards to components for consistency if possible, or lett A2UISurface handle them.
                    // But for IDs, we need them in root.
                    const cardComponents = chunk.cards.map((c: any) => ({ ...c, component: 'CardWrapper' })); // A2UISurface handles unknown types as legacy
                    mergeComponents(chunk.cards, true); // Treat like user message (append IDs to root)
                }
            }
        } catch (error) {
            console.error('Error consuming stream:', error);
        }
    };

    // --- Session Management ---

    useEffect(() => {
        loadSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadSessions = async () => {
        try {
            const data = await apiClient.getSessions();
            setSessions(data);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    };

    const selectSession = async (sessionId: string) => {
        if (loading) return;
        setLoading(true);
        setCurrentSessionId(sessionId);
        setIsEditingTitle(false);
        setComponents(new Map()); // Clear view

        try {
            const history = await apiClient.getSessionHistory(sessionId);
            // Replay history
            await consumeStream(historyGenerator(history));
        } catch (error) {
            console.error('Failed to load session history:', error);
        } finally {
            setLoading(false);
        }
    };

    const createNewSession = async () => {
        try {
            const newSession = await apiClient.createSession("New Chat");
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newSession.id);
            setComponents(new Map()); // Reset surface
            setIsEditingTitle(false);
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat?')) return;

        try {
            await apiClient.deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setComponents(new Map());
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    // ... Title editing helper methods ...
    const startEditingTitle = () => {
        const currentSession = sessions.find(s => s.id === currentSessionId);
        if (currentSession) {
            setEditedTitle(currentSession.title);
            setIsEditingTitle(true);
        }
    };

    const saveTitle = async () => {
        if (!currentSessionId || !editedTitle.trim()) {
            setIsEditingTitle(false);
            return;
        }
        try {
            const updatedSession = await apiClient.updateSession(currentSessionId, editedTitle);
            setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
            setIsEditingTitle(false);
        } catch (error) {
            console.error('Failed to update session:', error);
        }
    };


    // --- Chat Logic ---

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim() || loading) return;

        let activeSessionId = currentSessionId;
        if (!activeSessionId) {
            try {
                const newSession = await apiClient.createSession(inputText.slice(0, 30) || "New Chat");
                setSessions(prev => [newSession, ...prev]);
                setCurrentSessionId(newSession.id);
                activeSessionId = newSession.id;
                setComponents(new Map());
            } catch (error) {
                console.error("Failed to create session on send:", error);
                return;
            }
        }

        const text = inputText;
        setInputText('');
        setLoading(true);

        // Optimistically show user message
        const userMsgId = `user_msg_${Date.now()}`;
        const userEnvelope = {
            id: userMsgId,
            component: "Text",
            text: { markdown: text },
            metadata: { role: 'user' }
        };
        mergeComponents([userEnvelope], true);

        try {
            // Start streaming response
            const stream = apiClient.streamMessage(text, activeSessionId!, agentUrl);
            await consumeStream(stream);
            loadSessions(); // Refresh list associated with session
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Voice & Upload ---

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            await apiClient.uploadFile(file);
            const fileName = file.name;
            const fileMessage = `Uploaded file: ${fileName} (Size: ${Math.round(file.size / 1024)}KB)`;

            let activeSessionId = currentSessionId;
            if (!activeSessionId) {
                const newSession = await apiClient.createSession(`Upload: ${fileName}`);
                setSessions(prev => [newSession, ...prev]);
                setCurrentSessionId(newSession.id);
                activeSessionId = newSession.id;
                setComponents(new Map());
            }

            // Optimistic update
            const userMsgId = `user_file_${Date.now()}`;
            const userEnvelope = {
                id: userMsgId,
                component: "Text",
                text: { markdown: fileMessage },
                metadata: { role: 'user' }
            };
            mergeComponents([userEnvelope], true);

            // Stream the response
            const stream = apiClient.streamMessage(fileMessage, activeSessionId!, agentUrl);
            await consumeStream(stream);

        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAction = useCallback((action: any) => {
        console.log("User action:", action);
        // Handle submit_form or other actions
        if (currentSessionId && action.type === 'submit' && action.data) {
            const message = `Form Submitted: ${JSON.stringify(action.data)}`;

            // Optimistic update
            // We can't use mergeComponents easily here without passing it to A2UISurface or defining it outside
            // For now, let's just stream. The stream response will add to history.

            const stream = apiClient.streamMessage(message, currentSessionId, agentUrl);
            consumeStream(stream);
        }
    }, [currentSessionId, agentUrl, mergeComponents]); // added mergeComponents dependency if used, but it's not used directly here yet.

    // Cleanup & Logout
    const handleLogout = () => {
        authService.logout();
        window.location.reload();
    };


    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar (Keep existing sidebar layout) */}
            <div className={`${showSidebar ? 'w-64' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-gray-700">History</h2>
                    <button onClick={() => createNewSession()} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.map(session => (
                        <div key={session.id} onClick={() => selectSession(session.id)}
                            className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'hover:bg-gray-50 text-gray-600'}`}>
                            <div className="flex-1 truncate">
                                <p className="text-sm font-medium truncate">{session.title}</p>
                            </div>
                            <button onClick={(e) => deleteSession(e, session.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-bold bg-indigo-100 text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center">{user?.name?.[0].toUpperCase() || 'U'}</span>
                        <span className="truncate">{user?.name}</span>
                        <button onClick={handleLogout} className="ml-auto hover:text-red-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative bg-white">
                {/* Header */}
                <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur z-10">
                    <div className="flex items-center gap-3 flex-1">
                        <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                        {currentSessionId ? (
                            isEditingTitle ? (
                                <input autoFocus value={editedTitle} onChange={e => setEditedTitle(e.target.value)} onBlur={saveTitle} onKeyDown={e => e.key === 'Enter' && saveTitle()} className="font-semibold text-lg border rounded px-2" />
                            ) : (
                                <h1 onClick={startEditingTitle} className="font-semibold text-gray-800 text-lg cursor-pointer hover:text-indigo-600">{sessions.find(s => s.id === currentSessionId)?.title || "Chat"}</h1>
                            )
                        ) : <h1 className="font-semibold text-gray-800">A2UI Enterprise Chat</h1>}
                    </div>

                    {/* Settings Toggle */}
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-gray-400 hover:text-indigo-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    {showSettings && (
                        <div className="absolute top-16 right-6 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
                            <label className="block text-xs font-semibold text-gray-500 mb-1">A2A Agent URL</label>
                            <input value={agentUrl} onChange={e => setAgentUrl(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm" />
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto px-4 py-8 bg-gray-50" id="chat-container">
                    <div className="max-w-4xl mx-auto min-h-full">
                        {/* A2UI Surface */}
                        {/* We use SessionID as key to force remount/reset of processor when switching sessions */}
                        <A2UISurface
                            key={currentSessionId || 'empty'}
                            id="main"
                            components={Array.from(components.values())}
                            onAction={handleAction}
                            className="w-full h-full"
                        />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="max-w-4xl mx-auto relative flex gap-2">
                        <input
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 pl-4 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            disabled={loading}
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                        <button onClick={(e) => handleSendMessage(e)} disabled={loading || !inputText.trim()} className="px-6 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
