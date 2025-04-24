import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
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
    images: [
      {
        type: String,
        trim: true,
      },
    ],
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
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
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
