import express from 'express';
import mongoose from 'mongoose';
import Analysis from '../models/Analysis.js';
import Journal from '../models/Journal.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.userId);

        // Get total analyses count
        const totalAnalyses = await Analysis.countDocuments({ userId });

        // Get total journals count
        const totalJournals = await Journal.countDocuments({ userId });

        // Get sentiment distribution from analyses
        const sentimentCounts = await Analysis.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$sentiment', count: { $sum: 1 } } }
        ]);

        // Get sentiment distribution from journals
        const journalSentimentCounts = await Journal.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$sentiment', count: { $sum: 1 } } }
        ]);

        const sentimentDistribution = {
            positive: 0,
            negative: 0,
            neutral: 0
        };

        sentimentCounts.forEach(item => {
            sentimentDistribution[item._id] = item.count;
        });

        journalSentimentCounts.forEach(item => {
            sentimentDistribution[item._id] += item.count;
        });

        // Get average confidence
        const avgConfidence = await Analysis.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } }
        ]);

        // Get recent trend (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentAnalyses = await Analysis.find({
            userId,
            createdAt: { $gte: sevenDaysAgo }
        }).sort({ createdAt: 1 });

        // Group by day
        const trendData = {};
        recentAnalyses.forEach(analysis => {
            const date = analysis.createdAt.toISOString().split('T')[0];
            if (!trendData[date]) {
                trendData[date] = { positive: 0, negative: 0, neutral: 0, total: 0 };
            }
            trendData[date][analysis.sentiment]++;
            trendData[date].total++;
        });

        // Convert to array format
        const trend = Object.keys(trendData).map(date => ({
            date,
            ...trendData[date]
        }));

        res.json({
            success: true,
            stats: {
                totalAnalyses,
                totalJournals,
                sentimentDistribution,
                averageConfidence: avgConfidence[0]?.avgConfidence || 0,
                trend
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Error fetching statistics' });
    }
});

// Get sentiment trend over time
router.get('/trend', authenticateToken, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.userId);
        const days = parseInt(req.query.days) || 14;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const analyses = await Analysis.find({
            userId,
            createdAt: { $gte: startDate }
        }).sort({ createdAt: 1 });

        // Create daily sentiment scores
        const dailyData = {};

        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            const dateStr = date.toISOString().split('T')[0];
            dailyData[dateStr] = {
                date: dateStr,
                positive: 0,
                negative: 0,
                neutral: 0,
                score: 0,
                count: 0
            };
        }

        // Populate with actual data
        analyses.forEach(analysis => {
            const dateStr = analysis.createdAt.toISOString().split('T')[0];
            if (dailyData[dateStr]) {
                dailyData[dateStr][analysis.sentiment]++;
                dailyData[dateStr].count++;

                // Calculate sentiment score (-1 to 1)
                const sentimentValue = analysis.sentiment === 'positive' ? 1 :
                    analysis.sentiment === 'negative' ? -1 : 0;
                dailyData[dateStr].score += sentimentValue * analysis.confidence;
            }
        });

        // Calculate average scores
        Object.keys(dailyData).forEach(date => {
            if (dailyData[date].count > 0) {
                dailyData[date].score = dailyData[date].score / dailyData[date].count;
            }
        });

        const trendData = Object.values(dailyData);

        res.json({
            success: true,
            trend: trendData
        });
    } catch (error) {
        console.error('Trend error:', error);
        res.status(500).json({ error: 'Error fetching trend data' });
    }
});

export default router;
