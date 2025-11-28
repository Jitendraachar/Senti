import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

function JournalForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tags: '',
        mood: 'neutral'
    });

    const isEditing = !!id;

    useEffect(() => {
        if (isEditing) {
            fetchJournal();
        }
    }, [id]);

    const fetchJournal = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.get(`/api/journals/${id}`, { headers });
            const journal = res.data.journal;

            setFormData({
                title: journal.title,
                content: journal.content,
                tags: journal.tags?.join(', ') || '',
                mood: journal.mood || 'neutral'
            });
        } catch (err) {
            console.error('Error fetching journal:', err);
            alert('Failed to load journal');
            navigate('/journals');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim() || !formData.content.trim()) {
            alert('Please fill in both title and content');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const payload = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
                mood: formData.mood
            };

            if (isEditing) {
                await axios.put(`/api/journals/${id}`, payload, { headers });
            } else {
                await axios.post('/api/journals', payload, { headers });
            }

            navigate('/journals');
        } catch (err) {
            console.error('Error saving journal:', err);
            alert('Failed to save journal entry');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gradient">
                            {isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}
                        </h1>
                        <p className="text-gray-300 mt-2">
                            {isEditing ? 'Update your thoughts' : 'Express your thoughts and feelings'}
                        </p>
                    </div>
                    <Link to="/journals" className="btn-secondary">
                        ← Back
                    </Link>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="card">
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Give your entry a title..."
                                className="input w-full"
                                required
                            />
                        </div>

                        {/* Mood */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Current Mood
                            </label>
                            <select
                                name="mood"
                                value={formData.mood}
                                onChange={handleChange}
                                className="input w-full"
                            >
                                <option value="happy">😊 Happy</option>
                                <option value="sad">😢 Sad</option>
                                <option value="anxious">😰 Anxious</option>
                                <option value="calm">😌 Calm</option>
                                <option value="excited">🤩 Excited</option>
                                <option value="stressed">😫 Stressed</option>
                                <option value="grateful">🙏 Grateful</option>
                                <option value="neutral">😐 Neutral</option>
                            </select>
                        </div>

                        {/* Content */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Content <span className="text-red-400">*</span>
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                placeholder="Write your thoughts here... AI will analyze the sentiment automatically."
                                className="input w-full min-h-[300px] resize-y"
                                required
                            />
                            <div className="text-xs text-gray-400 mt-2">
                                {formData.content.length} characters
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Tags (optional)
                            </label>
                            <input
                                type="text"
                                name="tags"
                                value={formData.tags}
                                onChange={handleChange}
                                placeholder="work, personal, goals (comma separated)"
                                className="input w-full"
                            />
                            <div className="text-xs text-gray-400 mt-2">
                                Separate tags with commas
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">🤖</div>
                                <div>
                                    <h3 className="font-semibold text-purple-300 mb-1">AI Sentiment Analysis</h3>
                                    <p className="text-sm text-gray-300">
                                        Your journal entry will be automatically analyzed for sentiment when you save it.
                                        You'll receive personalized suggestions based on your mood.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="animate-spin">⏳</span>
                                        {isEditing ? 'Updating...' : 'Saving...'}
                                    </span>
                                ) : (
                                    <span>{isEditing ? '💾 Update Entry' : '✨ Save Entry'}</span>
                                )}
                            </button>
                            <Link to="/journals" className="btn-secondary flex-1 text-center">
                                Cancel
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default JournalForm;
