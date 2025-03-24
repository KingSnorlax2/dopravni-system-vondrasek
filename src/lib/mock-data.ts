// Common Czech car brands and models
const carBrands = [
  { brand: "Škoda", models: ["Octavia", "Fabia", "Superb", "Kodiaq", "Karoq", "Scala"] },
  { brand: "Volkswagen", models: ["Golf", "Passat", "Polo", "Tiguan", "T-Roc", "ID.4"] },
  { brand: "Toyota", models: ["Corolla", "Yaris", "RAV4", "Camry", "C-HR", "Aygo"] },
  { brand: "Hyundai", models: ["i30", "Tucson", "i20", "Kona", "i10", "Bayon"] },
  { brand: "Kia", models: ["Ceed", "Sportage", "Rio", "Stonic", "Sorento", "Niro"] },
  { brand: "Ford", models: ["Focus", "Fiesta", "Kuga", "Puma", "Mondeo", "Transit"] },
  { brand: "Renault", models: ["Clio", "Megane", "Captur", "Kadjar", "Arkana", "Talisman"] },
  { brand: "Peugeot", models: ["208", "308", "2008", "3008", "5008", "508"] },
];

// Generate a random SPZ (Czech license plate)
function generateSPZ(): string {
  const regions = ["A", "B", "C", "E", "H", "J", "K", "L", "M", "P", "S", "T", "U", "Z"];
  const region = regions[Math.floor(Math.random() * regions.length)];
  const numbers = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const letters = "ABCDEFGHJKLMNPRSTVXYZ";
  const letter1 = letters[Math.floor(Math.random() * letters.length)];
  const letter2 = letters[Math.floor(Math.random() * letters.length)];
  
  return `${region}${numbers}${letter1}${letter2}`;
}

// Generate a random date within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate a random location in the Czech Republic
function generateRandomLocation() {
  // Approximate boundaries of the Czech Republic
  const minLat = 48.5;
  const maxLat = 51.1;
  const minLng = 12.1;
  const maxLng = 18.9;
  
  const latitude = minLat + Math.random() * (maxLat - minLat);
  const longitude = minLng + Math.random() * (maxLng - minLng);
  
  return {
    latitude: parseFloat(latitude.toFixed(6)),
    longitude: parseFloat(longitude.toFixed(6))
  };
}

// Generate random vehicle data
export function generateRandomVehicleData(count = 1) {
  const vehicles = [];
  
  for (let i = 0; i < count; i++) {
    // Select random brand and model
    const brandData = carBrands[Math.floor(Math.random() * carBrands.length)];
    const model = brandData.models[Math.floor(Math.random() * brandData.models.length)];
    
    // Generate year between 2000 and current year
    const currentYear = new Date().getFullYear();
    const year = Math.floor(Math.random() * (currentYear - 2000 + 1)) + 2000;
    
    // Generate random mileage (10,000 to 250,000 km)
    const mileage = Math.floor(Math.random() * 240000) + 10000;
    
    // Random status
    const statuses = ["aktivní", "servis", "vyřazeno"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // STK date (1-2 years in the future from a random date in the past 3 years)
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setFullYear(today.getFullYear() - 3);
    const randomPastDate = randomDate(pastDate, today);
    const stkDate = new Date(randomPastDate);
    stkDate.setFullYear(stkDate.getFullYear() + Math.floor(Math.random() * 2) + 1);
    
    // Add location data
    const location = generateRandomLocation();
    
    // Generate a vehicle object
    vehicles.push({
      spz: generateSPZ(),
      znacka: brandData.brand,
      model,
      rokVyroby: year,
      najezd: mileage,
      stav: status,
      datumSTK: stkDate.toISOString(),
      poznamka: Math.random() > 0.5 ? `Testovací vozidlo č. ${i+1}` : "",
      latitude: location.latitude,
      longitude: location.longitude,
      lastUpdate: new Date().toISOString()
    });
  }
  
  return count === 1 ? vehicles[0] : vehicles;
}

// Function to generate mock location data for existing vehicles
export function generateLocationDataForVehicles(vehicles: any[]) {
  return vehicles.map((vehicle: any) => {
    const location = generateRandomLocation();
    return {
      ...vehicle,
      latitude: location.latitude,
      longitude: location.longitude,
      lastUpdate: new Date().toISOString()
    };
  });
} 