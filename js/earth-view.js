// Earth View for the 3D Solar System Explorer

const EarthView = {
    // Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    
    // Earth objects
    earth: null,
    atmosphere: null,
    clouds: null,
    cityLights: null,
    
    // Interaction
    raycaster: null,
    mouse: null,
    
    // State
    isActive: false,
    isInitialized: false,
    currentZoomLevel: 0,
    
    // Camera states for different zoom levels
    cameraStates: {
        space: { distance: 100, fov: 75 },
        lowOrbit: { distance: 50, fov: 60 },
        highAltitude: { distance: 20, fov: 45 },
        cityLevel: { distance: 5, fov: 30 },
        streetLevel: { distance: 1, fov: 20 }
    },
    
    // Initialize the Earth view
    init: function(container) {
        console.log('Initializing Earth View...');
        
        this.createScene();
        this.createCamera();
        this.createRenderer(container);
        this.createControls();
        this.createEarth();
        this.createAtmosphere();
        this.createClouds();
        this.createCityLights();
        this.setupInteraction();
        
        this.isInitialized = true;
        console.log('Earth View initialized');
        
        return this;
    },
    
    // Create the 3D scene
    createScene: function() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        
        // Add fog for atmospheric effect
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200);
    },
    
    // Create the camera
    createCamera: function() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            this.cameraStates.space.fov,
            aspect,
            0.1,
            1000
        );
        
        // Set initial camera position (space view)
        this.camera.position.set(0, 0, this.cameraStates.space.distance);
        this.camera.lookAt(0, 0, 0);
    },
    
    // Create the renderer
    createRenderer: function(container) {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Add renderer to container
        container.appendChild(this.renderer.domElement);
    },
    
    // Create camera controls
    createControls: function() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        // Configure controls for Earth view
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 0.5;
        this.controls.maxDistance = 200;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.panSpeed = 1.0;
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.0;
        
        // Set target to Earth center
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        
        // Add zoom event listener
        this.controls.addEventListener('change', this.onCameraChange.bind(this));
    },
    
    // Create Earth
    createEarth: function() {
        const earthRadius = 1;
        
        // Create Earth geometry
        const geometry = new THREE.SphereGeometry(earthRadius, 64, 64);
        
        // Create Earth material with day texture
        const material = new THREE.MeshStandardMaterial({
            map: null, // Will be loaded by texture manager
            bumpMap: null, // Height map for terrain
            bumpScale: 0.05,
            specularMap: null, // Specular map for water
            specular: new THREE.Color(0x333333),
            shininess: 25,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Create Earth mesh
        this.earth = new THREE.Mesh(geometry, material);
        this.earth.name = 'Earth';
        this.earth.castShadow = true;
        this.earth.receiveShadow = true;
        
        // Add Earth to scene
        this.scene.add(this.earth);
        
        // Load Earth textures
        this.loadEarthTextures(material);
        
        console.log('Earth created');
    },
    
    // Load Earth textures
    loadEarthTextures: function(material) {
        // Load day texture
        TextureManager.loadTexture('earth_day').then(texture => {
            material.map = texture;
            material.needsUpdate = true;
        });
        
        // Load bump map (height map)
        TextureManager.loadTexture('earth_specular').then(texture => {
            material.bumpMap = texture;
            material.needsUpdate = true;
        });
        
        // Load specular map
        TextureManager.loadTexture('earth_specular').then(texture => {
            material.specularMap = texture;
            material.needsUpdate = true;
        });
    },
    
    // Create atmosphere
    createAtmosphere: function() {
        const atmosphereRadius = 1.1;
        const geometry = new THREE.SphereGeometry(atmosphereRadius, 64, 64);
        
        const material = new THREE.MeshBasicMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        
        this.atmosphere = new THREE.Mesh(geometry, material);
        this.atmosphere.name = 'atmosphere';
        
        this.scene.add(this.atmosphere);
    },
    
    // Create clouds
    createClouds: function() {
        const cloudRadius = 1.05;
        const geometry = new THREE.SphereGeometry(cloudRadius, 64, 64);
        
        const material = new THREE.MeshBasicMaterial({
            map: null, // Will be loaded
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.clouds = new THREE.Mesh(geometry, material);
        this.clouds.name = 'clouds';
        
        this.scene.add(this.clouds);
        
        // Load cloud texture
        TextureManager.loadTexture('earth_clouds').then(texture => {
            material.map = texture;
            material.needsUpdate = true;
        });
    },
    
    // Create city lights
    createCityLights: function() {
        if (!CONFIG.EARTH.CITY_LIGHTS) return;
        
        const cityLightCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(cityLightCount * 3);
        const colors = new Float32Array(cityLightCount * 3);
        const sizes = new Float32Array(cityLightCount);
        
        for (let i = 0; i < cityLightCount; i++) {
            // Random position on Earth surface
            const lat = Utils.Math.random(-90, 90);
            const lon = Utils.Math.random(-180, 180);
            const position = Utils.Coordinates.latLonToPosition(lat, lon, 1.01);
            
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            // City light colors (mostly white/yellow, some blue)
            const colorChoice = Math.random();
            if (colorChoice < 0.8) {
                // White/yellow lights
                colors[i * 3] = Utils.Math.random(0.9, 1.0);
                colors[i * 3 + 1] = Utils.Math.random(0.8, 1.0);
                colors[i * 3 + 2] = Utils.Math.random(0.6, 0.9);
            } else {
                // Blue lights
                colors[i * 3] = Utils.Math.random(0.6, 0.8);
                colors[i * 3 + 1] = Utils.Math.random(0.7, 0.9);
                colors[i * 3 + 2] = Utils.Math.random(0.9, 1.0);
            }
            
            // Random sizes
            sizes[i] = Utils.Math.random(0.01, 0.05);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.02,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.cityLights = new THREE.Points(geometry, material);
        this.cityLights.name = 'city_lights';
        
        this.scene.add(this.cityLights);
    },
    
    // Setup interaction
    setupInteraction: function() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Mouse event listeners
        this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    },
    
    // Handle mouse click
    onMouseClick: function(event) {
        this.updateMousePosition(event);
        this.performRaycast();
    },
    
    // Handle mouse move
    onMouseMove: function(event) {
        this.updateMousePosition(event);
        this.updateHoverEffects();
    },
    
    // Update mouse position
    updateMousePosition: function(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    },
    
    // Perform raycast
    performRaycast: function() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObject(this.earth);
        
        if (intersects.length > 0) {
            const intersection = intersects[0];
            const worldPosition = intersection.point;
            const latLon = Utils.Coordinates.positionToLatLon(
                worldPosition.x,
                worldPosition.y,
                worldPosition.z
            );
            
            console.log(`Clicked at: ${latLon.lat.toFixed(2)}°, ${latLon.lon.toFixed(2)}°`);
            
            // Show location info
            this.showLocationInfo(latLon);
        }
    },
    
    // Show location information
    showLocationInfo: function(latLon) {
        // Find nearest known location
        let nearestLocation = null;
        let minDistance = Infinity;
        
        Object.keys(CONFIG.EARTH.LOCATIONS).forEach(locationName => {
            const location = CONFIG.EARTH.LOCATIONS[locationName];
            const distance = Math.sqrt(
                Math.pow(latLon.lat - location.lat, 2) + 
                Math.pow(latLon.lon - location.lon, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestLocation = { name: locationName, ...location };
            }
        });
        
        if (nearestLocation && minDistance < 10) {
            const info = {
                name: nearestLocation.name,
                type: 'Location',
                coordinates: `${latLon.lat.toFixed(4)}°, ${latLon.lon.toFixed(4)}°`,
                nearestCity: nearestLocation.name,
                distance: `${minDistance.toFixed(1)}°`
            };
            
            if (window.UIManager) {
                window.UIManager.showInfoPanel(info);
            }
        }
    },
    
    // Update hover effects
    updateHoverEffects: function() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObject(this.earth);
        
        // Reset Earth material
        if (this.earth.material.emissive) {
            this.earth.material.emissive.setHex(0x000000);
        }
        
        // Apply hover effect
        if (intersects.length > 0) {
            if (this.earth.material.emissive) {
                this.earth.material.emissive.setHex(0x111111);
            }
        }
    },
    
    // Handle camera change
    onCameraChange: function() {
        const distance = this.camera.position.length();
        this.updateZoomLevel(distance);
    },
    
    // Update zoom level based on camera distance
    updateZoomLevel: function(distance) {
        let newZoomLevel = 0;
        
        if (distance > 80) {
            newZoomLevel = 0; // Space view
        } else if (distance > 40) {
            newZoomLevel = 1; // Low orbit
        } else if (distance > 15) {
            newZoomLevel = 2; // High altitude
        } else if (distance > 3) {
            newZoomLevel = 3; // City level
        } else {
            newZoomLevel = 4; // Street level
        }
        
        if (newZoomLevel !== this.currentZoomLevel) {
            this.currentZoomLevel = newZoomLevel;
            this.onZoomLevelChange(newZoomLevel);
        }
    },
    
    // Handle zoom level change
    onZoomLevelChange: function(zoomLevel) {
        console.log(`Zoom level changed to: ${zoomLevel}`);
        
        // Update atmosphere visibility
        if (this.atmosphere) {
            this.atmosphere.material.opacity = zoomLevel === 0 ? 0.3 : 0.1;
        }
        
        // Update cloud visibility
        if (this.clouds) {
            this.clouds.material.opacity = zoomLevel === 0 ? 0.8 : 0.3;
        }
        
        // Update city lights visibility
        if (this.cityLights) {
            this.cityLights.visible = zoomLevel >= 2;
        }
        
        // Update fog
        const fogStates = [200, 100, 50, 20, 10];
        this.scene.fog.far = fogStates[zoomLevel] || 200;
        
        // Update camera FOV
        const fovStates = [75, 60, 45, 30, 20];
        this.camera.fov = fovStates[zoomLevel] || 75;
        this.camera.updateProjectionMatrix();
    },
    
    // Fly to location
    flyToLocation: function(locationName) {
        const location = CONFIG.EARTH.LOCATIONS[locationName];
        if (!location) return;
        
        console.log(`Flying to: ${location.name}`);
        
        // Calculate target position
        const targetPosition = Utils.Coordinates.latLonToPosition(
            location.lat,
            location.lon,
            5 // Distance from surface
        );
        
        // Smooth camera transition
        Utils.Animation.smoothTransition(
            this.camera,
            targetPosition,
            new THREE.Vector3(0, 0, 0),
            3000
        );
        
        // Update controls target
        setTimeout(() => {
            if (this.controls) {
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            }
        }, 3000);
    },
    
    // Update the view (animation loop)
    update: function(deltaTime) {
        if (!this.isActive || !this.isInitialized) return;
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Rotate Earth slowly
        if (this.earth) {
            this.earth.rotation.y += deltaTime * 0.1;
        }
        
        // Rotate clouds
        if (this.clouds) {
            this.clouds.rotation.y += deltaTime * 0.15;
        }
        
        // Rotate atmosphere
        if (this.atmosphere) {
            this.atmosphere.rotation.y += deltaTime * 0.05;
        }
        
        // Update city lights
        if (this.cityLights && this.cityLights.visible) {
            this.cityLights.rotation.y += deltaTime * 0.1;
        }
    },
    
    // Render the scene
    render: function() {
        if (!this.isActive || !this.isInitialized) return;
        
        this.renderer.render(this.scene, this.camera);
    },
    
    // Handle window resize
    onWindowResize: function() {
        if (!this.isInitialized) return;
        
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    },
    
    // Activate the view
    activate: function() {
        this.isActive = true;
        console.log('Earth View activated');
        
        // Reset camera to space view
        this.camera.position.set(0, 0, this.cameraStates.space.distance);
        this.camera.lookAt(0, 0, 0);
        
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
        
        // Show search bar
        if (window.UIManager) {
            window.UIManager.showEarthSearch();
        }
    },
    
    // Deactivate the view
    deactivate: function() {
        this.isActive = false;
        console.log('Earth View deactivated');
        
        // Hide search bar
        if (window.UIManager) {
            window.UIManager.hideEarthSearch();
        }
    },
    
    // Get camera state
    getCameraState: function() {
        return {
            position: this.camera.position.clone(),
            target: this.controls ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0),
            zoomLevel: this.currentZoomLevel
        };
    },
    
    // Set camera state
    setCameraState: function(state) {
        if (state.position) {
            this.camera.position.copy(state.position);
        }
        
        if (state.target && this.controls) {
            this.controls.target.copy(state.target);
            this.controls.update();
        }
        
        if (state.zoomLevel !== undefined) {
            this.currentZoomLevel = state.zoomLevel;
            this.onZoomLevelChange(state.zoomLevel);
        }
    },
    
    // Clean up resources
    dispose: function() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Remove event listeners
        if (this.renderer && this.renderer.domElement) {
            this.renderer.domElement.removeEventListener('click', this.onMouseClick);
            this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
        }
        
        this.isInitialized = false;
        this.isActive = false;
        
        console.log('Earth View disposed');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EarthView;
}