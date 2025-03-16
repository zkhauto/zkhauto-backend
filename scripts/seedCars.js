import mongoose from 'mongoose';
import Car from '../models/Car.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Helper function to generate image URL for a car
function generateCarImage(brand, model) {
  // Map specific model names to their corresponding image filenames
  const imageNameMap = {
    // Ferrari
    "f8-tributo": "f8",
    "sf90-stradale": "sf90",
    "812-superfast": "812",
    
    // Lamborghini
    "huracan-evo": "huracan",
    "aventador-svj": "aventador",
    "urus": "urus",
    
    // Porsche
    "911-gt3": "911",
    "taycan-turbo-s": "taycan",
    "cayenne-turbo-gt": "cayenne",
    
    // McLaren
    "720s": "720s",
    "artura": "artura",
    "765lt": "765lt",
    
    // Bentley
    "continental-gt": "continental",
    "flying-spur": "flying-spur",
    "bentayga": "bentayga",
    
    // Rolls-Royce
    "phantom": "phantom",
    "cullinan": "cullinan",
    "ghost": "ghost",
    
    // Mercedes-Benz
    "amg-c63": "amg-c63",
    "maybach-s680": "s-class",
    "g63-amg": "g63",
    
    // Audi
    "rs-e-tron-gt": "etron-gt",
    "rs7-sportback": "rs7",
    "rs-q8": "rs-q8",
    
    // BMW
    "m8-competition": "m8",
    "m5-cs": "m5",
    "xm": "m5"
  };

  const imageName = imageNameMap[model] || model;
  let imageUrl;
  
  // Special case for Mercedes AMG C63
  if (brand === "mercedes-benz" && model === "amg-c63") {
    imageUrl = `https://storage.googleapis.com/zkhauto_bucket/car-images/${brand}/mercedes-amg-c63-1.jpg`;
  }
  // Special case for Rolls-Royce
  else if (brand === "rolls-royce") {
    imageUrl = `https://storage.googleapis.com/zkhauto_bucket/car-images/${brand}/rolls-${imageName}-2.jpg`;
  }
  else {
    imageUrl = `https://storage.googleapis.com/zkhauto_bucket/car-images/${brand}/${brand}-${imageName}-1.jpg`;
  }
  
  return {
    url: imageUrl,
    isPrimary: true,
    placeholder: 'https://storage.googleapis.com/zkhauto_bucket/car-images/placeholder-car.jpg'
  };
}

// Helper function to check if image URL is accessible
async function isImageAvailable(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.status === 200;
  } catch (error) {
    console.error(`Error checking image availability for ${url}:`, error.message);
    return false;
  }
}

// Helper function to generate multiple cars for each model with different VINs and mileage
function generateMultipleCars(carTemplate, count = 1) {
  return Array.from({ length: count }, (_, index) => ({
    ...carTemplate,
    vin: `${carTemplate.brand.toUpperCase()}${carTemplate.model.toUpperCase()}${String(index + 1).padStart(5, '0')}`,
    mileage: Math.floor(Math.random() * 5000), // Random mileage between 0 and 5000
    status: 'available'
  }));
}

// Base car templates
const carTemplates = [
  // Ferrari Models
  {
    brand: "ferrari",
    model: "f8-tributo",
    year: 2023,
    price: 276000,
    type: "Coupe",
    fuel: "Gasoline",
    mileage: 1200,
    status: "available",
    color: "Rosso Corsa",
    engineSize: "3.9L V8",
    engineCylinders: 8,
    engineHorsepower: 710,
    engineTransmission: "DCT",
    features: [
      "Carbon Fiber Interior",
      "Racing Seats",
      "Sport Exhaust",
      "Launch Control"
    ],
    driveTrain: "RWD",
    description: "The Ferrari F8 Tributo is the new mid-rear-engined sports car that represents the highest expression of the Prancing Horse's classic two-seater berlinetta.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "ferrari",
    model: "sf90-stradale",
    year: 2023,
    price: 507300,
    type: "Coupe",
    fuel: "Hybrid",
    mileage: 500,
    status: "available",
    color: "Giallo Modena",
    engineSize: "4.0L V8 Hybrid",
    engineCylinders: 8,
    engineHorsepower: 986,
    engineTransmission: "DCT",
    features: [
      "Hybrid Technology",
      "Carbon Fiber Body",
      "Active Aerodynamics",
      "eManettino"
    ],
    driveTrain: "AWD",
    description: "The Ferrari SF90 Stradale is Ferrari's first plug-in hybrid with unprecedented performance.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "ferrari",
    model: "812-superfast",
    year: 2023,
    price: 340000,
    type: "Coupe",
    fuel: "Gasoline",
    mileage: 800,
    status: "available",
    color: "Blu Pozzi",
    engineSize: "6.5L V12",
    engineCylinders: 12,
    engineHorsepower: 789,
    engineTransmission: "DCT",
    features: [
      "Virtual Short Wheelbase 2.0",
      "Side Slip Control",
      "F1-Trac",
      "High-Performance ABS"
    ],
    driveTrain: "RWD",
    description: "The Ferrari 812 Superfast is the most powerful and fastest road-going Ferrari ever built.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },

  // Lamborghini Models
  {
    brand: "lamborghini",
    model: "huracan-evo",
    year: 2023,
    price: 287000,
    type: "Coupe",
    fuel: "Gasoline",
    mileage: 800,
    status: "available",
    color: "Verde Mantis",
    engineSize: "5.2L V10",
    engineCylinders: 10,
    engineHorsepower: 631,
    engineTransmission: "DCT",
    features: [
      "Adaptive Suspension",
      "Carbon Ceramic Brakes",
      "Dynamic Steering",
      "Lamborghini Dinamica Veicolo Integrata"
    ],
    driveTrain: "AWD",
    description: "The Lamborghini Huracán EVO is the evolution of the most successful V10-powered Lamborghini ever.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "lamborghini",
    model: "aventador-svj",
    year: 2023,
    price: 517770,
    type: "Coupe",
    fuel: "Gasoline",
    mileage: 300,
    status: "available",
    color: "Arancio Atlas",
    engineSize: "6.5L V12",
    engineCylinders: 12,
    engineHorsepower: 759,
    engineTransmission: "Automatic",
    features: [
      "ALA 2.0 Active Aerodynamics",
      "Carbon Fiber Monocoque",
      "Magnetic Push-Rod Suspension",
      "Four-Wheel Steering"
    ],
    driveTrain: "AWD",
    description: "The Lamborghini Aventador SVJ represents the pinnacle of Lamborghini V12 performance.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "lamborghini",
    model: "urus",
    year: 2023,
    price: 229495,
    type: "SUV",
    fuel: "Gasoline",
    mileage: 1500,
    status: "available",
    color: "Blu Astraeus",
    engineSize: "4.0L V8 Twin-Turbo",
    engineCylinders: 8,
    engineHorsepower: 641,
    engineTransmission: "Automatic",
    features: [
      "Adaptive Air Suspension",
      "Carbon Ceramic Brakes",
      "Torque Vectoring",
      "Active Roll Stabilization"
    ],
    driveTrain: "AWD",
    description: "The Lamborghini Urus is the world's first Super Sport Utility Vehicle.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },

  // Porsche Models
  {
    brand: "porsche",
    model: "911-gt3",
    year: 2023,
    price: 169000,
    type: "Coupe",
    fuel: "Gasoline",
    mileage: 1500,
    status: "available",
    color: "GT Silver Metallic",
    engineSize: "4.0L Flat-6",
    engineCylinders: 6,
    engineHorsepower: 502,
    engineTransmission: "Manual",
    features: [
      "Sport Chrono Package",
      "Carbon Fiber Bucket Seats",
      "Track Precision App",
      "Club Sport Package"
    ],
    driveTrain: "RWD",
    description: "The Porsche 911 GT3 with Touring Package is the understated version of the high-performance 911.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "porsche",
    model: "taycan-turbo-s",
    year: 2023,
    price: 185000,
    type: "Sedan",
    fuel: "Electric",
    mileage: 1000,
    status: "available",
    color: "Frozen Blue Metallic",
    engineSize: "Dual Electric Motors",
    engineCylinders: 0,
    engineHorsepower: 750,
    engineTransmission: "Automatic",
    features: [
      "Performance Battery Plus",
      "Porsche Dynamic Chassis Control",
      "Ceramic Composite Brakes",
      "Advanced Climate Control"
    ],
    driveTrain: "AWD",
    description: "The Porsche Taycan Turbo S represents the pinnacle of electric performance.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "porsche",
    model: "cayenne-turbo-gt",
    year: 2023,
    price: 180800,
    type: "SUV",
    fuel: "Gasoline",
    mileage: 1200,
    status: "available",
    color: "Carmine Red",
    engineSize: "4.0L V8 Twin-Turbo",
    engineCylinders: 8,
    engineHorsepower: 631,
    engineTransmission: "Automatic",
    features: [
      "Sport Chrono Package",
      "Ceramic Composite Brakes",
      "Adaptive Air Suspension",
      "Sport Exhaust System"
    ],
    driveTrain: "AWD",
    description: "The Porsche Cayenne Turbo GT is the most powerful version of Porsche's luxury SUV.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },

  // McLaren Models
  {
    brand: "mclaren",
    model: "720s",
    year: 2023,
    price: 299000,
    type: "Coupe",
    fuel: "Gasoline",
    mileage: 950,
    status: "available",
    color: "Papaya Spark",
    engineSize: "4.0L V8",
    engineCylinders: 8,
    engineHorsepower: 710,
    engineTransmission: "DCT",
    features: [
      "Variable Drift Control",
      "Active Dynamics Panel",
      "McLaren Track Telemetry",
      "Folding Driver Display"
    ],
    driveTrain: "RWD",
    description: "The McLaren 720S is a car of extraordinary capabilities.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "mclaren",
    model: "artura",
    year: 2023,
    price: 225000,
    type: "Coupe",
    fuel: "Hybrid",
    mileage: 500,
    status: "available",
    color: "Ember Orange",
    engineSize: "3.0L V6 Hybrid",
    engineCylinders: 6,
    engineHorsepower: 671,
    engineTransmission: "DCT",
    features: [
      "Carbon Fiber Monocoque",
      "E-Motor",
      "Proactive Damping Control",
      "Variable Drift Control"
    ],
    driveTrain: "RWD",
    description: "The McLaren Artura is McLaren's first series-production hybrid supercar.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "mclaren",
    model: "765lt",
    year: 2023,
    price: 358000,
    type: "Coupe",
    fuel: "Gasoline",
    mileage: 300,
    status: "available",
    color: "Burton Blue",
    engineSize: "4.0L V8",
    engineCylinders: 8,
    engineHorsepower: 755,
    engineTransmission: "DCT",
    features: [
      "Active Rear Wing",
      "Titanium Exhaust",
      "Carbon Fiber Racing Seats",
      "Track Telemetry"
    ],
    driveTrain: "RWD",
    description: "The McLaren 765LT is the most powerful McLaren Longtail ever.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },

  // Bentley Models
  {
    brand: "bentley",
    model: "continental-gt",
    year: 2023,
    price: 235000,
    type: "Coupe",
    fuel: "Gasoline",
    mileage: 1100,
    status: "available",
    color: "Beluga",
    engineSize: "6.0L W12",
    engineCylinders: 12,
    engineHorsepower: 626,
    engineTransmission: "Automatic",
    features: [
      "Naim Audio System",
      "Rotating Display",
      "Diamond Knurling",
      "Mood Lighting"
    ],
    driveTrain: "AWD",
    description: "The Bentley Continental GT is the quintessential grand tourer.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "bentley",
    model: "flying-spur",
    year: 2023,
    price: 215000,
    type: "Sedan",
    fuel: "Gasoline",
    mileage: 800,
    status: "available",
    color: "St. James Red",
    engineSize: "6.0L W12",
    engineCylinders: 12,
    engineHorsepower: 626,
    engineTransmission: "Automatic",
    features: [
      "Mulliner Driving Specification",
      "Rotating Display",
      "Naim Audio",
      "Rear Entertainment"
    ],
    driveTrain: "AWD",
    description: "The Bentley Flying Spur combines luxury with remarkable performance.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "bentley",
    model: "bentayga",
    year: 2023,
    price: 187000,
    type: "SUV",
    fuel: "Gasoline",
    mileage: 1500,
    status: "available",
    color: "Alpine Green",
    engineSize: "4.0L V8",
    engineCylinders: 8,
    engineHorsepower: 542,
    engineTransmission: "Automatic",
    features: [
      "All-Terrain Specification",
      "Touring Specification",
      "Naim Audio",
      "Rear Entertainment"
    ],
    driveTrain: "AWD",
    description: "The Bentley Bentayga is the ultimate luxury SUV.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },

  // Rolls-Royce Models
  {
    brand: "rolls-royce",
    model: "phantom",
    year: 2023,
    price: 460000,
    type: "Sedan",
    fuel: "Gasoline",
    mileage: 500,
    status: "available",
    color: "Arctic White",
    engineSize: "6.75L V12",
    engineCylinders: 12,
    engineHorsepower: 563,
    engineTransmission: "Automatic",
    features: [
      "Starlight Headliner",
      "Gallery Art Commission",
      "Rear Theatre Configuration",
      "Bespoke Audio"
    ],
    driveTrain: "RWD",
    description: "The Rolls-Royce Phantom is the pinnacle of luxury.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "rolls-royce",
    model: "cullinan",
    year: 2023,
    price: 335000,
    type: "SUV",
    fuel: "Gasoline",
    mileage: 1000,
    status: "available",
    color: "Salamanca Blue",
    engineSize: "6.75L V12",
    engineCylinders: 12,
    engineHorsepower: 563,
    engineTransmission: "Automatic",
    features: [
      "Viewing Suite",
      "Recreation Module",
      "Night Vision",
      "Shooting Star Headliner"
    ],
    driveTrain: "AWD",
    description: "The Rolls-Royce Cullinan is the most luxurious SUV in the world.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "rolls-royce",
    model: "ghost",
    year: 2023,
    price: 311900,
    type: "Sedan",
    fuel: "Gasoline",
    mileage: 800,
    status: "available",
    color: "English White",
    engineSize: "6.75L V12",
    engineCylinders: 12,
    engineHorsepower: 563,
    engineTransmission: "Automatic",
    features: [
      "Illuminated Grille",
      "Planar Suspension",
      "Starlight Headliner",
      "Champagne Cooler"
    ],
    driveTrain: "AWD",
    description: "The Rolls-Royce Ghost is the most technologically advanced Rolls-Royce ever created.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },

  // Mercedes-Benz Models
  {
    brand: "mercedes-benz",
    model: "amg-c63",
    year: 2023,
    price: 325000,
    type: "Sedan",
    fuel: "Gasoline",
    mileage: 750,
    status: "available",
    color: "Obsidian Black",
    engineSize: "4.0L V8 Biturbo",
    engineCylinders: 8,
    engineHorsepower: 503,
    engineTransmission: "Automatic",
    features: [
      "AMG Performance Exhaust",
      "AMG RIDE CONTROL",
      "Burmester Surround Sound",
      "AMG Performance Seats"
    ],
    driveTrain: "AWD",
    description: "The Mercedes-AMG C63 is a high-performance luxury sedan that combines comfort with incredible power.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "mercedes-benz",
    model: "maybach-s680",
    year: 2023,
    price: 229000,
    type: "Sedan",
    fuel: "Gasoline",
    mileage: 1000,
    status: "available",
    color: "Obsidian Black",
    engineSize: "6.0L V12",
    engineCylinders: 12,
    engineHorsepower: 621,
    engineTransmission: "Automatic",
    features: [
      "Executive Rear Seats",
      "Burmester 4D Audio",
      "Magic Body Control",
      "Rear Entertainment"
    ],
    driveTrain: "AWD",
    description: "The Mercedes-Maybach S680 represents the ultimate in luxury and refinement.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "mercedes-benz",
    model: "g63-amg",
    year: 2023,
    price: 156450,
    type: "SUV",
    fuel: "Gasoline",
    mileage: 1500,
    status: "available",
    color: "Brilliant Blue",
    engineSize: "4.0L V8",
    engineCylinders: 8,
    engineHorsepower: 577,
    engineTransmission: "Automatic",
    features: [
      "AMG Performance Exhaust",
      "Carbon Fiber Trim",
      "Adaptive Suspension",
      "360-Degree Camera"
    ],
    driveTrain: "AWD",
    description: "The Mercedes-AMG G63 combines legendary off-road capability with AMG performance.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },

  // Audi Models
  {
    brand: "audi",
    model: "rs-e-tron-gt",
    year: 2023,
    price: 139900,
    type: "Sedan",
    fuel: "Electric",
    mileage: 1000,
    status: "available",
    color: "Tactical Green",
    engineSize: "Electric Motors",
    engineCylinders: 0,
    engineHorsepower: 637,
    engineTransmission: "Automatic",
    features: [
      "Matrix LED Headlights",
      "Carbon Fiber Roof",
      "Boost Mode",
      "Rear-Wheel Steering"
    ],
    driveTrain: "AWD",
    description: "The Audi RS e-tron GT is Audi's high-performance electric flagship.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "audi",
    model: "rs7-sportback",
    year: 2023,
    price: 118500,
    type: "Sedan",
    fuel: "Gasoline",
    mileage: 1200,
    status: "available",
    color: "Nardo Gray",
    engineSize: "4.0L V8",
    engineCylinders: 8,
    engineHorsepower: 591,
    engineTransmission: "Automatic",
    features: [
      "RS Sport Exhaust",
      "Dynamic Package Plus",
      "Carbon Optic Package",
      "Bang & Olufsen Sound"
    ],
    driveTrain: "AWD",
    description: "The Audi RS7 Sportback combines stunning design with exceptional performance.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "audi",
    model: "rs-q8",
    year: 2023,
    price: 119900,
    type: "SUV",
    fuel: "Gasoline",
    mileage: 1500,
    status: "available",
    color: "Dragon Orange",
    engineSize: "4.0L V8",
    engineCylinders: 8,
    engineHorsepower: 591,
    engineTransmission: "Automatic",
    features: [
      "RS Sport Exhaust",
      "All-Wheel Steering",
      "Active Roll Stabilization",
      "Carbon Ceramic Brakes"
    ],
    driveTrain: "AWD",
    description: "The Audi RS Q8 is the most powerful SUV in Audi's lineup.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },

  // BMW Models
  {
    brand: "bmw",
    model: "m8-competition",
    year: 2023,
    price: 130000,
    type: "Coupe",
    fuel: "Gasoline",
    mileage: 1300,
    status: "available",
    color: "Frozen Black",
    engineSize: "4.4L V8",
    engineCylinders: 8,
    engineHorsepower: 617,
    engineTransmission: "Automatic",
    features: [
      "M Carbon Package",
      "M Driver's Package",
      "Bowers & Wilkins Sound",
      "M Track Mode"
    ],
    driveTrain: "AWD",
    description: "The BMW M8 Competition represents the pinnacle of BMW's luxury-performance lineup.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "bmw",
    model: "m5-cs",
    year: 2023,
    price: 142000,
    type: "Sedan",
    fuel: "Gasoline",
    mileage: 1000,
    status: "available",
    color: "Frozen Deep Green",
    engineSize: "4.4L V8",
    engineCylinders: 8,
    engineHorsepower: 627,
    engineTransmission: "Automatic",
    features: [
      "M Carbon Ceramic Brakes",
      "M Carbon Bucket Seats",
      "Gold Bronze Accents",
      "Track Mode"
    ],
    driveTrain: "AWD",
    description: "The BMW M5 CS is the most powerful production BMW ever made.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  },
  {
    brand: "bmw",
    model: "xm",
    year: 2023,
    price: 159000,
    type: "SUV",
    fuel: "Hybrid",
    mileage: 800,
    status: "available",
    color: "Cape York Green",
    engineSize: "4.4L V8 Hybrid",
    engineCylinders: 8,
    engineHorsepower: 644,
    engineTransmission: "Automatic",
    features: [
      "M Professional Driver's Package",
      "Executive Package",
      "Bowers & Wilkins Sound",
      "M Active Roll Stabilization"
    ],
    driveTrain: "AWD",
    description: "The BMW XM is BMW M's first electrified high-performance model.",
    condition: "New",
    rating: 5,
    numberOfImages: 2
  }
];

async function seedCars() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing cars
    await Car.deleteMany({});
    console.log('Deleted existing cars');

    // Process each car template
    const allCars = [];
    let totalCars = 0;
    const maxCarsPerBrand = 10;
    const processedBrands = new Set();

    for (const template of carTemplates) {
      // Skip if we already have enough cars for this brand
      if (processedBrands.has(template.brand)) {
        continue;
      }

      // Generate image URL
      const imageData = generateCarImage(template.brand, template.model);
      
      // Generate 1 car for this model
      const carsForModel = generateMultipleCars(template).map(car => ({
        ...car,
        images: [imageData]
      }));
      
      allCars.push(...carsForModel);
      totalCars++;
      
      // If this is the first car for this brand, mark it as processed
      if (!processedBrands.has(template.brand)) {
        processedBrands.add(template.brand);
        console.log(`Added car for ${template.brand} ${template.model} with image URL: ${imageData.url}`);
      }

      // Stop if we've reached the total limit
      if (totalCars >= maxCarsPerBrand) {
        break;
      }
    }

    // Add all cars to database
    const createdCars = await Car.create(allCars);
    console.log(`\nSuccessfully created ${createdCars.length} cars in the database`);

    // Log all image URLs that need to be uploaded
    console.log('\nImage URLs that need to be uploaded to Google Cloud Storage:');
    const uniqueUrls = new Set(allCars.map(car => car.images[0].url));
    uniqueUrls.forEach(url => console.log(url));
    console.log('\nPlaceholder image URL that needs to be uploaded:');
    console.log('https://storage.googleapis.com/zkhauto_bucket/car-images/placeholder-car.jpg');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding cars:', error);
    process.exit(1);
  }
}

seedCars(); 