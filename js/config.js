// Configuration file for the 3D Solar System Explorer
const CONFIG = {
    // Rendering settings
    RENDER: {
        FOV: 75,
        NEAR: 0.1,
        FAR: 1000000,
        SHADOW_MAP_SIZE: 2048,
        ANTIALIAS: true,
        SHADOWS: true
    },

    // Camera settings
    CAMERA: {
        INITIAL_DISTANCE: 100,
        MIN_DISTANCE: 1,
        MAX_DISTANCE: 500000,
        PAN_SPEED: 1.0,
        ROTATE_SPEED: 1.0,
        ZOOM_SPEED: 1.0
    },

    // Time settings
    TIME: {
        BASE_SPEED: 1,
        MAX_SPEED: 1000,
        PAUSE_SPEED: 0,
        DEFAULT_SPEED: 100
    },

    // Solar System data (scaled for visibility)
    SOLAR_SYSTEM: {
        SCALE: {
            DISTANCE: 0.0001, // Scale factor for distances
            SIZE: 1000,        // Scale factor for planet sizes
            TIME: 0.0001       // Scale factor for orbital periods
        },
        
        SUN: {
            name: "Sun",
            radius: 696340, // km
            distance: 0,
            color: 0xffff00,
            texture: "sun.jpg",
            rotationPeriod: 25.05, // days
            temperature: "5,778 K",
            mass: "1.989 × 10^30 kg",
            type: "Yellow Dwarf",
            discovery: "Ancient",
            atmosphere: "Plasma",
            moons: 0
        },

        PLANETS: [
            {
                name: "Mercury",
                radius: 2439.7,
                distance: 57909175,
                color: 0x8c7853,
                texture: "mercury.jpg",
                rotationPeriod: 58.646,
                orbitalPeriod: 87.969,
                mass: "3.285 × 10^23 kg",
                type: "Terrestrial",
                discovery: "Ancient",
                atmosphere: "Thin exosphere",
                moons: 0,
                rings: false,
                axialTilt: 0.034
            },
            {
                name: "Venus",
                radius: 6051.8,
                distance: 108208930,
                color: 0xe39e1c,
                texture: "venus.jpg",
                rotationPeriod: -243.025,
                orbitalPeriod: 224.701,
                mass: "4.867 × 10^24 kg",
                type: "Terrestrial",
                discovery: "Ancient",
                atmosphere: "CO2, N2",
                moons: 0,
                rings: false,
                axialTilt: 177.4
            },
            {
                name: "Earth",
                radius: 6371,
                distance: 149597870,
                color: 0x6b93d6,
                texture: "earth_day.jpg",
                nightTexture: "earth_night.jpg",
                rotationPeriod: 0.997,
                orbitalPeriod: 365.256,
                mass: "5.972 × 10^24 kg",
                type: "Terrestrial",
                discovery: "Ancient",
                atmosphere: "N2, O2, Ar",
                moons: 1,
                rings: false,
                axialTilt: 23.44,
                moonsData: [
                    {
                        name: "Moon",
                        radius: 1737.4,
                        distance: 384400,
                        color: 0x8c8c8c,
                        texture: "moon.jpg",
                        rotationPeriod: 27.322,
                        orbitalPeriod: 27.322,
                        mass: "7.342 × 10^22 kg",
                        discovery: "Ancient"
                    }
                ]
            },
            {
                name: "Mars",
                radius: 3389.5,
                distance: 227943824,
                color: 0xc1440e,
                texture: "mars.jpg",
                rotationPeriod: 1.026,
                orbitalPeriod: 686.971,
                mass: "6.39 × 10^23 kg",
                type: "Terrestrial",
                discovery: "Ancient",
                atmosphere: "CO2, N2, Ar",
                moons: 2,
                rings: false,
                axialTilt: 25.19,
                moonsData: [
                    {
                        name: "Phobos",
                        radius: 11.267,
                        distance: 9376,
                        color: 0x8c8c8c,
                        texture: "phobos.jpg",
                        rotationPeriod: 0.319,
                        orbitalPeriod: 0.319,
                        mass: "1.0659 × 10^16 kg",
                        discovery: "1877"
                    },
                    {
                        name: "Deimos",
                        radius: 6.2,
                        distance: 23463,
                        color: 0x8c8c8c,
                        texture: "deimos.jpg",
                        rotationPeriod: 1.263,
                        orbitalPeriod: 1.263,
                        mass: "1.4762 × 10^15 kg",
                        discovery: "1877"
                    }
                ]
            },
            {
                name: "Jupiter",
                radius: 69911,
                distance: 778570000,
                color: 0xd8ca9d,
                texture: "jupiter.jpg",
                rotationPeriod: 0.414,
                orbitalPeriod: 4332.59,
                mass: "1.898 × 10^27 kg",
                type: "Gas Giant",
                discovery: "Ancient",
                atmosphere: "H2, He",
                moons: 79,
                rings: true,
                axialTilt: 3.13,
                moonsData: [
                    {
                        name: "Io",
                        radius: 1821.6,
                        distance: 421800,
                        color: 0x8c8c8c,
                        texture: "io.jpg",
                        rotationPeriod: 1.769,
                        orbitalPeriod: 1.769,
                        mass: "8.932 × 10^22 kg",
                        discovery: "1610"
                    },
                    {
                        name: "Europa",
                        radius: 1560.8,
                        distance: 671100,
                        color: 0x8c8c8c,
                        texture: "europa.jpg",
                        rotationPeriod: 3.551,
                        orbitalPeriod: 3.551,
                        mass: "4.800 × 10^22 kg",
                        discovery: "1610"
                    },
                    {
                        name: "Ganymede",
                        radius: 2634.1,
                        distance: 1070400,
                        color: 0x8c8c8c,
                        texture: "ganymede.jpg",
                        rotationPeriod: 7.155,
                        orbitalPeriod: 7.155,
                        mass: "1.482 × 10^23 kg",
                        discovery: "1610"
                    },
                    {
                        name: "Callisto",
                        radius: 2410.3,
                        distance: 1882700,
                        color: 0x8c8c8c,
                        texture: "callisto.jpg",
                        rotationPeriod: 16.689,
                        orbitalPeriod: 16.689,
                        mass: "1.076 × 10^23 kg",
                        discovery: "1610"
                    }
                ]
            },
            {
                name: "Saturn",
                radius: 58232,
                distance: 1433449370,
                color: 0xfad5a5,
                texture: "saturn.jpg",
                rotationPeriod: 0.444,
                orbitalPeriod: 10759.22,
                mass: "5.683 × 10^26 kg",
                type: "Gas Giant",
                discovery: "Ancient",
                atmosphere: "H2, He",
                moons: 82,
                rings: true,
                axialTilt: 26.73,
                ringsData: {
                    innerRadius: 66900,
                    outerRadius: 140390,
                    texture: "saturn_rings.jpg"
                }
            },
            {
                name: "Uranus",
                radius: 25362,
                distance: 2876679082,
                color: 0x4fd0e7,
                texture: "uranus.jpg",
                rotationPeriod: -0.718,
                orbitalPeriod: 30688.5,
                mass: "8.681 × 10^25 kg",
                type: "Ice Giant",
                discovery: "1781",
                atmosphere: "H2, He, CH4",
                moons: 27,
                rings: true,
                axialTilt: 97.77
            },
            {
                name: "Neptune",
                radius: 24622,
                distance: 4498396441,
                color: 0x4b70dd,
                texture: "uranus.jpg", // Using Uranus texture as placeholder
                rotationPeriod: 0.671,
                orbitalPeriod: 60182,
                mass: "1.024 × 10^26 kg",
                type: "Ice Giant",
                discovery: "1846",
                atmosphere: "H2, He, CH4",
                moons: 14,
                rings: true,
                axialTilt: 28.32
            }
        ],

        ASTEROID_BELT: {
            innerRadius: 329115000,
            outerRadius: 478719000,
            count: 1000,
            sizeRange: [0.1, 10],
            color: 0x8c8c8c,
            texture: "asteroid.jpg"
        }
    },

    // Galaxy settings
    GALAXY: {
        SPIRAL_ARMS: 4,
        STAR_COUNT: 10000,
        DUST_CLOUDS: 50,
        NEARBY_GALAXIES: [
            {
                name: "Andromeda",
                distance: 2540000,
                type: "Spiral",
                size: 110000
            },
            {
                name: "Triangulum",
                distance: 3000000,
                type: "Spiral",
                size: 50000
            }
        ]
    },

    // Earth view settings
    EARTH: {
        MAX_ZOOM: 1000,
        MIN_ZOOM: 100,
        CITY_LIGHTS: true,
        ATMOSPHERE: true,
        CLOUDS: true,
        LOCATIONS: {
            "New York": { lat: 40.7128, lon: -74.0060, name: "New York City" },
            "London": { lat: 51.5074, lon: -0.1278, name: "London" },
            "Tokyo": { lat: 35.6762, lon: 139.6503, name: "Tokyo" },
            "Sydney": { lat: -33.8688, lon: 151.2093, name: "Sydney" },
            "Paris": { lat: 48.8566, lon: 2.3522, name: "Paris" },
            "Moscow": { lat: 55.7558, lon: 37.6176, name: "Moscow" },
            "Cairo": { lat: 30.0444, lon: 31.2357, name: "Cairo" },
            "Rio de Janeiro": { lat: -22.9068, lon: -43.1729, name: "Rio de Janeiro" },
            "Mount Everest": { lat: 27.9881, lon: 86.9250, name: "Mount Everest" },
            "Grand Canyon": { lat: 36.1069, lon: -112.1129, name: "Grand Canyon" }
        }
    },

    // Easter eggs
    EASTER_EGGS: [
        {
            name: "Voyager 1",
            description: "The farthest human-made object from Earth",
            trigger: "Click on Neptune 3 times",
            model: "voyager1.glb"
        },
        {
            name: "James Webb Telescope",
            description: "The most powerful space telescope ever built",
            trigger: "Click on Jupiter 5 times",
            model: "james_webb.glb"
        },
        {
            name: "ISS",
            description: "International Space Station orbiting Earth",
            trigger: "Zoom into Earth's low orbit",
            model: "iss.glb"
        }
    ],

    // Audio settings
    AUDIO: {
        BACKGROUND_MUSIC: "space_ambient.mp3",
        PLANET_SOUNDS: {
            "Earth": "earth_wind.mp3",
            "Jupiter": "jupiter_radio.mp3",
            "Saturn": "saturn_rings.mp3"
        },
        UI_SOUNDS: {
            "click": "ui_click.mp3",
            "hover": "ui_hover.mp3",
            "transition": "view_transition.mp3"
        }
    },

    // Performance settings
    PERFORMANCE: {
        LOD_DISTANCES: [100, 500, 1000, 5000],
        MAX_PARTICLES: 10000,
        SHADOW_QUALITY: "medium", // low, medium, high
        TEXTURE_QUALITY: "high",  // low, medium, high
        FRUSTUM_CULLING: true,
        OCCLUSION_CULLING: true
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}