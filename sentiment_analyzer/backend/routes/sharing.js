import express from 'express';
import crypto from 'crypto';
import SharedReport from '../models/SharedReport.js';
import Journal from '../models/Journal.js';
import Analysis from '../models/Analysis.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Create shareable report
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { title, description, selectedEntries, expirationDays } = req.body;

        if (!title || !selectedEntries || selectedEntries.length === 0) {
            return res.status(400).json({ error: 'Title and entries are required' });
        }

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (expirationDays || 30));

        // Generate unique token
        const shareToken = crypto.randomBytes(32).toString('hex');

        const report = new SharedReport({
            userId: req.user.userId,
            title,
            description,
            selectedEntries,
            shareToken,
            expiresAt
        });

        await report.save();

        res.status(201).json({
            success: true,
            report: {
                id: report._id,
                title: report.title,
                shareToken: report.shareToken,
                shareUrl: `${req.protocol}://${req.get('host')}/shared/${report.shareToken}`,
                expiresAt: report.expiresAt
            }
        });
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Error creating report' });
    }
});

// Get user's reports
router.get('/reports', authenticateToken, async (req, res) => {
    try {
        const reports = await SharedReport.find({
            userId: req.user.userId
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            reports: reports.map(r => ({
                id: r._id,
                title: r.title,
                description: r.description,
                shareToken: r.shareToken,
                shareUrl: `${req.protocol}://${req.get('host')}/shared/${r.shareToken}`,
                expiresAt: r.expiresAt,
                isActive: r.isActive,
                accessCount: r.accessLog.length,
                createdAt: r.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Error fetching reports' });
    }
});

// View shared report (public, no auth required)
router.get('/view/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const report = await SharedReport.findOne({
            shareToken: token,
            isActive: true,
            expiresAt: { $gt: new Date() }
        }).populate('userId', 'name');

        if (!report) {
            return res.status(404).json({ error: 'Report not found or expired' });
        }

        // Log access
        report.accessLog.push({
            accessedAt: new Date(),
            userAgent: req.get('user-agent')
        });
        await report.save();

        // Fetch selected entries
        const entries = await Promise.all(
            report.selectedEntries.map(async (entryId) => {
                const journal = await Journal.findById(entryId);
                if (journal) return { ...journal.toObject(), type: 'journal' };

                const analysis = await Analysis.findById(entryId);
                if (analysis) return { ...analysis.toObject(), type: 'analysis' };

                return null;
            })
        );

        const validEntries = entries.filter(e => e !== null);

        res.json({
            success: true,
            report: {
                title: report.title,
                description: report.description,
                userName: report.userId.name,
                entries: validEntries,
                createdAt: report.createdAt,
                expiresAt: report.expiresAt
            }
        });
    } catch (error) {
        console.error('Error viewing report:', error);
        res.status(500).json({ error: 'Error viewing report' });
    }
});

// Revoke report access
router.delete('/reports/:id', authenticateToken, async (req, res) => {
    try {
        const report = await SharedReport.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        report.isActive = false;
        await report.save();

        res.json({
            success: true,
            message: 'Report access revoked'
        });
    } catch (error) {
        console.error('Error revoking report:', error);
        res.status(500).json({ error: 'Error revoking report' });
    }
});

export default router;
