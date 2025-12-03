import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import analyzeRoutes from './routes/analyze.js';
import dashboardRoutes from './routes/dashboard.js';
import journalRoutes from './routes/journal.js';
import resultsRoutes from './routes/results.js';
import insightsRoutes from './routes/insights.js';
import streaksRoutes from './routes/streaks.js';
import searchRoutes from './routes/search.js';
import appointmentsRoutes from './routes/appointments.js';
import promptsRoutes from './routes/prompts.js';
import predictionsRoutes from './routes/predictions.js';
import sharingRoutes from './routes/sharing.js';
import accountabilityRoutes from './routes/accountability.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', analyzeRoutes);
app.use('/api', journalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/streaks', streaksRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/prompts', promptsRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api/accountability', accountabilityRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Sentiment Analyzer API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
