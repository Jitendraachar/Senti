import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Goals() {
    const [streaks, setStreaks] = useState(null);
    const [achievements, setAchievements] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [streaksRes, achievementsRes] = await Promise.all([
                axios.get('/api/streaks/current', { headers }),
                axios.get('/api/streaks/achievements', { headers })
            ]);

            setStreaks(streaksRes.data.streaks);
            setAchievements(achievementsRes.data);
        } catch (err) {
            console.error('Error fetching goals data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">🎯</div>
                    <p className="text-xl text-gray-300">Loading your progress...</p>
                </div>
            </div>
        );
    }

    const getStreakColor = (type) => {
        return type === 'positive' ? 'text-green-400' : type === 'negative' ? 'text-red-400' : 'text-gray-400';
    };

    const getProgressPercentage = (progress, target) => {
        return Math.min((progress / target) * 100, 100);
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/dashboard" className="btn-secondary mb-4 inline-block">← Back</Link>
                    <h1 className="text-4xl font-bold text-gradient">Goals & Achievements</h1>
                    <p className="text-gray-300 mt-2">Track your progress and unlock achievements</p>
                </div>

                {/* Current Streak */}
                {streaks && streaks.currentStreak && streaks.currentStreak.count > 0 && (
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold mb-4">🔥 Current Streak</h2>
                        <div className="flex items-center gap-6">
                            <div className="text-8xl">🔥</div>
                            <div>
                                <div className={`text-5xl font-bold ${getStreakColor(streaks.currentStreak.type)}`}>
                                    {streaks.currentStreak.count} Days
                                </div>
                                <div className="text-xl capitalize mt-2">
                                    {streaks.currentStreak.type} Streak
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                    Started {new Date(streaks.currentStreak.startDate).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Longest Streaks */}
                {streaks && (
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="card">
                            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                <span>🌟</span> Longest Positive Streak
                            </h3>
                            <div className="text-4xl font-bold text-green-400">
                                {streaks.longestPositiveStreak} Days
                            </div>
                            <p className="text-sm text-gray-400 mt-2">Your personal best!</p>
                        </div>
                        <div className="card">
                            <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                <span>📊</span> Longest Negative Streak
                            </h3>
                            <div className="text-4xl font-bold text-red-400">
                                {streaks.longestNegativeStreak} Days
                            </div>
                            <p className="text-sm text-gray-400 mt-2">Remember, tough times pass</p>
                        </div>
                    </div>
                )}

                {/* Achievements */}
                {achievements && (
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">🏆 Achievements</h2>
                            <div className="text-lg">
                                <span className="font-bold text-purple-400">{achievements.totalUnlocked}</span>
                                <span className="text-gray-400"> / {achievements.totalAchievements}</span>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {achievements.achievements.map((achievement) => (
                                <div
                                    key={achievement.id}
                                    className={`p-4 rounded-lg border-2 transition ${achievement.unlocked
                                            ? 'border-purple-500 bg-purple-500/10'
                                            : 'border-gray-700 bg-gray-800/50 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`text-5xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                                            {achievement.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold mb-1">{achievement.name}</h3>
                                            <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>

                                            {/* Progress Bar */}
                                            <div className="mb-2">
                                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                    <span>Progress</span>
                                                    <span>{achievement.progress} / {achievement.target}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${achievement.unlocked ? 'bg-purple-500' : 'bg-gray-600'
                                                            }`}
                                                        style={{ width: `${getProgressPercentage(achievement.progress, achievement.target)}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {achievement.unlocked && (
                                                <div className="text-xs text-purple-400 font-bold">✓ UNLOCKED</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Motivational Message */}
                <div className="card mt-8 text-center">
                    <div className="text-4xl mb-3">💪</div>
                    <h3 className="text-xl font-bold mb-2">Keep Going!</h3>
                    <p className="text-gray-300">
                        Every entry you create helps you understand yourself better. Stay consistent!
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Goals;
