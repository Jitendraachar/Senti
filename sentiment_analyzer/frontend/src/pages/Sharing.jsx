import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Sharing() {
    const [activeTab, setActiveTab] = useState('therapist'); // therapist or accountability

    // Therapist Sharing State
    const [reports, setReports] = useState([]);
    const [journals, setJournals] = useState([]);
    const [selectedEntries, setSelectedEntries] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [reportForm, setReportForm] = useState({
        title: '',
        description: '',
        expirationDays: 30
    });

    // Accountability Partner State
    const [partners, setPartners] = useState([]);
    const [showPartnerForm, setShowPartnerForm] = useState(false);
    const [partnerForm, setPartnerForm] = useState({
        partnerName: '',
        partnerEmail: '',
        frequency: 'weekly',
        consecutiveNegativeDays: 3,
        negativePercentage: 70
    });
    const [checkInResult, setCheckInResult] = useState(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            if (activeTab === 'therapist') {
                const [reportsRes, journalsRes] = await Promise.all([
                    axios.get('/api/sharing/reports', { headers }),
                    axios.get('/api/journals', { headers })
                ]);
                setReports(reportsRes.data.reports || []);
                setJournals(journalsRes.data.journals || []);
            } else {
                const partnersRes = await axios.get('/api/accountability/partners', { headers });
                setPartners(partnersRes.data.partners || []);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Therapist Sharing Functions
    const handleEntryToggle = (entryId) => {
        setSelectedEntries(prev =>
            prev.includes(entryId)
                ? prev.filter(id => id !== entryId)
                : [...prev, entryId]
        );
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/sharing/create', {
                ...reportForm,
                selectedEntries
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowCreateForm(false);
            setSelectedEntries([]);
            setReportForm({ title: '', description: '', expirationDays: 30 });
            fetchData();
        } catch (err) {
            console.error('Error creating report:', err);
            alert('Failed to create report');
        }
    };

    const handleRevokeReport = async (reportId) => {
        if (!confirm('Are you sure you want to revoke access to this report?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/sharing/reports/${reportId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error revoking report:', err);
        }
    };

    const copyShareLink = (url) => {
        navigator.clipboard.writeText(url);
        alert('Share link copied to clipboard!');
    };

    // Accountability Partner Functions
    const handleAddPartner = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/accountability/partners', {
                ...partnerForm,
                alertThresholds: {
                    consecutiveNegativeDays: partnerForm.consecutiveNegativeDays,
                    negativePercentage: partnerForm.negativePercentage
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowPartnerForm(false);
            setPartnerForm({
                partnerName: '',
                partnerEmail: '',
                frequency: 'weekly',
                consecutiveNegativeDays: 3,
                negativePercentage: 70
            });
            fetchData();
        } catch (err) {
            console.error('Error adding partner:', err);
            alert('Failed to add partner');
        }
    };

    const handleRemovePartner = async (partnerId) => {
        if (!confirm('Are you sure you want to remove this partner?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/accountability/partners/${partnerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error removing partner:', err);
        }
    };

    const handleSendCheckIn = async (partnerId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`/api/accountability/check-in/${partnerId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCheckInResult(response.data.checkIn);
        } catch (err) {
            console.error('Error sending check-in:', err);
            alert('Failed to send check-in');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">🤝</div>
                    <p className="text-xl text-gray-300">Loading...</p>
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
                    <h1 className="text-4xl font-bold text-gradient">Sharing & Support</h1>
                    <p className="text-gray-300 mt-2">Share with therapists or connect with accountability partners</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('therapist')}
                        className={`px-6 py-3 rounded-lg font-bold transition ${activeTab === 'therapist' ? 'bg-purple-600' : 'bg-white/10'
                            }`}
                    >
                        👨‍⚕️ Therapist Sharing
                    </button>
                    <button
                        onClick={() => setActiveTab('accountability')}
                        className={`px-6 py-3 rounded-lg font-bold transition ${activeTab === 'accountability' ? 'bg-purple-600' : 'bg-white/10'
                            }`}
                    >
                        👥 Accountability Partners
                    </button>
                </div>

                {/* Therapist Sharing Tab */}
                {activeTab === 'therapist' && (
                    <div>
                        <div className="card mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold">Shareable Reports</h2>
                                    <p className="text-sm text-gray-400">Create secure reports to share with mental health professionals</p>
                                </div>
                                <button onClick={() => setShowCreateForm(true)} className="btn-primary">
                                    + Create Report
                                </button>
                            </div>

                            {/* Create Report Form */}
                            {showCreateForm && (
                                <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500 rounded-lg">
                                    <h3 className="font-bold mb-4">Create New Report</h3>
                                    <form onSubmit={handleCreateReport} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Report Title *</label>
                                            <input
                                                type="text"
                                                required
                                                value={reportForm.title}
                                                onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                                placeholder="e.g., Monthly Progress Report"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Description</label>
                                            <textarea
                                                value={reportForm.description}
                                                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none resize-none"
                                                rows="2"
                                                placeholder="Optional notes for your therapist"
                                            ></textarea>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Expiration</label>
                                            <select
                                                value={reportForm.expirationDays}
                                                onChange={(e) => setReportForm({ ...reportForm, expirationDays: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                            >
                                                <option value={7}>7 days</option>
                                                <option value={30}>30 days</option>
                                                <option value={90}>90 days</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Select Entries to Include *</label>
                                            <div className="max-h-60 overflow-y-auto space-y-2">
                                                {journals.map(journal => (
                                                    <label key={journal._id} className="flex items-center gap-2 p-2 bg-white/5 rounded cursor-pointer hover:bg-white/10">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEntries.includes(journal._id)}
                                                            onChange={() => handleEntryToggle(journal._id)}
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-bold">{journal.title}</div>
                                                            <div className="text-xs text-gray-400">
                                                                {new Date(journal.createdAt).toLocaleDateString()} - {journal.sentiment}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">{selectedEntries.length} entries selected</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="submit" className="btn-primary flex-1" disabled={selectedEntries.length === 0}>
                                                Create Report
                                            </button>
                                            <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary flex-1">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Reports List */}
                            {reports.length > 0 ? (
                                <div className="space-y-4">
                                    {reports.map(report => (
                                        <div key={report.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg">{report.title}</h3>
                                                    {report.description && <p className="text-sm text-gray-400">{report.description}</p>}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-sm ${report.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {report.isActive ? 'Active' : 'Revoked'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400 mb-3">
                                                <div>Created: {new Date(report.createdAt).toLocaleDateString()}</div>
                                                <div>Expires: {new Date(report.expiresAt).toLocaleDateString()}</div>
                                                <div>Accessed: {report.accessCount} times</div>
                                            </div>
                                            {report.isActive && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => copyShareLink(report.shareUrl)} className="btn-secondary text-sm">
                                                        📋 Copy Link
                                                    </button>
                                                    <button onClick={() => handleRevokeReport(report.id)} className="btn-secondary text-sm text-red-400">
                                                        Revoke Access
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No reports yet. Create one to share with your therapist.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Accountability Partners Tab */}
                {activeTab === 'accountability' && (
                    <div>
                        <div className="card mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold">Accountability Partners</h2>
                                    <p className="text-sm text-gray-400">Designate trusted people to receive wellness check-ins</p>
                                </div>
                                <button onClick={() => setShowPartnerForm(true)} className="btn-primary">
                                    + Add Partner
                                </button>
                            </div>

                            {/* Add Partner Form */}
                            {showPartnerForm && (
                                <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500 rounded-lg">
                                    <h3 className="font-bold mb-4">Add Accountability Partner</h3>
                                    <form onSubmit={handleAddPartner} className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Partner Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={partnerForm.partnerName}
                                                    onChange={(e) => setPartnerForm({ ...partnerForm, partnerName: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Partner Email *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={partnerForm.partnerEmail}
                                                    onChange={(e) => setPartnerForm({ ...partnerForm, partnerEmail: e.target.value })}
                                                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Check-in Frequency</label>
                                            <select
                                                value={partnerForm.frequency}
                                                onChange={(e) => setPartnerForm({ ...partnerForm, frequency: e.target.value })}
                                                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="biweekly">Bi-weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Alert after consecutive negative days</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={partnerForm.consecutiveNegativeDays}
                                                    onChange={(e) => setPartnerForm({ ...partnerForm, consecutiveNegativeDays: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Alert if negative % exceeds</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={partnerForm.negativePercentage}
                                                    onChange={(e) => setPartnerForm({ ...partnerForm, negativePercentage: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button type="submit" className="btn-primary flex-1">
                                                Add Partner
                                            </button>
                                            <button type="button" onClick={() => setShowPartnerForm(false)} className="btn-secondary flex-1">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Partners List */}
                            {partners.length > 0 ? (
                                <div className="space-y-4">
                                    {partners.map(partner => (
                                        <div key={partner._id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-lg">{partner.partnerName}</h3>
                                                    <p className="text-sm text-gray-400">{partner.partnerEmail}</p>
                                                </div>
                                                <span className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 capitalize">
                                                    {partner.frequency}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400 mb-3">
                                                <div>Alert thresholds: {partner.alertThresholds.consecutiveNegativeDays} consecutive days or {partner.alertThresholds.negativePercentage}% negative</div>
                                                {partner.lastCheckIn && (
                                                    <div>Last check-in: {new Date(partner.lastCheckIn).toLocaleDateString()}</div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleSendCheckIn(partner._id)} className="btn-primary text-sm">
                                                    Send Check-in Now
                                                </button>
                                                <button onClick={() => handleRemovePartner(partner._id)} className="btn-secondary text-sm text-red-400">
                                                    Remove Partner
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No accountability partners yet. Add someone you trust.
                                </div>
                            )}

                            {/* Check-in Result */}
                            {checkInResult && (
                                <div className="mt-6 p-4 bg-green-500/20 border border-green-500 rounded-lg">
                                    <h3 className="font-bold mb-2">✅ Check-in Sent!</h3>
                                    <p className="mb-2">{checkInResult.message}</p>
                                    <div className="text-sm text-gray-300">
                                        <div>Wellness Score: {checkInResult.wellnessScore}/10</div>
                                        <div>Trend: {checkInResult.trend}</div>
                                        <div>Entries this week: {checkInResult.totalEntries}</div>
                                    </div>
                                    <button onClick={() => setCheckInResult(null)} className="mt-3 text-sm text-gray-400 hover:text-white">
                                        Dismiss
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Privacy Notice */}
                        <div className="card bg-blue-500/10 border border-blue-500">
                            <h3 className="font-bold mb-2">🔒 Privacy Notice</h3>
                            <p className="text-sm text-gray-300">
                                Your accountability partners will only receive summary information (mood trend, wellness score, entry count).
                                They will NOT see the actual content of your journal entries.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Sharing;
