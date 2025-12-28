import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/api';

export interface Session {
    id: string;
    title: string;
    created_at?: string;
}

export function useSessions() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Title Editing State
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState('');

    const loadSessions = useCallback(async () => {
        try {
            const data = await apiClient.getSessions();
            setSessions(data);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const selectSession = useCallback((sessionId: string) => {
        setCurrentSessionId(sessionId);
        setIsEditingTitle(false);
    }, []);

    const createNewSession = useCallback(async (initialTitle: string = "New Chat") => {
        try {
            const newSession = await apiClient.createSession(initialTitle);
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newSession.id);
            setIsEditingTitle(false);
            return newSession;
        } catch (error) {
            console.error('Failed to create session:', error);
            throw error;
        }
    }, []);

    const deleteSession = useCallback(async (sessionId: string) => {
        try {
            await apiClient.deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    }, [currentSessionId]);

    const startEditingTitle = useCallback(() => {
        const currentSession = sessions.find(s => s.id === currentSessionId);
        if (currentSession) {
            setEditedTitle(currentSession.title);
            setIsEditingTitle(true);
        }
    }, [sessions, currentSessionId]);

    const saveTitle = useCallback(async () => {
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
    }, [currentSessionId, editedTitle]);

    const cancelEditingTitle = useCallback(() => {
        setIsEditingTitle(false);
    }, []);

    return {
        sessions,
        currentSessionId,
        setCurrentSessionId,
        loading,
        setLoading,
        loadSessions,
        selectSession,
        createNewSession,
        deleteSession,
        isEditingTitle,
        editedTitle,
        setEditedTitle,
        startEditingTitle,
        saveTitle,
        cancelEditingTitle
    };
}
