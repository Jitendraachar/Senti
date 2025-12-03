import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function Dashboard() {
    const [stats, setStats] = useState(null);
    const [trend, setTrend] = useState(null);
    const [mentalHealthStatus, setMentalHealthStatus] = useState(null);
    const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
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

            const [statsRes, trendRes, healthRes] = await Promise.all([
                axios.get('/api/dashboard/stats', { headers }),
                axios.get('/api/dashboard/trend?days=7', { headers }),
                axios.get('/api/appointments/check-status', { headers })
            ]);

            setStats(statsRes.data.stats);
            setTrend(trendRes.data.trend);
            setMentalHealthStatus(healthRes.data);
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
                        <button onClick={() => setShowEmergencyAlert(true)} className="btn-secondary bg-red-600 hover:bg-red-700 border-red-500">
                            🚨 Emergency Help
                        </button>
                        <Link to="/results" className="btn-primary">
                            📊 Results
                        </Link>
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

                {/* Emergency Alert Modal */}
                {showEmergencyAlert && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-red-500">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">🚨</span>
                                    <h2 className="text-3xl font-bold text-red-400">Emergency Help</h2>
                                </div>
                                <button onClick={() => setShowEmergencyAlert(false)} className="text-3xl hover:text-red-400">×</button>
                            </div>

                            <div className="space-y-6">
                                {/* Crisis Warning */}
                                <div className="p-4 bg-red-500/20 border-2 border-red-500 rounded-lg">
                                    <p className="text-lg font-bold mb-2">⚠️ If you're in immediate danger or having thoughts of self-harm:</p>
                                    <p className="text-gray-200">Please call emergency services or a crisis helpline immediately. You are not alone, and help is available 24/7.</p>
                                </div>

                                {/* Crisis Helplines */}
                                <div>
                                    <h3 className="text-xl font-bold mb-3">📞 Crisis Helplines (24/7)</h3>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-white/5 rounded-lg">
                                            <div className="font-bold text-lg">National Suicide Prevention Lifeline (US)</div>
                                            <a href="tel:988" className="text-2xl text-purple-400 hover:underline">988</a>
                                            <p className="text-sm text-gray-400">Available 24/7 in English and Spanish</p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg">
                                            <div className="font-bold text-lg">Crisis Text Line</div>
                                            <div className="text-xl text-purple-400">Text HOME to <a href="sms:741741" className="hover:underline">741741</a></div>
                                            <p className="text-sm text-gray-400">Free, confidential support via text</p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg">
                                            <div className="font-bold text-lg">International Association for Suicide Prevention</div>
                                            <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                                                Find helplines worldwide →
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Services */}
                                <div>
                                    <h3 className="text-xl font-bold mb-3">🚑 Emergency Services</h3>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="p-3 bg-white/5 rounded-lg">
                                            <div className="font-bold">US Emergency</div>
                                            <a href="tel:911" className="text-2xl text-red-400 hover:underline">911</a>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-lg">
                                            <div className="font-bold">UK Emergency</div>
                                            <a href="tel:999" className="text-2xl text-red-400 hover:underline">999</a>
                                        </div>
                                    </div>
                                </div>

                                {/* Immediate Actions */}
                                <div>
                                    <h3 className="text-xl font-bold mb-3">💙 What You Can Do Right Now</h3>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-400">•</span>
                                            <span>Call a trusted friend or family member</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-400">•</span>
                                            <span>Go to your nearest emergency room</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-400">•</span>
                                            <span>Remove any means of self-harm from your immediate area</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-400">•</span>
                                            <span>Stay with someone you trust until help arrives</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Book Urgent Appointment */}
                                <div className="p-4 bg-purple-500/20 border border-purple-500 rounded-lg">
                                    <h3 className="text-xl font-bold mb-2">📅 Book Urgent Mental Health Appointment</h3>
                                    <p className="text-gray-300 mb-3">If you need professional support but it's not an immediate emergency, book an urgent appointment with a mental health professional.</p>
                                    <Link
                                        to="/appointments"
                                        onClick={() => setShowEmergencyAlert(false)}
                                        className="btn-primary inline-block"
                                    >
                                        Book Urgent Appointment →
                                    </Link>
                                </div>

                                {/* Additional Resources */}
                                <div>
                                    <h3 className="text-xl font-bold mb-3">📚 Additional Resources</h3>
                                    <div className="space-y-2">
                                        <a href="https://www.nami.org/" target="_blank" rel="noopener noreferrer" className="block p-2 bg-white/5 rounded hover:bg-white/10 transition">
                                            <span className="text-purple-400">NAMI</span> - National Alliance on Mental Illness →
                                        </a>
                                        <a href="https://www.mentalhealth.gov/" target="_blank" rel="noopener noreferrer" className="block p-2 bg-white/5 rounded hover:bg-white/10 transition">
                                            <span className="text-purple-400">MentalHealth.gov</span> - US Government Mental Health Resources →
                                        </a>
                                        <a href="https://www.samhsa.gov/find-help/national-helpline" target="_blank" rel="noopener noreferrer" className="block p-2 bg-white/5 rounded hover:bg-white/10 transition">
                                            <span className="text-purple-400">SAMHSA</span> - Substance Abuse and Mental Health Services →
                                        </a>
                                    </div>
                                </div>

                                <div className="text-center pt-4 border-t border-white/10">
                                    <p className="text-gray-400 text-sm">Remember: Seeking help is a sign of strength, not weakness. You deserve support. 💙</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mental Health Alert */}
                {mentalHealthStatus && mentalHealthStatus.needsSupport && (
                    <div className={`card mb-8 border-2 ${mentalHealthStatus.severity === 'high' ? 'border-red-500 bg-red-500/10' : 'border-yellow-500 bg-yellow-500/10'
                        }`}>
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">{mentalHealthStatus.severity === 'high' ? '🚨' : '⚠️'}</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold mb-2">
                                    {mentalHealthStatus.severity === 'high' ? 'We\'re Here to Help' : 'Check In With Yourself'}
                                </h3>
                                <p className="text-gray-200 mb-3">{mentalHealthStatus.message}</p>
                                {mentalHealthStatus.stats && (
                                    <div className="text-sm text-gray-400 mb-3">
                                        <span>Recent activity: {mentalHealthStatus.stats.negativePercentage}% negative entries</span>
                                        {mentalHealthStatus.stats.consecutiveNegativeDays > 0 && (
                                            <span> • {mentalHealthStatus.stats.consecutiveNegativeDays} consecutive difficult days</span>
                                        )}
                                    </div>
                                )}
                                {mentalHealthStatus.recommendations && mentalHealthStatus.recommendations.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-bold mb-2">Recommendations:</p>
                                        <ul className="text-sm space-y-1">
                                            {mentalHealthStatus.recommendations.map((rec, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-purple-400">•</span>
                                                    <span>{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <Link to="/appointments" className="btn-primary inline-block">
                                    📅 Book Doctor Appointment
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Access to New Features */}
                <div className="grid md:grid-cols-6 gap-4 mb-8">
                    <Link to="/insights" className="card hover:scale-105 transition text-center cursor-pointer">
                        <div className="text-4xl mb-2">🧠</div>
                        <div className="font-bold">AI Insights</div>
                        <div className="text-sm text-gray-400">Weekly analysis</div>
                    </Link>
                    <Link to="/calendar" className="card hover:scale-105 transition text-center cursor-pointer">
                        <div className="text-4xl mb-2">📅</div>
                        <div className="font-bold">Mood Calendar</div>
                        <div className="text-sm text-gray-400">Heatmap view</div>
                    </Link>
                    <Link to="/predictions" className="card hover:scale-105 transition text-center cursor-pointer">
                        <div className="text-4xl mb-2">🔮</div>
                        <div className="font-bold">Mood Forecast</div>
                        <div className="text-sm text-gray-400">7-day prediction</div>
                    </Link>
                    <Link to="/search" className="card hover:scale-105 transition text-center cursor-pointer">
                        <div className="text-4xl mb-2">🔍</div>
                        <div className="font-bold">Advanced Search</div>
                        <div className="text-sm text-gray-400">Find entries</div>
                    </Link>
                    <Link to="/goals" className="card hover:scale-105 transition text-center cursor-pointer">
                        <div className="text-4xl mb-2">🎯</div>
                        <div className="font-bold">Goals & Streaks</div>
                        <div className="text-sm text-gray-400">Track progress</div>
                    </Link>
                    <Link to="/sharing" className="card hover:scale-105 transition text-center cursor-pointer">
                        <div className="text-4xl mb-2">🤝</div>
                        <div className="font-bold">Sharing</div>
                        <div className="text-sm text-gray-400">Connect & support</div>
                    </Link>
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
