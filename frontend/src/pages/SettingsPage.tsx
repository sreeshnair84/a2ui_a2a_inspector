import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Settings as SettingsIcon, Volume2, Globe, Server } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { voices } = useTextToSpeech();

    // State
    const [model, setModel] = useState<'gemini' | 'cohere'>('gemini');
    const [agentUrl, setAgentUrl] = useState('http://localhost:8001');
    const [talkBack, setTalkBack] = useState(false);
    const [voiceURI, setVoiceURI] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    // Load Settings
    useEffect(() => {
        const savedModel = localStorage.getItem('model_preference') as 'gemini' | 'cohere';
        if (savedModel) setModel(savedModel);

        const savedUrl = localStorage.getItem('agent_url');
        if (savedUrl) setAgentUrl(savedUrl);

        const savedTalkBack = localStorage.getItem('talk_back') === 'true';
        setTalkBack(savedTalkBack);

        const savedVoice = localStorage.getItem('voice_uri');
        if (savedVoice) setVoiceURI(savedVoice);
    }, []);

    // Save Settings
    const saveSettings = () => {
        localStorage.setItem('model_preference', model);
        localStorage.setItem('agent_url', agentUrl);
        localStorage.setItem('talk_back', String(talkBack));
        localStorage.setItem('voice_uri', voiceURI);

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <SettingsIcon size={24} className="text-indigo-600" />
                        Settings
                    </h1>
                </div>
                <button
                    onClick={saveSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    {showSuccess ? <Check size={18} /> : null}
                    {showSuccess ? 'Saved' : 'Save Changes'}
                </button>
            </header>

            <main className="flex-1 max-w-3xl mx-auto w-full p-8 space-y-8">

                {/* Connection Settings */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Server size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Connection</h2>
                            <p className="text-sm text-gray-500">Configure connection to the A2A Agent.</p>
                        </div>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agent URL</label>
                        <input
                            type="url"
                            value={agentUrl}
                            onChange={(e) => setAgentUrl(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                            placeholder="http://localhost:8001"
                        />
                        <p className="text-xs text-gray-400 mt-2">Default: http://localhost:8001</p>
                    </div>
                </section>

                {/* Model Settings */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                            <Globe size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">AI Model</h2>
                            <p className="text-sm text-gray-500">Choose the intelligence behind the agent.</p>
                        </div>
                    </div>
                    <div className="p-6 grid gap-4 sm:grid-cols-2">
                        {/* Gemini Option */}
                        <div
                            onClick={() => setModel('gemini')}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${model === 'gemini'
                                ? 'border-indigo-600 bg-indigo-50/50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Gemini 2.0 Flash</h3>
                                    <p className="text-xs text-gray-500 mt-1">Best for reasoning & speed.</p>
                                </div>
                                {model === 'gemini' && <Check size={16} className="text-indigo-600" />}
                            </div>
                        </div>

                        {/* Cohere Option */}
                        <div
                            onClick={() => setModel('cohere')}
                            className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${model === 'cohere'
                                ? 'border-indigo-600 bg-indigo-50/50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Cohere Command R+ (08-2024)</h3>
                                    <p className="text-xs text-gray-500 mt-1">Optimized for tools & RAG.</p>
                                </div>
                                {model === 'cohere' && <Check size={16} className="text-indigo-600" />}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Voice Settings */}
                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <Volume2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Voice & Speech</h2>
                            <p className="text-sm text-gray-500">Configure text-to-speech output.</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Talk Back Toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-medium text-gray-900">Talk Back (Auto-Read)</label>
                                <p className="text-sm text-gray-500">Automatically read agent responses aloud.</p>
                            </div>
                            <button
                                onClick={() => setTalkBack(!talkBack)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${talkBack ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${talkBack ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Voice Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Voice</label>
                            <select
                                value={voiceURI}
                                onChange={(e) => setVoiceURI(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                            >
                                <option value="">Default System Voice</option>
                                {voices.map(voice => (
                                    <option key={voice.voiceURI} value={voice.voiceURI}>
                                        {voice.name} ({voice.lang})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}
