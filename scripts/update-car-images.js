import mongoose from 'mongoose';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import Car from '../models/Car.js';

// Load environment variables
dotenv.config();

// Get MongoDB URI from environment or use default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zkhauto';

// Define the actual available cars in storage
const availableCars = {
  'audi': ['etron-gt', 'r8', 'rs3', 'rs5', 'rs6', 'rs7', 's8', 'sq5', 'ttrs', 'q8'],
  'bentley': ['bacalar', 'bentayga', 'continental', 'flying-spur', 'mulsanne'],
  'bmw': ['i8', 'm2', 'm3', 'm4', 'm5', 'm8'],
  'ferrari': ['812', 'f8', 'portofino', 'roma', 'sf90'],
  'lamborghini': ['aventador', 'huracan', 'sian', 'svj', 'urus'],
  'mclaren': ['720s', '765lt', 'artura', 'gt', 'senna'],
  'mercedes-benz': ['amg-c63', 'amg-gt', 'cla', 'eqs', 'g63', 'gt63s', 's-class'],
  'porsche': ['911', '918', 'cayenne', 'cayman', 'gt2rs', 'gt3', 'macan', 'panamera', 'taycan'],
  'rolls-royce': ['cullinan', 'dawn', 'ghost', 'phantom', 'wraith']
};

// Function to check if a car model exists in storage
function isValidCarModel(brand, model) {
  const normalizedBrand = brand.toLowerCase();
  const normalizedModel = model.toLowerCase().replace(/\s+/g, '-');
  return availableCars[normalizedBrand]?.includes(normalizedModel);
}

// Function to check if an image URL exists in Google Storage
async function checkImageExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error checking image: ${url}`, error.message);
    return false;
  }
}

// Function to get correct image URLs for a car
function getCarImageUrls(brand, model) {
  const brandLower = brand.toLowerCase();
  const modelLower = model.toLowerCase().replace(/\s+/g, '-');
  
  // Most cars have 2 images in the storage
  return Array.from({ length: 2 }, (_, i) => ({
    url: `https://storage.googleapis.com/zkhauto_bucket/car-images/${brandLower}/${brandLower}-${modelLower}-${i + 1}.jpg`,
    exists: true
  }));
}

// Main function to update all cars
async function updateCarImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB at:', MONGODB_URI);

    // Get all cars
    const cars = await Car.find({});
    console.log(`Found ${cars.length} cars to process`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Process each car
    for (const car of cars) {
      try {
        console.log(`\nProcessing ${car.brand} ${car.model}`);
        
        // Check if this car model exists in our storage
        if (!isValidCarModel(car.brand, car.model)) {
          console.log(`⚠️ Skipping: No images available for ${car.brand} ${car.model}`);
          skippedCount++;
          continue;
        }
        
        // Generate correct image URLs
        const imageUrls = getCarImageUrls(car.brand, car.model);
        
        // Verify each image exists
        for (const [index, imageData] of imageUrls.entries()) {
          const exists = await checkImageExists(imageData.url);
          console.log(`Image ${index + 1}: ${imageData.url} - ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
          imageData.exists = exists;
        }

        // Update car with new image data
        car.images = imageUrls;
        await car.save();
        console.log(`✅ Updated ${car.brand} ${car.model}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error processing ${car.brand} ${car.model}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nUpdate Summary:');
    console.log(`✅ Successfully updated: ${successCount} cars`);
    console.log(`⚠️ Skipped (no images): ${skippedCount} cars`);
    console.log(`❌ Failed to update: ${errorCount} cars`);
    console.log(`Total processed: ${cars.length} cars`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the update
console.log('Starting car image URL update process...');
updateCarImages(); 