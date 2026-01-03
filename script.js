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
let orbitalPathOpacity = 0; // Opacity of the orbital path lines (0 to 1)

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
    text: 'designathons'
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

        // Draw orbital-line-1: path for the first tracked star (0.5px white line with opacity animation)
        if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathOpacity > 0) {
            const center = getOrbitalCenter();

            // Draw the full circular orbit path
            ctx.save(); // Save current context state
            ctx.beginPath();
            ctx.arc(center.x, center.y, trackedStar1.orbitalRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${orbitalPathOpacity})`; // White with opacity
            ctx.lineWidth = 0.5; // 0.5px width
            ctx.stroke();
            ctx.restore(); // Restore context state
        }

    }

    // --- DRAW BALLS ---
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathOpacity > 0.05) {
        const center = getOrbitalCenter();
        const nodes = [
            { node: orbitalNode, radius: trackedStar1.clusterRadius || trackedStar1.orbitalRadius },
            { node: orbitalNode2, radius: (trackedStar1.clusterRadius || trackedStar1.orbitalRadius) + 60 },
            { node: orbitalNode3, radius: (trackedStar1.clusterRadius || trackedStar1.orbitalRadius) + 140 },
            { node: orbitalNode4, radius: (trackedStar1.clusterRadius || trackedStar1.orbitalRadius) + 240 }
        ];

        let anyHovered = false;

        nodes.forEach(({ node, radius }) => {
            // Update node angle (10x slower orbit)
            node.angle += 0.00001 * clampedDeltaTime;

            // Calculate position
            const nodeX = center.x + Math.cos(node.angle) * radius;
            const nodeY = center.y + Math.sin(node.angle) * radius;

            // Hit testing
            const dx = mouseX - nodeX;
            const dy = mouseY - nodeY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            node.isHovered = dist < 25; // Hit radius
            if (node.isHovered) anyHovered = true;

            // Smooth size transition
            const targetSize = node.isHovered ? node.hoverRadius : node.radius;
            node.currentRadius += (targetSize - node.currentRadius) * 0.1;

            // Draw blurred copy underneath
            ctx.save();
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, node.currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${orbitalPathOpacity})`;
            ctx.filter = 'blur(4px)';
            ctx.fill();
            ctx.restore();

            // Draw main circle
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, node.currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${orbitalPathOpacity})`;
            ctx.fill();

            // Draw "about me" or "projects" text on hover
            if (node.isHovered) {
                ctx.save();
                ctx.font = '500 14px "Manrope", sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const textX = nodeX + node.currentRadius + 12; // 12px padding from ball

                // Draw blurred background layer
                ctx.shadowColor = `rgba(255, 255, 255, ${orbitalPathOpacity})`;
                ctx.shadowBlur = 4; // Visual glow
                ctx.filter = 'blur(2px)';
                ctx.fillStyle = `rgba(255, 255, 255, ${orbitalPathOpacity * 0.8})`;
                ctx.fillText(node.text, textX, nodeY);

                // Draw main text
                ctx.filter = 'none';
                ctx.shadowBlur = 0;
                ctx.fillStyle = `rgba(255, 255, 255, ${orbitalPathOpacity})`;
                ctx.fillText(node.text, textX, nodeY);
                ctx.restore();
            }
        });

        // Handle cursor
        if (anyHovered) {
            canvas.style.cursor = 'pointer';
        } else if (canvas.style.cursor === 'pointer') {
            canvas.style.cursor = 'default';
        }
    }

    // Draw orbital-line-2: path 60px further out from orbital-line-1 (0.5px white line with opacity animation)
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathOpacity > 0) {
        const center = getOrbitalCenter();
        const line2Radius = trackedStar1.orbitalRadius + 60; // Exactly 60px further out

        // Draw the full circular orbit path
        ctx.save(); // Save current context state
        ctx.beginPath();
        ctx.arc(center.x, center.y, line2Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${orbitalPathOpacity})`; // White with opacity
        ctx.lineWidth = 0.5; // 0.5px width
        ctx.stroke();
        ctx.restore(); // Restore context state
    }

    // Draw orbital-line-3: path 80px further out from orbital-line-2 (0.5px white line with opacity animation)
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathOpacity > 0) {
        const center = getOrbitalCenter();
        const line3Radius = trackedStar1.orbitalRadius + 140; // 60px + 80px = 140px from orbital-line-1

        // Draw the full circular orbit path
        ctx.save(); // Save current context state
        ctx.beginPath();
        ctx.arc(center.x, center.y, line3Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${orbitalPathOpacity})`; // White with opacity
        ctx.lineWidth = 0.5; // 0.5px width
        ctx.stroke();
        ctx.restore(); // Restore context state
    }

    // Draw orbital-line-4: path 100px further out from orbital-line-3 (0.5px white line with opacity animation)
    if (trackedStar1 && trackedStar1.orbitalRadius && trackedStar1.orbitalRadius > 0 && orbitalPathOpacity > 0) {
        const center = getOrbitalCenter();
        const line4Radius = trackedStar1.orbitalRadius + 240; // 140px (line 3) + 100px = 240px from orbital-line-1

        // Draw the full circular orbit path
        ctx.save(); // Save current context state
        ctx.beginPath();
        ctx.arc(center.x, center.y, line4Radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${orbitalPathOpacity})`; // White with opacity
        ctx.lineWidth = 0.5; // 0.5px width
        ctx.stroke();
        ctx.restore(); // Restore context state
    }

    requestAnimationFrame(animate);
}

// Track mouse position
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Handle ball clicks for page transition
canvas.addEventListener('click', () => {
    // Check if any node is currently hovered
    const anyHoveredNode = [orbitalNode, orbitalNode2, orbitalNode3, orbitalNode4].find(node => node.isHovered);

    if (anyHoveredNode) {
        // Create transition element if it doesn't exist
        let transitionOverlay = document.getElementById('transition-overlay');
        if (!transitionOverlay) {
            transitionOverlay = document.createElement('img');
            transitionOverlay.id = 'transition-overlay';
            transitionOverlay.src = 'images/Rectangle 9.svg';
            transitionOverlay.style.position = 'fixed';
            transitionOverlay.style.top = '0';
            transitionOverlay.style.left = '0';
            transitionOverlay.style.width = '100vw';
            transitionOverlay.style.height = '100vh';
            transitionOverlay.style.objectFit = 'cover';
            transitionOverlay.style.zIndex = '100000';
            transitionOverlay.style.opacity = '0';
            transitionOverlay.style.pointerEvents = 'none';
            transitionOverlay.style.transition = 'opacity 0.8s ease-in-out';
            document.body.appendChild(transitionOverlay);
        }

        // Trigger animation
        requestAnimationFrame(() => {
            transitionOverlay.style.opacity = '1';
            transitionOverlay.style.pointerEvents = 'auto'; // Block all interactions below

            // Create close button
            let closeBtn = document.getElementById('transition-close-btn');
            if (!closeBtn) {
                closeBtn = document.createElement('button');
                closeBtn.id = 'transition-close-btn';
                closeBtn.textContent = 'close';
                closeBtn.style.position = 'fixed';
                closeBtn.style.top = '20px'; // Same as hamburger
                closeBtn.style.right = '20px'; // Same as hamburger
                closeBtn.style.background = 'none';
                closeBtn.style.border = 'none';
                closeBtn.style.color = '#CBD1DC';
                closeBtn.style.fontFamily = '"Consolas", monospace';
                closeBtn.style.fontSize = '24px';
                closeBtn.style.fontStyle = 'italic';
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.zIndex = '100001'; // Above overlay
                closeBtn.style.filter = 'drop-shadow(0 0 2px #CBD1DC)'; // Layer blur 2
                closeBtn.style.opacity = '0';
                closeBtn.style.transition = 'opacity 0.8s ease-in-out';

                closeBtn.addEventListener('click', () => {
                    transitionOverlay.style.opacity = '0';
                    transitionOverlay.style.pointerEvents = 'none';
                    closeBtn.style.opacity = '0';
                    setTimeout(() => {
                        if (transitionOverlay.parentNode) transitionOverlay.parentNode.removeChild(transitionOverlay);
                        if (closeBtn.parentNode) closeBtn.parentNode.removeChild(closeBtn);
                    }, 800);
                });

                document.body.appendChild(closeBtn);
            }

            // Hide hamburger
            const menu = document.getElementById('hamburger-menu');
            if (menu) menu.style.display = 'none';

            // Fade in button
            setTimeout(() => {
                closeBtn.style.opacity = '1';
            }, 100);
        });
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
        const fadeDuration = 500;
        const fadeStartTime = performance.now();

        if (isExploreState) {
            // TRANSITION TO ORBITAL VIEW
            resetOrbitalNodes(); // Ensure balls start at their designated positions
            if (line1) line1.style.opacity = '0';
            if (line2) line2.style.opacity = '0';
            if (line3) line3.style.opacity = '0';

            function animateIn(currentTime) {
                const elapsed = currentTime - fadeStartTime;
                const progress = Math.min(elapsed / fadeDuration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                orbitalPathOpacity = easedProgress;

                if (progress < 1) {
                    requestAnimationFrame(animateIn);
                } else {
                    orbitalPathOpacity = 1;
                    actionButton.textContent = 'back →';
                    isExploreState = false;
                }
            }
            requestAnimationFrame(animateIn);
        } else {
            // TRANSITION BACK TO LANDING
            if (line1) line1.style.opacity = '1';
            if (line2) line2.style.opacity = '1';
            if (line3) line3.style.opacity = '1';

            function animateOut(currentTime) {
                const elapsed = currentTime - fadeStartTime;
                const progress = Math.min(elapsed / fadeDuration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3);
                orbitalPathOpacity = 1 - easedProgress;

                if (progress < 1) {
                    requestAnimationFrame(animateOut);
                } else {
                    orbitalPathOpacity = 0;
                    actionButton.textContent = 'explore →';
                    isExploreState = true;
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

