// Galaxy View for the 3D Solar System Explorer

const GalaxyView = {
    // Three.js objects
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    
    // Galaxy objects
    milkyWay: null,
    stars: null,
    dustClouds: null,
    nearbyGalaxies: [],
    
    // Interaction
    raycaster: null,
    mouse: null,
    
    // State
    isActive: false,
    isInitialized: false,
    
    // Galaxy parameters
    galaxyParams: {
        spiralArms: CONFIG.GALAXY.SPIRAL_ARMS,
        starCount: CONFIG.GALAXY.STAR_COUNT,
        dustCloudCount: CONFIG.GALAXY.DUST_CLOUDS,
        radius: 50000,
        height: 2000,
        armWidth: 0.3
    },
    
    // Initialize the Galaxy view
    init: function(container) {
        console.log('Initializing Galaxy View...');
        
        this.createScene();
        this.createCamera();
        this.createRenderer(container);
        this.createControls();
        this.createMilkyWay();
        this.createDustClouds();
        this.createNearbyGalaxies();
        this.setupInteraction();
        
        this.isInitialized = true;
        console.log('Galaxy View initialized');
        
        return this;
    },
    
    // Create the 3D scene
    createScene: function() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(0x000011, 10000, 100000);
    },
    
    // Create the camera
    createCamera: function() {
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(
            60,
            aspect,
            100,
            1000000
        );
        
        // Set initial camera position (outside the galaxy)
        this.camera.position.set(80000, 50000, 80000);
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
        this.renderer.shadowMap.enabled = false; // Disable shadows for performance
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Add renderer to container
        container.appendChild(this.renderer.domElement);
    },
    
    // Create camera controls
    createControls: function() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        
        // Configure controls for galaxy view
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true;
        this.controls.minDistance = 1000;
        this.controls.maxDistance = 500000;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.panSpeed = 2.0;
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.0;
        
        // Set target to galaxy center
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    },
    
    // Create Milky Way galaxy
    createMilkyWay: function() {
        // Create star field for the galaxy
        this.createGalaxyStars();
        
        // Create spiral arm structure
        this.createSpiralArms();
        
        console.log('Milky Way galaxy created');
    },
    
    // Create galaxy stars
    createGalaxyStars: function() {
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(this.galaxyParams.starCount * 3);
        const starColors = new Float32Array(this.galaxyParams.starCount * 3);
        const starSizes = new Float32Array(this.galaxyParams.starCount);
        
        for (let i = 0; i < this.galaxyParams.starCount; i++) {
            const star = this.generateStarPosition();
            
            starPositions[i * 3] = star.x;
            starPositions[i * 3 + 1] = star.y;
            starPositions[i * 3 + 2] = star.z;
            
            // Star colors based on type
            const colorChoice = Math.random();
            if (colorChoice < 0.6) {
                // Yellow/white stars (main sequence)
                starColors[i * 3] = Utils.Math.random(0.9, 1.0);
                starColors[i * 3 + 1] = Utils.Math.random(0.8, 1.0);
                starColors[i * 3 + 2] = Utils.Math.random(0.6, 0.9);
            } else if (colorChoice < 0.8) {
                // Blue stars (hot, young)
                starColors[i * 3] = Utils.Math.random(0.6, 0.8);
                starColors[i * 3 + 1] = Utils.Math.random(0.7, 0.9);
                starColors[i * 3 + 2] = Utils.Math.random(0.9, 1.0);
            } else if (colorChoice < 0.95) {
                // Red stars (cool, old)
                starColors[i * 3] = Utils.Math.random(0.9, 1.0);
                starColors[i * 3 + 1] = Utils.Math.random(0.4, 0.7);
                starColors[i * 3 + 2] = Utils.Math.random(0.3, 0.6);
            } else {
                // White dwarfs (very bright)
                starColors[i * 3] = 1.0;
                starColors[i * 3 + 1] = 1.0;
                starColors[i * 3 + 2] = 1.0;
            }
            
            // Star sizes based on brightness
            starSizes[i] = Utils.Math.random(0.5, 3.0);
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.stars.name = 'galaxy_stars';
        this.scene.add(this.stars);
    },
    
    // Generate star position in spiral galaxy
    generateStarPosition: function() {
        const arm = Math.floor(Math.random() * this.galaxyParams.spiralArms);
        const armAngle = (arm / this.galaxyParams.spiralArms) * Math.PI * 2;
        
        // Spiral arm parameters
        const spiralTightness = 0.3;
        const armWidth = this.galaxyParams.armWidth;
        
        // Random distance from center
        const distance = Utils.Math.random(0, this.galaxyParams.radius);
        
        // Spiral arm angle
        const spiralAngle = armAngle + (distance / this.galaxyParams.radius) * spiralTightness * Math.PI * 4;
        
        // Add some randomness to arm width
        const armOffset = (Math.random() - 0.5) * armWidth * distance;
        const finalAngle = spiralAngle + armOffset / distance;
        
        // Calculate position
        const x = Math.cos(finalAngle) * distance;
        const z = Math.sin(finalAngle) * distance;
        
        // Height based on distance (thinner at edges)
        const heightFactor = 1 - (distance / this.galaxyParams.radius);
        const y = (Math.random() - 0.5) * this.galaxyParams.height * heightFactor;
        
        return { x, y, z };
    },
    
    // Create spiral arm structure
    createSpiralArms: function() {
        // Create visual representation of spiral arms
        for (let arm = 0; arm < this.galaxyParams.spiralArms; arm++) {
            const armAngle = (arm / this.galaxyParams.spiralArms) * Math.PI * 2;
            this.createSpiralArm(armAngle, arm);
        }
    },
    
    // Create a single spiral arm
    createSpiralArm: function(armAngle, armIndex) {
        const armGeometry = new THREE.BufferGeometry();
        const armPositions = [];
        const armColors = [];
        
        const spiralTightness = 0.3;
        const armWidth = this.galaxyParams.armWidth;
        
        // Create points along the spiral arm
        for (let i = 0; i <= 100; i++) {
            const distance = (i / 100) * this.galaxyParams.radius;
            const spiralAngle = armAngle + (distance / this.galaxyParams.radius) * spiralTightness * Math.PI * 4;
            
            // Add some width to the arm
            for (let j = -5; j <= 5; j++) {
                const widthOffset = (j / 5) * armWidth * distance;
                const finalAngle = spiralAngle + widthOffset / distance;
                
                const x = Math.cos(finalAngle) * distance;
                const z = Math.sin(finalAngle) * distance;
                const y = (Math.random() - 0.5) * this.galaxyParams.height * 0.1;
                
                armPositions.push(x, y, z);
                
                // Arm color (slightly different for each arm)
                const hue = (armIndex / this.galaxyParams.spiralArms) + (j / 10);
                const color = new THREE.Color().setHSL(hue, 0.3, 0.6);
                armColors.push(color.r, color.g, color.b);
            }
        }
        
        armGeometry.setAttribute('position', new THREE.Float32BufferAttribute(armPositions, 3));
        armGeometry.setAttribute('color', new THREE.Float32BufferAttribute(armColors, 3));
        
        const armMaterial = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const arm = new THREE.Points(armGeometry, armMaterial);
        arm.name = `spiral_arm_${armIndex}`;
        this.scene.add(arm);
    },
    
    // Create dust clouds
    createDustClouds: function() {
        const cloudGeometry = new THREE.BufferGeometry();
        const cloudPositions = new Float32Array(this.galaxyParams.dustCloudCount * 3);
        const cloudColors = new Float32Array(this.galaxyParams.dustCloudCount * 3);
        const cloudSizes = new Float32Array(this.galaxyParams.dustCloudCount);
        
        for (let i = 0; i < this.galaxyParams.dustCloudCount; i++) {
            // Random position in galaxy
            const distance = Utils.Math.random(0, this.galaxyParams.radius * 0.8);
            const angle = Utils.Math.random(0, Math.PI * 2);
            const height = (Math.random() - 0.5) * this.galaxyParams.height * 0.5;
            
            cloudPositions[i * 3] = Math.cos(angle) * distance;
            cloudPositions[i * 3 + 1] = height;
            cloudPositions[i * 3 + 2] = Math.sin(angle) * distance;
            
            // Dust cloud colors (browns, reds, dark colors)
            const colorChoice = Math.random();
            if (colorChoice < 0.4) {
                // Brown dust
                cloudColors[i * 3] = Utils.Math.random(0.4, 0.7);
                cloudColors[i * 3 + 1] = Utils.Math.random(0.2, 0.5);
                cloudColors[i * 3 + 2] = Utils.Math.random(0.1, 0.4);
            } else if (colorChoice < 0.7) {
                // Red dust
                cloudColors[i * 3] = Utils.Math.random(0.6, 0.9);
                cloudColors[i * 3 + 1] = Utils.Math.random(0.2, 0.5);
                cloudColors[i * 3 + 2] = Utils.Math.random(0.1, 0.4);
            } else {
                // Dark dust
                cloudColors[i * 3] = Utils.Math.random(0.1, 0.3);
                cloudColors[i * 3 + 1] = Utils.Math.random(0.1, 0.3);
                cloudColors[i * 3 + 2] = Utils.Math.random(0.1, 0.3);
            }
            
            // Cloud sizes
            cloudSizes[i] = Utils.Math.random(5, 20);
        }
        
        cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
        cloudGeometry.setAttribute('color', new THREE.BufferAttribute(cloudColors, 3));
        cloudGeometry.setAttribute('size', new THREE.BufferAttribute(cloudSizes, 1));
        
        const cloudMaterial = new THREE.PointsMaterial({
            size: 8,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        this.dustClouds = new THREE.Points(cloudGeometry, cloudMaterial);
        this.dustClouds.name = 'dust_clouds';
        this.scene.add(this.dustClouds);
    },
    
    // Create nearby galaxies
    createNearbyGalaxies: function() {
        CONFIG.GALAXY.NEARBY_GALAXIES.forEach((galaxyData, index) => {
            this.createNearbyGalaxy(galaxyData, index);
        });
    },
    
    // Create a single nearby galaxy
    createNearbyGalaxy: function(galaxyData, index) {
        // Calculate position relative to Milky Way
        const angle = (index / CONFIG.GALAXY.NEARBY_GALAXIES.length) * Math.PI * 2;
        const distance = galaxyData.distance * 0.1; // Scale for visibility
        
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = (Math.random() - 0.5) * 1000;
        
        // Create galaxy representation
        const galaxyGeometry = new THREE.SphereGeometry(galaxyData.size * 0.1, 16, 16);
        
        // Galaxy material based on type
        let galaxyMaterial;
        if (galaxyData.type === 'Spiral') {
            galaxyMaterial = new THREE.MeshBasicMaterial({
                color: 0x4a90e2,
                transparent: true,
                opacity: 0.7
            });
        } else {
            galaxyMaterial = new THREE.MeshBasicMaterial({
                color: 0x8b4513,
                transparent: true,
                opacity: 0.5
            });
        }
        
        const galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
        galaxy.position.set(x, y, z);
        galaxy.name = galaxyData.name;
        galaxy.userData = {
            type: 'galaxy',
            data: galaxyData,
            clickable: true
        };
        
        this.scene.add(galaxy);
        this.nearbyGalaxies.push(galaxy);
        
        // Add label
        this.createGalaxyLabel(galaxy, galaxyData.name);
    },
    
    // Create galaxy label
    createGalaxyLabel: function(galaxy, name) {
        // Simple text label (could be enhanced with CSS overlay)
        const labelGeometry = new THREE.PlaneGeometry(100, 50);
        const labelMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.copy(galaxy.position);
        label.position.y += galaxy.geometry.parameters.radius + 50;
        label.lookAt(this.camera.position);
        
        this.scene.add(label);
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
        
        const clickableObjects = [this.stars, this.dustClouds, ...this.nearbyGalaxies];
        const intersects = this.raycaster.intersectObjects(clickableObjects, true);
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            this.handleObjectClick(clickedObject);
        }
    },
    
    // Handle object click
    handleObjectClick: function(object) {
        const userData = object.userData;
        
        if (userData && userData.clickable) {
            console.log(`Clicked on: ${object.name}`);
            
            if (userData.type === 'galaxy') {
                this.showGalaxyInfo(userData.data);
            }
        }
    },
    
    // Show galaxy information
    showGalaxyInfo: function(galaxyData) {
        const info = {
            name: galaxyData.name,
            type: galaxyData.type,
            distance: `${(galaxyData.distance / 1000).toFixed(1)} kly`,
            size: `${(galaxyData.size / 1000).toFixed(1)} kly`
        };
        
        if (window.UIManager) {
            window.UIManager.showInfoPanel(info);
        }
    },
    
    // Update hover effects
    updateHoverEffects: function() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const clickableObjects = [this.stars, this.dustClouds, ...this.nearbyGalaxies];
        const intersects = this.raycaster.intersectObjects(clickableObjects, true);
        
        // Reset all hover effects
        clickableObjects.forEach(obj => {
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
    
    // Update the view (animation loop)
    update: function(deltaTime) {
        if (!this.isActive || !this.isInitialized) return;
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Rotate galaxy slowly
        if (this.stars) {
            this.stars.rotation.y += deltaTime * 0.0001;
        }
        
        if (this.dustClouds) {
            this.dustClouds.rotation.y += deltaTime * 0.00005;
        }
        
        // Update nearby galaxies
        this.nearbyGalaxies.forEach(galaxy => {
            galaxy.rotation.y += deltaTime * 0.0002;
        });
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
        console.log('Galaxy View activated');
        
        // Reset camera position
        this.camera.position.set(80000, 50000, 80000);
        this.camera.lookAt(0, 0, 0);
        
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    },
    
    // Deactivate the view
    deactivate: function() {
        this.isActive = false;
        console.log('Galaxy View deactivated');
    },
    
    // Get camera state
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
        
        console.log('Galaxy View disposed');
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GalaxyView;
}