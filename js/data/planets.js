export const AU_KM = 149597870.7;

// Scaled units for visualization
export const DISTANCE_SCALE = 1 / (AU_KM * 1e-6); // kilometers -> world units (tuned)
export const RADIUS_SCALE = 1 / 3000; // kilometers -> world units

// One simulation day length in real seconds at timeScale = 1
export const BASE_SECONDS_PER_SIM_DAY = 4; // 1 day every 4 seconds (adjustable)

// Texture sources use three.js example textures (derived from NASA data)
const TEX_BASE = 'https://raw.githubusercontent.com/mrdoob/three.js/r161/examples/textures/planets/';

export const PLANETS = [
  {
    key: 'mercury', name: 'Mercury', radiusKm: 2439.7, distanceAu: 0.39, orbitDays: 88, rotationHours: 1407.6, tiltDeg: 0.03,
    texture: TEX_BASE + 'mercury.jpg', moons: 0, color: 0xb1b1b1,
    info: { atmosphere: 'None', discovered: 'Ancient', more: 'Smallest planet; closest to the Sun.' }
  },
  {
    key: 'venus', name: 'Venus', radiusKm: 6051.8, distanceAu: 0.72, orbitDays: 224.7, rotationHours: -5832.5, tiltDeg: 177.4,
    texture: TEX_BASE + 'venus.jpg', moons: 0, color: 0xd6c0a4,
    info: { atmosphere: 'CO₂, N₂, SO₂', discovered: 'Ancient', more: 'Hottest planet due to runaway greenhouse effect.' }
  },
  {
    key: 'earth', name: 'Earth', radiusKm: 6371, distanceAu: 1.0, orbitDays: 365.256, rotationHours: 24, tiltDeg: 23.44,
    texture: TEX_BASE + 'earth_atmos_2048.jpg', normalMap: TEX_BASE + 'earth_normal_2048.jpg', specularMap: TEX_BASE + 'earth_specular_2048.jpg',
    nightMap: TEX_BASE + 'earth_lights_2048.png', cloudsMap: TEX_BASE + 'earth_clouds_1024.png', moons: 1, color: 0x88aaff,
    info: { atmosphere: 'N₂, O₂, Ar, CO₂', discovered: '—', more: 'Our home. Only known planet with life.' }
  },
  {
    key: 'mars', name: 'Mars', radiusKm: 3389.5, distanceAu: 1.52, orbitDays: 686.98, rotationHours: 24.6, tiltDeg: 25.19,
    texture: TEX_BASE + 'mars_1k_color.jpg', moons: 2, color: 0xcc5533,
    info: { atmosphere: 'CO₂, N₂, Ar', discovered: 'Ancient', more: 'The Red Planet with the largest volcano, Olympus Mons.' }
  },
  {
    key: 'jupiter', name: 'Jupiter', radiusKm: 69911, distanceAu: 5.2, orbitDays: 4332.59, rotationHours: 9.9, tiltDeg: 3.13,
    texture: TEX_BASE + 'jupiter.jpg', moons: 95, color: 0xe0c8a0,
    info: { atmosphere: 'H₂, He', discovered: 'Ancient', more: 'Gas giant with the Great Red Spot.' }
  },
  {
    key: 'saturn', name: 'Saturn', radiusKm: 58232, distanceAu: 9.58, orbitDays: 10759.22, rotationHours: 10.7, tiltDeg: 26.73,
    texture: TEX_BASE + 'saturn.jpg', ringTexture: TEX_BASE + 'saturnring.png', ringInnerKm: 74500, ringOuterKm: 140220, moons: 146, color: 0xffe4b0,
    info: { atmosphere: 'H₂, He', discovered: 'Ancient', more: 'Spectacular ring system.' }
  },
  {
    key: 'uranus', name: 'Uranus', radiusKm: 25362, distanceAu: 19.2, orbitDays: 30688.5, rotationHours: -17.2, tiltDeg: 97.77,
    texture: TEX_BASE + 'uranus.jpg', ringTexture: TEX_BASE + 'saturnring.png', ringInnerKm: 38000, ringOuterKm: 51000, moons: 28, color: 0xa0e0ff,
    info: { atmosphere: 'H₂, He, CH₄', discovered: '1781 (Herschel)', more: 'Rotates on its side.' }
  },
  {
    key: 'neptune', name: 'Neptune', radiusKm: 24622, distanceAu: 30.05, orbitDays: 60182, rotationHours: 16.1, tiltDeg: 28.32,
    texture: TEX_BASE + 'neptune.jpg', ringTexture: TEX_BASE + 'saturnring.png', ringInnerKm: 42000, ringOuterKm: 63000, moons: 16, color: 0x6aa6ff,
    info: { atmosphere: 'H₂, He, CH₄', discovered: '1846 (Galle, d\'Arrest, Le Verrier)', more: 'Farthest known planet.' }
  }
];

export const SUN = {
  name: 'Sun', radiusKm: 696340, texture: TEX_BASE + 'sun.jpg', color: 0xffcc66
};

export const ASTEROID_BELT = {
  minAu: 2.2, maxAu: 3.2, count: 3000, minSizeKm: 1, maxSizeKm: 8
};