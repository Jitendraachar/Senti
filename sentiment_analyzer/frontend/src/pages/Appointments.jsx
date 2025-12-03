import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        doctorName: '',
        specialty: 'therapist',
        appointmentDate: '',
        appointmentTime: '',
        reason: 'Mental health consultation',
        notes: '',
        contactNumber: '',
        location: '',
        isVirtual: false,
        meetingLink: ''
    });

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/appointments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppointments(response.data.appointments);
        } catch (err) {
            console.error('Error fetching appointments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/appointments', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setShowBookingForm(false);
            setFormData({
                doctorName: '',
                specialty: 'therapist',
                appointmentDate: '',
                appointmentTime: '',
                reason: 'Mental health consultation',
                notes: '',
                contactNumber: '',
                location: '',
                isVirtual: false,
                meetingLink: ''
            });
            fetchAppointments();
        } catch (err) {
            console.error('Error booking appointment:', err);
            alert('Error booking appointment');
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/appointments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAppointments();
        } catch (err) {
            console.error('Error cancelling appointment:', err);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/appointments/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAppointments();
        } catch (err) {
            console.error('Error updating appointment:', err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-500/20 text-blue-400';
            case 'completed': return 'bg-green-500/20 text-green-400';
            case 'cancelled': return 'bg-red-500/20 text-red-400';
            case 'rescheduled': return 'bg-yellow-500/20 text-yellow-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const upcomingAppointments = appointments.filter(a =>
        a.status === 'scheduled' && new Date(a.appointmentDate) >= new Date()
    );
    const pastAppointments = appointments.filter(a =>
        a.status === 'completed' || new Date(a.appointmentDate) < new Date()
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">🏥</div>
                    <p className="text-xl text-gray-300">Loading appointments...</p>
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
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-gradient">Doctor Appointments</h1>
                            <p className="text-gray-300 mt-2">Manage your mental health appointments</p>
                        </div>
                        <button onClick={() => setShowBookingForm(true)} className="btn-primary">
                            📅 Book Appointment
                        </button>
                    </div>
                </div>

                {/* Booking Form Modal */}
                {showBookingForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Book Appointment</h2>
                                <button onClick={() => setShowBookingForm(false)} className="text-3xl hover:text-red-400">×</button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Doctor/Therapist Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.doctorName}
                                            onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Specialty</label>
                                        <select
                                            value={formData.specialty}
                                            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                        >
                                            <option value="therapist">Therapist</option>
                                            <option value="psychologist">Psychologist</option>
                                            <option value="psychiatrist">Psychiatrist</option>
                                            <option value="counselor">Counselor</option>
                                            <option value="general">General Practitioner</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.appointmentDate}
                                            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Time *</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.appointmentTime}
                                            onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Contact Number</label>
                                    <input
                                        type="tel"
                                        value={formData.contactNumber}
                                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isVirtual"
                                        checked={formData.isVirtual}
                                        onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
                                        className="w-4 h-4"
                                    />
                                    <label htmlFor="isVirtual" className="text-sm">Virtual Appointment (Online)</label>
                                </div>

                                {formData.isVirtual ? (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Meeting Link</label>
                                        <input
                                            type="url"
                                            value={formData.meetingLink}
                                            onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                            placeholder="https://zoom.us/..."
                                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Location</label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="Clinic address"
                                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-2">Notes</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-purple-500 focus:outline-none resize-none"
                                    ></textarea>
                                </div>

                                <div className="flex gap-3">
                                    <button type="submit" className="btn-primary flex-1">Book Appointment</button>
                                    <button type="button" onClick={() => setShowBookingForm(false)} className="btn-secondary flex-1">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Upcoming Appointments */}
                {upcomingAppointments.length > 0 && (
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold mb-4">Upcoming Appointments</h2>
                        <div className="space-y-4">
                            {upcomingAppointments.map((apt) => (
                                <div key={apt._id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-xl font-bold">{apt.doctorName}</h3>
                                            <p className="text-sm text-gray-400 capitalize">{apt.specialty}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(apt.status)}`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                                        <div className="flex items-center gap-2">
                                            <span>📅</span>
                                            <span>{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>🕐</span>
                                            <span>{apt.appointmentTime}</span>
                                        </div>
                                        {apt.isVirtual ? (
                                            <div className="flex items-center gap-2">
                                                <span>💻</span>
                                                <span>Virtual Appointment</span>
                                            </div>
                                        ) : apt.location && (
                                            <div className="flex items-center gap-2">
                                                <span>📍</span>
                                                <span>{apt.location}</span>
                                            </div>
                                        )}
                                        {apt.contactNumber && (
                                            <div className="flex items-center gap-2">
                                                <span>📞</span>
                                                <span>{apt.contactNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                    {apt.notes && (
                                        <p className="text-sm text-gray-300 mb-3">Notes: {apt.notes}</p>
                                    )}
                                    {apt.meetingLink && (
                                        <a href={apt.meetingLink} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline text-sm block mb-3">
                                            Join Meeting →
                                        </a>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={() => handleStatusUpdate(apt._id, 'completed')} className="btn-secondary text-sm">
                                            Mark Complete
                                        </button>
                                        <button onClick={() => handleCancel(apt._id)} className="btn-secondary text-sm text-red-400">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Appointments */}
                {pastAppointments.length > 0 && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4">Past Appointments</h2>
                        <div className="space-y-3">
                            {pastAppointments.map((apt) => (
                                <div key={apt._id} className="p-3 bg-white/5 rounded-lg opacity-70">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold">{apt.doctorName}</h3>
                                            <p className="text-sm text-gray-400">
                                                {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.appointmentTime}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(apt.status)}`}>
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {appointments.length === 0 && (
                    <div className="card text-center py-12">
                        <div className="text-6xl mb-4">🏥</div>
                        <h2 className="text-2xl font-bold mb-2">No Appointments Yet</h2>
                        <p className="text-gray-300 mb-4">Book your first appointment to get started</p>
                        <button onClick={() => setShowBookingForm(true)} className="btn-primary">
                            📅 Book Appointment
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Appointments;
