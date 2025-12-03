import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Predictions() {
    const [forecast, setForecast] = useState([]);
    const [trend, setTrend] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchForecast();
    }, []);

    const fetchForecast = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/predictions/mood-forecast', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setForecast(response.data.forecast || []);
            setTrend(response.data.trend);
            setRecommendations(response.data.recommendations || []);
            setInsights(response.data.insights);
        } catch (err) {
            console.error('Error fetching forecast:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'high': return 'bg-red-500/20 border-red-500 text-red-400';
            case 'medium': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
            case 'low': return 'bg-green-500/20 border-green-500 text-green-400';
            default: return 'bg-gray-500/20 border-gray-500 text-gray-400';
        }
    };

    const getRiskEmoji = (level) => {
        switch (level) {
            case 'high': return '⚠️';
            case 'medium': return '⚡';
            case 'low': return '✅';
            default: return '📊';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">🔮</div>
                    <p className="text-xl text-gray-300">Analyzing patterns...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/dashboard" className="btn-secondary mb-4 inline-block">← Back</Link>
                    <h1 className="text-4xl font-bold text-gradient">Mood Forecast</h1>
                    <p className="text-gray-300 mt-2">AI-powered predictions based on your patterns</p>
                </div>

                {forecast.length > 0 ? (
                    <>
                        {/* Trend Overview */}
                        {trend && (
                            <div className="card mb-8">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">📈</span>
                                    <h2 className="text-2xl font-bold">Recent Trend</h2>
                                </div>
                                <p className="text-xl mb-2">{trend.message}</p>
                                <p className="text-sm text-gray-400">
                                    {trend.recentNegativePercent}% challenging entries in the past {trend.period}
                                </p>
                            </div>
                        )}

                        {/* 7-Day Forecast */}
                        <div className="card mb-8">
                            <h2 className="text-2xl font-bold mb-6">7-Day Mood Forecast</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {forecast.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border-2 ${getRiskColor(day.riskLevel)}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-lg">{day.dayName}</div>
                                                <div className="text-sm text-gray-400">
                                                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </div>
                                            </div>
                                            <div className="text-3xl">{getRiskEmoji(day.riskLevel)}</div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="text-sm font-bold capitalize mb-1">Risk Level: {day.riskLevel}</div>
                                            <div className="w-full bg-gray-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${day.riskLevel === 'high' ? 'bg-red-500' :
                                                            day.riskLevel === 'medium' ? 'bg-yellow-500' :
                                                                'bg-green-500'
                                                        }`}
                                                    style={{ width: `${day.riskScore}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">{day.riskScore}% risk score</div>
                                        </div>

                                        {day.historicalData.total > 0 && (
                                            <div className="text-xs text-gray-400">
                                                Based on {day.historicalData.total} past {day.dayName}s
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Insights */}
                        {insights && (
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                <div className="card">
                                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                        <span>🌟</span> Your Best Day
                                    </h3>
                                    <p className="text-3xl font-bold text-green-400">{insights.bestDay}s</p>
                                    <p className="text-sm text-gray-400 mt-2">You tend to feel best on this day</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                        <span>⚡</span> Challenging Day
                                    </h3>
                                    <p className="text-3xl font-bold text-yellow-400">{insights.challengingDay}s</p>
                                    <p className="text-sm text-gray-400 mt-2">Plan extra self-care on this day</p>
                                </div>
                            </div>
                        )}

                        {/* Recommendations */}
                        {recommendations.length > 0 && (
                            <div className="card">
                                <h2 className="text-2xl font-bold mb-4">💡 Proactive Coping Strategies</h2>
                                <div className="space-y-3">
                                    {recommendations.map((rec, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                            <span className="text-purple-400 text-xl">•</span>
                                            <span>{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">📊</div>
                        <h2 className="text-2xl font-bold mb-2">Not Enough Data Yet</h2>
                        <p className="text-gray-300 mb-4">
                            Keep journaling for at least a week to see mood predictions!
                        </p>
                        <Link to="/journals/new" className="btn-primary">Create Journal Entry</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Predictions;
