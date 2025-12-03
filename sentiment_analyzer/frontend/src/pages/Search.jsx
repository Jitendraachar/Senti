import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Search() {
    const [filters, setFilters] = useState({
        query: '',
        sentiments: [],
        emotions: [],
        tags: [],
        dateFrom: '',
        dateTo: '',
        confidenceMin: 0,
        confidenceMax: 1,
        source: 'all'
    });
    const [results, setResults] = useState([]);
    const [availableFilters, setAvailableFilters] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        fetchAvailableFilters();
    }, []);

    const fetchAvailableFilters = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/search/filters', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAvailableFilters(response.data.filters);
        } catch (err) {
            console.error('Error fetching filters:', err);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearched(true);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/search', filters, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(response.data.results);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSentimentToggle = (sentiment) => {
        setFilters(prev => ({
            ...prev,
            sentiments: prev.sentiments.includes(sentiment)
                ? prev.sentiments.filter(s => s !== sentiment)
                : [...prev.sentiments, sentiment]
        }));
    };

    const handleEmotionToggle = (emotion) => {
        setFilters(prev => ({
            ...prev,
            emotions: prev.emotions.includes(emotion)
                ? prev.emotions.filter(e => e !== emotion)
                : [...prev.emotions, emotion]
        }));
    };

    const getSentimentColor = (sentiment) => {
        return sentiment === 'positive' ? 'text-green-400' : sentiment === 'negative' ? 'text-red-400' : 'text-blue-400';
    };

    const getEmotionEmoji = (emotion) => {
        const emojiMap = {
            joy: '😄', sadness: '😢', anger: '😠', fear: '😨',
            surprise: '😲', disgust: '🤢', love: '❤️', neutral: '😐'
        };
        return emojiMap[emotion] || '😐';
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/dashboard" className="btn-secondary mb-4 inline-block">← Back</Link>
                    <h1 className="text-4xl font-bold text-gradient">Advanced Search</h1>
                    <p className="text-gray-300 mt-2">Find specific entries with powerful filters</p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="card mb-8">
                    <h2 className="text-2xl font-bold mb-6">Search Filters</h2>

                    {/* Text Search */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Search Text</label>
                        <input
                            type="text"
                            value={filters.query}
                            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                            placeholder="Search in title or content..."
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                        />
                    </div>

                    {/* Sentiment Filter */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Sentiments</label>
                        <div className="flex gap-3">
                            {['positive', 'negative', 'neutral'].map(sentiment => (
                                <button
                                    key={sentiment}
                                    type="button"
                                    onClick={() => handleSentimentToggle(sentiment)}
                                    className={`px-4 py-2 rounded-lg transition ${filters.sentiments.includes(sentiment)
                                            ? 'bg-purple-600 border-purple-500'
                                            : 'bg-white/5 border-white/20'
                                        } border-2`}
                                >
                                    <span className="capitalize">{sentiment}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Emotion Filter */}
                    {availableFilters && availableFilters.emotions.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Emotions</label>
                            <div className="flex flex-wrap gap-2">
                                {availableFilters.emotions.map(emotion => (
                                    <button
                                        key={emotion}
                                        type="button"
                                        onClick={() => handleEmotionToggle(emotion)}
                                        className={`px-3 py-2 rounded-lg transition ${filters.emotions.includes(emotion)
                                                ? 'bg-purple-600 border-purple-500'
                                                : 'bg-white/5 border-white/20'
                                            } border-2`}
                                    >
                                        <span className="mr-1">{getEmotionEmoji(emotion)}</span>
                                        <span className="capitalize">{emotion}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Date Range */}
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">From Date</label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">To Date</label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Source Filter */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Source</label>
                        <select
                            value={filters.source}
                            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                        >
                            <option value="all">All Sources</option>
                            <option value="analysis">Quick Analyses Only</option>
                            <option value="journal">Journals Only</option>
                        </select>
                    </div>

                    {/* Search Button */}
                    <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? '🔍 Searching...' : '🔍 Search'}
                    </button>
                </form>

                {/* Results */}
                {searched && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4">
                            Search Results ({results.length})
                        </h2>

                        {results.length > 0 ? (
                            <div className="space-y-4">
                                {results.map((result, index) => (
                                    <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                {result.title && (
                                                    <h3 className="text-lg font-bold mb-1">{result.title}</h3>
                                                )}
                                                <div className="flex gap-2 items-center text-sm text-gray-400">
                                                    <span className="capitalize">{result.source}</span>
                                                    <span>•</span>
                                                    <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getSentimentColor(result.sentiment)}`}>
                                                {result.sentiment}
                                            </div>
                                        </div>
                                        <p className="text-gray-300 mb-3 line-clamp-3">
                                            {result.content || result.text}
                                        </p>
                                        {result.emotions && result.emotions.length > 0 && (
                                            <div className="flex gap-2 flex-wrap">
                                                {result.emotions.slice(0, 3).map((e, i) => (
                                                    <span key={i} className="px-2 py-1 bg-purple-500/20 rounded text-xs">
                                                        {getEmotionEmoji(e.emotion)} {e.emotion}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-6xl mb-4">🔍</div>
                                <p className="text-xl text-gray-300">No results found</p>
                                <p className="text-gray-400 mt-2">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Search;
