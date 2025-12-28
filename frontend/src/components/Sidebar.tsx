import { useRef, useState } from 'react';
import { LogOut, MessageSquare, Plus, Trash2, User } from 'lucide-react';
import { cn } from '../utils';
import { authService } from '../services/auth';
import { ConfirmationModal } from './ConfirmationModal';

interface SidebarProps {
    sessions: any[];
    currentSessionId: string | null;
    onSelectSession: (id: string) => void;
    onCreateSession: () => void;
    onDeleteSession: (e: React.MouseEvent, id: string) => void;
    isOpen: boolean;
    className?: string;
}

export const Sidebar = ({
    sessions,
    currentSessionId,
    onSelectSession,
    onCreateSession,
    onDeleteSession,
    isOpen,
    className
}: SidebarProps) => {
    const user = authService.getUser();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

    const handleLogout = () => {
        authService.logout();
        window.location.reload();
    };

    const confirmDelete = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setSessionToDelete(sessionId);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (sessionToDelete) {
            // We need to pass a mock event or handle it differently mostly because the original prop expects an event.
            // But simpler is to allow the prop to accept just ID or null event. 
            // Ideally refactor parent to not need event, but for now:
            const mockEvent = {} as React.MouseEvent;
            onDeleteSession(mockEvent, sessionToDelete);
        }
        setSessionToDelete(null);
    };

    return (
        <>
            <div className={cn(
                "h-full bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col transition-all duration-300 ease-in-out font-sans",
                isOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden",
                className
            )}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-950 font-bold text-lg">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-indigo-200 shadow-md">
                            <MessageSquare size={18} />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700">AI Chat</span>
                    </div>
                    <button
                        onClick={onCreateSession}
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all hover:scale-105 active:scale-95"
                        title="New Chat"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Session List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    {sessions.length === 0 && (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            <p className="mb-2">No chats yet</p>
                            <button onClick={onCreateSession} className="text-indigo-600 hover:underline">Start a new one</button>
                        </div>
                    )}
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => onSelectSession(session.id)}
                            className={cn(
                                "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent",
                                currentSessionId === session.id
                                    ? "bg-indigo-50/80 text-indigo-900 border-indigo-100 shadow-sm font-medium"
                                    : "hover:bg-gray-50 text-gray-600 hover:border-gray-100"
                            )}
                        >
                            <div className="flex-1 truncate pr-2">
                                <p className="text-sm truncate">{session.title}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5 font-light">
                                    {new Date(session.created_at || Date.now()).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                onClick={(e) => confirmDelete(e, session.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all transform hover:scale-110"
                                title="Delete Chat"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-white shadow-sm flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {user?.name?.[0].toUpperCase() || <User size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-green-500 flex items-center gap-1 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Online
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Conversation"
                description="Are you sure you want to delete this conversation? This action cannot be undone and all message history will be lost."
                confirmText="Delete"
                variant="danger"
            />
        </>
    );
};
