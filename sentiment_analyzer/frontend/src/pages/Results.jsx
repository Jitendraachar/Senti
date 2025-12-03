import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function Results() {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [publicationMode, setPublicationMode] = useState(false);
    const [exportFormat, setExportFormat] = useState('png');
    const [resolution, setResolution] = useState(2); // 1x, 2x, 3x
    const navigate = useNavigate();

    // Refs for chart containers
    const comparisonChartRef = useRef(null);
    const accuracyChartRef = useRef(null);
    const trendChartRef = useRef(null);
    const distributionChartRef = useRef(null);
    const confidenceChartRef = useRef(null);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/results/comprehensive', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(response.data.results);
        } catch (err) {
            console.error('Error fetching results:', err);
            alert('Error loading results data');
        } finally {
            setLoading(false);
        }
    };

    const exportChart = async (chartRef, filename) => {
        if (!chartRef.current) return;

        try {
            const canvas = await html2canvas(chartRef.current, {
                scale: resolution,
                backgroundColor: publicationMode ? '#ffffff' : '#1a1a2e'
            });

            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Export error:', error);
            alert('Error exporting chart');
        }
    };

    const exportAllCharts = async () => {
        await exportChart(comparisonChartRef, 'model_comparison');
        await exportChart(accuracyChartRef, 'accuracy_by_sentiment');
        await exportChart(trendChartRef, 'temporal_trend');
        await exportChart(distributionChartRef, 'sentiment_distribution');
        await exportChart(confidenceChartRef, 'confidence_distribution');
    };

    const exportCSV = () => {
        if (!results) return;

        const csvData = results.temporal.dailyTrend.map(day => ({
            Date: day.date,
            Positive: day.positive,
            Negative: day.negative,
            Neutral: day.neutral,
            'Avg Confidence': day.avgConfidence.toFixed(3),
            'Sentiment Score': day.sentimentScore.toFixed(3),
            'Total Count': day.count
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.download = 'sentiment_analysis_results.csv';
        link.href = URL.createObjectURL(blob);
        link.click();
    };

    const exportJSON = () => {
        if (!results) return;

        const json = JSON.stringify(results, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = 'sentiment_analysis_results.json';
        link.href = URL.createObjectURL(blob);
        link.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-pulse">📊</div>
                    <p className="text-xl text-gray-300">Loading results...</p>
                </div>
            </div>
        );
    }

    if (!results || results.overview.totalAnalyses === 0) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-7xl mx-auto">
                    <Link to="/dashboard" className="btn-secondary mb-4 inline-block">← Back to Dashboard</Link>
                    <div className="card text-center">
                        <div className="text-6xl mb-4">📊</div>
                        <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
                        <p className="text-gray-300 mb-4">Create some analyses or journal entries to generate results.</p>
                        <Link to="/analyzer" className="btn-primary">Start Analyzing</Link>
                    </div>
                </div>
            </div>
        );
    }

    const bgColor = publicationMode ? '#ffffff' : 'rgba(255, 255, 255, 0.05)';
    const textColor = publicationMode ? '#000000' : '#ffffff';
    const gridColor = publicationMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';

    // Model Comparison Chart
    const comparisonData = {
        labels: results.modelPerformance.comparison.labels,
        datasets: [{
            label: 'Accuracy',
            data: results.modelPerformance.comparison.accuracy,
            backgroundColor: ['#94a3b8', '#10b981'],
            borderColor: ['#64748b', '#059669'],
            borderWidth: 2
        }]
    };

    // Accuracy by Sentiment Chart
    const accuracyData = {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [
            {
                label: 'Baseline',
                data: [
                    results.modelPerformance.comparison.precision.positive[0],
                    results.modelPerformance.comparison.precision.negative[0],
                    results.modelPerformance.comparison.precision.neutral[0]
                ],
                backgroundColor: 'rgba(148, 163, 184, 0.7)',
                borderColor: '#94a3b8',
                borderWidth: 2
            },
            {
                label: 'RoBERTa (Ours)',
                data: [
                    results.modelPerformance.comparison.precision.positive[1],
                    results.modelPerformance.comparison.precision.negative[1],
                    results.modelPerformance.comparison.precision.neutral[1]
                ],
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: '#10b981',
                borderWidth: 2
            }
        ]
    };

    // Temporal Trend Line Chart
    const trendData = {
        labels: results.temporal.dailyTrend.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [
            {
                label: 'Sentiment Score',
                data: results.temporal.dailyTrend.map(d => d.sentimentScore),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            },
            {
                label: 'Avg Confidence',
                data: results.temporal.dailyTrend.map(d => d.avgConfidence),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }
        ]
    };

    // Sentiment Distribution Pie Chart
    const distributionData = {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [{
            data: [
                results.overview.sentimentDistribution.positive,
                results.overview.sentimentDistribution.negative,
                results.overview.sentimentDistribution.neutral
            ],
            backgroundColor: ['#10b981', '#ef4444', '#3b82f6'],
            borderColor: publicationMode ? '#ffffff' : '#1a1a2e',
            borderWidth: 2
        }]
    };

    // Confidence Distribution Bar Chart
    const confidenceData = {
        labels: results.confidence.distribution.map(d => d.range),
        datasets: [{
            label: 'Frequency',
            data: results.confidence.distribution.map(d => d.count),
            backgroundColor: '#a855f7',
            borderColor: '#9333ea',
            borderWidth: 2
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    font: { family: publicationMode ? 'Times New Roman, serif' : 'inherit' }
                }
            },
            title: {
                color: textColor,
                font: { family: publicationMode ? 'Times New Roman, serif' : 'inherit' }
            }
        },
        scales: {
            y: {
                ticks: {
                    color: textColor,
                    font: { family: publicationMode ? 'Times New Roman, serif' : 'inherit' }
                },
                grid: { color: gridColor }
            },
            x: {
                ticks: {
                    color: textColor,
                    font: { family: publicationMode ? 'Times New Roman, serif' : 'inherit' }
                },
                grid: { color: gridColor }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    font: { family: publicationMode ? 'Times New Roman, serif' : 'inherit' }
                }
            }
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8" style={publicationMode ? { backgroundColor: '#f5f5f5' } : {}}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Link to="/dashboard" className="btn-secondary mb-4 inline-block">← Back</Link>
                        <h1 className="text-4xl font-bold text-gradient">Publication Results</h1>
                        <p className="text-gray-300 mt-2">Export-ready comparison graphs and statistics</p>
                    </div>
                </div>

                {/* Export Controls */}
                <div className="card mb-8">
                    <h2 className="text-2xl font-bold mb-4">Export Settings</h2>
                    <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Publication Mode</label>
                            <button
                                onClick={() => setPublicationMode(!publicationMode)}
                                className={`w-full px-4 py-2 rounded-lg transition ${publicationMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                                    }`}
                            >
                                {publicationMode ? '✓ Enabled' : 'Disabled'}
                            </button>
                            <p className="text-xs text-gray-400 mt-1">White background, serif fonts</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Resolution</label>
                            <select
                                value={resolution}
                                onChange={(e) => setResolution(Number(e.target.value))}
                                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20"
                            >
                                <option value={1}>Standard (1x)</option>
                                <option value={2}>High (2x - 300 DPI)</option>
                                <option value={3}>Ultra (3x - 600 DPI)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Quick Export</label>
                            <button onClick={exportAllCharts} className="btn-primary w-full">
                                📊 Export All Charts
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Data Export</label>
                            <div className="flex gap-2">
                                <button onClick={exportCSV} className="btn-secondary flex-1">CSV</button>
                                <button onClick={exportJSON} className="btn-secondary flex-1">JSON</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="card text-center" style={publicationMode ? { backgroundColor: bgColor, color: textColor } : {}}>
                        <div className="text-3xl mb-2">📊</div>
                        <div className="text-2xl font-bold">{results.overview.totalAnalyses}</div>
                        <div className="text-sm opacity-70">Total Analyses</div>
                    </div>
                    <div className="card text-center" style={publicationMode ? { backgroundColor: bgColor, color: textColor } : {}}>
                        <div className="text-3xl mb-2">🎯</div>
                        <div className="text-2xl font-bold">{(results.modelPerformance.accuracy * 100).toFixed(1)}%</div>
                        <div className="text-sm opacity-70">Model Accuracy</div>
                    </div>
                    <div className="card text-center" style={publicationMode ? { backgroundColor: bgColor, color: textColor } : {}}>
                        <div className="text-3xl mb-2">📈</div>
                        <div className="text-2xl font-bold text-green-400">+{results.modelPerformance.improvement}%</div>
                        <div className="text-sm opacity-70">vs Baseline</div>
                    </div>
                    <div className="card text-center" style={publicationMode ? { backgroundColor: bgColor, color: textColor } : {}}>
                        <div className="text-3xl mb-2">✨</div>
                        <div className="text-2xl font-bold">{(results.confidence.mean * 100).toFixed(1)}%</div>
                        <div className="text-sm opacity-70">Avg Confidence</div>
                    </div>
                </div>

                {/* Model Comparison Chart */}
                <div className="card mb-8" style={publicationMode ? { backgroundColor: bgColor } : {}}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold" style={publicationMode ? { color: textColor } : {}}>
                            Model Comparison: Baseline vs RoBERTa
                        </h2>
                        <button onClick={() => exportChart(comparisonChartRef, 'model_comparison')} className="btn-secondary">
                            💾 Export
                        </button>
                    </div>
                    <div ref={comparisonChartRef} className="h-80 p-4">
                        <Bar data={comparisonData} options={chartOptions} />
                    </div>
                </div>

                {/* Accuracy by Sentiment */}
                <div className="card mb-8" style={publicationMode ? { backgroundColor: bgColor } : {}}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold" style={publicationMode ? { color: textColor } : {}}>
                            Accuracy by Sentiment Class
                        </h2>
                        <button onClick={() => exportChart(accuracyChartRef, 'accuracy_by_sentiment')} className="btn-secondary">
                            💾 Export
                        </button>
                    </div>
                    <div ref={accuracyChartRef} className="h-80 p-4">
                        <Bar data={accuracyData} options={chartOptions} />
                    </div>
                </div>

                {/* Temporal Trend */}
                <div className="card mb-8" style={publicationMode ? { backgroundColor: bgColor } : {}}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold" style={publicationMode ? { color: textColor } : {}}>
                            Temporal Analysis: Sentiment & Confidence Trends
                        </h2>
                        <button onClick={() => exportChart(trendChartRef, 'temporal_trend')} className="btn-secondary">
                            💾 Export
                        </button>
                    </div>
                    <div ref={trendChartRef} className="h-80 p-4">
                        <Line data={trendData} options={chartOptions} />
                    </div>
                </div>

                {/* Distribution Charts */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div className="card" style={publicationMode ? { backgroundColor: bgColor } : {}}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold" style={publicationMode ? { color: textColor } : {}}>
                                Sentiment Distribution
                            </h2>
                            <button onClick={() => exportChart(distributionChartRef, 'sentiment_distribution')} className="btn-secondary">
                                💾 Export
                            </button>
                        </div>
                        <div ref={distributionChartRef} className="h-80 p-4">
                            <Pie data={distributionData} options={pieOptions} />
                        </div>
                    </div>

                    <div className="card" style={publicationMode ? { backgroundColor: bgColor } : {}}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold" style={publicationMode ? { color: textColor } : {}}>
                                Confidence Score Distribution
                            </h2>
                            <button onClick={() => exportChart(confidenceChartRef, 'confidence_distribution')} className="btn-secondary">
                                💾 Export
                            </button>
                        </div>
                        <div ref={confidenceChartRef} className="h-80 p-4">
                            <Bar data={confidenceData} options={chartOptions} />
                        </div>
                    </div>
                </div>

                {/* Detailed Statistics */}
                <div className="card" style={publicationMode ? { backgroundColor: bgColor, color: textColor } : {}}>
                    <h2 className="text-2xl font-bold mb-4">Detailed Statistics</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <h3 className="font-bold mb-2">Confidence Metrics</h3>
                            <ul className="space-y-1 text-sm">
                                <li>Mean: {(results.confidence.mean * 100).toFixed(2)}%</li>
                                <li>Median: {(results.confidence.median * 100).toFixed(2)}%</li>
                                <li>Std Dev: {(results.confidence.stdDev * 100).toFixed(2)}%</li>
                                <li>Min: {(results.confidence.min * 100).toFixed(2)}%</li>
                                <li>Max: {(results.confidence.max * 100).toFixed(2)}%</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold mb-2">Sentiment Breakdown</h3>
                            <ul className="space-y-1 text-sm">
                                <li>Positive: {results.overview.sentimentPercentages.positive}%</li>
                                <li>Negative: {results.overview.sentimentPercentages.negative}%</li>
                                <li>Neutral: {results.overview.sentimentPercentages.neutral}%</li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold mb-2">Data Sources</h3>
                            <ul className="space-y-1 text-sm">
                                <li>Quick Analyses: {results.overview.quickAnalyses}</li>
                                <li>Journal Entries: {results.overview.journalEntries}</li>
                                <li>Total: {results.overview.totalAnalyses}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Results;
