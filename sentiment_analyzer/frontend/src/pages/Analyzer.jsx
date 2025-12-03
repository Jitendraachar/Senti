import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Analyzer() {
    const [text, setText] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                '/api/analyze',
                { text },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setResult(response.data.analysis);
            setHistory([response.data.analysis, ...history.slice(0, 4)]);
            setText('');
        } catch (err) {
            setError(err.response?.data?.error || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'sentiment-positive';
            case 'negative': return 'sentiment-negative';
            default: return 'sentiment-neutral';
        }
    };

    const getSentimentEmoji = (sentiment) => {
        switch (sentiment) {
            case 'positive': return '😊';
            case 'negative': return '😔';
            default: return '😐';
        }
    };

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
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-gradient">Sentiment Analyzer</h1>
                    <div className="flex gap-4">
                        <Link to="/dashboard" className="btn-secondary">
                            Dashboard
                        </Link>
                        <button onClick={handleLogout} className="btn-secondary">
                            Logout
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-2xl font-bold mb-4">Analyze Your Text</h2>

                            {error && (
                                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl mb-4">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleAnalyze} className="space-y-4">
                                <textarea
                                    className="input-field min-h-[200px] resize-none"
                                    placeholder="How are you feeling today? Share your thoughts..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="btn-primary w-full"
                                    disabled={loading || !text.trim()}
                                >
                                    {loading ? 'Analyzing...' : 'Analyze Sentiment'}
                                </button>
                            </form>
                        </div>

                        {/* Recent History */}
                        {history.length > 0 && (
                            <div className="card">
                                <h3 className="text-xl font-bold mb-4">Recent Analyses</h3>
                                <div className="space-y-3">
                                    {history.map((item, idx) => (
                                        <div key={idx} className="glass-hover p-3 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-2xl">{getSentimentEmoji(item.sentiment)}</span>
                                                <span className="font-semibold capitalize">{item.sentiment}</span>
                                                <span className="text-sm text-gray-400">
                                                    {(item.confidence * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-300 truncate">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {result && (
                            <>
                                <div className="card">
                                    <h2 className="text-2xl font-bold mb-4">Analysis Result</h2>

                                    <div className={`${getSentimentColor(result.sentiment)} p-6 rounded-xl text-center mb-4`}>
                                        <div className="text-6xl mb-2">{getSentimentEmoji(result.sentiment)}</div>
                                        <h3 className="text-3xl font-bold capitalize mb-2">{result.sentiment}</h3>
                                        <p className="text-lg">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
                                    </div>

                                    {/* Emotions Display */}
                                    {result.emotions && result.emotions.length > 0 && (
                                        <div className="mb-4 p-4 bg-purple-500/10 rounded-xl">
                                            <h4 className="text-sm font-bold mb-3 text-purple-300">Detected Emotions:</h4>
                                            <div className="flex gap-3 flex-wrap justify-center">
                                                {result.emotions.map((emotion, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg">
                                                        <span className="text-2xl">{getEmotionEmoji(emotion.emotion)}</span>
                                                        <div>
                                                            <div className="text-sm font-bold capitalize">{emotion.emotion}</div>
                                                            <div className="text-xs text-gray-400">{(emotion.score * 100).toFixed(0)}%</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="glass p-4 rounded-xl">
                                        <p className="text-gray-300 italic">"{result.text}"</p>
                                    </div>
                                </div>

                                <div className="card">
                                    <h3 className="text-xl font-bold mb-4">💡 Suggestions</h3>
                                    <ul className="space-y-3">
                                        {result.suggestions.map((suggestion, idx) => (
                                            <li key={idx} className="glass-hover p-4 rounded-xl flex items-start gap-3">
                                                <span className="text-purple-400 font-bold">{idx + 1}.</span>
                                                <span className="text-gray-200">{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                        {!result && (
                            <div className="card text-center py-12">
                                <div className="text-6xl mb-4 animate-float">🤖</div>
                                <h3 className="text-2xl font-bold mb-2">Ready to Analyze</h3>
                                <p className="text-gray-300">
                                    Enter your text and click "Analyze Sentiment" to get started
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Analyzer;
