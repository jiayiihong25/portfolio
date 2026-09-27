// Get canvas and context
const canvas = document.getElementById('star-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const mountain = document.getElementById('mountain');

let isMobile = window.innerWidth <= 768;
let lastTime = performance.now();

// Pre-rendered glow sprite for star glow effect.
// Using a cached sprite + drawImage is drastically cheaper than calling
// ctx.shadowBlur per-star, per-frame (shadowBlur forces an expensive blur
// recompute on every draw call it touches).
const glowSprite = document.createElement('canvas');
const GLOW_SPRITE_SIZE = 32; // px, drawn at unit scale and scaled per-star
glowSprite.width = GLOW_SPRITE_SIZE;
glowSprite.height = GLOW_SPRITE_SIZE;
(function drawGlowSprite() {
    const glowCtx = glowSprite.getContext('2d');
    const center = GLOW_SPRITE_SIZE / 2;
    const gradient = glowCtx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    glowCtx.fillStyle = gradient;
    glowCtx.fillRect(0, 0, GLOW_SPRITE_SIZE, GLOW_SPRITE_SIZE);
})();

// Orbital center (middle of the mountain). The mountain is position: fixed,
// so its rect only changes on resize or once the image loads — cache it
// instead of forcing a getBoundingClientRect() every frame.
let orbitalCenter = null;

function invalidateOrbitalCenter() {
    orbitalCenter = null;
}

function getOrbitalCenter() {
    if (orbitalCenter) return orbitalCenter;
    if (mountain) {
        const rect = mountain.getBoundingClientRect();
        // Shift center up significantly on mobile so orbits peek over the mountain top more
        const mobileYShift = isMobile ? rect.height * 0.4 : 0;
        orbitalCenter = {
            x: rect.left + rect.width / 2,
            y: (rect.top + rect.height / 2) - mobileYShift
        };
    } else {
        // Fallback to center bottom if mountain not found (shifted up for mobile)
        orbitalCenter = {
            x: canvas.width / 2,
            y: canvas.height * (isMobile ? 0.6 : 0.85)
        };
    }
    return orbitalCenter;
}

// Resizing a canvas clears it, so a paused sky needs one fresh frame.
let needsRedraw = true;

// Set canvas size to match window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    isMobile = window.innerWidth <= 768;
    invalidateOrbitalCenter();
    needsRedraw = true;
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

    update(deltaTime, center) {
        this.timeElapsed += deltaTime;

        // Wait for delay before starting to blink
        if (this.timeElapsed < this.blinkDelay) {
            // Still update position even if not blinking yet
            this.updatePosition(deltaTime, center);
            return;
        }

        // Check if we're in a pause period between blink cycles
        if (this.pauseBetweenBlinks > 0) {
            this.pauseBetweenBlinks -= deltaTime;
            this.updatePosition(deltaTime, center);
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
        this.updatePosition(deltaTime, center);
    }

    updatePosition(deltaTime, center) {
        // Update orbital angle
        this.orbitalAngle += this.orbitalSpeed * deltaTime;

        // Calculate new position based on orbital motion
        this.x = center.x + Math.cos(this.orbitalAngle) * this.orbitalRadius;
        this.y = center.y + Math.sin(this.orbitalAngle) * this.orbitalRadius;
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
            const glowSize = this.size * 6; // roughly matches the old shadowBlur spread
            ctx.globalAlpha = opacity * 0.5;
            ctx.drawImage(glowSprite, this.x - glowSize / 2, this.y - glowSize / 2, glowSize, glowSize);
            ctx.globalAlpha = 1;
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

    update() {
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

        // Retire once the whole trail has left the screen (right or bottom
        // edge), otherwise it keeps being drawn off-screen for ~10+ seconds.
        if (this.x - this.length > canvas.width || this.y - this.length > canvas.height) {
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
const numStars = 250; // Adjust this number for more/fewer stars

function initializeStars() {
    const center = getOrbitalCenter();

    for (let i = 0; i < numStars; i++) {
        stars.push(new Star(center));
    }

    // Add more small stars
    for (let i = 0; i < 25; i++) {
        const smallStar = new Star(center);
        // Force small size for these additional stars
        smallStar.size = (Math.random() * 1.5 + 0.5) * 0.6; // Small stars (0.3-1.2px)
        stars.push(smallStar);
    }
}

function drawFrame(currentTime, deltaTime) {
    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw all stars
    const starCenter = getOrbitalCenter();
    stars.forEach(star => {
        star.update(deltaTime, starCenter);
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
        // Spawn interval 1000-1500ms (was 800-1200ms) — 20% lower spawn
        // rate, since rate scales as 1/interval and 1/1.25 = 0.8.
        if (currentTime - lastMeteorTime > Math.random() * 500 + 1000) {
            meteors.push(new Meteor());
            lastMeteorTime = currentTime;
        }
    }

    // Update and draw meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.update();
        m.draw();
        if (!m.active) {
            meteors.splice(i, 1);
        }
    }
}

// How long to keep animating after the homepage sky is blurred out, so the
// stars don't visibly freeze while the 0.6s blur transition is still running.
const SKY_BLUR_SETTLE_MS = 700;
let skyHiddenSince = null;

// Animation loop
function animate(currentTime) {
    // Cap deltaTime to prevent huge jumps when tab becomes visible again
    // This prevents stars from clumping when switching tabs
    const deltaTime = Math.min(currentTime - lastTime, 100);
    lastTime = currentTime;

    // Once the homepage work section is showing, the whole sky sits under a
    // blur(10px) + brightness filter; redrawing it every frame just makes the
    // browser re-filter a full-screen layer for no visible change.
    if (document.body.classList.contains('work-unlocked')) {
        if (skyHiddenSince === null) skyHiddenSince = currentTime;
    } else {
        skyHiddenSince = null;
    }

    if (skyHiddenSince === null || currentTime - skyHiddenSince < SKY_BLUR_SETTLE_MS || needsRedraw) {
        drawFrame(currentTime, deltaTime);
        needsRedraw = false;
    }

    requestAnimationFrame(animate);
}

if (canvas && ctx) {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    if (mountain) {
        // The rect is only final once the image has loaded (height: auto) and
        // after any breakpoint transform transition finishes.
        mountain.addEventListener('load', invalidateOrbitalCenter);
        mountain.addEventListener('transitionend', invalidateOrbitalCenter);
    }
    initializeStars();
    requestAnimationFrame(animate);
}

// Master Case Study TOC ScrollSpy System & Reading Progress Bar
function initCaseStudyScrollSpy() {
    const sections = document.querySelectorAll('.case-section');
    const navLinks = document.querySelectorAll('.toc-link');

    if (!sections.length || !navLinks.length) return;

    // Auto inject Reading Progress Bar if not already in DOM
    let progressBar = document.querySelector('.reading-progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'reading-progress-bar';
        document.body.appendChild(progressBar);
    }

    let isClickScrolling = false;
    let clickTimeout = null;

    function setActiveLink(targetId) {
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === '#' + targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Direct click handler for instant UI update + smooth scroll
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    e.preventDefault();
                    isClickScrolling = true;
                    if (clickTimeout) clearTimeout(clickTimeout);

                    // Instantly illuminate clicked section in TOC
                    setActiveLink(targetId);

                    // Smooth scroll to target section with offset for fixed nav
                    const yOffset = -90;
                    const y = targetSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });

                    // Release click lock after smooth scroll settles
                    clickTimeout = setTimeout(() => {
                        isClickScrolling = false;
                        updateActive();
                    }, 800);
                }
            }
        });
    });

    function updateActive() {
        // Calculate Reading Progress Percentage
        const totalDocHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalDocHeight > 0 && progressBar) {
            const scrollPercent = Math.min(100, Math.max(0, (window.scrollY / totalDocHeight) * 100));
            progressBar.style.width = scrollPercent + '%';
        }

        if (isClickScrolling) return;

        let activeSectionId = sections[0].getAttribute('id');
        const focalPoint = window.innerHeight * 0.35; // 35% from the top of viewport
        let bestMatch = null;
        let minDistance = Infinity;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            // Check if section contains the focal line
            if (rect.top <= focalPoint && rect.bottom >= focalPoint) {
                bestMatch = section.getAttribute('id');
            }
            // Or find section whose top is closest to the focal point
            const dist = Math.abs(rect.top - focalPoint);
            if (dist < minDistance) {
                minDistance = dist;
                activeSectionId = section.getAttribute('id');
            }
        });

        if (bestMatch) {
            activeSectionId = bestMatch;
        }

        // Top of page edge case: if user is scrolled near top, select first section
        if (window.scrollY < 200 && sections.length > 0) {
            activeSectionId = sections[0].getAttribute('id');
        }

        // Bottom of page edge case: activate last section if scrolled near page bottom
        const isNearBottom = (window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 60);
        if (isNearBottom && sections.length > 0) {
            activeSectionId = sections[sections.length - 1].getAttribute('id');
        }

        if (activeSectionId) {
            setActiveLink(activeSectionId);
        }
    }

    // Scroll events can fire several times per frame; measure at most once per frame.
    let updateQueued = false;
    function queueUpdate() {
        if (updateQueued) return;
        updateQueued = true;
        requestAnimationFrame(() => {
            updateQueued = false;
            updateActive();
        });
    }

    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate, { passive: true });
    // Initial calculation on load
    updateActive();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCaseStudyScrollSpy);
} else {
    initCaseStudyScrollSpy();
}

/* ==========================================================================
   Custom Cursor Follower & Morphing "view work" Badge
   ========================================================================== */

function initCustomCursor() {
    // Only enable on desktop pointer devices
    if (window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(pointer: coarse)').matches) {
        return;
    }

    let follower = document.getElementById('custom-cursor-follower');
    if (!follower) {
        follower = document.createElement('div');
        follower.id = 'custom-cursor-follower';
        follower.className = 'custom-cursor-follower';
        follower.setAttribute('aria-hidden', 'true');
        follower.innerHTML = `
            <div class="cursor-badge-inner">
                <svg class="cursor-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
                <span class="cursor-badge-text">view work</span>
            </div>
        `;
        document.body.appendChild(follower);
    }

    const textEl = follower.querySelector('.cursor-badge-text');

    let mouseX = -100;
    let mouseY = -100;
    let cursorX = -100;
    let cursorY = -100;
    let isInitialized = false;
    let isExpanded = false;
    let rafId = null;

    function render() {
        // Smooth lerp interpolation
        const ease = isExpanded ? 0.22 : 0.28;
        cursorX += (mouseX - cursorX) * ease;
        cursorY += (mouseY - cursorY) * ease;

        follower.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;

        // Stop looping once the follower has caught up; the next mousemove restarts it.
        if (Math.abs(mouseX - cursorX) > 0.1 || Math.abs(mouseY - cursorY) > 0.1) {
            rafId = requestAnimationFrame(render);
        } else {
            rafId = null;
        }
    }

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        if (!isInitialized) {
            cursorX = mouseX;
            cursorY = mouseY;
            isInitialized = true;
            follower.classList.add('is-visible');
            follower.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
        }
        follower.classList.remove('is-hidden');

        if (rafId === null) rafId = requestAnimationFrame(render);
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        follower.classList.add('is-hidden');
    });

    document.addEventListener('mouseenter', () => {
        if (isInitialized) {
            follower.classList.remove('is-hidden');
        }
    });

    const workSelector = '.featured-card:not(.is-locked), [data-cursor-work]';
    const linkSelector = 'a, button, .jiayi-text';

    document.addEventListener('pointerover', (e) => {
        const workTarget = e.target.closest(workSelector);
        if (workTarget) {
            isExpanded = true;
            follower.classList.add('is-expanded');
            follower.classList.remove('is-hovering-link');
            const customText = workTarget.getAttribute('data-cursor-text') || 'view work';
            if (textEl) textEl.textContent = customText;
            return;
        }

        const linkTarget = e.target.closest(linkSelector);
        if (linkTarget && !isExpanded) {
            follower.classList.add('is-hovering-link');
        }
    });

    document.addEventListener('pointerout', (e) => {
        const workTarget = e.target.closest(workSelector);
        if (workTarget) {
            const nextWorkTarget = e.relatedTarget ? e.relatedTarget.closest(workSelector) : null;
            if (!nextWorkTarget) {
                isExpanded = false;
                follower.classList.remove('is-expanded');
                if (textEl) textEl.textContent = 'view work';
            } else {
                const customText = nextWorkTarget.getAttribute('data-cursor-text') || 'view work';
                if (textEl) textEl.textContent = customText;
            }
        }

        const linkTarget = e.target.closest(linkSelector);
        if (linkTarget) {
            const nextLinkTarget = e.relatedTarget ? e.relatedTarget.closest(linkSelector) : null;
            if (!nextLinkTarget) {
                follower.classList.remove('is-hovering-link');
            }
        }
    });
}

// Homepage cover videos are preload="none" (no autoplay attribute), so none of
// them download until they are about to scroll into view. Offscreen ones are
// paused so only visible videos spend time decoding.
function initCoverVideos() {
    const videos = document.querySelectorAll('.featured-card-img-wrapper video');
    if (!videos.length) return;

    const visible = new Set();
    const gestures = ['pointerdown', 'keydown', 'touchstart'];
    let retryArmed = false;

    function tryPlay(video) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(armRetry);
        }
    }

    // Autoplay can be refused (e.g. iOS Low Power Mode). Scrolling doesn't
    // count as a user gesture, so wait for a real tap/click/key, and re-arm
    // if that attempt is refused too.
    function armRetry() {
        if (retryArmed) return;
        retryArmed = true;
        gestures.forEach(type => window.addEventListener(type, retryPlay, { passive: true }));
    }

    function retryPlay() {
        retryArmed = false;
        gestures.forEach(type => window.removeEventListener(type, retryPlay));
        visible.forEach(tryPlay);
    }

    videos.forEach(video => { video.muted = true; });

    if (!('IntersectionObserver' in window)) {
        videos.forEach(video => {
            visible.add(video);
            tryPlay(video);
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
            if (isIntersecting) {
                visible.add(target);
                tryPlay(target);
            } else {
                visible.delete(target);
                target.pause();
            }
        });
    }, { rootMargin: '200px 0px' });

    videos.forEach(video => observer.observe(video));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initCustomCursor();
        initCoverVideos();
    });
} else {
    initCustomCursor();
    initCoverVideos();
}
