import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Calendar() {
    const [data, setData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEntries, setSelectedEntries] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [currentMonth]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch last 90 days of data
            const [analysesRes, journalsRes] = await Promise.all([
                axios.get('/api/history?limit=1000', { headers }),
                axios.get('/api/journals?limit=1000', { headers })
            ]);

            const analyses = analysesRes.data.analyses || [];
            const journals = journalsRes.data.journals || [];
            const allEntries = [...analyses, ...journals];

            // Group by date
            const grouped = {};
            allEntries.forEach(entry => {
                const date = new Date(entry.createdAt).toDateString();
                if (!grouped[date]) {
                    grouped[date] = {
                        date,
                        entries: [],
                        sentiments: { positive: 0, negative: 0, neutral: 0 }
                    };
                }
                grouped[date].entries.push(entry);
                grouped[date].sentiments[entry.sentiment]++;
            });

            setData(Object.values(grouped));
        } catch (err) {
            console.error('Error fetching calendar data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }
        // Add actual days
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }
        return days;
    };

    const getDataForDate = (date) => {
        if (!date) return null;
        const dateStr = date.toDateString();
        return data.find(d => d.date === dateStr);
    };

    const getSentimentColor = (dayData) => {
        if (!dayData) return 'bg-gray-800';

        const { positive, negative, neutral } = dayData.sentiments;
        const total = positive + negative + neutral;

        if (total === 0) return 'bg-gray-800';

        // Determine dominant sentiment
        if (positive > negative && positive > neutral) {
            const intensity = Math.min(positive / 3, 1);
            return `bg-green-500 opacity-${Math.round(intensity * 100)}`;
        } else if (negative > positive && negative > neutral) {
            const intensity = Math.min(negative / 3, 1);
            return `bg-red-500 opacity-${Math.round(intensity * 100)}`;
        } else {
            const intensity = Math.min(neutral / 3, 1);
            return `bg-blue-500 opacity-${Math.round(intensity * 100)}`;
        }
    };

    const handleDateClick = (date) => {
        const dayData = getDataForDate(date);
        setSelectedDate(date);
        setSelectedEntries(dayData ? dayData.entries : []);
    };

    const changeMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">📅</div>
                    <p className="text-xl text-gray-300">Loading calendar...</p>
                </div>
            </div>
        );
    }

    const days = getDaysInMonth(currentMonth);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/dashboard" className="btn-secondary mb-4 inline-block">← Back</Link>
                    <h1 className="text-4xl font-bold text-gradient">Mood Calendar</h1>
                    <p className="text-gray-300 mt-2">Visual heatmap of your emotional journey</p>
                </div>

                {/* Calendar */}
                <div className="card mb-8">
                    {/* Month Navigation */}
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => changeMonth(-1)} className="btn-secondary">
                            ← Previous
                        </button>
                        <h2 className="text-2xl font-bold">
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={() => changeMonth(1)} className="btn-secondary">
                            Next →
                        </button>
                    </div>

                    {/* Week Day Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-sm font-bold text-gray-400 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((date, index) => {
                            const dayData = date ? getDataForDate(date) : null;
                            const isToday = date && date.toDateString() === new Date().toDateString();
                            const isSelected = selectedDate && date && date.toDateString() === selectedDate.toDateString();

                            return (
                                <div
                                    key={index}
                                    onClick={() => date && handleDateClick(date)}
                                    className={`aspect-square rounded-lg flex items-center justify-center cursor-pointer transition ${date ? 'hover:scale-110' : ''
                                        } ${isSelected ? 'ring-2 ring-purple-500' : ''
                                        } ${isToday ? 'ring-2 ring-yellow-500' : ''
                                        } ${date ? getSentimentColor(dayData) : 'bg-transparent'
                                        }`}
                                    style={{
                                        opacity: dayData ? Math.min(0.3 + (dayData.entries.length * 0.2), 1) : 0.3
                                    }}
                                >
                                    {date && (
                                        <span className="text-sm font-bold">
                                            {date.getDate()}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="flex justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-green-500 rounded"></div>
                                <span>Positive</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                <span>Negative</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                <span>Neutral</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected Date Details */}
                {selectedDate && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4">
                            {selectedDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </h2>

                        {selectedEntries.length > 0 ? (
                            <div className="space-y-4">
                                {selectedEntries.map((entry, index) => (
                                    <div key={index} className="p-4 bg-white/5 rounded-lg">
                                        {entry.title && (
                                            <h3 className="font-bold mb-2">{entry.title}</h3>
                                        )}
                                        <p className="text-gray-300 mb-2 line-clamp-3">
                                            {entry.content || entry.text}
                                        </p>
                                        <div className="flex gap-2 items-center text-sm">
                                            <span className={`px-2 py-1 rounded ${entry.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                                                    entry.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {entry.sentiment}
                                            </span>
                                            {entry.emotions && entry.emotions.length > 0 && (
                                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                                                    {entry.emotions[0].emotion}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">No entries for this day</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Calendar;
