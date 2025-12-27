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
     * Create WebSocket connection for streaming
     */
    createStreamConnection(
        onCard: (card: any) => void,
        onComplete: () => void,
        onError: (error: Error) => void
    ): WebSocket {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/api/stream`);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'card') {
                onCard(data.data);
            } else if (data.type === 'complete') {
                onComplete();
            } else if (data.type === 'error') {
                onError(new Error(data.message));
            }
        };

        ws.onerror = () => {
            onError(new Error('WebSocket connection error'));
        };

        return ws;
    },

    /**
     * Send message via WebSocket
     */
    sendStreamMessage(ws: WebSocket, text: string, sessionId: string = 'default') {
        const token = authService.getToken();
        if (!token) {
            throw new Error('Not authenticated');
        }

        ws.send(JSON.stringify({
            token,
            text,
            session_id: sessionId,
        }));
    },
};
