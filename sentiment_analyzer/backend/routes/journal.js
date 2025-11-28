import express from 'express';
import { pipeline } from '@xenova/transformers';
import Journal from '../models/Journal.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Shared sentiment analysis pipeline
let sentimentPipeline = null;

async function getSentimentPipeline() {
    if (!sentimentPipeline) {
        console.log('Loading sentiment analysis model...');
        sentimentPipeline = await pipeline('sentiment-analysis');
        console.log('Model loaded successfully!');
    }
    return sentimentPipeline;
}

// Generate suggestions based on sentiment
function generateSuggestions(sentiment, confidence) {
    const suggestions = [];

    if (sentiment === 'positive') {
        suggestions.push('Wonderful entry! Reflect on what made today special.');
        suggestions.push('Consider sharing your positive experience with someone.');
        suggestions.push('Keep this momentum going tomorrow!');
        if (confidence > 0.9) {
            suggestions.push('Your joy is evident! Document the details to revisit later.');
        }
    } else if (sentiment === 'negative') {
        suggestions.push('Thank you for expressing your feelings. Writing helps process emotions.');
        suggestions.push('Consider what small step could improve your situation.');
        suggestions.push('Remember: difficult moments are temporary.');
        suggestions.push('Practice self-compassion and be gentle with yourself.');
        if (confidence > 0.8) {
            suggestions.push('If you\'re struggling, reach out to someone you trust.');
        }
    } else {
        suggestions.push('Reflection is valuable regardless of mood.');
        suggestions.push('Notice the small moments that brought you peace today.');
        suggestions.push('Continue this healthy habit of journaling.');
    }

    return suggestions;
}

// Analyze sentiment for journal content
async function analyzeSentiment(text) {
    const classifier = await getSentimentPipeline();
    const result = await classifier(text);

    const sentimentLabel = result[0].label.toLowerCase();
    const confidence = result[0].score;

    let sentiment = 'neutral';

    // If confidence is low, classify as neutral
    if (confidence < 0.65) {
        sentiment = 'neutral';
    } else if (sentimentLabel.includes('pos')) {
        sentiment = 'positive';
    } else if (sentimentLabel.includes('neg')) {
        sentiment = 'negative';
    }

    const suggestions = generateSuggestions(sentiment, confidence);

    return { sentiment, confidence, suggestions };
}

// Create new journal entry
router.post('/journals', authenticateToken, async (req, res) => {
    try {
        const { title, content, tags, mood } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        // Analyze sentiment of the journal content
        const { sentiment, confidence, suggestions } = await analyzeSentiment(content);

        // Create journal entry
        const journal = new Journal({
            userId: req.user.userId,
            title: title.trim(),
            content,
            sentiment,
            confidence,
            suggestions,
            tags: tags || [],
            mood: mood || 'neutral'
        });

        await journal.save();

        res.status(201).json({
            success: true,
            journal: {
                id: journal._id,
                title: journal.title,
                content: journal.content,
                sentiment: journal.sentiment,
                confidence: Math.round(confidence * 100) / 100,
                suggestions: journal.suggestions,
                tags: journal.tags,
                mood: journal.mood,
                createdAt: journal.createdAt,
                updatedAt: journal.updatedAt
            }
        });
    } catch (error) {
        console.error('Journal creation error:', error);
        res.status(500).json({ error: 'Error creating journal entry' });
    }
});

// Get all journals for user with pagination and filtering
router.get('/journals', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const sentiment = req.query.sentiment;
        const tag = req.query.tag;
        const search = req.query.search;

        // Build query
        const query = { userId: req.user.userId };

        if (sentiment) {
            query.sentiment = sentiment;
        }

        if (tag) {
            query.tags = tag;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await Journal.countDocuments(query);

        // Get journals
        const journals = await Journal.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-userId');

        res.json({
            success: true,
            journals,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Journals fetch error:', error);
        res.status(500).json({ error: 'Error fetching journals' });
    }
});

// Get single journal entry
router.get('/journals/:id', authenticateToken, async (req, res) => {
    try {
        const journal = await Journal.findOne({
            _id: req.params.id,
            userId: req.user.userId
        }).select('-userId');

        if (!journal) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        res.json({
            success: true,
            journal
        });
    } catch (error) {
        console.error('Journal fetch error:', error);
        res.status(500).json({ error: 'Error fetching journal entry' });
    }
});

// Update journal entry
router.put('/journals/:id', authenticateToken, async (req, res) => {
    try {
        const { title, content, tags, mood } = req.body;

        // Find journal
        const journal = await Journal.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!journal) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        // Update fields
        if (title) journal.title = title.trim();
        if (content) {
            journal.content = content;
            // Re-analyze sentiment if content changed
            const { sentiment, confidence, suggestions } = await analyzeSentiment(content);
            journal.sentiment = sentiment;
            journal.confidence = confidence;
            journal.suggestions = suggestions;
        }
        if (tags !== undefined) journal.tags = tags;
        if (mood) journal.mood = mood;

        await journal.save();

        res.json({
            success: true,
            journal: {
                id: journal._id,
                title: journal.title,
                content: journal.content,
                sentiment: journal.sentiment,
                confidence: Math.round(journal.confidence * 100) / 100,
                suggestions: journal.suggestions,
                tags: journal.tags,
                mood: journal.mood,
                createdAt: journal.createdAt,
                updatedAt: journal.updatedAt
            }
        });
    } catch (error) {
        console.error('Journal update error:', error);
        res.status(500).json({ error: 'Error updating journal entry' });
    }
});

// Delete journal entry
router.delete('/journals/:id', authenticateToken, async (req, res) => {
    try {
        const journal = await Journal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!journal) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        res.json({
            success: true,
            message: 'Journal entry deleted successfully'
        });
    } catch (error) {
        console.error('Journal delete error:', error);
        res.status(500).json({ error: 'Error deleting journal entry' });
    }
});

// Get journal statistics
router.get('/journals/stats/summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Total journals
        const total = await Journal.countDocuments({ userId });

        // Sentiment distribution
        const sentimentStats = await Journal.aggregate([
            { $match: { userId: userId } },
            { $group: { _id: '$sentiment', count: { $sum: 1 } } }
        ]);

        // Recent journals
        const recent = await Journal.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title sentiment createdAt');

        res.json({
            success: true,
            stats: {
                total,
                sentimentDistribution: sentimentStats,
                recentJournals: recent
            }
        });
    } catch (error) {
        console.error('Journal stats error:', error);
        res.status(500).json({ error: 'Error fetching journal statistics' });
    }
});

export default router;
