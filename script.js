// Responsive scaling helper
function getResponsiveValues() {
    // Base design width approx 1440px
    const scale = Math.max(0.5, window.innerWidth / 1440); // Prevent getting too small
    const isLargeScreen = window.innerWidth > 1500;

    return {
        offset1: 60 * scale,
        offset2: 140 * scale,
        offset3: 240 * scale,
        node1Radius: (isLargeScreen ? 14.5 : 12.5) * scale, // Push barely out if large screen
        node2Radius: 16 * scale,
        node3Radius: 23 * scale,
        node4Radius: 28 * scale,
    };
}

let responsiveVars = getResponsiveValues();

// Interactive node properties
const orbitalNode = {
    angle: Math.PI * 1.5, // Start at top
    radius: responsiveVars.node1Radius,
    hoverRadius: responsiveVars.node1Radius * 1.2,
    currentRadius: responsiveVars.node1Radius,
    isHovered: false,
    text: 'about me'
};
const orbitalNode2 = {
    angle: Math.PI * 1.5,
    radius: responsiveVars.node2Radius,
    hoverRadius: responsiveVars.node2Radius * 1.2,
    currentRadius: responsiveVars.node2Radius,
    isHovered: false,
    text: 'projects'
};
const orbitalNode3 = {
    angle: Math.PI * 1.5,
    radius: responsiveVars.node3Radius,
    hoverRadius: responsiveVars.node3Radius * 1.2,
    currentRadius: responsiveVars.node3Radius,
    isHovered: false,
    text: 'graphic design'
};
const orbitalNode4 = {
    angle: Math.PI * 1.5,
    radius: responsiveVars.node4Radius,
    hoverRadius: responsiveVars.node4Radius * 1.2,
    currentRadius: responsiveVars.node4Radius,
    isHovered: false,
    text: 'cases'
};
let mouseX = 0;
let mouseY = 0;

// Get canvas and context
const canvas = document.getElementById('star-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to match window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Update responsive variables
    responsiveVars = getResponsiveValues();

    // Update node base sizes if they are initialized
    if (typeof orbitalNode !== 'undefined') {
        orbitalNode.radius = responsiveVars.node1Radius;
        orbitalNode.hoverRadius = responsiveVars.node1Radius * 1.2;

        orbitalNode2.radius = responsiveVars.node2Radius;
        orbitalNode2.hoverRadius = responsiveVars.node2Radius * 1.2;

        orbitalNode3.radius = responsiveVars.node3Radius;
        orbitalNode3.hoverRadius = responsiveVars.node3Radius * 1.2;

        orbitalNode4.radius = responsiveVars.node4Radius;
        orbitalNode4.hoverRadius = responsiveVars.node4Radius * 1.2;
    }
}
resizeCanvas(); // Initial call
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


// Meteor class for the shower background
class Meteor {
    constructor() {
        this.reset();
    }

    reset() {
        // Start from left side to streak horizontally across screen
        // Angle 0 degrees (Left -> Right)

        // Spawn strictly from Left edge
        this.x = -Math.random() * 200 - 100; // Start off-screen Left
        // Y can be anywhere on screen
        this.y = Math.random() * canvas.height;

        this.length = Math.random() * 150 + 50; // Trail length
        this.speed = Math.random() * 4 + 6; // Speed

        const angleDeg = 10; // 10 degrees down
        this.angle = angleDeg * (Math.PI / 180);

        this.active = true;
        this.opacity = 0;
        this.fadeIn = true;
    }

    update(deltaTime) {
        if (!this.active) return;

        // Move meteor
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Fade in/out
        if (this.fadeIn) {
            this.opacity += 0.1;
            if (this.opacity >= 1) {
                this.opacity = 1;
                this.fadeIn = false;
            }
        }

        if (this.x < -300 || this.y > canvas.height + 300) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) return;

        // Draw trail
        const tailX = this.x - Math.cos(this.angle) * this.length;
        const tailY = this.y - Math.sin(this.angle) * this.length;

        // Gradient for tail - Darker theme
        const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
        // Head: less stark white, slightly bluish/grey
        gradient.addColorStop(0, `rgba(200, 220, 255, ${this.opacity * 0.7})`);
        // Mid: Darker blue-grey
        gradient.addColorStop(0.4, `rgba(60, 80, 110, ${this.opacity * 0.3})`);
        // Tail: Transparent
        gradient.addColorStop(1, `rgba(0, 0, 30, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Draw glowing head - subtler
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 230, 255, ${this.opacity * 0.8})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(80, 120, 180, ${this.opacity * 0.5})`;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

const meteors = [];
let lastMeteorTime = 0;
let meteorShowerActive = true;
let meteorShowerStartTime = 0;
const METEOR_CYCLE = 10000; // 10 seconds cycle (5s duration + 5s gap)
const METEOR_DURATION = 5000; // 5 seconds shower

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

    // Determine a consistent radius for the first orbital line (orbital-line-1)
    // We calculate the distance from the orbital center (mountain) to the screen center
    // This ensures the orbit always passes through the middle of the screen
    const screenCenterY = window.innerHeight / 2;
    const targetRadius = Math.abs(center.y - screenCenterY);

    // Create a specific star for the primary track to ensure consistent positioning
    // This replaces the previous random search which caused layout shifts
    trackedStar1 = new Star(center);
    trackedStar1.orbitalRadius = targetRadius;
    trackedStar1.orbitalAngle = Math.PI * 1.5; // Start at 12 o'clock
    trackedStar1.size = 1.2; // Slightly larger for visibility
    stars.push(trackedStar1);

    // Find a second star that's further out for orbital-line-2
    let secondClosestStar = null;
    let secondClosestDistance = Infinity;
    const secondTargetRadius = trackedStar1.orbitalRadius + responsiveVars.offset1; // Scaled offset

    stars.forEach(star => {
        // Find a star with orbital radius close to secondTargetRadius
        const radiusDiff = Math.abs(star.orbitalRadius - secondTargetRadius);
        // Relax check here slightly to find somewhat decent star
        if (radiusDiff < 50 && star !== trackedStar1) {
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

        const line2Radius = trackedStar1.orbitalRadius + responsiveVars.offset1;
        // Ensure dy / line2Radius is within [-1, 1] for asin
        const clampedRatio2 = Math.max(-1, Math.min(1, dy / line2Radius));
        const startAngle2 = Math.PI - Math.asin(clampedRatio2);

        // Shifted an additional 100px counterclockwise (total 220px offset)
        const totalShift = 220; // This shift might need scaling too if it represents arc length, but angle logic is complex. Leaving fixed for now.
        // Move "about me" slightly clockwise (180px vs 220px)
        orbitalNode.angle = (startAngle1 + 0.2);
        orbitalNode2.angle = (startAngle2 + 0.6); // Simplified

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

        // --- METEOR SHOWER LOGIC ---
        // Check cycle
        if (!meteorShowerActive && currentTime - meteorShowerStartTime > METEOR_CYCLE) {
            meteorShowerActive = true;
            meteorShowerStartTime = currentTime;
        }

        // End shower
        if (meteorShowerActive && currentTime - meteorShowerStartTime > METEOR_DURATION) {
            meteorShowerActive = false;
        }

        // Spawn meteors
        if (meteorShowerActive) {
            // Spawn less frequently: random interval 800-1200ms
            if (currentTime - lastMeteorTime > Math.random() * 400 + 800) {
                meteors.push(new Meteor());
                lastMeteorTime = currentTime;
            }
        }

        // Update and draw meteors
        for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            m.update(clampedDeltaTime);
            m.draw();
            if (!m.active) {
                meteors.splice(i, 1);
            }
        }
        // ---------------------------

        // Draw orbital-line-1: path for the first tracked star
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
            { node: orbitalNode2, radius: (trackedStar1.clusterRadius || trackedStar1.orbitalRadius) + responsiveVars.offset1 },
            { node: orbitalNode3, radius: (trackedStar1.clusterRadius || trackedStar1.orbitalRadius) + responsiveVars.offset2 },
            { node: orbitalNode4, radius: (trackedStar1.clusterRadius || trackedStar1.orbitalRadius) + responsiveVars.offset3 }
        ];

        let anyHovered = false;

        nodes.forEach(({ node, radius }) => {
            // Normalize angle to [0, 2PI)
            let normalizedAngle = node.angle % (Math.PI * 2);
            if (normalizedAngle < 0) normalizedAngle += Math.PI * 2;



            // Calculate current position first to determine speed
            const currentX = center.x + Math.cos(node.angle) * radius;
            const currentY = center.y + Math.sin(node.angle) * radius;

            // Default base speed requested "Above mountain"
            let targetSpeed = 0.00010;
            if (node === orbitalNode) targetSpeed = 0.00007; // "about me"
            else if (node === orbitalNode2) targetSpeed = 0.00008; // "projects"

            // Check against mountain position
            const mountain = document.getElementById('mountain');
            let isBelowMountain = false;

            if (mountain) {
                const mountainRect = mountain.getBoundingClientRect();
                if (currentY > mountainRect.top + 30) {
                    isBelowMountain = true;
                }
            }

            // Handle Below Mountain State & Timing
            if (isBelowMountain) {
                if (!node.wasBelowMountain) {
                    node.belowMountainStartTime = currentTime;
                    node.wasBelowMountain = true;
                }

                // Ramp logic
                const elapsed = currentTime - node.belowMountainStartTime;
                if (elapsed < 200) {
                    targetSpeed = 0.001; // First 200ms
                } else {
                    targetSpeed = 0.0015; // After 200ms
                }
            } else {
                node.wasBelowMountain = false;
                node.belowMountainStartTime = 0;
            }

            // Apply Speed Smoothing (Lerp)
            if (typeof node.currentSpeed === 'undefined') node.currentSpeed = targetSpeed;
            node.currentSpeed += (targetSpeed - node.currentSpeed) * 0.1;

            // Update angle with the determined speed
            node.angle += node.currentSpeed * clampedDeltaTime;

            // Update position for drawing
            const nodeX = center.x + Math.cos(node.angle) * radius;
            const nodeY = center.y + Math.sin(node.angle) * radius;

            // Hit testing
            if (!isTransitioning) {
                const dx = mouseX - nodeX;
                const dy = mouseY - nodeY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                node.isHovered = dist < Math.max(25, node.currentRadius);
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

            // Draw text on hover
            if (node.isHovered && nodeOpacity > 0.9) {
                ctx.save();
                ctx.font = '500 14px "Manrope", sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const textX = nodeX + node.currentRadius + 12;

                ctx.shadowColor = `rgba(255, 255, 255, ${nodeOpacity})`;
                ctx.shadowBlur = 4;
                ctx.filter = 'blur(2px)';
                ctx.fillStyle = `rgba(255, 255, 255, ${nodeOpacity * 0.8})`;
                ctx.fillText(node.text, textX, nodeY);

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

    // Draw orbital-line-2
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathProgress > 0) {
        const center = getOrbitalCenter();
        const line2Radius = trackedStar1.orbitalRadius + responsiveVars.offset1;
        const startAngle = Math.PI / 2;
        const endAngle = startAngle + Math.PI * 2 * orbitalPathProgress;

        ctx.save();
        ctx.filter = 'blur(2px)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line2Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.filter = 'none';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line2Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();
    }

    // Draw orbital-line-3
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathProgress > 0) {
        const center = getOrbitalCenter();
        const line3Radius = trackedStar1.orbitalRadius + responsiveVars.offset2;
        const startAngle = Math.PI / 2; // 6 o'clock
        const endAngle = startAngle + Math.PI * 2 * orbitalPathProgress;

        ctx.save();
        ctx.filter = 'blur(2px)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line3Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.filter = 'none';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line3Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();
    }

    // Draw orbital-line-4
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathProgress > 0) {
        const center = getOrbitalCenter();
        const line4Radius = trackedStar1.orbitalRadius + responsiveVars.offset3;
        const startAngle = Math.PI / 2; // 6 o'clock
        const endAngle = startAngle + Math.PI * 2 * orbitalPathProgress;

        ctx.save();
        ctx.filter = 'blur(2px)';
        ctx.beginPath();
        ctx.arc(center.x, center.y, line4Radius, startAngle, endAngle);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, orbitalPathProgress * 2) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

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
        contentDiv.style.top = '0';
        contentDiv.style.left = '0';
        contentDiv.style.width = '100%';
        contentDiv.style.height = '100%';
        contentDiv.style.zIndex = '100001';
        contentDiv.style.pointerEvents = 'auto'; // Content should be clickable
        overlay.appendChild(contentDiv);

        document.body.appendChild(overlay);
    }
    return overlay;
}

// Hamburger menu logic
const hamburgerButton = document.getElementById('hamburger-button');
const dropdownMenu = document.getElementById('dropdown-menu');
const exploreButton = document.getElementById('explore-button');
const backButton = document.getElementById('back-button');
const textContainer = document.getElementById('text');

if (hamburgerButton && dropdownMenu) {
    hamburgerButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = hamburgerButton.classList.toggle('active');
        if (isActive) {
            dropdownMenu.classList.remove('dropdown-hidden');
            dropdownMenu.classList.add('dropdown-visible');
        } else {
            dropdownMenu.classList.remove('dropdown-visible');
            dropdownMenu.classList.add('dropdown-hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!hamburgerButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
            hamburgerButton.classList.remove('active');
            dropdownMenu.classList.remove('dropdown-visible');
            dropdownMenu.classList.add('dropdown-hidden');
        }
    });
}

// Explore button logic
if (exploreButton) {
    exploreButton.addEventListener('click', (e) => {
        e.preventDefault();

        // 1. Fade out the text
        if (textContainer) {
            textContainer.style.opacity = '0';
        }

        // 2. Hide explore button
        exploreButton.style.display = 'none';

        // 3. Show back button
        if (backButton) {
            backButton.style.display = 'block';
        }

        // 4. Start drawing orbital lines
        showOrbitalPath = true; // start the drawing animation
        const drawDuration = 2000; // 2 seconds to draw
        const startTime = performance.now();

        function animatePath(time) {
            if (!showOrbitalPath) return; // Stop if interrupted

            const elapsed = time - startTime;
            orbitalPathProgress = Math.min(1, elapsed / drawDuration);

            if (orbitalPathProgress < 1) {
                requestAnimationFrame(animatePath);
            }
        }
        requestAnimationFrame(animatePath);
    });
}

// Back button logic
if (backButton) {
    backButton.addEventListener('click', (e) => {
        e.preventDefault();

        // 1. Show text
        if (textContainer) {
            textContainer.style.opacity = '1';
        }

        // 2. Show explore button
        if (exploreButton) {
            exploreButton.style.display = ''; // Revert to CSS default
        }

        // 3. Hide back button
        backButton.style.display = 'none';

        // 4. Reverse animation (undraw lines)
        showOrbitalPath = false;
        const undrawDuration = 1000; // Faster undraw
        const startTime = performance.now();
        const startProgress = orbitalPathProgress;

        function animateReversePath(time) {
            if (showOrbitalPath) return; // Stop if interrupted

            const elapsed = time - startTime;
            const progress = 1 - (elapsed / undrawDuration);
            orbitalPathProgress = Math.max(0, startProgress * progress);

            if (orbitalPathProgress > 0) {
                requestAnimationFrame(animateReversePath);
            }
        }
        requestAnimationFrame(animateReversePath);
    });
}

// Transition logic
function triggerTransition(targetUrl) {
    if (isTransitioning) return;
    isTransitioning = true;

    // Create/get overlay
    const overlay = ensureTransitionOverlay();

    // Force browser repaint to ensure transition plays
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto'; // Block other clicks

        // Wait for fade out
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 800);
    });
}

// Add click handlers for orbital balls
canvas.addEventListener('click', (e) => {
    // Only allow clicking if not transitioning and path is drawn
    if (isTransitioning || orbitalPathProgress < 1) return;

    if (orbitalNode.isHovered) {
        triggerTransition('about.html');
    } else if (orbitalNode2.isHovered) {
        triggerTransition('projects.html');
    } else if (orbitalNode3.isHovered) {
        triggerTransition('graphic-design.html');
    } else if (orbitalNode4.isHovered) {
        triggerTransition('cases.html');
    }
});

// Start animation loop
requestAnimationFrame(animate);
