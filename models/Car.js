import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: [true, 'Please provide a brand'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Please provide a model'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Please provide a year'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
    },
    mileage: {
      type: Number,
      required: [true, 'Please provide mileage'],
    },
    fuel: {
      type: String,
      required: [true, 'Please provide fuel type'],
      enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
    },
    transmission: {
      type: String,
      required: [true, 'Please provide transmission type'],
      enum: ['Automatic', 'Manual'],
    },
    status: {
      type: String,
      required: [true, 'Please provide status'],
      enum: ['available', 'sold', 'reserved'],
      default: 'available',
    },
    images: [{
      type: String,
    }],
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    features: [{
      type: String,
    }],
    color: {
      type: String,
      required: [true, 'Please provide color'],
    },
    condition: {
      type: String,
      required: [true, 'Please provide condition'],
      enum: ['New', 'Used'],
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Pre-save middleware to set number of images
carSchema.pre("save", function (next) {
  // Only set empty images if no images are provided
  if (!this.images || this.images.length === 0) {
    this.images = [];
  }
  next();
});

// Update the updatedAt timestamp before saving
carSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Add indexes for common queries
carSchema.index({ brand: 1, model: 1 });
carSchema.index({ price: 1 });
carSchema.index({ status: 1 });

const Car = mongoose.model("Car", carSchema);

export default Car;
