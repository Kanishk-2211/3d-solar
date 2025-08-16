// Texture manager for the 3D Solar System Explorer

const TextureManager = {
    // Texture cache
    cache: new Map(),
    
    // Loading promises
    loadingPromises: new Map(),
    
    // Default textures (fallbacks)
    defaultTextures: {
        sun: { color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1.0 },
        mercury: { color: 0x8c7853, roughness: 0.8, metalness: 0.1 },
        venus: { color: 0xe39e1c, roughness: 0.7, metalness: 0.1 },
        earth: { color: 0x6b93d6, roughness: 0.3, metalness: 0.1 },
        earth_night: { color: 0x1a1a1a, emissive: 0x333333, emissiveIntensity: 0.3 },
        mars: { color: 0xc1440e, roughness: 0.8, metalness: 0.1 },
        jupiter: { color: 0xd8ca9d, roughness: 0.6, metalness: 0.1 },
        saturn: { color: 0xfad5a5, roughness: 0.5, metalness: 0.1 },
        uranus: { color: 0x4fd0e7, roughness: 0.4, metalness: 0.2 },
        neptune: { color: 0x4b70dd, roughness: 0.4, metalness: 0.2 },
        moon: { color: 0x8c8c8c, roughness: 0.9, metalness: 0.0 },
        phobos: { color: 0x8c8c8c, roughness: 0.9, metalness: 0.0 },
        deimos: { color: 0x8c8c8c, roughness: 0.9, metalness: 0.0 },
        io: { color: 0x8c8c8c, roughness: 0.8, metalness: 0.0 },
        europa: { color: 0x8c8c8c, roughness: 0.8, metalness: 0.0 },
        ganymede: { color: 0x8c8c8c, roughness: 0.8, metalness: 0.0 },
        callisto: { color: 0x8c8c8c, roughness: 0.8, metalness: 0.0 },
        asteroid: { color: 0x8c8c8c, roughness: 0.9, metalness: 0.0 },
        saturn_rings: { color: 0xfad5a5, transparent: true, opacity: 0.8 }
    },
    
    // NASA/JPL texture URLs (high resolution)
    textureUrls: {
        sun: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_sun.jpg",
        mercury: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_mercury.jpg",
        venus: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_venus_atmosphere.jpg",
        earth_day: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_earth_daymap.jpg",
        earth_night: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_earth_nightmap.jpg",
        earth_specular: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_earth_specular_map.jpg",
        earth_clouds: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_earth_clouds.jpg",
        mars: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_mars.jpg",
        jupiter: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_jupiter.jpg",
        saturn: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_saturn.jpg",
        saturn_rings: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_saturn_rings.jpg",
        uranus: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_uranus.jpg",
        neptune: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_neptune.jpg",
        moon: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_moon.jpg",
        phobos: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_phobos.jpg",
        deimos: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_deimos.jpg",
        io: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_io.jpg",
        europa: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_europa.jpg",
        ganymede: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_ganymede.jpg",
        callisto: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_callisto.jpg",
        asteroid: "https://raw.githubusercontent.com/turban/webgl-earth/master/images/2k_asteroid.jpg"
    },
    
    // Initialize texture manager
    init: function() {
        console.log('Initializing Texture Manager...');
        this.createDefaultMaterials();
    },
    
    // Create default materials for fallback
    createDefaultMaterials: function() {
        Object.keys(this.defaultTextures).forEach(key => {
            const material = this.createDefaultMaterial(key);
            this.cache.set(key, material);
        });
    },
    
    // Create default material from fallback data
    createDefaultMaterial: function(textureName) {
        const defaults = this.defaultTextures[textureName];
        
        if (textureName === 'sun') {
            return new THREE.MeshBasicMaterial({
                color: defaults.color,
                emissive: defaults.emissive,
                emissiveIntensity: defaults.emissiveIntensity
            });
        }
        
        if (textureName === 'saturn_rings') {
            return new THREE.MeshBasicMaterial({
                color: defaults.color,
                transparent: defaults.transparent,
                opacity: defaults.opacity,
                side: THREE.DoubleSide
            });
        }
        
        return new THREE.MeshStandardMaterial({
            color: defaults.color,
            roughness: defaults.roughness,
            metalness: defaults.metalness
        });
    },
    
    // Load texture from URL
    loadTexture: function(textureName, onLoad = null, onError = null) {
        // Check if already cached
        if (this.cache.has(textureName)) {
            if (onLoad) onLoad(this.cache.get(textureName));
            return Promise.resolve(this.cache.get(textureName));
        }
        
        // Check if already loading
        if (this.loadingPromises.has(textureName)) {
            return this.loadingPromises.get(textureName);
        }
        
        // Create loading promise
        const loadingPromise = new Promise((resolve, reject) => {
            const textureLoader = new THREE.TextureLoader();
            
            // Set texture properties
            textureLoader.crossOrigin = "anonymous";
            
            // Load texture
            textureLoader.load(
                this.textureUrls[textureName],
                (texture) => {
                    this.onTextureLoaded(textureName, texture);
                    this.cache.set(textureName, texture);
                    this.loadingPromises.delete(textureName);
                    
                    if (onLoad) onLoad(texture);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load texture: ${textureName}`, error);
                    
                    // Use fallback material
                    const fallbackMaterial = this.createDefaultMaterial(textureName);
                    this.cache.set(textureName, fallbackMaterial);
                    this.loadingPromises.delete(textureName);
                    
                    if (onError) onError(error);
                    resolve(fallbackMaterial);
                }
            );
        });
        
        this.loadingPromises.set(textureName, loadingPromise);
        return loadingPromise;
    },
    
    // Handle texture loaded
    onTextureLoaded: function(textureName, texture) {
        console.log(`Texture loaded: ${textureName}`);
        
        // Configure texture properties
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        
        // Generate mipmaps for better performance
        texture.generateMipmaps = true;
        
        // Set texture quality based on performance settings
        if (CONFIG.PERFORMANCE.TEXTURE_QUALITY === 'low') {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
        } else if (CONFIG.PERFORMANCE.TEXTURE_QUALITY === 'medium') {
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
        } else {
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
        }
    },
    
    // Load multiple textures
    loadTextures: function(textureNames, onProgress = null, onComplete = null) {
        const promises = textureNames.map(name => this.loadTexture(name));
        
        if (onProgress) {
            let loaded = 0;
            promises.forEach(promise => {
                promise.then(() => {
                    loaded++;
                    onProgress(loaded, textureNames.length);
                });
            });
        }
        
        return Promise.all(promises).then(textures => {
            if (onComplete) onComplete(textures);
            return textures;
        });
    },
    
    // Create material with texture
    createMaterial: function(textureName, materialType = 'standard') {
        const texture = this.cache.get(textureName);
        
        if (!texture) {
            console.warn(`Texture not found: ${textureName}, using fallback`);
            return this.createDefaultMaterial(textureName);
        }
        
        switch (materialType) {
            case 'basic':
                return new THREE.MeshBasicMaterial({ map: texture });
            case 'phong':
                return new THREE.MeshPhongMaterial({ map: texture });
            case 'standard':
                return new THREE.MeshStandardMaterial({ 
                    map: texture,
                    roughness: 0.5,
                    metalness: 0.1
                });
            case 'emissive':
                return new THREE.MeshBasicMaterial({ 
                    map: texture,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.5
                });
            default:
                return new THREE.MeshStandardMaterial({ map: texture });
        }
    },
    
    // Create planet material with multiple textures
    createPlanetMaterial: function(planetData) {
        const material = new THREE.MeshStandardMaterial({
            color: planetData.color,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Load day texture
        if (planetData.texture) {
            this.loadTexture(planetData.texture).then(texture => {
                material.map = texture;
                material.needsUpdate = true;
            });
        }
        
        // Load night texture for Earth
        if (planetData.nightTexture) {
            this.loadTexture(planetData.nightTexture).then(texture => {
                material.nightMap = texture;
                material.needsUpdate = true;
            });
        }
        
        return material;
    },
    
    // Create atmosphere material
    createAtmosphereMaterial: function(color = 0x87ceeb, intensity = 0.3) {
        return new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: intensity,
            side: THREE.BackSide
        });
    },
    
    // Create ring material
    createRingMaterial: function(ringData) {
        if (ringData.texture) {
            return this.loadTexture(ringData.texture).then(texture => {
                return new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
            });
        }
        
        return Promise.resolve(new THREE.MeshBasicMaterial({
            color: 0xfad5a5,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        }));
    },
    
    // Create star material
    createStarMaterial: function(color = 0xffffff, size = 1.0) {
        return new THREE.PointsMaterial({
            color: color,
            size: size,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    },
    
    // Create particle material
    createParticleMaterial: function(color = 0xffffff, size = 0.1) {
        return new THREE.PointsMaterial({
            color: color,
            size: size,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    },
    
    // Get texture from cache
    getTexture: function(textureName) {
        return this.cache.get(textureName);
    },
    
    // Check if texture is loaded
    isTextureLoaded: function(textureName) {
        return this.cache.has(textureName);
    },
    
    // Clear texture cache
    clearCache: function() {
        this.cache.forEach(texture => {
            if (texture.dispose) {
                texture.dispose();
            }
        });
        this.cache.clear();
        this.loadingPromises.clear();
    },
    
    // Get loading progress
    getLoadingProgress: function() {
        const total = Object.keys(this.textureUrls).length;
        const loaded = this.cache.size;
        return { loaded, total, percentage: (loaded / total) * 100 };
    },
    
    // Preload all textures
    preloadAll: function(onProgress = null, onComplete = null) {
        const textureNames = Object.keys(this.textureUrls);
        return this.loadTextures(textureNames, onProgress, onComplete);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextureManager;
}