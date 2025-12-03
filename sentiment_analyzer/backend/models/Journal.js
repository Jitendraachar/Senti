import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    sentiment: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        required: true
    },
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    emotions: [{
        emotion: {
            type: String,
            enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'love', 'neutral']
        },
        score: {
            type: Number,
            min: 0,
            max: 1
        }
    }],
    suggestions: [{
        type: String
    }],
    tags: [{
        type: String,
        trim: true
    }],
    mood: {
        type: String,
        enum: ['happy', 'sad', 'anxious', 'calm', 'excited', 'stressed', 'grateful', 'neutral'],
        default: 'neutral'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
journalSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Journal', journalSchema);
