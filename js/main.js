// Main Application for the 3D Solar System Explorer

const SolarSystemApp = {
    // Application state
    isInitialized: false,
    isRunning: false,
    
    // Views
    solarSystemView: null,
    earthView: null,
    galaxyView: null,
    
    // Systems
    uiManager: null,
    textureManager: null,
    celestialBodies: null,
    
    // Animation
    animationId: null,
    lastTime: 0,
    timeSpeed: CONFIG.TIME.DEFAULT_SPEED,
    isTimePaused: false,
    
    // Initialize the application
    init: function() {
        console.log('Initializing Solar System Explorer...');
        
        // Check WebGL support
        if (!Utils.Device.supportsWebGL()) {
            this.showWebGLError();
            return;
        }
        
        // Initialize managers
        this.initializeManagers();
        
        // Initialize views
        this.initializeViews();
        
        // Setup UI event handlers
        this.setupUIEventHandlers();
        
        // Start loading assets
        this.loadAssets();
        
        this.isInitialized = true;
        console.log('Solar System Explorer initialized');
    },
    
    // Initialize managers
    initializeManagers: function() {
        // Initialize texture manager
        this.textureManager = TextureManager;
        this.textureManager.init();
        
        // Initialize UI manager
        this.uiManager = UIManager;
        this.uiManager.init();
    },
    
    // Initialize views
    initializeViews: function() {
        const container = document.getElementById('canvas-container');
        
        // Initialize Solar System View
        this.solarSystemView = SolarSystemView;
        this.solarSystemView.init(container);
        
        // Initialize Earth View
        this.earthView = EarthView;
        this.earthView.init(container);
        
        // Initialize Galaxy View
        this.galaxyView = GalaxyView;
        this.galaxyView.init(container);
        
        // Make views globally accessible
        window.SolarSystemView = this.solarSystemView;
        window.EarthView = this.earthView;
        window.GalaxyView = this.galaxyView;
        window.UIManager = this.uiManager;
    },
    
    // Setup UI event handlers
    setupUIEventHandlers: function() {
        // Override UI manager event handlers
        this.uiManager.onViewChange = this.onViewChange.bind(this);
        this.uiManager.onTimePause = this.onTimePause.bind(this);
        this.uiManager.onTimeResume = this.onTimeResume.bind(this);
        this.uiManager.onTimeSpeedChange = this.onTimeSpeedChange.bind(this);
    },
    
    // Load assets
    loadAssets: function() {
        console.log('Loading assets...');
        
        // Preload essential textures
        const essentialTextures = [
            'sun', 'earth_day', 'earth_night', 'earth_clouds',
            'mercury', 'venus', 'mars', 'jupiter', 'saturn',
            'uranus', 'neptune', 'moon'
        ];
        
        this.textureManager.loadTextures(
            essentialTextures,
            this.onTextureProgress.bind(this),
            this.onTexturesLoaded.bind(this)
        );
    },
    
    // Handle texture loading progress
    onTextureProgress: function(loaded, total) {
        const progress = (loaded / total) * 100;
        this.uiManager.updateLoadingProgress(progress);
    },
    
    // Handle textures loaded
    onTexturesLoaded: function() {
        console.log('Essential textures loaded');
        
        // Initialize celestial bodies
        this.initializeCelestialBodies();
        
        // Complete initialization
        this.onInitializationComplete();
    },
    
    // Initialize celestial bodies
    initializeCelestialBodies: function() {
        this.celestialBodies = CelestialBodies;
        this.celestialBodies.init(this.solarSystemView.scene);
        
        // Add celestial bodies to solar system view
        this.solarSystemView.addCelestialBodies(this.celestialBodies);
    },
    
    // Handle initialization complete
    onInitializationComplete: function() {
        console.log('Initialization complete');
        
        // Hide loading screen
        this.uiManager.hideLoadingScreen();
        
        // Activate solar system view
        this.solarSystemView.activate();
        
        // Start the application
        this.start();
    },
    
    // Start the application
    start: function() {
        if (!this.isInitialized || this.isRunning) return;
        
        console.log('Starting Solar System Explorer...');
        this.isRunning = true;
        
        // Start animation loop
        this.animate();
        
        // Load remaining textures in background
        this.loadRemainingTextures();
    },
    
    // Animation loop
    animate: function(currentTime) {
        if (!this.isRunning) return;
        
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update time speed
        const effectiveTimeSpeed = this.isTimePaused ? 0 : this.timeSpeed;
        
        // Update current view
        this.updateCurrentView(deltaTime, effectiveTimeSpeed);
        
        // Render current view
        this.renderCurrentView();
    },
    
    // Update current view
    updateCurrentView: function(deltaTime, timeSpeed) {
        const currentView = this.uiManager.getCurrentView();
        
        switch (currentView) {
            case 'solar-system':
                if (this.solarSystemView) {
                    this.solarSystemView.update(deltaTime, timeSpeed);
                }
                break;
            case 'earth':
                if (this.earthView) {
                    this.earthView.update(deltaTime);
                }
                break;
            case 'galaxy':
                if (this.galaxyView) {
                    this.galaxyView.update(deltaTime);
                }
                break;
        }
    },
    
    // Render current view
    renderCurrentView: function() {
        const currentView = this.uiManager.getCurrentView();
        
        switch (currentView) {
            case 'solar-system':
                if (this.solarSystemView) {
                    this.solarSystemView.render();
                }
                break;
            case 'earth':
                if (this.earthView) {
                    this.earthView.render();
                }
                break;
            case 'galaxy':
                if (this.galaxyView) {
                    this.galaxyView.render();
                }
                break;
        }
    },
    
    // Load remaining textures
    loadRemainingTextures: function() {
        const allTextures = Object.keys(this.textureManager.textureUrls);
        const essentialTextures = [
            'sun', 'earth_day', 'earth_night', 'earth_clouds',
            'mercury', 'venus', 'mars', 'jupiter', 'saturn',
            'uranus', 'neptune', 'moon'
        ];
        
        const remainingTextures = allTextures.filter(texture => 
            !essentialTextures.includes(texture)
        );
        
        if (remainingTextures.length > 0) {
            console.log('Loading remaining textures...');
            this.textureManager.loadTextures(remainingTextures);
        }
    },
    
    // Handle view change
    onViewChange: function(viewName) {
        console.log(`View changed to: ${viewName}`);
        
        // Handle view-specific setup
        switch (viewName) {
            case 'solar-system':
                // Solar system view is already active
                break;
            case 'earth':
                // Earth view specific setup
                break;
            case 'galaxy':
                // Galaxy view specific setup
                break;
        }
    },
    
    // Handle time pause
    onTimePause: function() {
        console.log('Time paused');
        this.isTimePaused = true;
    },
    
    // Handle time resume
    onTimeResume: function() {
        console.log('Time resumed');
        this.isTimePaused = false;
    },
    
    // Handle time speed change
    onTimeSpeedChange: function(speed) {
        console.log(`Time speed changed to: ${speed}`);
        this.timeSpeed = speed;
    },
    
    // Show WebGL error
    showWebGLError: function() {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingContent = loadingScreen.querySelector('.loading-content');
        
        loadingContent.innerHTML = `
            <div class="loading-logo">❌</div>
            <h1>WebGL Not Supported</h1>
            <p>Your device or browser does not support WebGL, which is required to run this application.</p>
            <p>Please try updating your browser or using a different device.</p>
        `;
    },
    
    // Stop the application
    stop: function() {
        if (!this.isRunning) return;
        
        console.log('Stopping Solar System Explorer...');
        this.isRunning = false;
        
        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    },
    
    // Pause the application
    pause: function() {
        if (!this.isRunning) return;
        
        console.log('Pausing Solar System Explorer...');
        this.stop();
    },
    
    // Resume the application
    resume: function() {
        if (this.isRunning) return;
        
        console.log('Resuming Solar System Explorer...');
        this.start();
    },
    
    // Clean up resources
    dispose: function() {
        console.log('Disposing Solar System Explorer...');
        
        // Stop the application
        this.stop();
        
        // Dispose views
        if (this.solarSystemView) {
            this.solarSystemView.dispose();
        }
        if (this.earthView) {
            this.earthView.dispose();
        }
        if (this.galaxyView) {
            this.galaxyView.dispose();
        }
        
        // Dispose celestial bodies
        if (this.celestialBodies) {
            this.celestialBodies.dispose();
        }
        
        // Clear texture cache
        if (this.textureManager) {
            this.textureManager.clearCache();
        }
        
        this.isInitialized = false;
        console.log('Solar System Explorer disposed');
    },
    
    // Get application state
    getState: function() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            currentView: this.uiManager ? this.uiManager.getCurrentView() : null,
            timeSpeed: this.timeSpeed,
            isTimePaused: this.isTimePaused
        };
    },
    
    // Handle window focus/blur
    onWindowFocus: function() {
        if (this.isInitialized && !this.isRunning) {
            this.resume();
        }
    },
    
    onWindowBlur: function() {
        if (this.isInitialized && this.isRunning) {
            this.pause();
        }
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Solar System Explorer...');
    
    // Initialize the application
    SolarSystemApp.init();
    
    // Setup window event listeners
    window.addEventListener('focus', SolarSystemApp.onWindowFocus.bind(SolarSystemApp));
    window.addEventListener('blur', SolarSystemApp.onWindowBlur.bind(SolarSystemApp));
    
    // Setup page visibility change handler
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            SolarSystemApp.onWindowBlur();
        } else {
            SolarSystemApp.onWindowFocus();
        }
    });
    
    // Setup beforeunload handler
    window.addEventListener('beforeunload', function() {
        SolarSystemApp.dispose();
    });
});

// Make app globally accessible
window.SolarSystemApp = SolarSystemApp;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SolarSystemApp;
}