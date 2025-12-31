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

// Star class
class Star {
    constructor() {
        // Random position across the canvas
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        
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
        
        // Movement properties for subtle shifting
        this.originalX = this.x;
        this.originalY = this.y;
        this.driftX = (Math.random() - 0.5) * 0.02; // Very slow horizontal drift
        this.driftY = (Math.random() - 0.5) * 0.02; // Very slow vertical drift
        this.driftRadius = Math.random() * 3 + 1; // Max drift distance (1-4px)
        this.driftAngle = Math.random() * Math.PI * 2; // Random starting angle
        this.driftSpeed = Math.random() * 0.0005 + 0.0002; // Very slow rotation speed
        this.rightwardSpeed = 0.01; // Subtle constant movement to the right
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
        // Update originalX to account for rightward movement
        this.originalX += this.rightwardSpeed * deltaTime;
        
        // Subtle circular drift to simulate atmospheric effects
        this.driftAngle += this.driftSpeed * deltaTime;
        this.x = this.originalX + Math.cos(this.driftAngle) * this.driftRadius;
        this.y = this.originalY + Math.sin(this.driftAngle) * this.driftRadius;
        
        // Keep stars within canvas bounds (wrap around if needed)
        if (this.x < 0) {
            this.x = canvas.width;
            this.originalX = canvas.width;
        }
        if (this.x > canvas.width) {
            this.x = 0;
            this.originalX = 0;
        }
        if (this.y < 0) {
            this.y = canvas.height;
            this.originalY = canvas.height;
        }
        if (this.y > canvas.height) {
            this.y = 0;
            this.originalY = 0;
        }
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
const numStars = 800; // Adjust this number for more/fewer stars

// Initialize stars
for (let i = 0; i < numStars; i++) {
    stars.push(new Star());
}

// Add 150 more small stars (50 original + 100 new)
for (let i = 0; i < 150; i++) {
    const smallStar = new Star();
    // Force small size for these additional stars
    smallStar.size = (Math.random() * 1.5 + 0.5) * 0.6; // Small stars (0.3-1.2px)
    stars.push(smallStar);
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
    
    // Update and draw all stars
    stars.forEach(star => {
        star.update(clampedDeltaTime);
        star.draw();
    });
    
    requestAnimationFrame(animate);
}

// Handle window resize - maintain star positions
window.addEventListener('resize', () => {
    resizeCanvas();
    // Update original positions to maintain relative positions
    stars.forEach(star => {
        // Scale positions proportionally
        const scaleX = canvas.width / (canvas.width || 1);
        const scaleY = canvas.height / (canvas.height || 1);
        star.originalX *= scaleX;
        star.originalY *= scaleY;
        star.x = star.originalX;
        star.y = star.originalY;
    });
});

// Start animation
animate(performance.now());

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

