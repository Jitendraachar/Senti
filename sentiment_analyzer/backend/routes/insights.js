import express from 'express';
import Analysis from '../models/Analysis.js';
import Journal from '../models/Journal.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get weekly AI-generated insights
router.get('/weekly', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Fetch all analyses and journals from the past week
        const [analyses, journals] = await Promise.all([
            Analysis.find({ userId, createdAt: { $gte: weekAgo } }),
            Journal.find({ userId, createdAt: { $gte: weekAgo } })
        ]);

        const allEntries = [...analyses, ...journals];

        if (allEntries.length === 0) {
            return res.json({
                success: true,
                insights: {
                    summary: 'Not enough data yet. Start journaling to see insights!',
                    totalEntries: 0,
                    patterns: [],
                    recommendations: []
                }
            });
        }

        // Calculate sentiment distribution
        const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
        allEntries.forEach(entry => {
            sentimentCounts[entry.sentiment]++;
        });

        // Calculate emotion distribution
        const emotionCounts = {};
        allEntries.forEach(entry => {
            if (entry.emotions && entry.emotions.length > 0) {
                entry.emotions.forEach(e => {
                    emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
                });
            }
        });

        // Find dominant emotion
        const dominantEmotion = Object.entries(emotionCounts)
            .sort((a, b) => b[1] - a[1])[0];

        // Analyze patterns by day of week
        const dayPatterns = {};
        allEntries.forEach(entry => {
            const day = new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'long' });
            if (!dayPatterns[day]) {
                dayPatterns[day] = { positive: 0, negative: 0, neutral: 0, total: 0 };
            }
            dayPatterns[day][entry.sentiment]++;
            dayPatterns[day].total++;
        });

        // Find best and worst days
        let bestDay = null;
        let worstDay = null;
        let maxPositiveRatio = 0;
        let maxNegativeRatio = 0;

        Object.entries(dayPatterns).forEach(([day, counts]) => {
            const positiveRatio = counts.positive / counts.total;
            const negativeRatio = counts.negative / counts.total;

            if (positiveRatio > maxPositiveRatio) {
                maxPositiveRatio = positiveRatio;
                bestDay = day;
            }
            if (negativeRatio > maxNegativeRatio) {
                maxNegativeRatio = negativeRatio;
                worstDay = day;
            }
        });

        // Generate insights summary
        const totalPositive = sentimentCounts.positive;
        const totalNegative = sentimentCounts.negative;
        const totalNeutral = sentimentCounts.neutral;
        const total = allEntries.length;

        let summary = '';
        if (totalPositive > totalNegative + totalNeutral) {
            summary = `Great week! You had ${totalPositive} positive entries (${Math.round(totalPositive / total * 100)}%). Keep up the positive momentum!`;
        } else if (totalNegative > totalPositive) {
            summary = `This week was challenging with ${totalNegative} negative entries. Remember, it's okay to have difficult days. Consider reaching out for support.`;
        } else {
            summary = `Balanced week with a mix of emotions. You had ${totalPositive} positive and ${totalNegative} negative entries.`;
        }

        // Generate patterns
        const patterns = [];
        if (bestDay && maxPositiveRatio > 0.6) {
            patterns.push(`You tend to feel best on ${bestDay}s`);
        }
        if (worstDay && maxNegativeRatio > 0.6) {
            patterns.push(`${worstDay}s seem to be more challenging for you`);
        }
        if (dominantEmotion && dominantEmotion[1] > 3) {
            patterns.push(`${dominantEmotion[0]} was your most frequent emotion this week`);
        }

        // Generate recommendations
        const recommendations = [];
        if (totalNegative > totalPositive) {
            recommendations.push('Consider scheduling activities you enjoy on difficult days');
            recommendations.push('Practice self-care routines to boost your mood');
            recommendations.push('Connect with friends or loved ones for support');
        } else {
            recommendations.push('Continue your positive habits and routines');
            recommendations.push('Share your positivity with others');
            recommendations.push('Document what\'s working well for you');
        }

        res.json({
            success: true,
            insights: {
                summary,
                totalEntries: total,
                sentimentBreakdown: {
                    positive: totalPositive,
                    negative: totalNegative,
                    neutral: totalNeutral
                },
                dominantEmotion: dominantEmotion ? dominantEmotion[0] : null,
                patterns,
                recommendations,
                bestDay,
                worstDay
            }
        });
    } catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({ error: 'Error generating insights' });
    }
});

// Get pattern analysis
router.get('/patterns', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [analyses, journals] = await Promise.all([
            Analysis.find({ userId, createdAt: { $gte: startDate } }),
            Journal.find({ userId, createdAt: { $gte: startDate } })
        ]);

        const allEntries = [...analyses, ...journals];

        // Analyze time of day patterns (if metadata available)
        const timePatterns = {
            morning: { positive: 0, negative: 0, neutral: 0 },
            afternoon: { positive: 0, negative: 0, neutral: 0 },
            evening: { positive: 0, negative: 0, neutral: 0 }
        };

        allEntries.forEach(entry => {
            if (entry.metadata && entry.metadata.timeOfDay) {
                timePatterns[entry.metadata.timeOfDay][entry.sentiment]++;
            }
        });

        // Extract common words from positive and negative entries
        const positiveTexts = allEntries.filter(e => e.sentiment === 'positive').map(e => e.text || e.content).join(' ');
        const negativeTexts = allEntries.filter(e => e.sentiment === 'negative').map(e => e.text || e.content).join(' ');

        res.json({
            success: true,
            patterns: {
                timeOfDay: timePatterns,
                totalAnalyzed: allEntries.length
            }
        });
    } catch (error) {
        console.error('Error analyzing patterns:', error);
        res.status(500).json({ error: 'Error analyzing patterns' });
    }
});

export default router;
