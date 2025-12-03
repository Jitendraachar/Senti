import express from 'express';
import { pipeline } from '@xenova/transformers';
import Analysis from '../models/Analysis.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

let sentimentPipeline = null;

async function getSentimentPipeline() {
    if (!sentimentPipeline) {
        console.log('\n🔄 ========== LOADING SENTIMENT MODEL ==========');
        console.log('Model: distilbert-sst-2-english');
        console.log('This will download ~250MB on first use...');
        console.log('Please wait 1-2 minutes...\n');

        sentimentPipeline = await pipeline(
            'sentiment-analysis',
            'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
        );

        console.log('✅ ========== MODEL LOADED SUCCESSFULLY ==========\n');
    }
    return sentimentPipeline;
}

// Analyze route
router.post('/analyze', authenticateToken, async (req, res) => {
    console.log('\n📝 === ANALYZE REQUEST ===');
    console.log('User:', req.user?.userId);
    console.log('Text length:', req.body?.text?.length);

    try {
        const { text } = req.body;

        if (!text || text.trim().length === 0) {
            console.log('❌ No text provided');
            return res.status(400).json({ error: 'Text is required for analysis' });
        }

        console.log('Getting pipeline...');
        const classifier = await getSentimentPipeline();

        console.log('Running analysis...');
        const result = await classifier(text);

        console.log('Result:', result);

        const sentiment = result[0].label.toLowerCase();
        const confidence = result[0].score;

        const suggestions = [];
        if (sentiment === 'POSITIVE') {
            suggestions.push('Great mindset! Keep up the positive energy.');
            suggestions.push('Share your positivity with others today.');
        } else {
            suggestions.push('Take time for self-care.');
            suggestions.push('Consider talking to someone you trust.');
        }

        const now = new Date();
        const metadata = {
            timeOfDay: now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening',
            dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
            wordCount: text.split(/\s+/).length
        };

        const analysis = new Analysis({
            userId: req.user.userId,
            text,
            sentiment,
            confidence,
            emotions: [],
            suggestions,
            metadata
        });

        await analysis.save();
        console.log('✅ Analysis saved to database');

        res.json({
            success: true,
            analysis: {
                id: analysis._id,
                text,
                sentiment,
                confidence: Math.round(confidence * 100) / 100,
                emotions: [],
                suggestions,
                metadata,
                createdAt: analysis.createdAt
            }
        });

        console.log('✅ Response sent\n');
    } catch (error) {
        console.error('\n❌ ========== ERROR ==========');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('================================\n');
        res.status(500).json({ error: 'Error analyzing sentiment: ' + error.message });
    }
});

// Get history
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

