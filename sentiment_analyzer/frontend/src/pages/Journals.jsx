import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Journals() {
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sentimentFilter, setSentimentFilter] = useState('');
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        fetchJournals();
    }, [pagination.page, sentimentFilter]);

    const fetchJournals = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            let url = `/api/journals?page=${pagination.page}&limit=12`;
            if (sentimentFilter) url += `&sentiment=${sentimentFilter}`;
            if (searchTerm) url += `&search=${searchTerm}`;

            const res = await axios.get(url, { headers });
            setJournals(res.data.journals);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Error fetching journals:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchJournals();
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this journal entry?')) return;

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            await axios.delete(`/api/journals/${id}`, { headers });
            fetchJournals();
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">📔</div>
                    <p className="text-xl text-gray-300">Loading journals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gradient">My Journals</h1>
                        <p className="text-gray-300 mt-2">Your personal mood tracking diary</p>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/journals/new" className="btn-primary">
                            ✍️ New Entry
                        </Link>
                        <Link to="/dashboard" className="btn-secondary">
                            Dashboard
                        </Link>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="card mb-8">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Search journals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input flex-1"
                        />
                        <select
                            value={sentimentFilter}
                            onChange={(e) => setSentimentFilter(e.target.value)}
                            className="input"
                        >
                            <option value="">All Sentiments</option>
                            <option value="positive">Positive</option>
                            <option value="negative">Negative</option>
                            <option value="neutral">Neutral</option>
                        </select>
                        <button type="submit" className="btn-primary">
                            🔍 Search
                        </button>
                    </form>
                </div>

                {/* Journals Grid */}
                {journals.length === 0 ? (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">📔</div>
                        <h2 className="text-2xl font-bold mb-2">No Journals Yet</h2>
                        <p className="text-gray-300 mb-6">Start your journaling journey today!</p>
                        <Link to="/journals/new" className="btn-primary inline-block">
                            Create Your First Entry
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {journals.map((journal) => (
                                <div
                                    key={journal._id}
                                    className="card hover:scale-105 transition-transform cursor-pointer group"
                                    onClick={() => navigate(`/journals/${journal._id}`)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getSentimentColor(journal.sentiment)}`}>
                                            {getSentimentEmoji(journal.sentiment)} {journal.sentiment}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(journal._id);
                                            }}
                                            className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 line-clamp-2">{journal.title}</h3>

                                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                                        {journal.content}
                                    </p>

                                    <div className="flex justify-between items-center text-xs text-gray-400">
                                        <span>{new Date(journal.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}</span>
                                        <span className="text-purple-400">
                                            {Math.round(journal.confidence * 100)}% confidence
                                        </span>
                                    </div>

                                    {journal.tags && journal.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {journal.tags.slice(0, 3).map((tag, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-center gap-2">
                                <button
                                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                    disabled={pagination.page === 1}
                                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← Previous
                                </button>
                                <span className="px-4 py-2 text-gray-300">
                                    Page {pagination.page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                    disabled={pagination.page === pagination.pages}
                                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Journals;
