import express from 'express';
import Analysis from '../models/Analysis.js';
import Journal from '../models/Journal.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Advanced search endpoint
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            query,
            sentiments = [],
            emotions = [],
            tags = [],
            dateFrom,
            dateTo,
            confidenceMin,
            confidenceMax,
            source // 'analysis', 'journal', or 'all'
        } = req.body;

        // Build query filters
        const filters = { userId };

        // Date range filter
        if (dateFrom || dateTo) {
            filters.createdAt = {};
            if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filters.createdAt.$lte = new Date(dateTo);
        }

        // Sentiment filter
        if (sentiments.length > 0) {
            filters.sentiment = { $in: sentiments };
        }

        // Confidence range filter
        if (confidenceMin !== undefined || confidenceMax !== undefined) {
            filters.confidence = {};
            if (confidenceMin !== undefined) filters.confidence.$gte = confidenceMin;
            if (confidenceMax !== undefined) filters.confidence.$lte = confidenceMax;
        }

        // Emotion filter
        if (emotions.length > 0) {
            filters['emotions.emotion'] = { $in: emotions };
        }

        // Tags filter
        if (tags.length > 0) {
            filters.tags = { $in: tags };
        }

        // Text search filter
        if (query && query.trim()) {
            filters.$or = [
                { text: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { title: { $regex: query, $options: 'i' } }
            ];
        }

        // Fetch from appropriate sources
        let results = [];

        if (!source || source === 'all' || source === 'analysis') {
            const analyses = await Analysis.find(filters)
                .sort({ createdAt: -1 })
                .limit(100);
            results.push(...analyses.map(a => ({ ...a.toObject(), source: 'analysis' })));
        }

        if (!source || source === 'all' || source === 'journal') {
            const journals = await Journal.find(filters)
                .sort({ createdAt: -1 })
                .limit(100);
            results.push(...journals.map(j => ({ ...j.toObject(), source: 'journal' })));
        }

        // Sort combined results by date
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Limit total results
        results = results.slice(0, 100);

        res.json({
            success: true,
            count: results.length,
            results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Error performing search' });
    }
});

// Get available filter options (for UI)
router.get('/filters', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get unique tags from both collections
        const [analyses, journals] = await Promise.all([
            Analysis.find({ userId }).distinct('tags'),
            Journal.find({ userId }).distinct('tags')
        ]);

        const allTags = [...new Set([...analyses, ...journals])].filter(Boolean);

        // Get unique emotions
        const [analysisEmotions, journalEmotions] = await Promise.all([
            Analysis.find({ userId }).distinct('emotions.emotion'),
            Journal.find({ userId }).distinct('emotions.emotion')
        ]);

        const allEmotions = [...new Set([...analysisEmotions, ...journalEmotions])].filter(Boolean);

        res.json({
            success: true,
            filters: {
                sentiments: ['positive', 'negative', 'neutral'],
                emotions: allEmotions,
                tags: allTags,
                sources: ['all', 'analysis', 'journal']
            }
        });
    } catch (error) {
        console.error('Error fetching filters:', error);
        res.status(500).json({ error: 'Error fetching filter options' });
    }
});

export default router;
