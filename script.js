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

    // Find the star closest to the center of the page to track (orbital-line-1)
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    let closestStar = null;
    let closestDistance = Infinity;

    stars.forEach(star => {
        // Calculate distance from star to screen center
        const dx = star.x - screenCenterX;
        const dy = star.y - screenCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestStar = star;
        }
    });

    trackedStar1 = closestStar;

    // Find a second star that's 40px further out for orbital-line-2
    let secondClosestStar = null;
    let secondClosestDistance = Infinity;
    const targetRadius = trackedStar1.orbitalRadius + 40; // 40px further out

    stars.forEach(star => {
        // Find a star with orbital radius close to targetRadius (within 30px range for 40px offset)
        const radiusDiff = Math.abs(star.orbitalRadius - targetRadius);
        if (radiusDiff < 30 && star !== trackedStar1) {
            if (radiusDiff < secondClosestDistance) {
                secondClosestDistance = radiusDiff;
                secondClosestStar = star;
            }
        }
    });

    // If no star found close to target, find the next closest one
    if (!secondClosestStar) {
        stars.forEach(star => {
            if (star !== trackedStar1 && star.orbitalRadius > trackedStar1.orbitalRadius) {
                const radiusDiff = star.orbitalRadius - trackedStar1.orbitalRadius;
                if (radiusDiff < secondClosestDistance) {
                    secondClosestDistance = radiusDiff;
                    secondClosestStar = star;
                }
            }
        });
    }

    trackedStar2 = secondClosestStar || trackedStar1; // Fallback to star1 if no second star found

    resetOrbitalNodes();
}

// Function to reset orbital node positions to their starting points (based on red dots diagram)
function resetOrbitalNodes() {
    const mountain = document.getElementById('mountain');
    if (mountain && trackedStar1) {
        const rect = mountain.getBoundingClientRect();
        const center = getOrbitalCenter();
        const dy = rect.top - center.y;

        // Base angle where line peeks out of left side of mountain
        // Ensure dy / trackedStar1.orbitalRadius is within [-1, 1] for asin
        const clampedRatio1 = Math.max(-1, Math.min(1, dy / trackedStar1.orbitalRadius));
        const startAngle1 = Math.PI - Math.asin(clampedRatio1);

        const line2Radius = trackedStar1.orbitalRadius + 60;
        // Ensure dy / line2Radius is within [-1, 1] for asin
        const clampedRatio2 = Math.max(-1, Math.min(1, dy / line2Radius));
        const startAngle2 = Math.PI - Math.asin(clampedRatio2);

        // Shifted an additional 100px counterclockwise (total 220px offset)
        const totalShift = 220;
        // Move "about me" slightly clockwise (180px vs 220px)
        orbitalNode.angle = (startAngle1 + 0.2) - (180 / trackedStar1.orbitalRadius);
        orbitalNode2.angle = (startAngle2 + 0.6) - (totalShift / line2Radius);

        // Ball 3 (designathons) starts at 12:00 position
        orbitalNode3.angle = Math.PI * 1.5;

        // Ball 4 (cases) starts at 10:00 position (PI + PI/6)
        orbitalNode4.angle = (7 / 6) * Math.PI;
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
let showOrbitalPath = false; // Flag to show orbital path line when explore button is clicked
let trackedStar1 = null; // Star closest to center that we'll track (orbital-line-1)
let trackedStar2 = null; // Star slightly further out that we'll track (orbital-line-2)
let orbitalPathProgress = 0; // Drawing progress of the orbital path lines (0 to 1)
let isTransitioning = false; // Flag to track if the transition overlay is active

// Interactive node properties
const orbitalNode = {
    angle: Math.PI * 1.5, // Start at top
    radius: 12.5, // 25px diameter / 2
    hoverRadius: 15, // Expand to 30px diameter
    currentRadius: 12.5,
    isHovered: false,
    text: 'about me'
};
const orbitalNode2 = {
    angle: Math.PI * 1.5,
    radius: 15, // 30px diameter / 2
    hoverRadius: 18, // Expand to 36px diameter
    currentRadius: 15,
    isHovered: false,
    text: 'projects'
};
const orbitalNode3 = {
    angle: Math.PI * 1.5,
    radius: 22.5, // 45px diameter / 2
    hoverRadius: 26, // Expand to 52px diameter
    currentRadius: 22.5,
    isHovered: false,
    text: 'graphic design'
};
const orbitalNode4 = {
    angle: Math.PI * 1.5,
    radius: 27.5, // 55px diameter / 2
    hoverRadius: 32, // Expand to 64px diameter
    currentRadius: 27.5,
    isHovered: false,
    text: 'cases'
};
let mouseX = 0;
let mouseY = 0;

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

        // Draw orbital-line-1: path for the first tracked star (0.5px white line with drawing animation)
        if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathProgress > 0) {
            const center = getOrbitalCenter();
            const startAngle = Math.PI / 2; // 6 o'clock
            const endAngle = startAngle + Math.PI * 2 * orbitalPathProgress;

            // Draw the partial circular orbit path
            ctx.save();

            // Draw blurred background glow
            ctx.filter = 'blur(2px)';
            ctx.beginPath();
            ctx.arc(center.x, center.y, trackedStar1.orbitalRadius, startAngle, endAngle);
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2) * 0.5})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Draw main line
            ctx.filter = 'none';
            ctx.beginPath();
            ctx.arc(center.x, center.y, trackedStar1.orbitalRadius, startAngle, endAngle);
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2)})`; // Fade in while drawing
            ctx.lineWidth = 0.5;
            ctx.stroke();

            ctx.restore();
        }

    }

    // --- DRAW BALLS ---
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathProgress > 0.05) {
        const center = getOrbitalCenter();
        const nodes = [
            { node: orbitalNode, radius: trackedStar1.clusterRadius || trackedStar1.orbitalRadius },
            { node: orbitalNode2, radius: (trackedStar1.clusterRadius || trackedStar1.orbitalRadius) + 60 },
            { node: orbitalNode3, radius: (trackedStar1.clusterRadius || trackedStar1.orbitalRadius) + 140 },
            { node: orbitalNode4, radius: (trackedStar1.clusterRadius || trackedStar1.orbitalRadius) + 240 }
        ];

        let anyHovered = false;

        nodes.forEach(({ node, radius }) => {
            // Update node angle (10x slower orbit normally, 100000x faster between 3 and 9 o'clock)
            // 3 o'clock = 0 rad, 9 o'clock = PI rad
            const normalizedAngle = node.angle % (Math.PI * 2);
            const isSlingshotZone = normalizedAngle >= 0 && normalizedAngle <= Math.PI;

            const baseSpeed = 0.00001;
            const slingshotSpeed = baseSpeed * 100000;
            const currentSpeed = isSlingshotZone ? slingshotSpeed : baseSpeed;

            node.angle += currentSpeed * clampedDeltaTime;

            // Calculate position
            const nodeX = center.x + Math.cos(node.angle) * radius;
            const nodeY = center.y + Math.sin(node.angle) * radius;

            // Hit testing
            if (!isTransitioning) {
                const dx = mouseX - nodeX;
                const dy = mouseY - nodeY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                node.isHovered = dist < Math.max(25, node.currentRadius); // Hit radius matches visual size, min 25px
                if (node.isHovered) anyHovered = true;
            } else {
                node.isHovered = false;
            }

            // Smooth size transition
            const targetSize = node.isHovered ? node.hoverRadius : node.radius;
            node.currentRadius += (targetSize - node.currentRadius) * 0.1;

            // Calculate node specific opacity based on the drawing progress
            // Get normalized angle relative to 6 o'clock (0 to 1)
            let relativeAngle = (node.angle - Math.PI / 2) % (Math.PI * 2);
            if (relativeAngle < 0) relativeAngle += Math.PI * 2;
            const threshold = relativeAngle / (Math.PI * 2);

            // Fade in over a short range after the line crosses the threshold
            const nodeOpacity = Math.max(0, Math.min(1, (orbitalPathProgress - threshold) * 10));

            // Draw blurred copy underneath
            ctx.save();
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, node.currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${nodeOpacity})`;
            ctx.filter = 'blur(4px)';
            ctx.fill();
            ctx.restore();

            // Draw main circle
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, node.currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${nodeOpacity})`;
            ctx.fill();

            // Draw "about me" or "projects" text on hover
            if (node.isHovered && nodeOpacity > 0.9) {
                ctx.save();
                ctx.font = '500 14px "Manrope", sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const textX = nodeX + node.currentRadius + 12; // 12px padding from ball

                // Draw blurred background layer
                ctx.shadowColor = `rgba(255, 255, 255, ${nodeOpacity})`;
                ctx.shadowBlur = 4; // Visual glow
                ctx.filter = 'blur(2px)';
                ctx.fillStyle = `rgba(255, 255, 255, ${nodeOpacity * 0.8})`;
                ctx.fillText(node.text, textX, nodeY);

                // Draw main text
                ctx.filter = 'none';
                ctx.shadowBlur = 0;
                ctx.fillStyle = `rgba(255, 255, 255, ${nodeOpacity})`;
                ctx.fillText(node.text, textX, nodeY);
                ctx.restore();
            }
        });

        // Handle cursor
        if (!isTransitioning && anyHovered) {
            canvas.style.cursor = 'pointer';
        } else if (canvas.style.cursor === 'pointer' || isTransitioning) {
            canvas.style.cursor = 'default';
        }
    }

    // Draw orbital-line-2: path 60px further out from orbital-line-1 (0.5px white line with drawing animation)
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathProgress > 0) {
        const center = getOrbitalCenter();
        const line2Radius = trackedStar1.orbitalRadius + 60;
        const startAngle = Math.PI / 2; // 6 o'clock
        const endAngle = startAngle + Math.PI * 2 * orbitalPathProgress;

        // Draw the partial circular orbit path
        ctx.save();

        // Draw blurred background glow
        ctx.filter = 'blur(2px)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line2Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw main line
        ctx.filter = 'none';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line2Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();
    }

    // Draw orbital-line-3: path 80px further out from orbital-line-2 (0.5px white line with drawing animation)
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathProgress > 0) {
        const center = getOrbitalCenter();
        const line3Radius = trackedStar1.orbitalRadius + 140;
        const startAngle = Math.PI / 2; // 6 o'clock
        const endAngle = startAngle + Math.PI * 2 * orbitalPathProgress;

        // Draw the partial circular orbit path
        ctx.save();

        // Draw blurred background glow
        ctx.filter = 'blur(2px)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line3Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw main line
        ctx.filter = 'none';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line3Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();
    }

    // Draw orbital-line-4: path 100px further out from orbital-line-3 (0.5px white line with drawing animation)
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathProgress > 0) {
        const center = getOrbitalCenter();
        const line4Radius = trackedStar1.orbitalRadius + 240;
        const startAngle = Math.PI / 2; // 6 o'clock
        const endAngle = startAngle + Math.PI * 2 * orbitalPathProgress;

        // Draw the partial circular orbit path
        ctx.save();

        // Draw blurred background glow
        ctx.filter = 'blur(2px)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line4Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw main line
        ctx.filter = 'none';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line4Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();
    }

    requestAnimationFrame(animate);
}

// Track mouse position
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Shared function to ensure transition overlay exists
function ensureTransitionOverlay() {
    let overlay = document.getElementById('transition-overlay');

    // Reset pointer events on containers if they exist (fixes re-opening bug)
    const contentDiv = document.getElementById('transition-content');
    const photoContainer = document.getElementById('photo-container');
    if (contentDiv) contentDiv.style.pointerEvents = 'auto';
    if (photoContainer) photoContainer.style.pointerEvents = 'none';

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'transition-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.zIndex = '100000';
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 0.8s ease-in-out';

        // Add the background SVG
        const bgImg = document.createElement('img');
        bgImg.src = 'images/Rectangle 9.svg';
        bgImg.style.width = '100%';
        bgImg.style.height = '100%';
        bgImg.style.objectFit = 'cover';
        bgImg.style.position = 'absolute';
        bgImg.style.top = '0';
        bgImg.style.left = '0';
        overlay.appendChild(bgImg);

        // Add the content container
        const contentDiv = document.createElement('div');
        contentDiv.id = 'transition-content';
        contentDiv.style.position = 'absolute';
        contentDiv.style.top = '50%';
        contentDiv.style.left = '50%';
        contentDiv.style.transform = 'translate(-50%, -50%)';
        contentDiv.style.width = '90%';
        contentDiv.style.textAlign = 'center';
        overlay.appendChild(contentDiv);

        // Add photo container
        const photoContainer = document.createElement('div');
        photoContainer.id = 'photo-container';
        photoContainer.style.position = 'absolute';
        photoContainer.style.top = '50%';
        photoContainer.style.left = '25%';
        photoContainer.style.transform = 'translate(-50%, -50%)';
        photoContainer.style.width = '300px';
        photoContainer.style.height = '400px';
        photoContainer.style.pointerEvents = 'none';
        overlay.appendChild(photoContainer);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .about-btn {
                color: rgba(203, 209, 220, 0.6);
                text-decoration: none;
                margin-right: 0px;
                display: inline-block;
                transition: all 0.3s ease;
                cursor: pointer;
                z-index: 10;
                position: relative;
            }
            .about-btn:hover {
                color: white;
                text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
            }
            #close-transition:hover {
                transform: scale(1.1);
            }
            .about-photo {
                position: absolute;
                width: 220px;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                cursor: pointer;
                pointer-events: auto;
            }
            #photo-casual { top: 0; right: 0; transform: rotate(5deg); z-index: 1; }
            #photo-professional { bottom: 0; left: 0; transform: rotate(-5deg); z-index: 2; }
            .about-photo:hover {
                transform: scale(1.05) rotate(0deg) !important;
                z-index: 100 !important;
            }
            
            /* Graphics Portfolio Styles */
            .graphics-portfolio {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
                width: 100%;
                overflow: hidden; /* Prevent horizontal scrollbar on body */
            }
            .marquee-container {
                width: 100%;
                overflow-x: auto; /* Enable horizontal scrolling */
                overflow-y: hidden;
                white-space: nowrap;
                position: relative;
                -webkit-overflow-scrolling: touch; /* smooth scrolling on iOS */
                cursor: grab; /* Indicate draggable/scrollable */
                scrollbar-width: none; /* Firefox */
                padding: 0 5vw; /* Add some padding on sides */
                box-sizing: border-box; /* Include padding in width */
            }
            .marquee-container::-webkit-scrollbar {
                display: none; /* Chrome/Safari */
            }
            .marquee-container:active {
                cursor: grabbing;
            }
            .marquee-track {
                display: flex;
                gap: 40px;
                width: max-content;
                /* Animation removed for manual scroll */
                padding: 20px 0; /* Space for shadows */
            }
            /* Animation keyframes removed */
            .graphics-img {
                height: 400px; /* Sized up images */
                width: auto;
                border-radius: 8px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                filter: brightness(0.9);
            }
            .graphics-img:hover {
                transform: scale(1.05);
                z-index: 100;
                box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                filter: brightness(1);
            }
            
            /* Cases Section Styles */
            .case-photo {
                position: absolute;
                width: 260px; /* Uniform width */
                height: auto;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                cursor: pointer;
            }
            .case-photo:hover {
                transform: scale(1.05) rotate(0deg) !important;
                z-index: 100 !important;
                box-shadow: 0 20px 50px rgba(0,0,0,0.6);
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(overlay);
    }
    return overlay;
}

// Function to show the "About Me" transition
function showAboutMeTransition() {
    isTransitioning = true;

    const hamburgerMenu = document.getElementById('hamburger-menu');
    const exploreButton = document.getElementById('explore-button');
    if (hamburgerMenu) hamburgerMenu.style.pointerEvents = 'none';
    if (exploreButton) exploreButton.style.pointerEvents = 'none';

    const overlay = ensureTransitionOverlay();
    const contentDiv = document.getElementById('transition-content');
    const photoContainer = document.getElementById('photo-container');

    // Setup About Me specific layout
    contentDiv.style.left = '38%';
    contentDiv.style.transform = 'translateY(-50%)'; // Restore original transform
    contentDiv.style.textAlign = 'left';
    contentDiv.style.width = '45%';
    contentDiv.style.color = 'rgba(203, 209, 220, 0.6)';
    contentDiv.style.fontFamily = '"Manrope", sans-serif';
    contentDiv.style.fontWeight = '500';
    contentDiv.style.fontSize = '14px';
    contentDiv.style.lineHeight = '1.6';
    contentDiv.style.whiteSpace = 'pre-line';
    contentDiv.style.backdropFilter = 'blur(2px)';
    contentDiv.style.textShadow = '0 0 2px #CBD1DC';
    contentDiv.style.padding = '20px';
    contentDiv.style.display = 'block'; // Reset display to block
    contentDiv.style.alignItems = 'initial'; // Reset align-items
    contentDiv.style.justifyContent = 'initial'; // Reset justify-content

    photoContainer.style.display = 'block';
    photoContainer.innerHTML = `
        <img src="images/jiayi-casual.JPG" id="photo-casual" class="about-photo" alt="Jiayi Casual">
        <img src="images/jiayi-professional.JPG" id="photo-professional" class="about-photo" alt="Jiayi Professional">
    `;

    const casual = document.getElementById('photo-casual');
    const professional = document.getElementById('photo-professional');
    const bringToFront = (el, other) => { el.style.zIndex = '3'; other.style.zIndex = '1'; };
    casual.addEventListener('mouseenter', () => bringToFront(casual, professional));
    professional.addEventListener('mouseenter', () => bringToFront(professional, casual));

    contentDiv.innerHTML = `<i># About me</i> 

Hi! I'm Jiayi, a designer & business student @ Western University 

I love solving ambiguous problems; either visually through design or through stories backed by data & analysis

Outside of work I'm a addicted to concerts & food. I'm also a pretty fast typist!

I'm always looking to meet new people, feel free to reach out :)
<div style="margin-top: 0px; display: flex; align-items: center; gap: 10px;">
    <a href="https://www.linkedin.com/in/jiayiihong/" target="_blank" class="about-btn">[Linkedin]</a><span id="copy-email" class="about-btn">[Email]</span><a href="https://x.com/hong_jiayi380" target="_blank" class="about-btn">[X]</a>
</div>

<div style="margin-top: 10px;">
    <span id="close-transition" class="about-btn">[close]</span>
</div>`;

    document.getElementById('copy-email').onclick = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText('jiayihong52@gmail.com').then(() => {
            const originalText = e.target.innerText;
            e.target.innerText = '[Copied!]';
            setTimeout(() => { e.target.innerText = originalText; }, 2000);
        });
    };

    document.getElementById('close-transition').onclick = (e) => {
        e.stopPropagation();
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';

        // Immediately disable pointer events on all content to prevent blocking background clicks
        overlay.querySelectorAll('*').forEach(el => el.style.pointerEvents = 'none');

        isTransitioning = false;
        if (hamburgerMenu) hamburgerMenu.style.pointerEvents = 'all';
        if (exploreButton) exploreButton.style.pointerEvents = 'all';
    };

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
    });
}

// Function to show the "Graphic Design" transition
function showGraphicDesignTransition() {
    isTransitioning = true;

    const hamburgerMenu = document.getElementById('hamburger-menu');
    const exploreButton = document.getElementById('explore-button');
    if (hamburgerMenu) hamburgerMenu.style.pointerEvents = 'none';
    if (exploreButton) exploreButton.style.pointerEvents = 'none';

    const overlay = ensureTransitionOverlay();
    const contentDiv = document.getElementById('transition-content');
    const photoContainer = document.getElementById('photo-container');

    // Clear About Me specific setup
    photoContainer.style.display = 'none';
    contentDiv.style.left = '50%';
    contentDiv.style.transform = 'translate(-50%, -50%)'; // Ensure centered transform
    contentDiv.style.textAlign = 'center';
    contentDiv.style.width = '100%'; // Full width for marquee
    contentDiv.style.backdropFilter = 'none';
    contentDiv.style.textShadow = 'none';
    contentDiv.style.padding = '0';
    contentDiv.style.display = 'block'; // Reset display to block
    contentDiv.style.alignItems = 'initial';
    contentDiv.style.justifyContent = 'initial';
    contentDiv.style.color = 'rgba(203, 209, 220, 0.6)';
    contentDiv.style.fontFamily = '"Manrope", sans-serif';
    contentDiv.style.fontWeight = '500';
    contentDiv.style.fontSize = '14px';
    contentDiv.style.lineHeight = '1.6';
    contentDiv.style.whiteSpace = 'normal';

    const allImages = [
        'CSA VLOGS 5 (1).jpg', 'bar night.jpg', 'CSA WV AUDITION.jpg',
        'wv ap.jpg', 'bobaboardgames.jpg', 'CSA VLOGS- PROD (1).jpg',
        'IMG_6596.JPG', 'IMG_6616 (1).JPG', 'IMG_6635 (1).JPG',
        'IMG_6755 (1).JPG', 'IMG_7823 (1).JPG', 'IMG_7935 (1).JPG'
    ];

    // Duplicate images to creating infinite scroll illusion (3 sets should be safe)
    const infiniteImages = [...allImages, ...allImages, ...allImages];

    const imagesHtml = infiniteImages.map(img => {
        return `<img src="images/Graphics Portfolio/${img}" class="graphics-img">`;
    }).join('');

    contentDiv.innerHTML = `
        <div class="graphics-portfolio">
            <div style="margin-bottom: 20px; backdrop-filter: blur(2px); text-shadow: 0 0 2px #CBD1DC; padding: 10px; border-radius: 8px;">
                <i># Graphic design</i>
            </div>
            <div class="marquee-container" id="infinite-scroll-container">
                <div class="marquee-track" id="infinite-scroll-track">
                    ${imagesHtml}
                </div>
            </div>
            <div style="margin-top: 30px; backdrop-filter: blur(2px); text-shadow: 0 0 2px #CBD1DC; padding: 10px; border-radius: 8px;">
                <span id="close-transition" class="about-btn">[close]</span>
            </div>
        </div>
    `;

    // Infinite scroll logic
    const scrollContainer = document.getElementById('infinite-scroll-container');

    // We need to wait for images to layout to know widths, but for now we can approximate or use requestAnimationFrame loop
    // A better approach for infinite manual scroll without jank is to check scroll position

    function checkScrollLoop() {
        if (!isTransitioning) return; // Stop if closed

        const scrollWidth = scrollContainer.scrollWidth;
        const offsetWidth = scrollContainer.offsetWidth;
        const maxScroll = scrollWidth / 3; // Approx width of one set

        if (scrollContainer.scrollLeft <= 50) {
            // If user scrolls too far left, jump to middle set
            scrollContainer.scrollLeft += maxScroll;
        } else if (scrollContainer.scrollLeft >= maxScroll * 2) {
            // If user scrolls too far right, jump back to middle set
            scrollContainer.scrollLeft -= maxScroll;
        }

        requestAnimationFrame(checkScrollLoop);
    }

    // Initial scroll position to the middle set so user can scroll left immediately
    // Wait slightly for layout
    setTimeout(() => {
        if (scrollContainer) {
            // Calculate one set width roughly or just rely on the loop to catch it eventually, 
            // but best to start in middle.
            // Assume images are loaded enough or containers are sized.
            // As a fallback, we just start them a bit in.
            scrollContainer.scrollLeft = scrollContainer.scrollWidth / 3;
            checkScrollLoop();
        }
    }, 100);

    document.getElementById('close-transition').onclick = (e) => {
        e.stopPropagation();
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';

        // Immediately disable pointer events on all content
        overlay.querySelectorAll('*').forEach(el => el.style.pointerEvents = 'none');

        isTransitioning = false;
        if (hamburgerMenu) hamburgerMenu.style.pointerEvents = 'all';
        if (exploreButton) exploreButton.style.pointerEvents = 'all';
    };

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
    });
}

// Function to show the "Cases" transition
function showCasesTransition() {
    isTransitioning = true;

    const hamburgerMenu = document.getElementById('hamburger-menu');
    const exploreButton = document.getElementById('explore-button');
    if (hamburgerMenu) hamburgerMenu.style.pointerEvents = 'none';
    if (exploreButton) exploreButton.style.pointerEvents = 'none';

    const overlay = ensureTransitionOverlay();
    const contentDiv = document.getElementById('transition-content');
    const photoContainer = document.getElementById('photo-container');

    // Setup Cases specific layout
    contentDiv.style.left = '40%'; // Center slightly more to balance with images
    contentDiv.style.transform = 'translate(-50%, -50%)';
    contentDiv.style.textAlign = 'left';
    contentDiv.style.width = '70%'; // Wider container to hold both text and images
    contentDiv.style.color = 'rgba(203, 209, 220, 0.6)';
    contentDiv.style.fontFamily = '"Manrope", sans-serif';
    contentDiv.style.fontWeight = '500';
    contentDiv.style.fontSize = '14px';
    contentDiv.style.lineHeight = '1.6';
    contentDiv.style.whiteSpace = 'normal';
    contentDiv.style.backdropFilter = 'none';
    contentDiv.style.textShadow = '0 0 2px #CBD1DC';
    contentDiv.style.padding = '20px';
    contentDiv.style.display = 'flex';
    contentDiv.style.alignItems = 'center';
    contentDiv.style.justifyContent = 'center';
    contentDiv.style.gap = '50px';

    // Photos Setup
    photoContainer.style.display = 'none'; // We will use inline images in contentDiv for better spacing control or absolute positioning relative to contentDiv

    contentDiv.innerHTML = `
        <div style="position: relative; width: 350px; height: 437px;">
             <img src="images/Case Covers/BANXX.jpg" class="case-photo" style="top: -5px; left: 20px; transform: rotate(-3deg); z-index: 2;">
             <img src="images/Case Covers/FINALS 1220 (2).jpg" class="case-photo" style="top: 120px; left: 100px; transform: rotate(5deg); z-index: 3;">
             <img src="images/Case Covers/TCS.jpg" class="case-photo" style="top: 235px; left: 5px; transform: rotate(-5deg); z-index: 4;">
             <img src="images/Case Covers/Hero Visual.png" class="case-photo" style="top: 335px; left: 90px; transform: rotate(3deg); z-index: 5;"> 
        </div>

        <div style="flex: 1; max-width: 400px; z-index: 10;">
            <i># Cases</i>
            <br><br>
            <b>Strategy:</b> 
            <br><br>
            [Leveraging open banking to solve U.S. medical debt]
            <br><br>
            [Franchising a local London Dutch bakery]
            <br><br>
            <b>Design:</b> 
            <br><br>
            [Creating new occasions for Gen-Z Starbucks customers]
            <br><br>
            [Lowering the barrier to entry for genuine human interaction]
            <br><br>
            <div style="margin-top: 30px;">
                <span id="close-transition" class="about-btn">[close]</span>
            </div>
        </div>
    `;

    // Add persistent Z-index logic
    const casePhotos = contentDiv.querySelectorAll('.case-photo');
    let maxZ = 10;
    casePhotos.forEach(photo => {
        photo.addEventListener('mouseenter', () => {
            photo.style.zIndex = ++maxZ;
        });
    });

    document.getElementById('close-transition').onclick = (e) => {
        e.stopPropagation();
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';

        // Immediately disable pointer events on all content
        overlay.querySelectorAll('*').forEach(el => el.style.pointerEvents = 'none');

        isTransitioning = false;
        if (hamburgerMenu) hamburgerMenu.style.pointerEvents = 'all';
        if (exploreButton) exploreButton.style.pointerEvents = 'all';
    };

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
    });
}

// Function to show the "Projects" transition
function showProjectsTransition() {
    isTransitioning = true;

    const hamburgerMenu = document.getElementById('hamburger-menu');
    const exploreButton = document.getElementById('explore-button');
    if (hamburgerMenu) hamburgerMenu.style.pointerEvents = 'none';
    if (exploreButton) exploreButton.style.pointerEvents = 'none';

    const overlay = ensureTransitionOverlay();
    const contentDiv = document.getElementById('transition-content');
    const photoContainer = document.getElementById('photo-container');

    // Setup Projects specific layout
    photoContainer.style.display = 'none';
    contentDiv.style.left = '50%';
    contentDiv.style.transform = 'translate(-50%, -50%)';
    contentDiv.style.textAlign = 'center';
    contentDiv.style.width = '100%';
    contentDiv.style.color = 'rgba(203, 209, 220, 0.6)';
    contentDiv.style.fontFamily = '"Manrope", sans-serif';
    contentDiv.style.fontWeight = '500';
    contentDiv.style.fontSize = '14px';
    contentDiv.style.lineHeight = '1.6';
    contentDiv.style.whiteSpace = 'pre-line';
    contentDiv.style.backdropFilter = 'none';
    contentDiv.style.textShadow = '0 0 2px #CBD1DC';
    contentDiv.style.padding = '20px';
    contentDiv.style.display = 'block';

    contentDiv.innerHTML = `<i># Projects</i>

In the works...

<div style="margin-top: 30px;">
    <span id="close-transition" class="about-btn">[close]</span>
</div>`;

    document.getElementById('close-transition').onclick = (e) => {
        e.stopPropagation();
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';

        // Immediately disable pointer events on all content
        overlay.querySelectorAll('*').forEach(el => el.style.pointerEvents = 'none');

        isTransitioning = false;
        if (hamburgerMenu) hamburgerMenu.style.pointerEvents = 'all';
        if (exploreButton) exploreButton.style.pointerEvents = 'all';
    };

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'all';
    });
}

// Handle ball clicks for page transition
canvas.addEventListener('click', () => {
    const anyHoveredNode = [orbitalNode, orbitalNode2, orbitalNode3, orbitalNode4].find(node => node.isHovered);

    if (anyHoveredNode && !isTransitioning) {
        if (anyHoveredNode.text === 'about me') {
            showAboutMeTransition();
        } else if (anyHoveredNode.text === 'graphic design') {
            showGraphicDesignTransition();
        } else if (anyHoveredNode.text === 'cases') {
            showCasesTransition();
        } else if (anyHoveredNode.text === 'projects') {
            showProjectsTransition();
        } else {
            isTransitioning = true;
            const hamburgerMenu = document.getElementById('hamburger-menu');
            const exploreButton = document.getElementById('explore-button');
            if (hamburgerMenu) hamburgerMenu.style.pointerEvents = 'none';
            if (exploreButton) exploreButton.style.pointerEvents = 'none';

            const overlay = ensureTransitionOverlay();
            const contentDiv = document.getElementById('transition-content');
            const photoContainer = document.getElementById('photo-container');
            contentDiv.innerHTML = '';
            photoContainer.innerHTML = '';
            photoContainer.style.display = 'none'; // Ensure photo container is hidden for generic transition

            // Reset contentDiv styles to generic for other transitions
            contentDiv.style.left = '50%';
            contentDiv.style.textAlign = 'center';
            contentDiv.style.width = '90%';
            contentDiv.style.backdropFilter = 'none';
            contentDiv.style.textShadow = 'none';
            contentDiv.style.padding = '0';
            contentDiv.style.color = 'rgba(203, 209, 220, 0.6)';
            contentDiv.style.fontFamily = '"Manrope", sans-serif';
            contentDiv.style.fontWeight = '500';
            contentDiv.style.fontSize = '14px';
            contentDiv.style.lineHeight = '1.6';
            contentDiv.style.whiteSpace = 'normal';

            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'all';
            });
        }
    }
});

// Handle window resize - stars will automatically adjust since center is recalculated each frame
window.addEventListener('resize', () => {
    resizeCanvas();
    // Stars will naturally adjust since getOrbitalCenter() is called each frame in updatePosition
});

// Start animation
animate(performance.now());


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

// Link "about me" in dropdown to show the transition
const aboutMeDropdownLink = Array.from(document.querySelectorAll('.dropdown-item')).find(el => el.textContent === 'about me');
if (aboutMeDropdownLink) {
    aboutMeDropdownLink.addEventListener('click', (e) => {
        e.preventDefault();
        hamburgerButton.classList.remove('active');
        dropdownMenu.classList.remove('dropdown-visible');
        dropdownMenu.classList.add('dropdown-hidden');
        showAboutMeTransition();
    });
}

// Link "graphic design" in dropdown to show the transition
const graphicDesignDropdownLink = Array.from(document.querySelectorAll('.dropdown-item')).find(el => el.textContent === 'graphic design');
if (graphicDesignDropdownLink) {
    graphicDesignDropdownLink.addEventListener('click', (e) => {
        e.preventDefault();
        hamburgerButton.classList.remove('active');
        dropdownMenu.classList.remove('dropdown-visible');
        dropdownMenu.classList.add('dropdown-hidden');
        showGraphicDesignTransition();
    });
}

// Link "cases" in dropdown to show the transition
const casesDropdownLink = Array.from(document.querySelectorAll('.dropdown-item')).find(el => el.textContent === 'cases');
if (casesDropdownLink) {
    casesDropdownLink.addEventListener('click', (e) => {
        e.preventDefault();
        hamburgerButton.classList.remove('active');
        dropdownMenu.classList.remove('dropdown-visible');
        dropdownMenu.classList.add('dropdown-hidden');
        showCasesTransition();
    });
}

// Link "projects" in dropdown to show the transition
const projectsDropdownLink = Array.from(document.querySelectorAll('.dropdown-item')).find(el => el.textContent === 'projects');
if (projectsDropdownLink) {
    projectsDropdownLink.addEventListener('click', (e) => {
        e.preventDefault();
        hamburgerButton.classList.remove('active');
        dropdownMenu.classList.remove('dropdown-visible');
        dropdownMenu.classList.add('dropdown-hidden');
        showProjectsTransition();
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    const isClickInside = hamburgerButton.contains(event.target) || dropdownMenu.contains(event.target);
    if (!isClickInside && dropdownMenu.classList.contains('dropdown-visible')) {
        hamburgerButton.classList.remove('active');
        dropdownMenu.classList.remove('dropdown-visible');
        dropdownMenu.classList.add('dropdown-hidden');
    }
});

// Explore/Back button functionality
const actionButton = document.getElementById('explore-button');
let isExploreState = true;

if (actionButton) {
    actionButton.addEventListener('click', (e) => {
        e.preventDefault();

        const line1 = document.querySelector('.line-1');
        const line2 = document.querySelector('.line-2');
        const line3 = document.querySelector('.line-3');
        const fadeDuration = 1000;
        const fadeStartTime = performance.now();

        if (isExploreState) {
            // TRANSITION TO ORBITAL VIEW
            // Fade text out faster (300ms) to reduce overlap with lines drawing in
            if (line1) { line1.style.transition = 'opacity 0.3s ease-out'; line1.style.opacity = '0'; }
            if (line2) { line2.style.transition = 'opacity 0.3s ease-out'; line2.style.opacity = '0'; }
            if (line3) { line3.style.transition = 'opacity 0.3s ease-out'; line3.style.opacity = '0'; }

            // Delay the line drawing slightly or just start it immediately while text is leaving
            resetOrbitalNodes();
            function animateIn(currentTime) {
                const elapsed = currentTime - fadeStartTime;
                const progress = Math.min(elapsed / fadeDuration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                orbitalPathProgress = easedProgress; // Update drawing progress

                if (progress < 1) {
                    requestAnimationFrame(animateIn);
                } else {
                    orbitalPathProgress = 1;
                    actionButton.textContent = 'back →';
                    isExploreState = false;
                }
            }
            requestAnimationFrame(animateIn);
        } else {
            // TRANSITION BACK TO LANDING
            function animateOut(currentTime) {
                const elapsed = currentTime - fadeStartTime;
                const progress = Math.min(elapsed / fadeDuration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                orbitalPathProgress = 1 - easedProgress; // Reverse drawing progress

                if (progress < 1) {
                    requestAnimationFrame(animateOut);
                } else {
                    orbitalPathProgress = 0;
                    actionButton.textContent = 'explore →';
                    isExploreState = true;
                    // Fade text back in after lines are completely gone
                    if (line1) { line1.style.transition = 'opacity 0.5s ease-in'; line1.style.opacity = '1'; }
                    if (line2) { line2.style.transition = 'opacity 0.5s ease-in'; line2.style.opacity = '1'; }
                    if (line3) { line3.style.transition = 'opacity 0.5s ease-in'; line3.style.opacity = '1'; }
                }
            }
            requestAnimationFrame(animateOut);
        }
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

