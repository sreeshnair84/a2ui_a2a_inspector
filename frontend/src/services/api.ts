/**
 * API client for backend communication
 */
import { authService } from './auth';
import type { A2UIResponse } from '../types/a2ui';

const API_BASE = '';  // Using proxy from vite.config

export interface ChatRequest {
    message: string;
    agent_url: string;
    session_id: string;
    use_push?: boolean;
}

// Helper to handle API responses and auto-logout on 401
const handleResponse = async (response: Response, errorMsg: string) => {
    if (response.status === 401) {
        authService.logout();
        window.location.reload();
        throw new Error('Session expired');
    }
    if (!response.ok) {
        throw new Error(`${errorMsg}: ${response.status}`);
    }
    return response;
};

export const apiClient = {
    /**
     * Send a text message to the chat API
     */
    async sendMessage(text: string, sessionId: string = 'default', agentUrl: string = 'http://localhost:8001'): Promise<A2UIResponse> {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const request: ChatRequest = {
            message: text,
            agent_url: agentUrl,
            session_id: sessionId,
            use_push: false
        };

        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(request),
        });

        await handleResponse(response, 'API error');
        return response.json();
    },

    /**
     * Send a message and stream the response via SSE over POST
     */
    async *streamMessage(text: string, sessionId: string = 'default', agentUrl: string = 'http://localhost:8001'): AsyncGenerator<any, void, unknown> {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const request: ChatRequest = {
            message: text,
            agent_url: agentUrl,
            session_id: sessionId,
            use_push: false
        };

        const response = await fetch(`${API_BASE}/api/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(request),
        });

        if (response.status === 401) {
            authService.logout();
            window.location.reload();
            throw new Error('Session expired');
        }

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        if (!response.body) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Process complete SSE events in buffer
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || ''; // Keep the incomplete part

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        try {
                            console.log("SSE Received Raw:", dataStr);
                            const data = JSON.parse(dataStr);
                            console.log("SSE Parsed:", data);
                            yield data;
                        } catch (e) {
                            console.error('Error parsing SSE json:', e, dataStr);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    },

    /**
     * Upload a file
     */
    async uploadFile(file: File): Promise<any> {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        await handleResponse(response, 'Upload failed');
        return response.json();
    },

    /**
     * Get all chat sessions
     */
    async getSessions(): Promise<any[]> {
        const token = authService.getToken();
        if (!token) return [];

        const response = await fetch(`${API_BASE}/api/sessions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            authService.logout();
            // Don't reload here to avoid loops if needed, or return empty
            return [];
        }

        if (!response.ok) throw new Error('Failed to fetch sessions');
        return response.json();
    },

    /**
     * Create a new chat session
     */
    async createSession(title: string = "New Chat"): Promise<any> {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE}/api/sessions?title=${encodeURIComponent(title)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        await handleResponse(response, 'Failed to create session');
        return response.json();
    },

    /**
     * Get session history
     */
    async getSessionHistory(sessionId: string): Promise<any[]> {
        const token = authService.getToken();
        if (!token) return [];

        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            authService.logout();
            return [];
        }

        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    },

    /**
     * Delete a session
     */
    async deleteSession(sessionId: string): Promise<void> {
        const token = authService.getToken();
        if (!token) return;

        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        await handleResponse(response, 'Failed to delete session');
    },

    /**
     * Update a session (e.g. rename)
     */
    async updateSession(sessionId: string, title: string): Promise<any> {
        const token = authService.getToken();
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title })
        });

        await handleResponse(response, 'Failed to update session');
        return response.json();
    }
};
