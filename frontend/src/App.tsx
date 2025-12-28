import { useState, useEffect } from 'react';
import { authService } from './services/auth';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsAuthenticated(authService.isAuthenticated());
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    return (
        <Routes>
            <Route path="/login" element={!isAuthenticated ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/" />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={isAuthenticated ? <ChatPage /> : <Navigate to="/login" />} />
        </Routes>
    );
}

export default App;
