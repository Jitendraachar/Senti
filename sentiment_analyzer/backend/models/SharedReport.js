import mongoose from 'mongoose';

const sharedReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    selectedEntries: [{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'entryType'
    }],
    entryType: {
        type: String,
        enum: ['Journal', 'Analysis']
    },
    shareToken: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    accessLog: [{
        accessedAt: {
            type: Date,
            default: Date.now
        },
        userAgent: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique share token
sharedReportSchema.pre('save', function (next) {
    if (!this.shareToken) {
        this.shareToken = require('crypto').randomBytes(32).toString('hex');
    }
    next();
});

export default mongoose.model('SharedReport', sharedReportSchema);
