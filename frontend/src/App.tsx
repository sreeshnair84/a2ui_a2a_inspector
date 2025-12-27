import { useState, useEffect } from 'react';
import { authService } from './services/auth';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsAuthenticated(authService.isAuthenticated());
    }, []);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    return isAuthenticated ? <ChatPage /> : <LoginPage onLogin={handleLogin} />;
}

export default App;
