// UI Manager for the 3D Solar System Explorer

const UIManager = {
    // Current state
    currentView: 'solar-system',
    isInfoPanelVisible: false,
    isSearchVisible: false,
    
    // UI elements
    elements: {},
    
    // Initialize the UI Manager
    init: function() {
        console.log('Initializing UI Manager...');
        
        this.cacheElements();
        this.setupEventListeners();
        this.initializeControls();
        
        console.log('UI Manager initialized');
        return this;
    },
    
    // Cache DOM elements
    cacheElements: function() {
        this.elements = {
            // Navigation
            navButtons: document.querySelectorAll('.nav-btn'),
            navLogo: document.querySelector('.nav-logo'),
            
            // Controls
            timeControl: document.getElementById('time-control'),
            musicToggle: document.getElementById('music-toggle'),
            vrMode: document.getElementById('vr-mode'),
            nightMode: document.getElementById('night-mode'),
            
            // Time controls
            timeSpeed: document.getElementById('time-speed'),
            currentTime: document.getElementById('current-time'),
            
            // Search
            earthSearch: document.getElementById('earth-search'),
            locationSearch: document.getElementById('location-search'),
            searchBtn: document.getElementById('search-btn'),
            searchSuggestions: document.getElementById('search-suggestions'),
            
            // Info panel
            infoPanel: document.getElementById('info-panel'),
            infoTitle: document.getElementById('info-title'),
            infoContent: document.getElementById('info-content'),
            closeInfo: document.getElementById('close-info'),
            
            // HUD
            currentView: document.getElementById('current-view'),
            fpsCounter: document.getElementById('fps-counter'),
            
            // Easter egg
            easterEgg: document.getElementById('easter-egg'),
            easterEggText: document.getElementById('easter-egg-text'),
            
            // Main UI
            mainUI: document.getElementById('main-ui'),
            loadingScreen: document.getElementById('loading-screen')
        };
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Navigation buttons
        this.elements.navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
        
        // Control buttons
        this.elements.timeControl.addEventListener('click', this.toggleTimeControl.bind(this));
        this.elements.musicToggle.addEventListener('click', this.toggleMusic.bind(this));
        this.elements.vrMode.addEventListener('click', this.toggleVRMode.bind(this));
        this.elements.nightMode.addEventListener('click', this.toggleNightMode.bind(this));
        
        // Time speed slider
        this.elements.timeSpeed.addEventListener('input', this.onTimeSpeedChange.bind(this));
        
        // Search functionality
        this.elements.locationSearch.addEventListener('input', this.onSearchInput.bind(this));
        this.elements.searchBtn.addEventListener('click', this.performSearch.bind(this));
        
        // Info panel
        this.elements.closeInfo.addEventListener('click', this.hideInfoPanel.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        // Window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    },
    
    // Initialize controls state
    initializeControls: function() {
        // Set initial time speed
        this.elements.timeSpeed.value = CONFIG.TIME.DEFAULT_SPEED;
        this.updateTimeDisplay();
        
        // Set initial view
        this.updateCurrentViewDisplay();
        
        // Initialize FPS counter
        this.startFPSCounter();
    },
    
    // Switch between views
    switchView: function(viewName) {
        if (viewName === this.currentView) return;
        
        console.log(`Switching to view: ${viewName}`);
        
        // Deactivate current view
        this.deactivateCurrentView();
        
        // Update navigation buttons
        this.updateNavigationButtons(viewName);
        
        // Activate new view
        this.activateView(viewName);
        
        // Update current view display
        this.currentView = viewName;
        this.updateCurrentViewDisplay();
        
        // Update search visibility
        this.updateSearchVisibility(viewName);
        
        // Trigger view change event
        this.onViewChange(viewName);
    },
    
    // Deactivate current view
    deactivateCurrentView: function() {
        switch (this.currentView) {
            case 'solar-system':
                if (window.SolarSystemView) {
                    window.SolarSystemView.deactivate();
                }
                break;
            case 'earth':
                if (window.EarthView) {
                    window.EarthView.deactivate();
                }
                break;
            case 'galaxy':
                if (window.GalaxyView) {
                    window.GalaxyView.deactivate();
                }
                break;
        }
    },
    
    // Activate new view
    activateView: function(viewName) {
        switch (viewName) {
            case 'solar-system':
                if (window.SolarSystemView) {
                    window.SolarSystemView.activate();
                }
                break;
            case 'earth':
                if (window.EarthView) {
                    window.EarthView.activate();
                }
                break;
            case 'galaxy':
                if (window.GalaxyView) {
                    window.GalaxyView.activate();
                }
                break;
        }
    },
    
    // Update navigation buttons
    updateNavigationButtons: function(activeView) {
        this.elements.navButtons.forEach(button => {
            if (button.dataset.view === activeView) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    },
    
    // Update current view display
    updateCurrentViewDisplay: function() {
        const viewNames = {
            'solar-system': 'Solar System View',
            'earth': 'Earth View',
            'galaxy': 'Galaxy View'
        };
        
        this.elements.currentView.textContent = viewNames[this.currentView] || 'Unknown View';
    },
    
    // Update search visibility
    updateSearchVisibility: function(viewName) {
        if (viewName === 'earth') {
            this.showEarthSearch();
        } else {
            this.hideEarthSearch();
        }
    },
    
    // Show Earth search
    showEarthSearch: function() {
        this.elements.earthSearch.style.display = 'block';
        this.isSearchVisible = true;
    },
    
    // Hide Earth search
    hideEarthSearch: function() {
        this.elements.earthSearch.style.display = 'none';
        this.isSearchVisible = false;
        this.hideSearchSuggestions();
    },
    
    // Handle search input
    onSearchInput: function(event) {
        const query = event.target.value.trim();
        
        if (query.length === 0) {
            this.hideSearchSuggestions();
            return;
        }
        
        this.showSearchSuggestions(query);
    },
    
    // Show search suggestions
    showSearchSuggestions: function(query) {
        const suggestions = this.getSearchSuggestions(query);
        
        if (suggestions.length === 0) {
            this.hideSearchSuggestions();
            return;
        }
        
        this.elements.searchSuggestions.innerHTML = '';
        
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'search-suggestion';
            div.textContent = suggestion.name;
            div.addEventListener('click', () => {
                this.selectSearchSuggestion(suggestion);
            });
            this.elements.searchSuggestions.appendChild(div);
        });
        
        this.elements.searchSuggestions.style.display = 'block';
    },
    
    // Hide search suggestions
    hideSearchSuggestions: function() {
        this.elements.searchSuggestions.style.display = 'none';
    },
    
    // Get search suggestions
    getSearchSuggestions: function(query) {
        const locations = CONFIG.EARTH.LOCATIONS;
        const suggestions = [];
        
        Object.keys(locations).forEach(locationName => {
            const location = locations[locationName];
            
            if (locationName.toLowerCase().includes(query.toLowerCase()) ||
                location.name.toLowerCase().includes(query.toLowerCase())) {
                suggestions.push({
                    name: location.name,
                    data: location
                });
            }
        });
        
        return suggestions.slice(0, 5); // Limit to 5 suggestions
    },
    
    // Select search suggestion
    selectSearchSuggestion: function(suggestion) {
        this.elements.locationSearch.value = suggestion.name;
        this.hideSearchSuggestions();
        this.flyToLocation(suggestion.data);
    },
    
    // Perform search
    performSearch: function() {
        const query = this.elements.locationSearch.value.trim();
        
        if (query.length === 0) return;
        
        const location = this.findLocation(query);
        
        if (location) {
            this.flyToLocation(location);
        } else {
            this.showSearchError(`Location "${query}" not found`);
        }
    },
    
    // Find location by name
    findLocation: function(query) {
        const locations = CONFIG.EARTH.LOCATIONS;
        
        for (const locationName in locations) {
            const location = locations[locationName];
            if (locationName.toLowerCase() === query.toLowerCase() ||
                location.name.toLowerCase() === query.toLowerCase()) {
                return location;
            }
        }
        
        return null;
    },
    
    // Fly to location
    flyToLocation: function(location) {
        if (window.EarthView && this.currentView === 'earth') {
            window.EarthView.flyToLocation(location.name);
        }
    },
    
    // Show search error
    showSearchError: function(message) {
        // Simple error display (could be enhanced)
        console.warn(message);
        
        // Show temporary error in search box
        const originalValue = this.elements.locationSearch.value;
        this.elements.locationSearch.value = message;
        this.elements.locationSearch.style.color = '#ff6b6b';
        
        setTimeout(() => {
            this.elements.locationSearch.value = originalValue;
            this.elements.locationSearch.style.color = 'white';
        }, 2000);
    },
    
    // Toggle time control
    toggleTimeControl: function() {
        const isPaused = this.elements.timeControl.classList.contains('active');
        
        if (isPaused) {
            this.resumeTime();
        } else {
            this.pauseTime();
        }
    },
    
    // Pause time
    pauseTime: function() {
        this.elements.timeControl.classList.add('active');
        this.elements.timeControl.querySelector('.icon').textContent = '▶️';
        this.elements.timeControl.title = 'Resume Time';
        
        // Trigger time pause event
        this.onTimePause();
    },
    
    // Resume time
    resumeTime: function() {
        this.elements.timeControl.classList.remove('active');
        this.elements.timeControl.querySelector('.icon').textContent = '⏸️';
        this.elements.timeControl.title = 'Pause Time';
        
        // Trigger time resume event
        this.onTimeResume();
    },
    
    // Toggle music
    toggleMusic: function() {
        this.elements.musicToggle.classList.toggle('active');
        
        if (this.elements.musicToggle.classList.contains('active')) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
    },
    
    // Play music
    playMusic: function() {
        // Implement music playback
        console.log('Music started');
    },
    
    // Stop music
    stopMusic: function() {
        // Implement music stop
        console.log('Music stopped');
    },
    
    // Toggle VR mode
    toggleVRMode: function() {
        if (Utils.Device.supportsWebXR()) {
            this.elements.vrMode.classList.toggle('active');
            
            if (this.elements.vrMode.classList.contains('active')) {
                this.enterVRMode();
            } else {
                this.exitVRMode();
            }
        } else {
            this.showEasterEgg('VR not supported on this device');
        }
    },
    
    // Enter VR mode
    enterVRMode: function() {
        // Implement VR mode
        console.log('Entering VR mode');
    },
    
    // Exit VR mode
    exitVRMode: function() {
        // Implement VR mode exit
        console.log('Exiting VR mode');
    },
    
    // Toggle night mode
    toggleNightMode: function() {
        this.elements.nightMode.classList.toggle('active');
        
        if (this.elements.nightMode.classList.contains('active')) {
            this.enableNightMode();
        } else {
            this.disableNightMode();
        }
    },
    
    // Enable night mode
    enableNightMode: function() {
        document.body.classList.add('night-mode');
        console.log('Night mode enabled');
    },
    
    // Disable night mode
    disableNightMode: function() {
        document.body.classList.remove('night-mode');
        console.log('Night mode disabled');
    },
    
    // Handle time speed change
    onTimeSpeedChange: function(event) {
        const speed = parseInt(event.target.value);
        this.updateTimeDisplay(speed);
        
        // Trigger time speed change event
        this.onTimeSpeedChange(speed);
    },
    
    // Update time display
    updateTimeDisplay: function(speed = null) {
        if (speed === null) {
            speed = parseInt(this.elements.timeSpeed.value);
        }
        
        const currentDate = new Date();
        const timeString = Utils.Time.formatTime(currentDate);
        
        if (speed === 0) {
            this.elements.currentTime.textContent = `Time: Paused`;
        } else if (speed === 100) {
            this.elements.currentTime.textContent = `Earth Time: ${timeString}`;
        } else {
            this.elements.currentTime.textContent = `Time Speed: ${speed}x`;
        }
    },
    
    // Show info panel
    showInfoPanel: function(info) {
        if (!info) return;
        
        // Update info content
        this.elements.infoTitle.textContent = info.name;
        
        let content = '';
        for (const [key, value] of Object.entries(info)) {
            if (key === 'name') continue;
            
            const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
            content += `<p><strong>${label}:</strong> ${value}</p>`;
        }
        
        this.elements.infoContent.innerHTML = content;
        
        // Show panel
        this.elements.infoPanel.classList.add('visible');
        this.isInfoPanelVisible = true;
    },
    
    // Hide info panel
    hideInfoPanel: function() {
        this.elements.infoPanel.classList.remove('visible');
        this.isInfoPanelVisible = false;
    },
    
    // Show easter egg
    showEasterEgg: function(message) {
        this.elements.easterEggText.textContent = message;
        this.elements.easterEgg.classList.add('show');
        
        setTimeout(() => {
            this.elements.easterEgg.classList.remove('show');
        }, 3000);
    },
    
    // Start FPS counter
    startFPSCounter: function() {
        setInterval(() => {
            const fps = Utils.Performance.fpsCounter.update();
            this.elements.fpsCounter.textContent = `FPS: ${fps}`;
        }, 1000);
    },
    
    // Handle keyboard shortcuts
    onKeyDown: function(event) {
        switch (event.key.toLowerCase()) {
            case '1':
                this.switchView('solar-system');
                break;
            case '2':
                this.switchView('earth');
                break;
            case '3':
                this.switchView('galaxy');
                break;
            case ' ':
                event.preventDefault();
                this.toggleTimeControl();
                break;
            case 'escape':
                if (this.isInfoPanelVisible) {
                    this.hideInfoPanel();
                }
                break;
            case 'l':
                // Force complete loading if stuck (emergency)
                if (this.elements.loadingScreen.style.display !== 'none') {
                    this.forceCompleteLoading();
                }
                break;
        }
    },
    
    // Handle window resize
    onWindowResize: function() {
        // Update all views
        if (window.SolarSystemView) {
            window.SolarSystemView.onWindowResize();
        }
        if (window.EarthView) {
            window.EarthView.onWindowResize();
        }
        if (window.GalaxyView) {
            window.GalaxyView.onWindowResize();
        }
    },
    
    // Event handlers (to be overridden by main app)
    onViewChange: function(viewName) {
        // Override in main app
    },
    
    onTimePause: function() {
        // Override in main app
    },
    
    onTimeResume: function() {
        // Override in main app
    },
    
    onTimeSpeedChange: function(speed) {
        // Override in main app
    },
    
    // Hide loading screen
    hideLoadingScreen: function() {
        this.elements.loadingScreen.style.opacity = '0';
        setTimeout(() => {
            this.elements.loadingScreen.style.display = 'none';
            this.elements.mainUI.style.display = 'block';
        }, 500);
    },
    
    // Force complete loading (emergency fallback)
    forceCompleteLoading: function() {
        console.log('Force completing loading...');
        this.updateLoadingProgress(100);
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 1000);
    },
    
    // Update loading progress
    updateLoadingProgress: function(progress) {
        const progressBar = this.elements.loadingScreen.querySelector('.loading-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        const loadingText = this.elements.loadingScreen.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = `Loading universe... ${Math.round(progress)}%`;
        }
        
        // Auto-hide loading screen when progress reaches 100%
        if (progress >= 100) {
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 500);
        }
    },
    
    // Get current view
    getCurrentView: function() {
        return this.currentView;
    },
    
    // Check if info panel is visible
    isInfoPanelVisible: function() {
        return this.isInfoPanelVisible;
    },
    
    // Check if search is visible
    isSearchVisible: function() {
        return this.isSearchVisible;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}