import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Journals from './pages/Journals';
import JournalForm from './pages/JournalForm';
import JournalView from './pages/JournalView';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user has token
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    const ProtectedRoute = ({ children }) => {
        return isAuthenticated ? children : <Navigate to="/login" />;
    };

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
                <Route path="/register" element={<Register setAuth={setIsAuthenticated} />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/analyzer"
                    element={
                        <ProtectedRoute>
                            <Analyzer />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/journals"
                    element={
                        <ProtectedRoute>
                            <Journals />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/journals/new"
                    element={
                        <ProtectedRoute>
                            <JournalForm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/journals/:id"
                    element={
                        <ProtectedRoute>
                            <JournalView />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/journals/:id/edit"
                    element={
                        <ProtectedRoute>
                            <JournalForm />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
}

export default App;
