import express from 'express';
import Analysis from '../models/Analysis.js';
import Journal from '../models/Journal.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Helper function to calculate streaks
function calculateStreaks(entries) {
    if (entries.length === 0) {
        return {
            currentStreak: { type: null, count: 0, startDate: null },
            longestPositiveStreak: 0,
            longestNegativeStreak: 0,
            streakHistory: []
        };
    }

    // Sort by date ascending
    const sorted = entries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let currentStreak = { type: null, count: 0, startDate: null };
    let longestPositiveStreak = 0;
    let longestNegativeStreak = 0;
    let streakHistory = [];

    // Group by day
    const dayGroups = {};
    sorted.forEach(entry => {
        const day = new Date(entry.createdAt).toDateString();
        if (!dayGroups[day]) {
            dayGroups[day] = [];
        }
        dayGroups[day].push(entry);
    });

    // Calculate dominant sentiment per day
    const dailySentiments = Object.entries(dayGroups).map(([day, entries]) => {
        const counts = { positive: 0, negative: 0, neutral: 0 };
        entries.forEach(e => counts[e.sentiment]++);

        let dominant = 'neutral';
        if (counts.positive > counts.negative && counts.positive > counts.neutral) {
            dominant = 'positive';
        } else if (counts.negative > counts.positive && counts.negative > counts.neutral) {
            dominant = 'negative';
        }

        return { date: new Date(day), sentiment: dominant };
    });

    // Calculate streaks
    let tempStreak = { type: null, count: 0, startDate: null };

    dailySentiments.forEach((day, index) => {
        if (day.sentiment === 'neutral') return;

        if (tempStreak.type === day.sentiment) {
            tempStreak.count++;
        } else {
            if (tempStreak.count > 0) {
                streakHistory.push({ ...tempStreak });
                if (tempStreak.type === 'positive' && tempStreak.count > longestPositiveStreak) {
                    longestPositiveStreak = tempStreak.count;
                }
                if (tempStreak.type === 'negative' && tempStreak.count > longestNegativeStreak) {
                    longestNegativeStreak = tempStreak.count;
                }
            }
            tempStreak = { type: day.sentiment, count: 1, startDate: day.date };
        }

        // Update current streak if this is the last day
        if (index === dailySentiments.length - 1) {
            currentStreak = { ...tempStreak };
        }
    });

    return {
        currentStreak,
        longestPositiveStreak,
        longestNegativeStreak,
        streakHistory
    };
}

// Get current streaks
router.get('/current', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get all entries
        const [analyses, journals] = await Promise.all([
            Analysis.find({ userId }).select('sentiment createdAt'),
            Journal.find({ userId }).select('sentiment createdAt')
        ]);

        const allEntries = [...analyses, ...journals];
        const streakData = calculateStreaks(allEntries);

        res.json({
            success: true,
            streaks: streakData
        });
    } catch (error) {
        console.error('Error calculating streaks:', error);
        res.status(500).json({ error: 'Error calculating streaks' });
    }
});

// Get achievements
router.get('/achievements', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [analyses, journals] = await Promise.all([
            Analysis.find({ userId }).select('sentiment createdAt'),
            Journal.find({ userId }).select('sentiment createdAt')
        ]);

        const allEntries = [...analyses, ...journals];
        const streakData = calculateStreaks(allEntries);

        // Define achievements
        const achievements = [
            {
                id: 'first_entry',
                name: 'First Step',
                description: 'Created your first entry',
                icon: '🎯',
                unlocked: allEntries.length > 0,
                progress: allEntries.length > 0 ? 1 : 0,
                target: 1
            },
            {
                id: 'week_streak',
                name: 'Week Warrior',
                description: 'Maintain a 7-day positive streak',
                icon: '🔥',
                unlocked: streakData.longestPositiveStreak >= 7,
                progress: Math.min(streakData.longestPositiveStreak, 7),
                target: 7
            },
            {
                id: 'month_streak',
                name: 'Monthly Master',
                description: 'Maintain a 30-day positive streak',
                icon: '⭐',
                unlocked: streakData.longestPositiveStreak >= 30,
                progress: Math.min(streakData.longestPositiveStreak, 30),
                target: 30
            },
            {
                id: 'hundred_entries',
                name: 'Century Club',
                description: 'Create 100 entries',
                icon: '💯',
                unlocked: allEntries.length >= 100,
                progress: Math.min(allEntries.length, 100),
                target: 100
            },
            {
                id: 'fifty_positive',
                name: 'Positivity Champion',
                description: 'Record 50 positive entries',
                icon: '😊',
                unlocked: allEntries.filter(e => e.sentiment === 'positive').length >= 50,
                progress: Math.min(allEntries.filter(e => e.sentiment === 'positive').length, 50),
                target: 50
            }
        ];

        res.json({
            success: true,
            achievements,
            totalUnlocked: achievements.filter(a => a.unlocked).length,
            totalAchievements: achievements.length
        });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        res.status(500).json({ error: 'Error fetching achievements' });
    }
});

export default router;
