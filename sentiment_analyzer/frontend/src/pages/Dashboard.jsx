import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [trend, setTrend] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(userData);
        fetchData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, trendRes] = await Promise.all([
                axios.get('/api/dashboard/stats', { headers }),
                axios.get('/api/dashboard/trend?days=7', { headers })
            ]);

            setStats(statsRes.data.stats);
            setTrend(trendRes.data.trend);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">📊</div>
                    <p className="text-xl text-gray-300">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const pieData = {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [{
            data: [
                stats?.sentimentDistribution?.positive || 0,
                stats?.sentimentDistribution?.negative || 0,
                stats?.sentimentDistribution?.neutral || 0
            ],
            backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
            borderColor: ['#059669', '#dc2626', '#2563eb'],
            borderWidth: 2
        }]
    };

    const lineData = {
        labels: trend?.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
        datasets: [{
            label: 'Sentiment Score',
            data: trend?.map(d => d.score) || [],
            borderColor: '#a855f7',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            tension: 0.4,
            fill: true
        }]
    };

    const barData = {
        labels: trend?.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
        datasets: [
            {
                label: 'Positive',
                data: trend?.map(d => d.positive) || [],
                backgroundColor: '#10b981'
            },
            {
                label: 'Negative',
                data: trend?.map(d => d.negative) || [],
                backgroundColor: '#ef4444'
            },
            {
                label: 'Neutral',
                data: trend?.map(d => d.neutral) || [],
                backgroundColor: '#3b82f6'
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#fff' }
            }
        },
        scales: {
            y: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
                ticks: { color: '#fff' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gradient">Dashboard</h1>
                        <p className="text-gray-300 mt-2">Welcome back, {user?.name}!</p>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/journals" className="btn-primary">
                            📔 Journals
                        </Link>
                        <Link to="/analyzer" className="btn-primary">
                            New Analysis
                        </Link>
                        <button onClick={handleLogout} className="btn-secondary">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-5 gap-6 mb-8">
                    <div className="card text-center">
                        <div className="text-4xl mb-2">📝</div>
                        <div className="text-3xl font-bold text-gradient">{stats?.totalAnalyses || 0}</div>
                        <div className="text-gray-300">Quick Analyses</div>
                    </div>

                    <div className="card text-center">
                        <div className="text-4xl mb-2">📔</div>
                        <div className="text-3xl font-bold text-gradient">{stats?.totalJournals || 0}</div>
                        <div className="text-gray-300">Journal Entries</div>
                    </div>

                    <div className="card text-center">
                        <div className="text-4xl mb-2">😊</div>
                        <div className="text-3xl font-bold text-green-400">{stats?.sentimentDistribution?.positive || 0}</div>
                        <div className="text-gray-300">Positive</div>
                    </div>

                    <div className="card text-center">
                        <div className="text-4xl mb-2">😔</div>
                        <div className="text-3xl font-bold text-red-400">{stats?.sentimentDistribution?.negative || 0}</div>
                        <div className="text-gray-300">Negative</div>
                    </div>

                    <div className="card text-center">
                        <div className="text-4xl mb-2">😐</div>
                        <div className="text-3xl font-bold text-blue-400">{stats?.sentimentDistribution?.neutral || 0}</div>
                        <div className="text-gray-300">Neutral</div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4">Sentiment Distribution</h2>
                        <div className="h-64">
                            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } } }} />
                        </div>
                    </div>

                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4">7-Day Sentiment Trend</h2>
                        <div className="h-64">
                            <Line data={lineData} options={chartOptions} />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-2xl font-bold mb-4">Daily Sentiment Breakdown</h2>
                    <div className="h-80">
                        <Bar data={barData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
