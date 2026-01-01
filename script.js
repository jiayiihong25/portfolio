// Get canvas and context
const canvas = document.getElementById('star-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Calculate orbital center (middle of the mountain)
function getOrbitalCenter() {
    const mountain = document.getElementById('mountain');
    if (mountain) {
        const rect = mountain.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    // Fallback to center bottom if mountain not found
    return {
        x: canvas.width / 2,
        y: canvas.height * 0.85
    };
}

// Star class
class Star {
    constructor(center) {
        // Size variation (smaller stars are more common) - all sizes reduced
        const sizeRand = Math.random();
        if (sizeRand < 0.7) {
            this.size = (Math.random() * 1.5 + 0.5) * 0.6; // Small stars (0.3-1.2px)
        } else if (sizeRand < 0.95) {
            // Medium stars further reduced
            this.size = (Math.random() * 1.5 + 2) * 0.42; // Medium stars (0.9-1.5px)
        } else {
            // Large stars further reduced
            this.size = (Math.random() * 2 + 3.5) * 0.3; // Large stars (1.05-1.65px)
        }
        
        // Brightness (0 to 1)
        this.brightness = Math.random() * 0.5 + 0.5; // Start between 0.5 and 1
        
        // Blinking properties - slow and infrequent twinkling
        this.blinkSpeed = Math.random() * 0.003 + 0.001; // Much slower blink speed
        this.blinkDirection = Math.random() > 0.5 ? 1 : -1; // Random initial direction
        this.minBrightness = Math.random() * 0.3 + 0.1; // Minimum brightness (0.1-0.4)
        this.maxBrightness = Math.random() * 0.3 + 0.7; // Maximum brightness (0.7-1.0)
        
        // Random delay before starting to blink (much longer for less frequent twinkling)
        this.blinkDelay = Math.random() * 8000 + 2000; // 2-10 seconds delay
        this.timeElapsed = 0;
        this.pauseBetweenBlinks = 0; // Pause counter between blink cycles
        this.pauseDuration = Math.random() * 5000 + 3000; // 3-8 seconds pause between cycles
        
        // Orbital properties - initialize with evenly distributed orbital properties
        // Use random angle for even distribution around the center
        this.orbitalAngle = Math.random() * Math.PI * 2;
        // Use square root distribution for better spread (more stars at larger radii)
        const maxRadius = Math.max(canvas.width, canvas.height) * 0.8;
        this.orbitalRadius = Math.sqrt(Math.random()) * maxRadius + 50; // Minimum radius of 50px
        // Orbital speed - all orbit clockwise (right) at a slow pace
        this.orbitalSpeed = Math.random() * 0.00001 + 0.000020; // Slow clockwise orbit
        
        // Calculate initial position based on orbital properties
        this.x = center.x + Math.cos(this.orbitalAngle) * this.orbitalRadius;
        this.y = center.y + Math.sin(this.orbitalAngle) * this.orbitalRadius;
    }
    
    update(deltaTime) {
        this.timeElapsed += deltaTime;
        
        // Wait for delay before starting to blink
        if (this.timeElapsed < this.blinkDelay) {
            // Still update position even if not blinking yet
            this.updatePosition(deltaTime);
            return;
        }
        
        // Check if we're in a pause period between blink cycles
        if (this.pauseBetweenBlinks > 0) {
            this.pauseBetweenBlinks -= deltaTime;
            this.updatePosition(deltaTime);
            return;
        }
        
        // Update brightness - slow twinkling
        this.brightness += this.blinkSpeed * this.blinkDirection;
        
        // Reverse direction at boundaries
        if (this.brightness >= this.maxBrightness) {
            this.brightness = this.maxBrightness;
            this.blinkDirection = -1;
            // Start pause after reaching max brightness
            this.pauseBetweenBlinks = this.pauseDuration;
        } else if (this.brightness <= this.minBrightness) {
            this.brightness = this.minBrightness;
            this.blinkDirection = 1;
            // Start pause after reaching min brightness
            this.pauseBetweenBlinks = this.pauseDuration;
            // Reset delay for next blink cycle (less frequent)
            this.blinkDelay = this.timeElapsed + Math.random() * 8000 + 2000;
        }
        
        // Occasionally change blink speed for more natural variation (slower)
        if (Math.random() > 0.995) {
            this.blinkSpeed = Math.random() * 0.003 + 0.001;
        }
        
        // Update position for subtle movement
        this.updatePosition(deltaTime);
    }
    
    updatePosition(deltaTime) {
        // Get the current orbital center (in case window was resized)
        const center = getOrbitalCenter();
        
        // Update orbital angle
        this.orbitalAngle += this.orbitalSpeed * deltaTime;
        
        // Calculate new position based on orbital motion
        this.x = center.x + Math.cos(this.orbitalAngle) * this.orbitalRadius;
        this.y = center.y + Math.sin(this.orbitalAngle) * this.orbitalRadius;
        
        // Keep stars within reasonable bounds - just let them continue orbiting naturally
        // If they go off-screen, they'll naturally come back around
    }
    
    draw() {
        // Calculate opacity based on brightness
        const opacity = this.brightness;
        
        // Draw star as a circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Use white with varying opacity for twinkling effect
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
        
        // Add a subtle glow for larger stars (adjusted threshold for further reduced size)
        if (this.size > 0.9) {
            ctx.shadowBlur = this.size * 2;
            ctx.shadowColor = `rgba(255, 255, 255, ${opacity * 0.5})`;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// Create stars array
const stars = [];
const numStars = 1500; // Adjust this number for more/fewer stars
let starsInitialized = false;

// Function to initialize stars after mountain image is loaded
function initializeStars() {
    if (starsInitialized) return; // Prevent double initialization
    starsInitialized = true;
    
    // Get the orbital center - wait a frame to ensure image is positioned
    const center = getOrbitalCenter();
    
    // Initialize stars
    for (let i = 0; i < numStars; i++) {
        stars.push(new Star(center));
    }
    
    // Add 150 more small stars
    for (let i = 0; i < 150; i++) {
        const smallStar = new Star(center);
        // Force small size for these additional stars
        smallStar.size = (Math.random() * 1.5 + 0.5) * 0.6; // Small stars (0.3-1.2px)
        stars.push(smallStar);
    }
}

// Wait for mountain image to load before initializing stars
const mountain = document.getElementById('mountain');
if (mountain && mountain.complete) {
    // Image already loaded, initialize immediately (with a small delay to ensure positioning)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            initializeStars();
        });
    });
} else if (mountain) {
    // Wait for image to load
    mountain.addEventListener('load', () => {
        // Wait a frame for positioning to settle
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                initializeStars();
            });
        });
    });
    // Fallback in case load event doesn't fire
    setTimeout(() => {
        if (!starsInitialized) {
            initializeStars();
        }
    }, 100);
} else {
    // Mountain not found, initialize with fallback center
    initializeStars();
}

// Animation variables
let lastTime = performance.now();
let isTabVisible = true;

// Handle tab visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        isTabVisible = false;
    } else {
        isTabVisible = true;
        // Reset lastTime when tab becomes visible to prevent huge deltaTime
        lastTime = performance.now();
    }
});

// Animation loop
function animate(currentTime) {
    const deltaTime = currentTime - lastTime;
    
    // Cap deltaTime to prevent huge jumps when tab becomes visible again
    // This prevents stars from clumping when switching tabs
    const maxDeltaTime = 100; // Cap at ~100ms (roughly 6 frames at 60fps)
    const clampedDeltaTime = Math.min(deltaTime, maxDeltaTime);
    
    lastTime = currentTime;
    
    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw all stars (only if initialized)
    if (stars.length > 0) {
        stars.forEach(star => {
            star.update(clampedDeltaTime);
            star.draw();
        });
    }
    
    requestAnimationFrame(animate);
}

// Handle window resize - stars will automatically adjust since center is recalculated each frame
window.addEventListener('resize', () => {
    resizeCanvas();
    // Stars will naturally adjust since getOrbitalCenter() is called each frame in updatePosition
});

// Start animation
animate(performance.now());

// Initialize orbital lines after page loads
// Wait for mountain to load so we can calculate center correctly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => initializeOrbitalLines(), 100);
    });
} else {
    setTimeout(() => initializeOrbitalLines(), 100);
}

// Also reinitialize on window resize
window.addEventListener('resize', () => {
    initializeOrbitalLines();
});

// Fade-in effect for explore page
if (window.location.pathname.includes('explore.html')) {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 50);
}

// Hamburger menu functionality
const hamburgerButton = document.getElementById('hamburger-button');
const dropdownMenu = document.getElementById('dropdown-menu');

hamburgerButton.addEventListener('click', () => {
    hamburgerButton.classList.toggle('active');
    dropdownMenu.classList.toggle('dropdown-hidden');
    dropdownMenu.classList.toggle('dropdown-visible');
});

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    const isClickInside = hamburgerButton.contains(event.target) || dropdownMenu.contains(event.target);
    if (!isClickInside && dropdownMenu.classList.contains('dropdown-visible')) {
        hamburgerButton.classList.remove('active');
        dropdownMenu.classList.remove('dropdown-visible');
        dropdownMenu.classList.add('dropdown-hidden');
    }
});

// Explore button functionality - fade out text lines and animate orbital lines
const exploreButton = document.getElementById('explore-button');
if (exploreButton) {
    exploreButton.addEventListener('click', (e) => {
        e.preventDefault();
        // Fade out line-1, line-2, and line-3
        const line1 = document.querySelector('.line-1');
        const line2 = document.querySelector('.line-2');
        const line3 = document.querySelector('.line-3');
        
        if (line1) line1.style.opacity = '0';
        if (line2) line2.style.opacity = '0';
        if (line3) line3.style.opacity = '0';
        
        // Animate orbital lines
        animateOrbitalLines();
    });
}

// Initialize orbital lines with full paths (called on page load)
function initializeOrbitalLines() {
    const orbitalLinesSvg = document.getElementById('orbital-lines');
    const lines = orbitalLinesSvg.querySelectorAll('.orbital-line');
    if (lines.length === 0) return;
    
    const center = getOrbitalCenter();
    
    // Calculate starting and ending angles from bottom corners of screen
    const bottomY = window.innerHeight;
    const centerX = center.x;
    const centerY = center.y;
    
    // Left side of screen at bottom
    const leftX = 0;
    const leftY = bottomY;
    const dxLeft = leftX - centerX;
    const dyLeft = leftY - centerY;
    const startAngle = Math.atan2(dyLeft, dxLeft);
    
    // Right side of screen at bottom
    const rightX = window.innerWidth;
    const rightY = bottomY;
    const dxRight = rightX - centerX;
    const dyRight = rightY - centerY;
    const endAngle = Math.atan2(dyRight, dxRight);
    
    // Calculate base radius based on distance from center to bottom corners
    const baseRadius = Math.max(
        Math.sqrt(dxLeft * dxLeft + dyLeft * dyLeft),
        Math.sqrt(dxRight * dxRight + dyRight * dyRight)
    );
    
    // Different radii for each line to create parallel arcs with larger spacing
    const radiusOffsets = [0, 100, 220, 360];
    
    // Create full paths for each line
    lines.forEach((line, index) => {
        const lineRadius = baseRadius + radiusOffsets[index];
        
        // Build full SVG path from start to end
        const startX = center.x + Math.cos(startAngle) * lineRadius;
        const startY = center.y + Math.sin(startAngle) * lineRadius;
        const endX = center.x + Math.cos(endAngle) * lineRadius;
        const endY = center.y + Math.sin(endAngle) * lineRadius;
        
        // Create full arc path
        const largeArcFlag = 0;
        const sweepFlag = 1; // Clockwise
        
        const pathData = `M ${startX} ${startY} A ${lineRadius} ${lineRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
        line.setAttribute('d', pathData);
        
        // Get path length for stroke-dasharray animation
        const pathLength = line.getTotalLength();
        
        // Set up dash array and offset to hide the line initially
        line.style.strokeDasharray = pathLength;
        line.style.strokeDashoffset = pathLength;
        line.style.opacity = '0';
    });
}

// Function to animate 4 lines being drawn from left to right
function animateOrbitalLines() {
    const orbitalLinesSvg = document.getElementById('orbital-lines');
    const lines = orbitalLinesSvg.querySelectorAll('.orbital-line');
    if (lines.length === 0) return;
    
    // Different durations for each line (slower overall)
    const durations = [1200, 1500, 1800, 2100]; // ms - each line has a different speed
    const startTime = performance.now();
    
    // Stagger the lines slightly for visual effect
    const staggerDelay = 100; // ms between each line
    
    lines.forEach((line, index) => {
        const lineStartTime = startTime + (index * staggerDelay);
        const duration = durations[index]; // Each line gets its own duration
        const pathLength = line.getTotalLength();
        
        // Make line visible
        line.style.opacity = '1';
        
        function animateLine(currentTime) {
            const elapsed = currentTime - lineStartTime;
            const progress = Math.min(Math.max(elapsed / duration, 0), 1);
            
            // Use ease-out for smoother animation
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            // Animate stroke-dashoffset from pathLength to 0 to reveal the line
            const dashOffset = pathLength * (1 - easedProgress);
            line.style.strokeDashoffset = dashOffset;
            
            if (progress < 1) {
                requestAnimationFrame(animateLine);
            } else {
                // Animation complete, line fully revealed
                line.style.strokeDashoffset = '0';
            }
        }
        
        // Start animation for this line
        requestAnimationFrame(animateLine);
    });
}

// Homepage link functionality - transition back to homepage
const homepageLinks = document.querySelectorAll('a[href="index.html"]');
homepageLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Add fade-out transition
        document.body.style.transition = 'opacity 0.5s ease-out';
        document.body.style.opacity = '0';
        
        // Navigate to homepage after transition
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    });
});

