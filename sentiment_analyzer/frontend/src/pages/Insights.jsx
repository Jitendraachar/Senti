import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Insights() {
    const [insights, setInsights] = useState(null);
    const [patterns, setPatterns] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [insightsRes, patternsRes] = await Promise.all([
                axios.get('/api/insights/weekly', { headers }),
                axios.get('/api/insights/patterns?days=30', { headers })
            ]);

            setInsights(insightsRes.data.insights);
            setPatterns(patternsRes.data.patterns);
        } catch (err) {
            console.error('Error fetching insights:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">🧠</div>
                    <p className="text-xl text-gray-300">Analyzing your patterns...</p>
                </div>
            </div>
        );
    }

    const getEmotionEmoji = (emotion) => {
        const emojiMap = {
            joy: '😄',
            sadness: '😢',
            anger: '😠',
            fear: '😨',
            surprise: '😲',
            disgust: '🤢',
            love: '❤️',
            neutral: '😐'
        };
        return emojiMap[emotion] || '😐';
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/dashboard" className="btn-secondary mb-4 inline-block">← Back</Link>
                    <h1 className="text-4xl font-bold text-gradient">AI Insights</h1>
                    <p className="text-gray-300 mt-2">Personalized analysis of your emotional patterns</p>
                </div>

                {insights && insights.totalEntries > 0 ? (
                    <>
                        {/* Weekly Summary */}
                        <div className="card mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-4xl">📊</div>
                                <div>
                                    <h2 className="text-2xl font-bold">Weekly Summary</h2>
                                    <p className="text-sm text-gray-400">Based on {insights.totalEntries} entries this week</p>
                                </div>
                            </div>
                            <p className="text-lg leading-relaxed">{insights.summary}</p>
                        </div>

                        {/* Sentiment Breakdown */}
                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            <div className="card text-center">
                                <div className="text-4xl mb-2">😊</div>
                                <div className="text-3xl font-bold text-green-400">{insights.sentimentBreakdown.positive}</div>
                                <div className="text-gray-300">Positive Entries</div>
                            </div>
                            <div className="card text-center">
                                <div className="text-4xl mb-2">😔</div>
                                <div className="text-3xl font-bold text-red-400">{insights.sentimentBreakdown.negative}</div>
                                <div className="text-gray-300">Negative Entries</div>
                            </div>
                            <div className="card text-center">
                                <div className="text-4xl mb-2">😐</div>
                                <div className="text-3xl font-bold text-blue-400">{insights.sentimentBreakdown.neutral}</div>
                                <div className="text-gray-300">Neutral Entries</div>
                            </div>
                        </div>

                        {/* Dominant Emotion */}
                        {insights.dominantEmotion && (
                            <div className="card mb-8">
                                <h2 className="text-2xl font-bold mb-4">Dominant Emotion</h2>
                                <div className="flex items-center gap-4">
                                    <div className="text-6xl">{getEmotionEmoji(insights.dominantEmotion)}</div>
                                    <div>
                                        <div className="text-3xl font-bold capitalize">{insights.dominantEmotion}</div>
                                        <p className="text-gray-300">Your most frequent emotion this week</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Patterns */}
                        {insights.patterns && insights.patterns.length > 0 && (
                            <div className="card mb-8">
                                <h2 className="text-2xl font-bold mb-4">🔍 Patterns Detected</h2>
                                <ul className="space-y-3">
                                    {insights.patterns.map((pattern, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <span className="text-purple-400 text-xl">•</span>
                                            <span className="text-lg">{pattern}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Best & Worst Days */}
                        {(insights.bestDay || insights.worstDay) && (
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                {insights.bestDay && (
                                    <div className="card">
                                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                            <span>🌟</span> Best Day
                                        </h3>
                                        <p className="text-2xl font-bold text-green-400">{insights.bestDay}s</p>
                                        <p className="text-sm text-gray-400">You tend to feel most positive on this day</p>
                                    </div>
                                )}
                                {insights.worstDay && (
                                    <div className="card">
                                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                            <span>⚠️</span> Challenging Day
                                        </h3>
                                        <p className="text-2xl font-bold text-red-400">{insights.worstDay}s</p>
                                        <p className="text-sm text-gray-400">This day tends to be more difficult</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recommendations */}
                        {insights.recommendations && insights.recommendations.length > 0 && (
                            <div className="card">
                                <h2 className="text-2xl font-bold mb-4">💡 Personalized Recommendations</h2>
                                <div className="space-y-3">
                                    {insights.recommendations.map((rec, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                                            <span className="text-yellow-400 text-xl">💡</span>
                                            <span>{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="card text-center">
                        <div className="text-6xl mb-4">📝</div>
                        <h2 className="text-2xl font-bold mb-2">Not Enough Data Yet</h2>
                        <p className="text-gray-300 mb-4">Start creating journal entries or analyses to see AI-powered insights!</p>
                        <Link to="/journals/new" className="btn-primary">Create Journal Entry</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Insights;
