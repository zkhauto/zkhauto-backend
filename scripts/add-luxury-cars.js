import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Car from '../models/Car.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zkhauto';

// Define luxury car specifications
const luxuryCars = [
  // Bentley Models
  {
    brand: 'Bentley',
    model: 'continental',
    year: 2023,
    price: 202500,
    type: 'Coupe',
    fuel: 'Gasoline',
    mileage: 0,
    color: 'Beluga Black',
    engineSize: '6.0L',
    engineCylinders: 12,
    engineHorsepower: 626,
    engineTransmission: 'Automatic',
    driveTrain: 'AWD',
    condition: 'New',
    status: 'available',
    rating: 5,
    description: 'The Bentley Continental GT represents the pinnacle of British luxury grand touring.',
    features: ['Diamond Quilted Leather', 'Naim Audio System', 'Rotating Display', 'Air Suspension'],
    numberOfImages: 2
  },
  // Ferrari Models
  {
    brand: 'Ferrari',
    model: '812',
    year: 2023,
    price: 398500,
    type: 'Coupe',
    fuel: 'Gasoline',
    mileage: 0,
    color: 'Rosso Corsa',
    engineSize: '6.5L',
    engineCylinders: 12,
    engineHorsepower: 789,
    engineTransmission: 'DCT',
    driveTrain: 'RWD',
    condition: 'New',
    status: 'available',
    rating: 5,
    description: 'The Ferrari 812 Superfast is the most powerful and fastest road-going Ferrari ever built.',
    features: ['Carbon Ceramic Brakes', 'JBL Premium Sound', 'Carbon Fiber Racing Seats', 'Telemetry System'],
    numberOfImages: 2
  },
  // Lamborghini Models
  {
    brand: 'Lamborghini',
    model: 'aventador',
    year: 2023,
    price: 507353,
    type: 'Coupe',
    fuel: 'Gasoline',
    mileage: 0,
    color: 'Verde Mantis',
    engineSize: '6.5L',
    engineCylinders: 12,
    engineHorsepower: 769,
    engineTransmission: 'DCT',
    driveTrain: 'AWD',
    condition: 'New',
    status: 'available',
    rating: 5,
    description: 'The Lamborghini Aventador represents the pinnacle of Lamborghini design and engineering.',
    features: ['Scissor Doors', 'Carbon Fiber Monocoque', 'Dynamic Steering', 'Adaptive Magneto Suspension'],
    numberOfImages: 2
  },
  {
    brand: 'Lamborghini',
    model: 'urus',
    year: 2023,
    price: 229495,
    type: 'SUV',
    fuel: 'Gasoline',
    mileage: 0,
    color: 'Giallo Auge',
    engineSize: '4.0L',
    engineCylinders: 8,
    engineHorsepower: 641,
    engineTransmission: 'Automatic',
    driveTrain: 'AWD',
    condition: 'New',
    status: 'available',
    rating: 5,
    description: 'The Lamborghini Urus is the world\'s first Super Sport Utility Vehicle.',
    features: ['ANIMA Selector', 'Bang & Olufsen Sound', 'Panoramic Roof', 'Carbon Ceramic Brakes'],
    numberOfImages: 2
  },
  // McLaren Models
  {
    brand: 'McLaren',
    model: '720s',
    year: 2023,
    price: 299000,
    type: 'Coupe',
    fuel: 'Gasoline',
    mileage: 0,
    color: 'Papaya Spark',
    engineSize: '4.0L',
    engineCylinders: 8,
    engineHorsepower: 710,
    engineTransmission: 'DCT',
    driveTrain: 'RWD',
    condition: 'New',
    status: 'available',
    rating: 5,
    description: 'The McLaren 720S delivers an unrivaled combination of performance, craftsmanship and technology.',
    features: ['Dihedral Doors', 'Variable Drift Control', 'Track Telemetry', 'Carbon Fiber Chassis'],
    numberOfImages: 2
  },
  // Porsche Models
  {
    brand: 'Porsche',
    model: '911',
    year: 2023,
    price: 182900,
    type: 'Coupe',
    fuel: 'Gasoline',
    mileage: 0,
    color: 'Guards Red',
    engineSize: '3.8L',
    engineCylinders: 6,
    engineHorsepower: 640,
    engineTransmission: 'DCT',
    driveTrain: 'RWD',
    condition: 'New',
    status: 'available',
    rating: 5,
    description: 'The Porsche 911 continues to set the standard as the everyday supercar.',
    features: ['Sport Chrono Package', 'PASM Sport Suspension', 'Rear Axle Steering', 'Burmester Sound System'],
    numberOfImages: 2
  }
];

async function addLuxuryCars() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing cars
    await Car.deleteMany({});
    console.log('Cleared existing cars');

    // Add new luxury cars
    for (const carData of luxuryCars) {
      const car = new Car({
        ...carData,
        images: Array.from({ length: carData.numberOfImages }, () => ({ 
          url: '', 
          exists: true 
        }))
      });
      await car.save();
      console.log(`Added ${car.brand} ${car.model} with ${carData.numberOfImages} images`);
    }

    console.log('\nAll luxury cars added successfully');
    
    // Verify cars were added
    const count = await Car.countDocuments();
    console.log(`Total cars in database: ${count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
console.log('Starting to add luxury cars...');
addLuxuryCars(); 