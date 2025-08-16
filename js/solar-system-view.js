// Solar System View for the 3D Solar System Explorer

const SolarSystemView = {
    // Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    
    // Scene objects
    celestialBodies: null,
    stars: null,
    
    // Interaction
    raycaster: null,
    mouse: null,
    clickableObjects: [],
    
    // State
    isActive: false,
    isInitialized: false,
    
    // Initialize the solar system view
    init: function(container) {
        console.log('Initializing Solar System View...');
        
        this.createScene();
        this.createCamera();
        this.createRenderer(container);
        this.createControls();
        this.createStars();
        this.setupInteraction();
        
        this.isInitialized = true;
        console.log('Solar System View initialized');
        
        return this;
    },
    
    // Create the 3D scene
    createScene: function() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(0x000011, 1000, 10000);
    },
    
    // Create the camera
    createCamera: function() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.RENDER.FOV,
            aspect,
            CONFIG.RENDER.NEAR,
            CONFIG.RENDER.FAR
        );
        
        // Set initial camera position
        this.camera.position.set(
            CONFIG.CAMERA.INITIAL_DISTANCE,
            CONFIG.CAMERA.INITIAL_DISTANCE * 0.5,
            CONFIG.CAMERA.INITIAL_DISTANCE
        );
        
        this.camera.lookAt(0, 0, 0);
    },
    
    // Create the renderer
    createRenderer: function(container) {
        this.renderer = new THREE.WebGLRenderer({
            antialias: CONFIG.RENDER.ANTIALIAS,
            alpha: false,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = CONFIG.RENDER.SHADOWS;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Add renderer to container
        container.appendChild(this.renderer.domElement);
    },
    
    // Create camera controls
    createControls: function() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        // Configure controls
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = CONFIG.CAMERA.MIN_DISTANCE;
        this.controls.maxDistance = CONFIG.CAMERA.MAX_DISTANCE;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.panSpeed = CONFIG.CAMERA.PAN_SPEED;
        this.controls.rotateSpeed = CONFIG.CAMERA.ROTATE_SPEED;
        this.controls.zoomSpeed = CONFIG.CAMERA.ZOOM_SPEED;
        
        // Set target to center of solar system
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    },
    
    // Create starfield background
    createStars: function() {
        const starCount = 5000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);
        const starSizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            // Random position in a large sphere
            const radius = Utils.Math.random(5000, 20000);
            const theta = Utils.Math.random(0, Math.PI * 2);
            const phi = Utils.Math.random(0, Math.PI);
            
            starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = radius * Math.cos(phi);
            starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // Random star colors (mostly white/blue, some yellow/red)
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                // White/blue stars
                starColors[i * 3] = Utils.Math.random(0.8, 1.0);
                starColors[i * 3 + 1] = Utils.Math.random(0.8, 1.0);
                starColors[i * 3 + 2] = Utils.Math.random(0.9, 1.0);
            } else if (colorChoice < 0.9) {
                // Yellow stars
                starColors[i * 3] = Utils.Math.random(0.9, 1.0);
                starColors[i * 3 + 1] = Utils.Math.random(0.8, 1.0);
                starColors[i * 3 + 2] = Utils.Math.random(0.6, 0.8);
            } else {
                // Red stars
                starColors[i * 3] = Utils.Math.random(0.9, 1.0);
                starColors[i * 3 + 1] = Utils.Math.random(0.4, 0.7);
                starColors[i * 3 + 2] = Utils.Math.random(0.3, 0.6);
            }
            
            // Random star sizes
            starSizes[i] = Utils.Math.random(0.1, 2.0);
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    },
    
    // Setup interaction (raycasting)
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
    
    // Perform raycast for object selection
    performRaycast: function() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        if (this.celestialBodies) {
            this.clickableObjects = this.celestialBodies.getClickableObjects();
        }
        
        const intersects = this.raycaster.intersectObjects(this.clickableObjects, true);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            this.handleObjectClick(clickedObject);
        }
    },
    
    // Handle object click
    handleObjectClick: function(object) {
        const userData = object.userData;
        
        if (!userData || !userData.clickable) return;
        
        console.log(`Clicked on: ${object.name}`);
        
        // Handle different object types
        switch (userData.type) {
            case 'sun':
                this.showSunInfo();
                break;
            case 'planet':
                this.showPlanetInfo(userData.data.name);
                break;
            case 'moon':
                this.showMoonInfo(userData.data.name, userData.parentPlanet);
                break;
            default:
                console.log('Unknown object type:', userData.type);
        }
        
        // Trigger easter egg checks
        this.checkEasterEggs(object);
    },
    
    // Show sun information
    showSunInfo: function() {
        const sunData = CONFIG.SOLAR_SYSTEM.SUN;
        const info = {
            name: sunData.name,
            type: sunData.type,
            radius: `${(sunData.radius / 1000).toFixed(1)} km`,
            temperature: sunData.temperature,
            mass: sunData.mass,
            discovery: sunData.discovery,
            atmosphere: sunData.atmosphere
        };
        
        // Trigger UI update
        if (window.UIManager) {
            window.UIManager.showInfoPanel(info);
        }
    },
    
    // Show planet information
    showPlanetInfo: function(planetName) {
        if (this.celestialBodies) {
            const info = this.celestialBodies.getPlanetInfo(planetName);
            if (info && window.UIManager) {
                window.UIManager.showInfoPanel(info);
            }
        }
    },
    
    // Show moon information
    showMoonInfo: function(moonName, planetName) {
        if (this.celestialBodies) {
            const info = this.celestialBodies.getMoonInfo(moonName, planetName);
            if (info && window.UIManager) {
                window.UIManager.showInfoPanel(info);
            }
        }
    },
    
    // Check for easter eggs
    checkEasterEggs: function(object) {
        const userData = object.userData;
        
        // Initialize click counter if not exists
        if (!userData.clickCount) {
            userData.clickCount = 0;
        }
        
        userData.clickCount++;
        
        // Check for specific easter eggs
        if (userData.type === 'planet') {
            if (userData.data.name === 'Neptune' && userData.clickCount >= 3) {
                this.triggerEasterEgg('Voyager 1');
            } else if (userData.data.name === 'Jupiter' && userData.clickCount >= 5) {
                this.triggerEasterEgg('James Webb Telescope');
            }
        }
    },
    
    // Trigger easter egg
    triggerEasterEgg: function(easterEggName) {
        console.log(`Easter egg triggered: ${easterEggName}`);
        
        if (window.UIManager) {
            window.UIManager.showEasterEgg(easterEggName);
        }
    },
    
    // Update hover effects
    updateHoverEffects: function() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        if (this.celestialBodies) {
            this.clickableObjects = this.celestialBodies.getClickableObjects();
        }
        
        const intersects = this.raycaster.intersectObjects(this.clickableObjects, true);
        
        // Reset all hover effects
        this.clickableObjects.forEach(obj => {
            if (obj.material.emissive) {
                obj.material.emissive.setHex(0x000000);
            }
        });
        
        // Apply hover effect to intersected object
        if (intersects.length > 0) {
            const hoveredObject = intersects[0].object;
            if (hoveredObject.material.emissive) {
                hoveredObject.material.emissive.setHex(0x333333);
            }
        }
    },
    
    // Add celestial bodies to the scene
    addCelestialBodies: function(celestialBodies) {
        this.celestialBodies = celestialBodies;
        
        if (celestialBodies && celestialBodies.scene) {
            // Add all celestial bodies to the scene
            this.scene.add(celestialBodies.sun);
            
            celestialBodies.planets.forEach(planet => {
                this.scene.add(planet);
            });
            
            if (celestialBodies.asteroidBelt) {
                this.scene.add(celestialBodies.asteroidBelt);
            }
        }
    },
    
    // Update the view (animation loop)
    update: function(deltaTime, timeSpeed) {
        if (!this.isActive || !this.isInitialized) return;
        
        // Update celestial bodies
        if (this.celestialBodies) {
            this.celestialBodies.update(deltaTime, timeSpeed);
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Update stars rotation (very slow)
        if (this.stars) {
            this.stars.rotation.y += deltaTime * 0.0001;
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
        console.log('Solar System View activated');
        
        // Reset camera position
        this.camera.position.set(
            CONFIG.CAMERA.INITIAL_DISTANCE,
            CONFIG.CAMERA.INITIAL_DISTANCE * 0.5,
            CONFIG.CAMERA.INITIAL_DISTANCE
        );
        this.camera.lookAt(0, 0, 0);
        
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    },
    
    // Deactivate the view
    deactivate: function() {
        this.isActive = false;
        console.log('Solar System View deactivated');
    },
    
    // Smooth camera transition to target
    transitionToTarget: function(target, duration = 2000) {
        if (!this.controls) return;
        
        const targetPosition = target.position.clone();
        const targetLookAt = new THREE.Vector3(0, 0, 0);
        
        Utils.Animation.smoothTransition(
            this.camera,
            targetPosition,
            targetLookAt,
            duration
        );
        
        // Update controls target
        setTimeout(() => {
            if (this.controls) {
                this.controls.target.copy(targetLookAt);
                this.controls.update();
            }
        }, duration);
    },
    
    // Get camera position and target
    getCameraState: function() {
        return {
            position: this.camera.position.clone(),
            target: this.controls ? this.controls.target.clone() : new THREE.Vector3(0, 0, 0)
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
    },
    
    // Clean up resources
    dispose: function() {
        if (this.celestialBodies) {
            this.celestialBodies.dispose();
        }
        
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
        
        console.log('Solar System View disposed');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SolarSystemView;
}