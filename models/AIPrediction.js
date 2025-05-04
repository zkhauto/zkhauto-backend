import mongoose from 'mongoose';

const defaultSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Paint', 'Tire', 'Interior', 'Engine', 'Body']
  },
  severity: {
    type: String,
    required: true,
    enum: ['None', 'Minor', 'Moderate', 'Major']
  },
  description: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
});

const imageAnalysisSchema = new mongoose.Schema({
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  model: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'verified', 'rejected']
  },
  imageUrl: {
    type: String,
    required: true
  },
  defaults: [defaultSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const AIPrediction = mongoose.model('AIPrediction', imageAnalysisSchema);

export default AIPrediction; 