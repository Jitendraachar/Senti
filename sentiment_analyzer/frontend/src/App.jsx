import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analyzer from './pages/Analyzer';
import Journals from './pages/Journals';
import JournalForm from './pages/JournalForm';
import JournalView from './pages/JournalView';
import Results from './pages/Results';
import Insights from './pages/Insights';
import Calendar from './pages/Calendar';
import Search from './pages/Search';
import Goals from './pages/Goals';
import Appointments from './pages/Appointments';
import Predictions from './pages/Predictions';
import Sharing from './pages/Sharing';

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
                <Route
                    path="/results"
                    element={
                        <ProtectedRoute>
                            <Results />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/insights"
                    element={
                        <ProtectedRoute>
                            <Insights />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/calendar"
                    element={
                        <ProtectedRoute>
                            <Calendar />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/search"
                    element={
                        <ProtectedRoute>
                            <Search />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/goals"
                    element={
                        <ProtectedRoute>
                            <Goals />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/appointments"
                    element={
                        <ProtectedRoute>
                            <Appointments />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/predictions"
                    element={
                        <ProtectedRoute>
                            <Predictions />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/sharing"
                    element={
                        <ProtectedRoute>
                            <Sharing />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Router>
    );
}

export default App;
