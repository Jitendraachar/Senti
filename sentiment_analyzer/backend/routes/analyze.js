import express from 'express';
import { pipeline } from '@xenova/transformers';
import Analysis from '../models/Analysis.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Initialize sentiment analysis pipeline (lazy loading)
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
        suggestions.push('Great mindset! Keep up the positive energy.');
        suggestions.push('Share your positivity with others today.');
        suggestions.push('Document what made you feel good to repeat it.');
        if (confidence > 0.9) {
            suggestions.push('Your enthusiasm is contagious! Consider mentoring someone.');
        }
    } else if (sentiment === 'negative') {
        suggestions.push('Take a short break and practice deep breathing.');
        suggestions.push('Try writing down what\'s bothering you to gain clarity.');
        suggestions.push('Reach out to a friend or loved one for support.');
        suggestions.push('Consider a short walk or light exercise to boost your mood.');
        if (confidence > 0.8) {
            suggestions.push('If these feelings persist, consider talking to a professional.');
        }
    } else {
        suggestions.push('Maintain balance in your daily routine.');
        suggestions.push('Set small, achievable goals for today.');
        suggestions.push('Practice gratitude by noting three positive things.');
    }

    return suggestions;
}

// Analyze text sentiment
router.post('/analyze', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required for analysis' });
        }

        // Get sentiment pipeline
        const classifier = await getSentimentPipeline();

        // Perform sentiment analysis
        const result = await classifier(text);

        // Extract sentiment and confidence
        const sentimentLabel = result[0].label.toLowerCase();
        const confidence = result[0].score;

        // Map labels to our format
        let sentiment = 'neutral';
        if (sentimentLabel.includes('pos')) {
            sentiment = 'positive';
        } else if (sentimentLabel.includes('neg')) {
            sentiment = 'negative';
        }

        // Generate suggestions
        const suggestions = generateSuggestions(sentiment, confidence);

        // Save analysis to database
        const analysis = new Analysis({
            userId: req.user.userId,
            text,
            sentiment,
            confidence,
            suggestions
        });

        await analysis.save();

        res.json({
            success: true,
            analysis: {
                id: analysis._id,
                text,
                sentiment,
                confidence: Math.round(confidence * 100) / 100,
                suggestions,
                createdAt: analysis.createdAt
            }
        });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Error analyzing sentiment' });
    }
});

// Get user's analysis history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const analyses = await Analysis.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('-userId');

        res.json({
            success: true,
            count: analyses.length,
            analyses
        });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ error: 'Error fetching analysis history' });
    }
});

export default router;
