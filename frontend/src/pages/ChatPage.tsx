import { useState, useEffect } from 'react';
import { useSessions } from '../hooks/useSessions';
import { useChat } from '../hooks/useChat';
import { Sidebar } from '../components/Sidebar';
import { ChatInput } from '../components/Chat/ChatInput';
import { MessageList } from '../components/Chat/MessageList';
import { apiClient } from '../services/api';
import { Menu, Settings, Check, X, Edit2 } from 'lucide-react';
import { cn } from '../utils';

export default function ChatPage() {
    // Hooks
    const {
        sessions, currentSessionId, selectSession, createNewSession, deleteSession,
        isEditingTitle, editedTitle, setEditedTitle, startEditingTitle, saveTitle, cancelEditingTitle
    } = useSessions();

    const { components, loading: chatLoading, loadHistory, streamMessage, addOptimisticMessage, reset } = useChat();

    // Local State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [agentUrl, setAgentUrl] = useState('http://localhost:8001');

    // Effects
    useEffect(() => {
        if (currentSessionId) {
            loadHistory(currentSessionId);
        } else {
            reset();
        }
    }, [currentSessionId, loadHistory, reset]);

    // Handlers
    const handleSendMessage = async (text: string) => {
        let activeSessionId = currentSessionId;
        if (!activeSessionId) {
            try {
                const newSession = await createNewSession(text.slice(0, 30));
                activeSessionId = newSession.id;
            } catch (error) {
                console.error("Failed to create session:", error);
                return;
            }
        }

        addOptimisticMessage(text);
        try {
            await streamMessage(text, activeSessionId!, agentUrl);
        } catch (error) {
            console.error("Stream failed:", error);
        }
    };

    const handleFileUpload = async (file: File) => {
        try {
            await apiClient.uploadFile(file);
            const msg = `Uploaded file: ${file.name} (Size: ${Math.round(file.size / 1024)}KB)`;

            let activeSessionId = currentSessionId;
            if (!activeSessionId) {
                const newSession = await createNewSession(`Upload: ${file.name}`);
                activeSessionId = newSession.id;
            }

            addOptimisticMessage(msg);
            await streamMessage(msg, activeSessionId!, agentUrl);
        } catch (e) {
            console.error("Upload failed:", e);
        }
    };

    const handleAction = (action: any) => {
        // Handle actions from A2UI Components (e.g. standard buttons, not the core input)
        // If we need to send a message back:
        if (action.type === 'submit' && action.data && currentSessionId) {
            const message = `Form Submitted: ${JSON.stringify(action.data)}`;
            addOptimisticMessage(message);
            streamMessage(message, currentSessionId, agentUrl);
        }
    };

    const currentSession = sessions.find(s => s.id === currentSessionId);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <Sidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={selectSession}
                onCreateSession={() => createNewSession()}
                onDeleteSession={deleteSession}
                isOpen={sidebarOpen}
                className="shrink-0 z-20 absolute md:relative h-full"
            />

            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-black/20 z-10" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                {/* Header */}
                <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur z-10 sticky top-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 -ml-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="flex items-center gap-2 min-w-0">
                            {currentSessionId ? (
                                isEditingTitle ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            autoFocus
                                            value={editedTitle}
                                            onChange={e => setEditedTitle(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && saveTitle()}
                                            className="font-semibold text-lg border-b-2 border-indigo-500 focus:outline-none px-1 bg-transparent"
                                        />
                                        <button onClick={saveTitle} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={18} /></button>
                                        <button onClick={cancelEditingTitle} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={18} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group cursor-pointer" onClick={startEditingTitle}>
                                        <h1 className="font-semibold text-gray-800 text-lg truncate max-w-md">
                                            {currentSession?.title || "Chat"}
                                        </h1>
                                        <Edit2 size={14} className="opacity-0 group-hover:opacity-50 text-gray-400" />
                                    </div>
                                )
                            ) : (
                                <h1 className="font-semibold text-gray-800 text-lg">New Conversation</h1>
                            )}
                        </div>
                    </div>

                    {/* Settings Toggle */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={cn("p-2 rounded-lg transition-colors", showSettings ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-indigo-600 hover:bg-gray-50")}
                        >
                            <Settings size={22} />
                        </button>

                        {showSettings && (
                            <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <h3 className="font-bold text-gray-800 mb-4">Configuration</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">A2A Agent URL</label>
                                        <input
                                            value={agentUrl}
                                            onChange={e => setAgentUrl(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            Point this to your running A2A Agent instance. Ensure CORS is enabled if running on a different port.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative bg-gradient-to-b from-gray-50 to-white">
                    <MessageList components={components} onAction={handleAction} />

                    <div className="shrink-0 z-10 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-2">
                        <ChatInput
                            onSendMessage={handleSendMessage}
                            onFileUpload={handleFileUpload}
                            loading={chatLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
