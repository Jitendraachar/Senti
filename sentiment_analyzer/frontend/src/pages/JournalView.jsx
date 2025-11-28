import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

function JournalView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [journal, setJournal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJournal();
    }, [id]);

    const fetchJournal = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`/api/journals/${id}`, { headers });
            setJournal(res.data.journal);
        } catch (err) {
            console.error('Error fetching journal:', err);
            alert('Failed to load journal');
            navigate('/journals');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this journal entry?')) return;

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.delete(`/api/journals/${id}`, { headers });
            navigate('/journals');
        } catch (err) {
            console.error('Error deleting journal:', err);
            alert('Failed to delete journal entry');
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'bg-green-500/20 text-green-400 border-green-500';
            case 'negative': return 'bg-red-500/20 text-red-400 border-red-500';
            default: return 'bg-blue-500/20 text-blue-400 border-blue-500';
        }
    };

    const getSentimentEmoji = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '😊';
            case 'negative': return '😔';
            default: return '😐';
        }
    };

    const getMoodEmoji = (mood) => {
        const moodMap = {
            happy: '😊',
            sad: '😢',
            anxious: '😰',
            calm: '😌',
            excited: '🤩',
            stressed: '😫',
            grateful: '🙏',
            neutral: '😐'
        };
        return moodMap[mood] || '😐';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">📖</div>
                    <p className="text-xl text-gray-300">Loading journal...</p>
                </div>
            </div>
        );
    }

    if (!journal) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-xl text-gray-300">Journal not found</p>
                    <Link to="/journals" className="btn-primary mt-4 inline-block">
                        Back to Journals
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <Link to="/journals" className="btn-secondary">
                        ← Back to Journals
                    </Link>
                    <div className="flex gap-4">
                        <Link to={`/journals/${id}/edit`} className="btn-primary">
                            ✏️ Edit
                        </Link>
                        <button onClick={handleDelete} className="btn-secondary text-red-400 hover:text-red-300">
                            🗑️ Delete
                        </button>
                    </div>
                </div>

                {/* Journal Content */}
                <div className="card">
                    {/* Title and Metadata */}
                    <div className="mb-6">
                        <h1 className="text-4xl font-bold mb-4">{journal.title}</h1>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <span>📅 {new Date(journal.createdAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>

                            {journal.updatedAt !== journal.createdAt && (
                                <span>✏️ Updated {new Date(journal.updatedAt).toLocaleDateString()}</span>
                            )}

                            <span>{getMoodEmoji(journal.mood)} {journal.mood}</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert max-w-none mb-6">
                        <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {journal.content}
                        </div>
                    </div>

                    {/* Tags */}
                    {journal.tags && journal.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                            {journal.tags.map((tag, idx) => (
                                <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="border-t border-gray-700 my-6"></div>

                    {/* Sentiment Analysis */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            🤖 AI Sentiment Analysis
                        </h2>

                        <div className="flex items-center gap-4">
                            <span className={`px-4 py-2 rounded-full text-lg font-semibold border ${getSentimentColor(journal.sentiment)}`}>
                                {getSentimentEmoji(journal.sentiment)} {journal.sentiment.toUpperCase()}
                            </span>
                            <span className="text-purple-400 font-semibold">
                                {Math.round(journal.confidence * 100)}% Confidence
                            </span>
                        </div>

                        {/* Confidence Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                style={{ width: `${journal.confidence * 100}%` }}
                            ></div>
                        </div>

                        {/* Suggestions */}
                        {journal.suggestions && journal.suggestions.length > 0 && (
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6">
                                <h3 className="text-xl font-semibold mb-4 text-purple-300">
                                    💡 Personalized Suggestions
                                </h3>
                                <ul className="space-y-3">
                                    {journal.suggestions.map((suggestion, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <span className="text-purple-400 mt-1">•</span>
                                            <span className="text-gray-200">{suggestion}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default JournalView;
