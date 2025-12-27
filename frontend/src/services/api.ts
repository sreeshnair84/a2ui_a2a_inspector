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

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

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
                            const data = JSON.parse(dataStr);
                            yield data;
                        } catch (e) {
                            console.error('Error parsing SSE json:', e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    },
};
