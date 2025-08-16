// Celestial Bodies Manager for the 3D Solar System Explorer

const CelestialBodies = {
    // Scene objects
    scene: null,
    
    // Celestial bodies containers
    sun: null,
    planets: new Map(),
    moons: new Map(),
    asteroidBelt: null,
    rings: new Map(),
    
    // Initialize celestial bodies
    init: function(scene) {
        this.scene = scene;
        console.log('Initializing Celestial Bodies...');
        
        this.createSun();
        this.createPlanets();
        this.createAsteroidBelt();
        this.createRings();
        
        return this;
    },
    
    // Create the Sun
    createSun: function() {
        const sunData = CONFIG.SOLAR_SYSTEM.SUN;
        const radius = sunData.radius / CONFIG.SOLAR_SYSTEM.SCALE.SIZE;
        
        // Create sun geometry
        const geometry = new THREE.SphereGeometry(radius, 64, 64);
        
        // Create sun material
        const material = new THREE.MeshBasicMaterial({
            color: sunData.color,
            emissive: sunData.color,
            emissiveIntensity: 1.0
        });
        
        // Create sun mesh
        this.sun = new THREE.Mesh(geometry, material);
        this.sun.name = sunData.name;
        this.sun.userData = {
            type: 'sun',
            data: sunData,
            clickable: true
        };
        
        // Add sun to scene
        this.scene.add(this.sun);
        
        // Add sun light
        const sunLight = new THREE.DirectionalLight(0xffffff, 2);
        sunLight.position.copy(this.sun.position);
        sunLight.castShadow = CONFIG.RENDER.SHADOWS;
        sunLight.shadow.mapSize.width = CONFIG.RENDER.SHADOW_MAP_SIZE;
        sunLight.shadow.mapSize.height = CONFIG.RENDER.SHADOW_MAP_SIZE;
        sunLight.shadow.camera.near = 0.1;
        sunLight.shadow.camera.far = 1000;
        sunLight.shadow.camera.left = -100;
        sunLight.shadow.camera.right = 100;
        sunLight.shadow.camera.top = 100;
        sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(sunLight);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);
        
        console.log('Sun created');
    },
    
    // Create all planets
    createPlanets: function() {
        CONFIG.SOLAR_SYSTEM.PLANETS.forEach(planetData => {
            this.createPlanet(planetData);
        });
    },
    
    // Create a single planet
    createPlanet: function(planetData) {
        const radius = planetData.radius / CONFIG.SOLAR_SYSTEM.SCALE.SIZE;
        const distance = planetData.distance * CONFIG.SOLAR_SYSTEM.SCALE.DISTANCE;
        
        // Create planet geometry
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        
        // Create planet material
        const material = TextureManager.createPlanetMaterial(planetData);
        
        // Create planet mesh
        const planet = new THREE.Mesh(geometry, material);
        planet.name = planetData.name;
        planet.userData = {
            type: 'planet',
            data: planetData,
            clickable: true,
            radius: radius,
            distance: distance
        };
        
        // Set initial position
        planet.position.set(distance, 0, 0);
        
        // Add planet to scene
        this.scene.add(planet);
        this.planets.set(planetData.name, planet);
        
        // Create moons if planet has them
        if (planetData.moons > 0 && planetData.moonsData) {
            this.createMoons(planet, planetData);
        }
        
        // Create atmosphere if specified
        if (planetData.atmosphere && planetData.atmosphere !== 'Thin exosphere') {
            this.createAtmosphere(planet, planetData);
        }
        
        console.log(`Planet ${planetData.name} created`);
    },
    
    // Create moons for a planet
    createMoons: function(planet, planetData) {
        planetData.moonsData.forEach(moonData => {
            const moonRadius = moonData.radius / CONFIG.SOLAR_SYSTEM.SCALE.SIZE;
            const moonDistance = moonData.distance / CONFIG.SOLAR_SYSTEM.SCALE.SIZE;
            
            // Create moon geometry
            const geometry = new THREE.SphereGeometry(moonRadius, 16, 16);
            
            // Create moon material
            const material = new THREE.MeshStandardMaterial({
                color: moonData.color,
                roughness: 0.9,
                metalness: 0.0
            });
            
            // Create moon mesh
            const moon = new THREE.Mesh(geometry, material);
            moon.name = moonData.name;
            moon.userData = {
                type: 'moon',
                data: moonData,
                clickable: true,
                parentPlanet: planet.name,
                radius: moonRadius,
                distance: moonDistance
            };
            
            // Set moon position relative to planet
            moon.position.set(moonDistance, 0, 0);
            
            // Add moon to planet
            planet.add(moon);
            
            // Store moon reference
            const moonKey = `${planet.name}_${moonData.name}`;
            this.moons.set(moonKey, moon);
            
            console.log(`Moon ${moonData.name} created for ${planet.name}`);
        });
    },
    
    // Create atmosphere for a planet
    createAtmosphere: function(planet, planetData) {
        const atmosphereRadius = planet.userData.radius * 1.1;
        const geometry = new THREE.SphereGeometry(atmosphereRadius, 32, 32);
        
        let atmosphereColor = 0x87ceeb; // Default blue
        let opacity = 0.3;
        
        // Customize atmosphere based on planet
        switch (planetData.name) {
            case 'Venus':
                atmosphereColor = 0xffd700;
                opacity = 0.6;
                break;
            case 'Mars':
                atmosphereColor = 0xff6b35;
                opacity = 0.2;
                break;
            case 'Jupiter':
                atmosphereColor = 0xffa500;
                opacity = 0.4;
                break;
            case 'Saturn':
                atmosphereColor = 0xffd700;
                opacity = 0.3;
                break;
            case 'Uranus':
                atmosphereColor = 0x87ceeb;
                opacity = 0.4;
                break;
            case 'Neptune':
                atmosphereColor = 0x4169e1;
                opacity = 0.4;
                break;
        }
        
        const material = new THREE.MeshBasicMaterial({
            color: atmosphereColor,
            transparent: true,
            opacity: opacity,
            side: THREE.BackSide
        });
        
        const atmosphere = new THREE.Mesh(geometry, material);
        atmosphere.name = `${planetData.name}_atmosphere`;
        atmosphere.userData = {
            type: 'atmosphere',
            parentPlanet: planet.name
        };
        
        planet.add(atmosphere);
    },
    
    // Create asteroid belt
    createAsteroidBelt: function() {
        const beltData = CONFIG.SOLAR_SYSTEM.ASTEROID_BELT;
        const innerRadius = beltData.innerRadius * CONFIG.SOLAR_SYSTEM.SCALE.DISTANCE;
        const outerRadius = beltData.outerRadius * CONFIG.SOLAR_SYSTEM.SCALE.DISTANCE;
        
        // Create asteroid belt container
        this.asteroidBelt = new THREE.Group();
        this.asteroidBelt.name = 'asteroid_belt';
        this.scene.add(this.asteroidBelt);
        
        // Create asteroids
        for (let i = 0; i < beltData.count; i++) {
            const asteroid = this.createAsteroid(beltData, innerRadius, outerRadius);
            this.asteroidBelt.add(asteroid);
        }
        
        console.log('Asteroid belt created');
    },
    
    // Create a single asteroid
    createAsteroid: function(beltData, innerRadius, outerRadius) {
        // Random position in belt
        const angle = Math.random() * Math.PI * 2;
        const radius = Utils.Math.random(innerRadius, outerRadius);
        const height = Utils.Math.random(-1000, 1000);
        
        // Random size
        const size = Utils.Math.random(beltData.sizeRange[0], beltData.sizeRange[1]);
        
        // Create asteroid geometry
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        
        // Create asteroid material
        const material = new THREE.MeshStandardMaterial({
            color: beltData.color,
            roughness: 0.9,
            metalness: 0.0
        });
        
        // Create asteroid mesh
        const asteroid = new THREE.Mesh(geometry, material);
        asteroid.userData = {
            type: 'asteroid',
            size: size
        };
        
        // Set position
        asteroid.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        
        return asteroid;
    },
    
    // Create planetary rings
    createRings: function() {
        CONFIG.SOLAR_SYSTEM.PLANETS.forEach(planetData => {
            if (planetData.rings && planetData.ringsData) {
                this.createPlanetaryRings(planetData);
            }
        });
    },
    
    // Create rings for a specific planet
    createPlanetaryRings: function(planetData) {
        const planet = this.planets.get(planetData.name);
        if (!planet) return;
        
        const ringData = planetData.ringsData;
        const innerRadius = ringData.innerRadius / CONFIG.SOLAR_SYSTEM.SCALE.SIZE;
        const outerRadius = ringData.outerRadius / CONFIG.SOLAR_SYSTEM.SCALE.SIZE;
        
        // Create ring geometry
        const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        
        // Create ring material
        TextureManager.createRingMaterial(ringData).then(material => {
            const ring = new THREE.Mesh(geometry, material);
            ring.name = `${planetData.name}_rings`;
            ring.userData = {
                type: 'rings',
                parentPlanet: planet.name
            };
            
            // Rotate ring to match planet's axial tilt
            ring.rotation.x = Utils.Math.degToRad(planetData.axialTilt || 0);
            
            planet.add(ring);
            
            // Store ring reference
            this.rings.set(planetData.name, ring);
            
            console.log(`Rings created for ${planetData.name}`);
        });
    },
    
    // Update celestial bodies (animation)
    update: function(deltaTime, timeSpeed) {
        const scaledTime = deltaTime * timeSpeed * CONFIG.SOLAR_SYSTEM.SCALE.TIME;
        
        // Update sun rotation
        if (this.sun) {
            this.sun.rotation.y += scaledTime / CONFIG.SOLAR_SYSTEM.SUN.rotationPeriod;
        }
        
        // Update planets
        this.planets.forEach((planet, planetName) => {
            const planetData = planet.userData.data;
            
            // Update planet rotation
            planet.rotation.y += scaledTime / planetData.rotationPeriod;
            
            // Update planet orbit
            const orbitalSpeed = scaledTime / planetData.orbitalPeriod;
            const distance = planet.userData.distance;
            const currentAngle = Math.atan2(planet.position.z, planet.position.x);
            const newAngle = currentAngle + orbitalSpeed;
            
            planet.position.x = Math.cos(newAngle) * distance;
            planet.position.z = Math.sin(newAngle) * distance;
            
            // Update moons
            if (planetData.moons > 0) {
                this.updateMoons(planet, scaledTime);
            }
        });
        
        // Update asteroid belt rotation
        if (this.asteroidBelt) {
            this.asteroidBelt.rotation.y += scaledTime * 0.001;
        }
    },
    
    // Update moons
    updateMoons: function(planet, scaledTime) {
        const planetData = planet.userData.data;
        
        planetData.moonsData.forEach(moonData => {
            const moonKey = `${planet.name}_${moonData.name}`;
            const moon = this.moons.get(moonKey);
            
            if (moon) {
                // Update moon rotation
                moon.rotation.y += scaledTime / moonData.rotationPeriod;
                
                // Update moon orbit
                const orbitalSpeed = scaledTime / moonData.orbitalPeriod;
                const distance = moon.userData.distance;
                const currentAngle = Math.atan2(moon.position.z, moon.position.x);
                const newAngle = currentAngle + orbitalSpeed;
                
                moon.position.x = Math.cos(newAngle) * distance;
                moon.position.z = Math.sin(newAngle) * distance;
            }
        });
    },
    
    // Get celestial body by name
    getBody: function(name) {
        if (name === 'Sun') return this.sun;
        if (this.planets.has(name)) return this.planets.get(name);
        
        // Search in moons
        for (const [moonKey, moon] of this.moons) {
            if (moon.name === name) return moon;
        }
        
        return null;
    },
    
    // Get all clickable objects
    getClickableObjects: function() {
        const clickable = [];
        
        if (this.sun) clickable.push(this.sun);
        
        this.planets.forEach(planet => {
            clickable.push(planet);
        });
        
        this.moons.forEach(moon => {
            clickable.push(moon);
        });
        
        return clickable;
    },
    
    // Get planet info for display
    getPlanetInfo: function(planetName) {
        const planet = this.planets.get(planetName);
        if (!planet) return null;
        
        const data = planet.userData.data;
        const moons = data.moonsData || [];
        
        return {
            name: data.name,
            type: data.type,
            radius: `${(data.radius / 1000).toFixed(1)} km`,
            distance: `${(data.distance / 149597870.7).toFixed(2)} AU`,
            mass: data.mass,
            discovery: data.discovery,
            atmosphere: data.atmosphere,
            moons: moons.length,
            moonsList: moons.map(moon => moon.name),
            rotationPeriod: `${Math.abs(data.rotationPeriod)} days`,
            orbitalPeriod: `${data.orbitalPeriod} days`,
            axialTilt: `${data.axialTilt}°`
        };
    },
    
    // Get moon info for display
    getMoonInfo: function(moonName, planetName) {
        const moonKey = `${planetName}_${moonName}`;
        const moon = this.moons.get(moonKey);
        if (!moon) return null;
        
        const data = moon.userData.data;
        
        return {
            name: data.name,
            type: 'Moon',
            radius: `${(data.radius / 1000).toFixed(1)} km`,
            distance: `${(data.distance / 1000).toFixed(0)} km from ${planetName}`,
            mass: data.mass,
            discovery: data.discovery,
            rotationPeriod: `${Math.abs(data.rotationPeriod)} days`,
            orbitalPeriod: `${data.orbitalPeriod} days`
        };
    },
    
    // Clean up resources
    dispose: function() {
        // Dispose geometries and materials
        if (this.sun) {
            this.sun.geometry.dispose();
            this.sun.material.dispose();
        }
        
        this.planets.forEach(planet => {
            planet.geometry.dispose();
            planet.material.dispose();
        });
        
        this.moons.forEach(moon => {
            moon.geometry.dispose();
            moon.material.dispose();
        });
        
        // Clear maps
        this.planets.clear();
        this.moons.clear();
        this.rings.clear();
        
        console.log('Celestial bodies disposed');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CelestialBodies;
}