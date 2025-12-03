import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctorName: {
        type: String,
        required: true
    },
    specialty: {
        type: String,
        enum: ['psychiatrist', 'psychologist', 'therapist', 'counselor', 'general'],
        default: 'therapist'
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    appointmentTime: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        default: 'Mental health consultation'
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    },
    notes: {
        type: String
    },
    contactNumber: {
        type: String
    },
    location: {
        type: String
    },
    isVirtual: {
        type: Boolean,
        default: false
    },
    meetingLink: {
        type: String
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

// Update timestamp before saving
appointmentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

export default mongoose.model('Appointment', appointmentSchema);
