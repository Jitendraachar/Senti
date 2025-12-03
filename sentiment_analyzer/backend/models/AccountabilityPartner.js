import mongoose from 'mongoose';

const accountabilityPartnerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    partnerName: {
        type: String,
        required: true
    },
    partnerEmail: {
        type: String,
        required: true
    },
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        default: 'weekly'
    },
    alertThresholds: {
        consecutiveNegativeDays: {
            type: Number,
            default: 3
        },
        negativePercentage: {
            type: Number,
            default: 70
        }
    },
    lastCheckIn: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('AccountabilityPartner', accountabilityPartnerSchema);
