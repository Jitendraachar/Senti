import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
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
    metadata: {
        timeOfDay: String,
        dayOfWeek: String,
        wordCount: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Analysis', analysisSchema);
