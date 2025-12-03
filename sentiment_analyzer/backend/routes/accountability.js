import express from 'express';
import AccountabilityPartner from '../models/AccountabilityPartner.js';
import Journal from '../models/Journal.js';
import Analysis from '../models/Analysis.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Add accountability partner
router.post('/partners', authenticateToken, async (req, res) => {
    try {
        const { partnerName, partnerEmail, frequency, alertThresholds } = req.body;

        if (!partnerName || !partnerEmail) {
            return res.status(400).json({ error: 'Partner name and email are required' });
        }

        const partner = new AccountabilityPartner({
            userId: req.user.userId,
            partnerName,
            partnerEmail,
            frequency: frequency || 'weekly',
            alertThresholds: alertThresholds || {}
        });

        await partner.save();

        res.status(201).json({
            success: true,
            partner
        });
    } catch (error) {
        console.error('Error adding partner:', error);
        res.status(500).json({ error: 'Error adding partner' });
    }
});

// Get accountability partners
router.get('/partners', authenticateToken, async (req, res) => {
    try {
        const partners = await AccountabilityPartner.find({
            userId: req.user.userId,
            isActive: true
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            partners
        });
    } catch (error) {
        console.error('Error fetching partners:', error);
        res.status(500).json({ error: 'Error fetching partners' });
    }
});

// Remove accountability partner
router.delete('/partners/:id', authenticateToken, async (req, res) => {
    try {
        const partner = await AccountabilityPartner.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        partner.isActive = false;
        await partner.save();

        res.json({
            success: true,
            message: 'Partner removed'
        });
    } catch (error) {
        console.error('Error removing partner:', error);
        res.status(500).json({ error: 'Error removing partner' });
    }
});

// Generate check-in summary
router.post('/check-in/:partnerId', authenticateToken, async (req, res) => {
    try {
        const partner = await AccountabilityPartner.findOne({
            _id: req.params.partnerId,
            userId: req.user.userId,
            isActive: true
        });

        if (!partner) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        const userId = req.user.userId;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Fetch recent entries
        const [journals, analyses] = await Promise.all([
            Journal.find({ userId, createdAt: { $gte: weekAgo } }),
            Analysis.find({ userId, createdAt: { $gte: weekAgo } })
        ]);

        const allEntries = [...journals, ...analyses];

        // Calculate wellness metrics
        const totalEntries = allEntries.length;
        const negativeCount = allEntries.filter(e => e.sentiment === 'negative').length;
        const positiveCount = allEntries.filter(e => e.sentiment === 'positive').length;
        const negativePercentage = totalEntries > 0 ? (negativeCount / totalEntries) * 100 : 0;

        // Calculate consecutive negative days
        const dayGroups = {};
        allEntries.forEach(entry => {
            const day = new Date(entry.createdAt).toDateString();
            if (!dayGroups[day]) dayGroups[day] = [];
            dayGroups[day].push(entry);
        });

        let consecutiveNegativeDays = 0;
        const sortedDays = Object.keys(dayGroups).sort((a, b) => new Date(b) - new Date(a));

        for (const day of sortedDays) {
            const dayEntries = dayGroups[day];
            const negCount = dayEntries.filter(e => e.sentiment === 'negative').length;
            const posCount = dayEntries.filter(e => e.sentiment === 'positive').length;

            if (negCount > posCount) {
                consecutiveNegativeDays++;
            } else {
                break;
            }
        }

        // Determine trend
        let trend = 'stable';
        let wellnessScore = 7;

        if (negativePercentage >= 70) {
            trend = 'declining';
            wellnessScore = 4;
        } else if (negativePercentage <= 30) {
            trend = 'improving';
            wellnessScore = 9;
        }

        // Check if alert threshold met
        const alertTriggered =
            consecutiveNegativeDays >= partner.alertThresholds.consecutiveNegativeDays ||
            negativePercentage >= partner.alertThresholds.negativePercentage;

        // Generate check-in message
        let message = '';
        if (trend === 'improving') {
            message = `${req.user.name || 'Your accountability partner'} has been doing well this week! They've been journaling consistently and their mood is ${trend}. 😊`;
        } else if (trend === 'declining') {
            message = `${req.user.name || 'Your accountability partner'}'s mood has been ${trend} for the past few days. Consider checking in with them. 💙`;
        } else {
            message = `${req.user.name || 'Your accountability partner'} has been journaling regularly this week. Their mood is ${trend}.`;
        }

        // Update last check-in
        partner.lastCheckIn = new Date();
        await partner.save();

        // In a real app, this would send email/SMS
        // For blueprint, we return the check-in data
        res.json({
            success: true,
            checkIn: {
                partnerId: partner._id,
                partnerName: partner.partnerName,
                partnerEmail: partner.partnerEmail,
                trend,
                wellnessScore,
                totalEntries,
                consecutiveNegativeDays,
                negativePercentage: Math.round(negativePercentage),
                alertTriggered,
                message,
                timestamp: new Date()
            }
        });
    } catch (error) {
        console.error('Error generating check-in:', error);
        res.status(500).json({ error: 'Error generating check-in' });
    }
});

// Get check-in history (simulated for blueprint)
router.get('/check-ins', authenticateToken, async (req, res) => {
    try {
        // In a real app, this would fetch from a CheckIn model
        // For blueprint, we return sample data
        res.json({
            success: true,
            checkIns: [
                {
                    date: new Date(),
                    trend: 'stable',
                    wellnessScore: 7,
                    sent: true
                }
            ]
        });
    } catch (error) {
        console.error('Error fetching check-ins:', error);
        res.status(500).json({ error: 'Error fetching check-ins' });
    }
});

export default router;
