import express from 'express';
import Journal from '../models/Journal.js';
import Analysis from '../models/Analysis.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Topic categories to track
const TOPICS = {
    goals: ['goal', 'achieve', 'accomplish', 'plan', 'future', 'aspire', 'dream', 'ambition', 'target'],
    gratitude: ['grateful', 'thankful', 'appreciate', 'blessing', 'fortunate', 'lucky', 'thank'],
    relationships: ['friend', 'family', 'partner', 'relationship', 'love', 'social', 'connect', 'together'],
    challenges: ['problem', 'difficult', 'struggle', 'challenge', 'hard', 'tough', 'obstacle', 'issue'],
    selfcare: ['exercise', 'sleep', 'rest', 'relax', 'meditation', 'health', 'wellness', 'care'],
    work: ['work', 'job', 'career', 'project', 'task', 'meeting', 'deadline', 'professional'],
    emotions: ['feel', 'emotion', 'mood', 'happy', 'sad', 'angry', 'anxious', 'excited'],
    growth: ['learn', 'grow', 'improve', 'develop', 'progress', 'better', 'change', 'evolve']
};

// Prompt templates for each topic
const PROMPT_TEMPLATES = {
    goals: [
        "You haven't written about your goals lately. What's one thing you're working toward?",
        "It's been a while since you reflected on your aspirations. What goal would you like to focus on this week?",
        "What's a dream or ambition you've been thinking about recently?"
    ],
    gratitude: [
        "You haven't written about gratitude recently. What are three things you're grateful for today?",
        "Take a moment to appreciate the good things. What brought you joy this week?",
        "What's something small that made you smile recently?"
    ],
    relationships: [
        "You haven't written about your relationships lately. How are your connections with friends and family?",
        "Who has been important to you recently, and why?",
        "What's a meaningful conversation you've had this week?"
    ],
    challenges: [
        "What's a challenge you're currently facing, and how are you handling it?",
        "Is there something difficult you'd like to work through by writing about it?",
        "What obstacle have you overcome recently, and what did you learn?"
    ],
    selfcare: [
        "You haven't written about self-care lately. How have you been taking care of yourself?",
        "What's one thing you could do today to nurture your well-being?",
        "How have your sleep, exercise, and relaxation been this week?"
    ],
    work: [
        "You haven't written about work recently. How are things going professionally?",
        "What's a recent accomplishment or challenge at work?",
        "How do you feel about your current work-life balance?"
    ],
    emotions: [
        "How are you really feeling today? Take time to explore your emotions.",
        "What emotion has been most present for you this week?",
        "Describe your emotional state right now without judgment."
    ],
    growth: [
        "What's something new you've learned about yourself recently?",
        "How have you grown or changed in the past month?",
        "What's an area of your life where you'd like to see improvement?"
    ]
};

// Analyze which topics are missing from recent entries
function analyzeTopicGaps(entries) {
    const topicCounts = {};
    const allText = entries.map(e => (e.content || e.text || '').toLowerCase()).join(' ');

    // Count mentions of each topic
    for (const [topic, keywords] of Object.entries(TOPICS)) {
        topicCounts[topic] = 0;
        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'gi');
            const matches = allText.match(regex);
            topicCounts[topic] += matches ? matches.length : 0;
        }
    }

    // Find topics with lowest mentions
    const sortedTopics = Object.entries(topicCounts)
        .sort((a, b) => a[1] - b[1])
        .map(([topic]) => topic);

    return sortedTopics;
}

// Get personalized journal prompt
router.get('/daily', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const daysToAnalyze = 14; // Look at past 2 weeks
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToAnalyze);

        // Fetch recent entries
        const [journals, analyses] = await Promise.all([
            Journal.find({ userId, createdAt: { $gte: cutoffDate } }).sort({ createdAt: -1 }),
            Analysis.find({ userId, createdAt: { $gte: cutoffDate } }).sort({ createdAt: -1 })
        ]);

        const allEntries = [...journals, ...analyses];

        if (allEntries.length === 0) {
            // New user - suggest starting with emotions
            return res.json({
                success: true,
                prompt: {
                    text: "Welcome! Let's start your journaling journey. How are you feeling today?",
                    category: 'emotions',
                    reason: 'Starting your first entry'
                }
            });
        }

        // Analyze topic gaps
        const topicGaps = analyzeTopicGaps(allEntries);

        // Get the most neglected topic
        const suggestedTopic = topicGaps[0];
        const prompts = PROMPT_TEMPLATES[suggestedTopic];
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        // Calculate days since last entry
        const lastEntry = allEntries[0];
        const daysSinceLastEntry = Math.floor((Date.now() - new Date(lastEntry.createdAt)) / (1000 * 60 * 60 * 24));

        let reason = `You haven't written much about ${suggestedTopic} recently`;
        if (daysSinceLastEntry > 3) {
            reason = `It's been ${daysSinceLastEntry} days since your last entry`;
        }

        res.json({
            success: true,
            prompt: {
                text: randomPrompt,
                category: suggestedTopic,
                reason: reason,
                daysAnalyzed: daysToAnalyze,
                totalEntries: allEntries.length
            }
        });
    } catch (error) {
        console.error('Error generating prompt:', error);
        res.status(500).json({ error: 'Error generating prompt' });
    }
});

// Get multiple prompt suggestions
router.get('/suggestions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 14);

        const [journals, analyses] = await Promise.all([
            Journal.find({ userId, createdAt: { $gte: cutoffDate } }),
            Analysis.find({ userId, createdAt: { $gte: cutoffDate } })
        ]);

        const allEntries = [...journals, ...analyses];
        const topicGaps = analyzeTopicGaps(allEntries);

        // Get top 3 neglected topics
        const suggestions = topicGaps.slice(0, 3).map(topic => {
            const prompts = PROMPT_TEMPLATES[topic];
            return {
                category: topic,
                prompt: prompts[Math.floor(Math.random() * prompts.length)]
            };
        });

        res.json({
            success: true,
            suggestions
        });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({ error: 'Error generating suggestions' });
    }
});

export default router;
