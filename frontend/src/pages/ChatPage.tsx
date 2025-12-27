import { useState, useRef, useEffect } from 'react';
import { authService } from '../services/auth';
import { apiClient } from '../services/api';
import A2UIRenderer from '../components/A2UIRenderer';
import type { A2UICard } from '../types/a2ui';
import { useNavigate } from 'react-router-dom';

export default function ChatPage() {
    const [messages, setMessages] = useState<A2UICard[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [agentUrl, setAgentUrl] = useState('http://localhost:8001');
    const [showSettings, setShowSettings] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const user = authService.getUser();
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim() || loading) return;

        const text = inputText;
        setInputText('');

        // Add user message immediately
        setMessages(prev => [...prev, {
            type: 'text_card',
            id: `user_${Date.now()}`,
            content: { text }
        }]);

        setLoading(true);

        try {
            const response = await apiClient.sendMessage(text, 'default', agentUrl);
            setMessages(prev => [...prev, ...response.cards]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                type: 'text_card',
                id: `error_${Date.now()}`,
                content: { text: `Error: ${error instanceof Error ? error.message : String(error)}` }
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: string, data: any) => {
        if (loading) return;

        if (action === 'submit_form') {
            setLoading(true);
            try {
                // Serialize form data as JSON string for now since backend expects string message
                // In a real app, we might want a structured way to send form data
                const message = `Form Submitted: ${JSON.stringify(data, null, 2)}`;

                // Add user feedback card immediately
                setMessages(prev => [...prev, {
                    type: 'text_card',
                    id: `user_form_${Date.now()}`,
                    content: { text: "Submitted form" }
                }]);

                const response = await apiClient.sendMessage(message, 'default', agentUrl);
                setMessages(prev => [...prev, ...response.cards]);
            } catch (error) {
                console.error('Form submission error:', error);
                setMessages(prev => [...prev, {
                    type: 'text_card',
                    id: `error_${Date.now()}`,
                    content: { text: `Error submitting form: ${error instanceof Error ? error.message : String(error)}` }
                }]);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleLogout = () => {
        authService.logout();
        window.location.reload();
    };

    return (
        <div className="flex flex-col h-screen bg-white relative overflow-hidden font-sans">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 w-full h-[50vh] bg-gradient-to-b from-indigo-50/50 via-white to-white"></div>
                <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-100/30 rounded-full blur-3xl"></div>
                <div className="absolute top-[10%] -left-[10%] w-[30%] h-[30%] bg-blue-100/30 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-8 py-4 sticky top-0 z-20 transition-all duration-300">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center shadow-lg ring-4 ring-gray-50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 tracking-tight">Service Assistant</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <p className="text-xs font-medium text-gray-500">System Operational</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-50'}`}
                            title="Agent Connection Settings"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3 bg-gray-50/80 px-4 py-2 rounded-full border border-gray-100">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="text-sm font-semibold text-gray-700">
                                {user?.name || 'User'}
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                            title="Logout"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Settings Popover */}
                {showSettings && (
                    <div className="absolute top-full right-8 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 animate-fadeIn z-50">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Agent Connection Settings</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">A2A Agent URL</label>
                                <input
                                    type="text"
                                    value={agentUrl}
                                    onChange={(e) => setAgentUrl(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    placeholder="http://localhost:8001"
                                />
                            </div>
                            <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-xs flex gap-2">
                                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p>Point this to your running A2A agent server. Default is http://localhost:8001.</p>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth relative z-10" id="chat-container">
                <div className="max-w-4xl mx-auto space-y-8">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fadeIn">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center mb-6 transform hover:scale-105 transition-transform duration-300">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
                                How can I help you today?
                            </h2>
                            <p className="text-gray-500 mb-10 max-w-lg text-lg leading-relaxed">
                                I'm your AI assistant for IT operations. Ask me about VMs, SAP access, RBAC, or Azure deployments.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                                {[
                                    {
                                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 01-2 2v4a2 2 0 012 2h14a2 2 0 012-2v-4a2 2 0 01-2-2m-2-4h.01M17 16h.01" />,
                                        title: 'Request a new VM',
                                        desc: 'Provision virtual machines'
                                    },
                                    {
                                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 19.464a2.5 2.5 0 01-1.768.732H7.828l-.939-.939a2.5 2.5 0 01-.732-1.768v-1.948a2.5 2.5 0 01.732-1.768l2.678-2.678c-.246-.954.008-2.07.745-2.812A4.47 4.47 0 0013 7c0-1.879-.81-3.619-2.126-4.874 .803-.836 1.933-1.126 2.872-.752A5.992 5.992 0 0115 7z" />,
                                        title: 'SAP access request',
                                        desc: 'Get system permissions'
                                    },
                                    {
                                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
                                        title: 'RBAC permissions',
                                        desc: 'Manage user roles'
                                    },
                                    {
                                        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />,
                                        title: 'Deploy Azure WebApp',
                                        desc: 'Launch web services'
                                    }
                                ].map((item) => (
                                    <button
                                        key={item.title}
                                        onClick={() => setInputText(item.title)}
                                        className="group p-5 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left flex items-start gap-4"
                                    >
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl group-hover:bg-indigo-50 transition-colors flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                {item.icon}
                                            </svg>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-800 group-hover:text-indigo-700 block mb-1">{item.title}</span>
                                            <span className="text-xs text-gray-400 font-medium">{item.desc}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((card) => (
                        <div key={card.id} className="animate-fadeIn">
                            <A2UIRenderer
                                cards={[card]}
                                onAction={handleAction}
                            />
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-center gap-3 p-4 ml-2 animate-fadeIn">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-500">Processing request...</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white/90 backdrop-blur-md border-t border-gray-200/50 px-6 py-6 pb-8 z-10">
                <div className="max-w-3xl mx-auto relative">
                    <div className="relative shadow-lg rounded-2xl">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type your message..."
                            className="w-full pl-6 pr-32 py-4 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 text-gray-800 placeholder-gray-400 text-lg shadow-sm"
                            disabled={loading}
                            autoFocus
                        />
                        <div className="absolute right-2 top-2 bottom-2">
                            <button
                                onClick={handleSendMessage}
                                disabled={loading || !inputText.trim()}
                                className="h-full px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                <span>Send</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
