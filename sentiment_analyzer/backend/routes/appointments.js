import express from 'express';
import Appointment from '../models/Appointment.js';
import Analysis from '../models/Analysis.js';
import Journal from '../models/Journal.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// Check mental health status and recommend appointment if needed
router.get('/check-status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Fetch recent entries
        const [analyses, journals] = await Promise.all([
            Analysis.find({ userId, createdAt: { $gte: weekAgo } }).sort({ createdAt: -1 }),
            Journal.find({ userId, createdAt: { $gte: weekAgo } }).sort({ createdAt: -1 })
        ]);

        const allEntries = [...analyses, ...journals];

        if (allEntries.length === 0) {
            return res.json({
                success: true,
                needsSupport: false,
                message: 'Not enough data to assess'
            });
        }

        // Calculate metrics
        const negativeCoun = allEntries.filter(e => e.sentiment === 'negative').length;
        const totalCount = allEntries.length;
        const negativePercentage = (negativeCoun / totalCount) * 100;

        // Check for consecutive negative days
        const dayGroups = {};
        allEntries.forEach(entry => {
            const day = new Date(entry.createdAt).toDateString();
            if (!dayGroups[day]) {
                dayGroups[day] = [];
            }
            dayGroups[day].push(entry);
        });

        let consecutiveNegativeDays = 0;
        let maxConsecutiveNegative = 0;
        const sortedDays = Object.keys(dayGroups).sort((a, b) => new Date(b) - new Date(a));

        for (const day of sortedDays) {
            const dayEntries = dayGroups[day];
            const negCount = dayEntries.filter(e => e.sentiment === 'negative').length;
            const posCount = dayEntries.filter(e => e.sentiment === 'positive').length;

            if (negCount > posCount) {
                consecutiveNegativeDays++;
                maxConsecutiveNegative = Math.max(maxConsecutiveNegative, consecutiveNegativeDays);
            } else {
                consecutiveNegativeDays = 0;
            }
        }

        // Determine if support is needed
        const needsSupport = negativePercentage >= 70 || maxConsecutiveNegative >= 3;

        let severity = 'low';
        let message = 'Your mood seems stable. Keep up the good work!';
        let recommendations = [];

        if (needsSupport) {
            if (maxConsecutiveNegative >= 5 || negativePercentage >= 85) {
                severity = 'high';
                message = 'We\'ve noticed you\'ve been struggling lately. It might be helpful to talk to a professional.';
                recommendations = [
                    'Consider booking an appointment with a mental health professional',
                    'Reach out to friends or family for support',
                    'Practice self-care activities that bring you comfort',
                    'If you\'re in crisis, please contact a crisis helpline immediately'
                ];
            } else {
                severity = 'moderate';
                message = 'You\'ve had some challenging days recently. Taking care of your mental health is important.';
                recommendations = [
                    'Consider talking to a therapist or counselor',
                    'Try stress-reduction techniques like meditation or exercise',
                    'Maintain a regular sleep schedule',
                    'Connect with supportive people in your life'
                ];
            }
        }

        res.json({
            success: true,
            needsSupport,
            severity,
            message,
            recommendations,
            stats: {
                negativePercentage: Math.round(negativePercentage),
                consecutiveNegativeDays: maxConsecutiveNegative,
                totalEntries: totalCount
            }
        });
    } catch (error) {
        console.error('Error checking mental health status:', error);
        res.status(500).json({ error: 'Error checking status' });
    }
});

// Create new appointment
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            doctorName,
            specialty,
            appointmentDate,
            appointmentTime,
            reason,
            notes,
            contactNumber,
            location,
            isVirtual,
            meetingLink
        } = req.body;

        if (!doctorName || !appointmentDate || !appointmentTime) {
            return res.status(400).json({ error: 'Doctor name, date, and time are required' });
        }

        const appointment = new Appointment({
            userId: req.user.userId,
            doctorName,
            specialty: specialty || 'therapist',
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            reason: reason || 'Mental health consultation',
            notes,
            contactNumber,
            location,
            isVirtual: isVirtual || false,
            meetingLink
        });

        await appointment.save();

        res.status(201).json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Error creating appointment' });
    }
});

// Get all appointments for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const appointments = await Appointment.find({ userId: req.user.userId })
            .sort({ appointmentDate: 1 })
            .select('-userId');

        res.json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Error fetching appointments' });
    }
});

// Update appointment status
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { status, notes } = req.body;

        const appointment = await Appointment.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (status) appointment.status = status;
        if (notes !== undefined) appointment.notes = notes;

        await appointment.save();

        res.json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ error: 'Error updating appointment' });
    }
});

// Delete appointment
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const appointment = await Appointment.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        res.json({
            success: true,
            message: 'Appointment cancelled successfully'
        });
    } catch (error) {
        console.error('Error deleting appointment:', error);
        res.status(500).json({ error: 'Error deleting appointment' });
    }
});

export default router;
