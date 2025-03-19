import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    get: function(value) {
      if (!value) return null;
      
      // If it's already a full URL, return it
      if (value.startsWith('http')) return value;
      
      // Otherwise, construct the URL
      const brand = this.parent().brand?.toLowerCase().trim() || '';
      const model = this.parent().model?.toLowerCase().replace(/\s+/g, '-') || '';
      const index = this.parent().images.indexOf(this) + 1;
      
      if (!brand || !model) return null;
      
      return `https://storage.googleapis.com/zkhauto_bucket/car-images/${brand}/${brand}-${model}-${index}.jpg`;
    }
  },
  exists: {
    type: Boolean,
    default: false
  }
});

const carSchema = new mongoose.Schema({
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  model: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "SUV",
      "Sedan",
      "Truck",
      "Van",
      "Coupe",
      "Wagon",
      "Convertible",
      "Hatchback",
    ],
  },
  fuel: {
    type: String,
    required: true,
    enum: [
      "Gasoline",
      "Diesel",
      "Electric",
      "Hybrid",
      "Plug-in Hybrid",
      "Hydrogen",
    ],
  },
  mileage: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ["available", "sold", "reserved", "maintenance"],
    default: "available",
  },
  color: {
    type: String,
    required: true,
    trim: true,
  },
  engineSize: {
    type: String,
    required: true,
    trim: true,
  },
  engineCylinders: {
    type: Number,
    required: true,
    min: 0,
  },
  engineHorsepower: {
    type: Number,
    required: true,
    min: 0,
  },
  engineTransmission: {
    type: String,
    required: true,
    enum: ["Manual", "Automatic", "CVT", "DCT", "Semi-Automatic"],
  },
  features: [
    {
      type: String,
      trim: true,
    },
  ],
  images: [imageSchema],
  driveTrain: {
    type: String,
    required: true,
    enum: ["FWD", "RWD", "AWD", "4WD"],
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000,
  },
  condition: {
    type: String,
    required: true,
    enum: ["New", "Used", "Refurbished", "Remade"],
    default: "Used",
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Pre-save middleware to handle images
carSchema.pre('save', function(next) {
  // Initialize images array if it doesn't exist
  if (!this.images) {
    this.images = [];
  }

  // Ensure images is an array
  if (!Array.isArray(this.images)) {
    this.images = [this.images].filter(Boolean);
  }

  // Remove any invalid images
  this.images = this.images.filter(img => img && (img.url || img.exists));

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
