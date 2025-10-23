import fs from 'fs';
import path from 'path';

const inputDir = './input';
const outputFile = './car_urls.json';

// Get all JSON files from input directory (excluding car_urls.json if it exists)
const jsonFiles = fs.readdirSync(inputDir)
  .filter(file => file.endsWith('.json') && file !== 'car_urls.json')
  .map(file => path.join(inputDir, file));

console.log(`Found ${jsonFiles.length} JSON files:`);
jsonFiles.forEach(file => console.log(`  - ${path.basename(file)}`));

// Read and merge all JSON files
const allCars = jsonFiles.flatMap(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`  ${path.basename(file)}: ${data.length} cars`);
  return data;
});

// Remove duplicates based on detail_url
const uniqueCars = Array.from(
  new Map(allCars.map(car => [car.detail_url, car])).values()
);

console.log(`\nTotal cars collected: ${allCars.length}`);
console.log(`Unique cars (after deduplication): ${uniqueCars.length}`);
console.log(`Duplicates removed: ${allCars.length - uniqueCars.length}`);

// Save merged file
fs.writeFileSync(outputFile, JSON.stringify(uniqueCars, null, 2));
console.log(`\nSaved to: ${outputFile}`);
