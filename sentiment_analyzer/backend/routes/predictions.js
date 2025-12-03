import express from 'express';
import Journal from '../models/Journal.js';
import Analysis from '../models/Analysis.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Coping strategies by category
const COPING_STRATEGIES = {
    stress: [
        'Practice deep breathing: 4 seconds in, 7 seconds hold, 8 seconds out',
        'Take a 10-minute walk outside',
        'Write down 3 things you can control right now',
        'Try progressive muscle relaxation',
        'Listen to calming music or nature sounds'
    ],
    anxiety: [
        'Use the 5-4-3-2-1 grounding technique',
        'Challenge anxious thoughts with evidence',
        'Practice mindfulness meditation for 5 minutes',
        'Reach out to a trusted friend',
        'Engage in physical activity to release tension'
    ],
    sadness: [
        'Allow yourself to feel without judgment',
        'Do something kind for yourself',
        'Connect with someone who cares about you',
        'Engage in a hobby you enjoy',
        'Write about what you\'re grateful for'
    ],
    general: [
        'Maintain a regular sleep schedule',
        'Eat nutritious meals',
        'Limit caffeine and alcohol',
        'Practice self-compassion',
        'Set small, achievable goals for the day'
    ]
};

// Analyze day-of-week patterns
function analyzeDayPatterns(entries) {
    const dayStats = {
        0: { name: 'Sunday', positive: 0, negative: 0, neutral: 0, total: 0 },
        1: { name: 'Monday', positive: 0, negative: 0, neutral: 0, total: 0 },
        2: { name: 'Tuesday', positive: 0, negative: 0, neutral: 0, total: 0 },
        3: { name: 'Wednesday', positive: 0, negative: 0, neutral: 0, total: 0 },
        4: { name: 'Thursday', positive: 0, negative: 0, neutral: 0, total: 0 },
        5: { name: 'Friday', positive: 0, negative: 0, neutral: 0, total: 0 },
        6: { name: 'Saturday', positive: 0, negative: 0, neutral: 0, total: 0 }
    };

    entries.forEach(entry => {
        const day = new Date(entry.createdAt).getDay();
        dayStats[day][entry.sentiment]++;
        dayStats[day].total++;
    });

    // Calculate negative percentage for each day
    const dayRisks = Object.entries(dayStats).map(([day, stats]) => {
        const negativePercent = stats.total > 0 ? (stats.negative / stats.total) * 100 : 0;
        return {
            day: parseInt(day),
            name: stats.name,
            negativePercent,
            total: stats.total,
            stats
        };
    }).sort((a, b) => b.negativePercent - a.negativePercent);

    return dayRisks;
}

// Predict mood for upcoming days
router.get('/mood-forecast', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const daysToAnalyze = 60; // Analyze past 60 days for patterns
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToAnalyze);

        // Fetch historical entries
        const [journals, analyses] = await Promise.all([
            Journal.find({ userId, createdAt: { $gte: cutoffDate } }),
            Analysis.find({ userId, createdAt: { $gte: cutoffDate } })
        ]);

        const allEntries = [...journals, ...analyses];

        if (allEntries.length < 7) {
            return res.json({
                success: true,
                message: 'Not enough data for predictions. Keep journaling!',
                forecast: [],
                recommendations: COPING_STRATEGIES.general
            });
        }

        // Analyze day-of-week patterns
        const dayRisks = analyzeDayPatterns(allEntries);

        // Generate 7-day forecast
        const today = new Date();
        const forecast = [];

        for (let i = 0; i < 7; i++) {
            const forecastDate = new Date(today);
            forecastDate.setDate(today.getDate() + i);
            const dayOfWeek = forecastDate.getDay();
            const dayData = dayRisks.find(d => d.day === dayOfWeek);

            let riskLevel = 'low';
            let riskScore = dayData.negativePercent;

            if (riskScore >= 60) {
                riskLevel = 'high';
            } else if (riskScore >= 40) {
                riskLevel = 'medium';
            }

            forecast.push({
                date: forecastDate.toDateString(),
                dayName: dayData.name,
                riskLevel,
                riskScore: Math.round(riskScore),
                confidence: dayData.total >= 3 ? 'high' : dayData.total >= 1 ? 'medium' : 'low',
                historicalData: {
                    positive: dayData.stats.positive,
                    negative: dayData.stats.negative,
                    neutral: dayData.stats.neutral,
                    total: dayData.stats.total
                }
            });
        }

        // Identify high-risk days
        const highRiskDays = forecast.filter(f => f.riskLevel === 'high' || f.riskLevel === 'medium');

        // Generate personalized recommendations
        const recommendations = [];

        if (highRiskDays.length > 0) {
            recommendations.push(`You tend to have more difficult days on ${highRiskDays.map(d => d.dayName).join(', ')}`);
            recommendations.push('Plan extra self-care activities on these days');
            recommendations.push(...COPING_STRATEGIES.stress.slice(0, 2));
            recommendations.push(...COPING_STRATEGIES.anxiety.slice(0, 2));
        } else {
            recommendations.push('Your mood patterns look stable!');
            recommendations.push('Keep up your current self-care routine');
            recommendations.push(...COPING_STRATEGIES.general.slice(0, 3));
        }

        // Overall trend analysis
        const recentEntries = allEntries.slice(0, 14); // Last 2 weeks
        const recentNegativePercent = (recentEntries.filter(e => e.sentiment === 'negative').length / recentEntries.length) * 100;

        let trendMessage = 'Your mood has been relatively stable';
        if (recentNegativePercent > 60) {
            trendMessage = 'You\'ve been experiencing more challenges lately';
        } else if (recentNegativePercent < 30) {
            trendMessage = 'You\'ve been doing well recently!';
        }

        res.json({
            success: true,
            forecast,
            trend: {
                message: trendMessage,
                recentNegativePercent: Math.round(recentNegativePercent),
                period: '14 days'
            },
            recommendations,
            insights: {
                bestDay: dayRisks[dayRisks.length - 1].name,
                challengingDay: dayRisks[0].name,
                totalEntriesAnalyzed: allEntries.length,
                daysAnalyzed: daysToAnalyze
            }
        });
    } catch (error) {
        console.error('Error generating mood forecast:', error);
        res.status(500).json({ error: 'Error generating forecast' });
    }
});

// Get coping strategies based on current mood
router.get('/coping-strategies', authenticateToken, async (req, res) => {
    try {
        const { mood } = req.query; // stress, anxiety, sadness, general

        const strategies = COPING_STRATEGIES[mood] || COPING_STRATEGIES.general;

        res.json({
            success: true,
            mood: mood || 'general',
            strategies
        });
    } catch (error) {
        console.error('Error fetching coping strategies:', error);
        res.status(500).json({ error: 'Error fetching strategies' });
    }
});

export default router;
