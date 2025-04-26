import mongoose from "mongoose";

const footerSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please provide company name'],
    default: 'Car Selling'
  },
  socialLinks: {
    twitter: {
      type: String,
      default: '#'
    },
    youtube: {
      type: String,
      default: '#'
    },
    facebook: {
      type: String,
      default: '#'
    }
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Footer = mongoose.model("Footer", footerSchema);

export default Footer; 