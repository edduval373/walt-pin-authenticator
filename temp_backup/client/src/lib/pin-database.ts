// Mock database of authentic Disney pins
// In a real app, this would be fetched from the backend

import { RgbColor } from './color-analysis';

export interface PinData {
  pinId: string;
  name: string;
  series: string;
  releaseYear: number;
  imageUrl: string;
  dominantColors: RgbColor[];
  similarPins: string[];
}

const pins: PinData[] = [
  {
    pinId: 'DLP-2018-042',
    name: 'Mickey Mouse Classic',
    series: 'Limited Edition Series',
    releaseYear: 2018,
    imageUrl: 'https://cdn.pixabay.com/photo/2015/10/12/15/46/pin-984072_1280.jpg',
    dominantColors: [
      { r: 30, g: 30, b: 30 }, // Black
      { r: 220, g: 40, b: 40 }, // Red
      { r: 255, g: 215, b: 0 }, // Gold
      { r: 255, g: 255, b: 255 } // White
    ],
    similarPins: ['DLP-2017-021', 'DLP-2019-007', 'WDW-2018-105']
  },
  {
    pinId: 'DLP-2017-021',
    name: 'Mickey Mouse Anniversary',
    series: 'Celebration Collection',
    releaseYear: 2017,
    imageUrl: 'https://cdn.pixabay.com/photo/2020/05/31/19/35/mickey-mouse-5244740_1280.jpg',
    dominantColors: [
      { r: 25, g: 25, b: 25 }, // Black
      { r: 230, g: 30, b: 30 }, // Red
      { r: 250, g: 210, b: 0 } // Gold
    ],
    similarPins: ['DLP-2018-042', 'WDW-2018-105', 'DLP-2019-007']
  },
  {
    pinId: 'WDW-2018-105',
    name: 'Mickey & Friends',
    series: 'Walt Disney World Collection',
    releaseYear: 2018,
    imageUrl: 'https://cdn.pixabay.com/photo/2020/05/31/19/35/mickey-mouse-5244740_1280.jpg',
    dominantColors: [
      { r: 30, g: 30, b: 30 }, // Black
      { r: 230, g: 30, b: 30 }, // Red
      { r: 255, g: 255, b: 255 }, // White
      { r: 80, g: 180, b: 230 } // Blue
    ],
    similarPins: ['DLP-2018-042', 'DLP-2017-021', 'DLP-2019-007']
  },
  {
    pinId: 'DLP-2019-007',
    name: 'Mickey Mouse Sparkle',
    series: 'Limited Edition Series',
    releaseYear: 2019,
    imageUrl: 'https://cdn.pixabay.com/photo/2022/02/19/16/10/art-7022599_1280.jpg',
    dominantColors: [
      { r: 20, g: 20, b: 20 }, // Black
      { r: 240, g: 30, b: 30 }, // Red
      { r: 240, g: 200, b: 0 }, // Gold
      { r: 255, g: 255, b: 255 } // White
    ],
    similarPins: ['DLP-2018-042', 'DLP-2017-021', 'WDW-2018-105']
  },
  {
    pinId: 'WDW-2020-033',
    name: 'Donald Duck Classic',
    series: 'Character Collection',
    releaseYear: 2020,
    imageUrl: 'https://cdn.pixabay.com/photo/2022/02/19/16/10/art-7022599_1280.jpg',
    dominantColors: [
      { r: 255, g: 255, b: 255 }, // White
      { r: 30, g: 90, b: 200 }, // Blue
      { r: 240, g: 160, b: 0 } // Gold/Yellow
    ],
    similarPins: ['WDW-2019-054', 'DLP-2020-012']
  },
  {
    pinId: 'WDW-2019-054',
    name: 'Donald Duck Anniversary',
    series: 'Celebration Collection',
    releaseYear: 2019,
    imageUrl: 'https://cdn.pixabay.com/photo/2022/02/19/16/10/art-7022599_1280.jpg',
    dominantColors: [
      { r: 255, g: 255, b: 255 }, // White
      { r: 40, g: 100, b: 210 }, // Blue
      { r: 230, g: 150, b: 0 } // Gold/Yellow
    ],
    similarPins: ['WDW-2020-033', 'DLP-2020-012']
  },
  {
    pinId: 'DLP-2020-012',
    name: 'Donald & Daisy',
    series: 'Couples Series',
    releaseYear: 2020,
    imageUrl: 'https://cdn.pixabay.com/photo/2020/05/31/19/35/mickey-mouse-5244740_1280.jpg',
    dominantColors: [
      { r: 255, g: 255, b: 255 }, // White
      { r: 40, g: 100, b: 210 }, // Blue
      { r: 230, g: 150, b: 0 }, // Gold/Yellow
      { r: 255, g: 180, b: 210 } // Pink
    ],
    similarPins: ['WDW-2020-033', 'WDW-2019-054']
  },
  {
    pinId: 'DLP-2021-005',
    name: 'Minnie Mouse Bow',
    series: 'Fashion Collection',
    releaseYear: 2021,
    imageUrl: 'https://cdn.pixabay.com/photo/2022/02/19/16/10/art-7022599_1280.jpg',
    dominantColors: [
      { r: 20, g: 20, b: 20 }, // Black
      { r: 255, g: 30, b: 70 }, // Pink/Red
      { r: 255, g: 255, b: 255 }, // White
      { r: 240, g: 200, b: 0 } // Gold
    ],
    similarPins: ['DLP-2020-024', 'WDW-2021-011']
  },
  {
    pinId: 'DLP-2020-024',
    name: 'Minnie Mouse Classic',
    series: 'Character Collection',
    releaseYear: 2020,
    imageUrl: 'https://cdn.pixabay.com/photo/2020/05/31/19/35/mickey-mouse-5244740_1280.jpg',
    dominantColors: [
      { r: 20, g: 20, b: 20 }, // Black
      { r: 255, g: 40, b: 80 }, // Pink/Red
      { r: 255, g: 255, b: 255 } // White
    ],
    similarPins: ['DLP-2021-005', 'WDW-2021-011']
  },
  {
    pinId: 'WDW-2021-011',
    name: 'Minnie & Mickey',
    series: 'Couples Series',
    releaseYear: 2021,
    imageUrl: 'https://cdn.pixabay.com/photo/2022/02/19/16/10/art-7022599_1280.jpg',
    dominantColors: [
      { r: 20, g: 20, b: 20 }, // Black
      { r: 220, g: 40, b: 40 }, // Red
      { r: 255, g: 40, b: 80 }, // Pink
      { r: 255, g: 255, b: 255 } // White
    ],
    similarPins: ['DLP-2021-005', 'DLP-2020-024', 'DLP-2018-042']
  }
];

// Export functions to interact with the pin database
export function getPinById(id: string): PinData {
  const pin = pins.find(pin => pin.pinId === id);
  
  if (!pin) {
    // Return a default pin if not found
    return {
      pinId: 'unknown',
      name: 'Unknown Pin',
      series: 'Unidentified Series',
      releaseYear: 0,
      imageUrl: 'https://cdn.pixabay.com/photo/2022/02/19/16/10/art-7022599_1280.jpg',
      dominantColors: [],
      similarPins: []
    };
  }
  
  return pin;
}

export function getAllPins(): PinData[] {
  return pins;
}

// Find pins with similar color profiles
export function findSimilarPins(colors: RgbColor[], limit: number = 3): PinData[] {
  // Implementation details omitted for brevity
  // In a real app, this would use a similarity algorithm
  
  // For the MVP, we'll return a random selection of pins
  const shuffled = [...pins].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, limit);
}

// Add this to allow server-side to fetch the pin database
export const pinDatabase = pins;
