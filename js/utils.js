// Utility functions for the 3D Solar System Explorer

const Utils = {
    // Math utilities
    Math: {
        // Convert degrees to radians
        degToRad: (degrees) => degrees * (Math.PI / 180),
        
        // Convert radians to degrees
        radToDeg: (radians) => radians * (180 / Math.PI),
        
        // Clamp value between min and max
        clamp: (value, min, max) => Math.min(Math.max(value, min), max),
        
        // Linear interpolation
        lerp: (start, end, factor) => start + (end - start) * factor,
        
        // Smooth interpolation
        smoothStep: (edge0, edge1, x) => {
            const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
            return t * t * (3.0 - 2.0 * t);
        },
        
        // Generate random number between min and max
        random: (min, max) => Math.random() * (max - min) + min,
        
        // Generate random integer between min and max
        randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
        
        // Calculate distance between two 3D points
        distance: (p1, p2) => {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dz = p2.z - p1.z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        },
        
        // Calculate distance between two 2D points
        distance2D: (p1, p2) => {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            return Math.sqrt(dx * dx + dy * dy);
        },
        
        // Spherical to Cartesian coordinates
        sphericalToCartesian: (radius, theta, phi) => {
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.sin(theta);
            return { x, y, z };
        },
        
        // Cartesian to spherical coordinates
        cartesianToSpherical: (x, y, z) => {
            const radius = Math.sqrt(x * x + y * y + z * z);
            const theta = Math.atan2(z, x);
            const phi = Math.acos(y / radius);
            return { radius, theta, phi };
        }
    },

    // Coordinate conversion utilities
    Coordinates: {
        // Convert latitude/longitude to 3D position on a sphere
        latLonToPosition: (lat, lon, radius) => {
            const phi = Utils.Math.degToRad(90 - lat);
            const theta = Utils.Math.degToRad(lon);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.sin(theta);
            
            return { x, y, z };
        },
        
        // Convert 3D position to latitude/longitude
        positionToLatLon: (x, y, z) => {
            const radius = Math.sqrt(x * x + y * y + z * z);
            const lat = 90 - Utils.Math.radToDeg(Math.acos(y / radius));
            const lon = Utils.Math.radToDeg(Math.atan2(z, x));
            
            return { lat, lon };
        },
        
        // Convert astronomical units to kilometers
        auToKm: (au) => au * 149597870.7,
        
        // Convert kilometers to astronomical units
        kmToAu: (km) => km / 149597870.7,
        
        // Convert light years to kilometers
        lyToKm: (ly) => ly * 9460730472580800,
        
        // Convert kilometers to light years
        kmToLy: (km) => km / 9460730472580800
    },

    // Time utilities
    Time: {
        // Get current Julian Date
        getJulianDate: () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const hour = now.getHours();
            const minute = now.getMinutes();
            const second = now.getSeconds();
            
            if (month <= 2) {
                year -= 1;
                month += 12;
            }
            
            const a = Math.floor(year / 100);
            const b = 2 - a + Math.floor(a / 4);
            
            const jd = Math.floor(365.25 * (year + 4716)) +
                      Math.floor(30.6001 * (month + 1)) +
                      day + b - 1524.5 +
                      hour / 24 + minute / 1440 + second / 86400;
            
            return jd;
        },
        
        // Calculate time since J2000 epoch
        getJ2000: () => {
            const jd = Utils.Time.getJulianDate();
            return jd - 2451545.0;
        },
        
        // Format time for display
        formatTime: (date) => {
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short'
            };
            return date.toLocaleDateString('en-US', options);
        },
        
        // Calculate orbital position based on time
        calculateOrbitalPosition: (semiMajorAxis, eccentricity, inclination, 
                                  longitudeOfAscendingNode, argumentOfPeriapsis, 
                                  meanAnomaly, time) => {
            // Simplified orbital mechanics calculation
            const meanMotion = 2 * Math.PI / 365.25; // Simplified for Earth years
            const currentMeanAnomaly = meanAnomaly + meanMotion * time;
            
            // Approximate true anomaly (Kepler's equation simplified)
            const trueAnomaly = currentMeanAnomaly + 
                               2 * eccentricity * Math.sin(currentMeanAnomaly);
            
            // Calculate radius
            const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / 
                          (1 + eccentricity * Math.cos(trueAnomaly));
            
            // Calculate 3D position
            const x = radius * (Math.cos(longitudeOfAscendingNode) * 
                               Math.cos(argumentOfPeriapsis + trueAnomaly) -
                               Math.sin(longitudeOfAscendingNode) * 
                               Math.sin(argumentOfPeriapsis + trueAnomaly) * 
                               Math.cos(inclination));
            
            const y = radius * (Math.sin(longitudeOfAscendingNode) * 
                               Math.cos(argumentOfPeriapsis + trueAnomaly) +
                               Math.cos(longitudeOfAscendingNode) * 
                               Math.sin(argumentOfPeriapsis + trueAnomaly) * 
                               Math.cos(inclination));
            
            const z = radius * Math.sin(argumentOfPeriapsis + trueAnomaly) * 
                      Math.sin(inclination);
            
            return { x, y, z, radius, trueAnomaly };
        }
    },

    // Color utilities
    Color: {
        // Convert hex color to RGB
        hexToRgb: (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        
        // Convert RGB to hex
        rgbToHex: (r, g, b) => {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        },
        
        // Interpolate between two colors
        interpolate: (color1, color2, factor) => {
            const r = Math.round(color1.r + (color2.r - color1.r) * factor);
            const g = Math.round(color1.g + (color2.g - color1.g) * factor);
            const b = Math.round(color1.b + (color2.b - color1.b) * factor);
            return { r, g, b };
        },
        
        // Generate random color
        random: () => {
            const r = Utils.Math.randomInt(0, 255);
            const g = Utils.Math.randomInt(0, 255);
            const b = Utils.Math.randomInt(0, 255);
            return { r, g, b };
        }
    },

    // Performance utilities
    Performance: {
        // FPS counter
        fpsCounter: {
            frames: 0,
            lastTime: performance.now(),
            fps: 0,
            
            update: () => {
                Utils.Performance.fpsCounter.frames++;
                const currentTime = performance.now();
                
                if (currentTime - Utils.Performance.fpsCounter.lastTime >= 1000) {
                    Utils.Performance.fpsCounter.fps = Utils.Performance.fpsCounter.frames;
                    Utils.Performance.fpsCounter.frames = 0;
                    Utils.Performance.fpsCounter.lastTime = currentTime;
                }
                
                return Utils.Performance.fpsCounter.fps;
            }
        },
        
        // Throttle function calls
        throttle: (func, limit) => {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        // Debounce function calls
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    },

    // Animation utilities
    Animation: {
        // Easing functions
        easing: {
            linear: (t) => t,
            easeInQuad: (t) => t * t,
            easeOutQuad: (t) => t * (2 - t),
            easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: (t) => t * t * t,
            easeOutCubic: (t) => (--t) * t * t + 1,
            easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
        },
        
        // Smooth camera transition
        smoothTransition: (camera, targetPosition, targetLookAt, duration, easing = 'easeInOutCubic') => {
            const startPosition = camera.position.clone();
            const startLookAt = camera.getWorldDirection(new THREE.Vector3());
            const startTime = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = Utils.Animation.easing[easing](progress);
                
                camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
                
                const currentLookAt = new THREE.Vector3();
                currentLookAt.lerpVectors(startLookAt, targetLookAt, easedProgress);
                camera.lookAt(currentLookAt);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            requestAnimationFrame(animate);
        }
    },

    // Device detection
    Device: {
        isMobile: () => {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        isTablet: () => {
            return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
        },
        
        isDesktop: () => {
            return !Utils.Device.isMobile() && !Utils.Device.isTablet();
        },
        
        supportsWebGL: () => {
            try {
                const canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && 
                         (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            } catch (e) {
                return false;
            }
        },
        
        supportsWebXR: () => {
            return 'xr' in navigator;
        }
    },

    // Storage utilities
    Storage: {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.warn('Failed to save to localStorage:', e);
            }
        },
        
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('Failed to read from localStorage:', e);
                return defaultValue;
            }
        },
        
        remove: (key) => {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('Failed to remove from localStorage:', e);
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}