import express from 'express';
import { pipeline } from '@xenova/transformers';
import Analysis from '../models/Analysis.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Initialize sentiment analysis pipeline (lazy loading)
let sentimentPipeline = null;
let emotionPipeline = null;

async function getSentimentPipeline() {
    if (!sentimentPipeline) {
        console.log('Loading 3-class sentiment analysis model...');
        // Use model that supports positive, neutral, and negative
        sentimentPipeline = await pipeline(
            'sentiment-analysis',
            'Xenova/twitter-roberta-base-sentiment-latest'
        );
        console.log('3-class sentiment model loaded successfully!');
    }
    return sentimentPipeline;
}

async function getEmotionPipeline() {
    if (!emotionPipeline) {
        console.log('Loading emotion detection model...');
        emotionPipeline = await pipeline(
            'text-classification',
            'Xenova/distilbert-base-uncased-emotion'
        );
        console.log('Emotion detection model loaded successfully!');
    }
    return emotionPipeline;
}

// Generate suggestions based on sentiment and emotions
function generateSuggestions(sentiment, confidence, emotions = []) {
    const suggestions = [];

    // Get dominant emotion if available
    const dominantEmotion = emotions.length > 0 ? emotions[0].emotion : null;

    if (sentiment === 'positive') {
        suggestions.push('Great mindset! Keep up the positive energy.');
        suggestions.push('Share your positivity with others today.');
        suggestions.push('Document what made you feel good to repeat it.');
        if (confidence > 0.9) {
            suggestions.push('Your enthusiasm is contagious! Consider mentoring someone.');
        }
        if (dominantEmotion === 'joy') {
            suggestions.push('Celebrate this moment! Consider doing something special.');
        } else if (dominantEmotion === 'love') {
            suggestions.push('Express your appreciation to those who matter to you.');
        }
    } else if (sentiment === 'negative') {
        suggestions.push('Take a short break and practice deep breathing.');
        suggestions.push('Try writing down what\'s bothering you to gain clarity.');
        suggestions.push('Reach out to a friend or loved one for support.');
        suggestions.push('Consider a short walk or light exercise to boost your mood.');
        if (confidence > 0.8) {
            suggestions.push('If these feelings persist, consider talking to a professional.');
        }
        if (dominantEmotion === 'sadness') {
            suggestions.push('It\'s okay to feel sad. Allow yourself to process these emotions.');
            suggestions.push('Try listening to uplifting music or watching something comforting.');
        } else if (dominantEmotion === 'anger') {
            suggestions.push('Take a moment to cool down before reacting.');
            suggestions.push('Physical activity can help release tension and anger.');
        } else if (dominantEmotion === 'fear') {
            suggestions.push('Identify what\'s causing the fear and break it down into manageable parts.');
            suggestions.push('Practice grounding techniques to stay present.');
        }
    } else {
        suggestions.push('Maintain balance in your daily routine.');
        suggestions.push('Set small, achievable goals for today.');
        suggestions.push('Practice gratitude by noting three positive things.');
        if (dominantEmotion === 'surprise') {
            suggestions.push('Embrace the unexpected and stay curious.');
        }
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

        // Debug logging
        console.log('=== QUICK ANALYSIS DEBUG ===');
        console.log('Text:', text.substring(0, 100) + '...');
        console.log('Model Label:', sentimentLabel);
        console.log('Model Confidence:', confidence);

        // The 3-class model returns: 'positive', 'neutral', or 'negative'
        // Map to our format (handle variations in label naming)
        let sentiment = 'neutral';
        if (sentimentLabel.includes('pos')) {
            sentiment = 'positive';
        } else if (sentimentLabel.includes('neg')) {
            sentiment = 'negative';
        } else if (sentimentLabel.includes('neu')) {
            sentiment = 'neutral';
        }

        console.log('Final Sentiment:', sentiment);

        // Perform emotion detection
        const emotionClassifier = await getEmotionPipeline();
        const emotionResults = await emotionClassifier(text, { topk: 3 }); // Get top 3 emotions

        const emotions = emotionResults.map(e => ({
            emotion: e.label.toLowerCase(),
            score: e.score
        }));

        console.log('Detected Emotions:', emotions);
        console.log('============================');

        // Generate metadata
        const now = new Date();
        const metadata = {
            timeOfDay: now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening',
            dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
            wordCount: text.split(/\s+/).length
        };

        // Generate suggestions
        const suggestions = generateSuggestions(sentiment, confidence, emotions);

        // Save analysis to database
        const analysis = new Analysis({
            userId: req.user.userId,
            text,
            sentiment,
            confidence,
            emotions,
            suggestions,
            metadata
        });

        await analysis.save();

        res.json({
            success: true,
            analysis: {
                id: analysis._id,
                text,
                sentiment,
                confidence: Math.round(confidence * 100) / 100,
                emotions,
                suggestions,
                metadata,
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
