// Constants
const G = 0.2; // Increased gravitational constant for stronger pull
const MIN_DISTANCE = 5;

// Player and leaderboard variables
let currentPlayer = null;
let leaderboardData = [];

// Star type definitions based on real stellar classifications
const STAR_TYPES = {
    O: { // Blue supergiants
        mass: 400000,
        radius: 50,
        color: '#9DB4FF',
        name: 'Blue Supergiant'
    },
    B: { // Blue-white giants
        mass: 300000,
        radius: 45,
        color: '#A7B8FF',
        name: 'Blue-White Giant'
    },
    A: { // White stars
        mass: 250000,
        radius: 40,
        color: '#CAD7FF',
        name: 'White Star'
    },
    F: { // Yellow-white stars
        mass: 200000,
        radius: 35,
        color: '#F8F7FF',
        name: 'Yellow-White Star'
    },
    G: { // Yellow stars (like our Sun)
        mass: 180000,
        radius: 30,
        color: '#FFF4EA',
        name: 'Yellow Star'
    },
    K: { // Orange stars
        mass: 150000,
        radius: 25,
        color: '#FFD2A1',
        name: 'Orange Star'
    },
    M: { // Red dwarfs
        mass: 100000,
        radius: 20,
        color: '#FFB56C',
        name: 'Red Dwarf'
    }
};

// Game state
let canvas, ctx;
let backgroundCanvas, backgroundCtx;
let sun;
let planets = [];
let asteroids = [];
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let dragCurrent = { x: 0, y: 0 };
/** Expanding rings when a planet is launched */
let launchRipples = [];
let score = 0;
let textPopups = [];
let orbitsCompleted = 0;

// Background state
let stars = [];
let nebulaClouds = [];
const STAR_COUNT = 200;
const NEBULA_COUNT = 5;

// Asteroid properties
const ASTEROID_COUNT = 20;
const ASTEROID_SPEED = 1;
const ASTEROID_SIZE = { min: 5, max: 10 };

// Next planet preview
let nextPlanetPreview = generatePlanetProperties();

// Initialize background
function initBackground() {
    backgroundCanvas = document.getElementById('backgroundCanvas');
    backgroundCtx = backgroundCanvas.getContext('2d');
    
    // Set background canvas size
    backgroundCanvas.width = window.innerWidth - 40;
    backgroundCanvas.height = window.innerHeight - 40;
    
    // Create stars
    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * backgroundCanvas.width,
            y: Math.random() * backgroundCanvas.height,
            radius: Math.random() * 1.5,
            twinkleSpeed: 0.02 + Math.random() * 0.05,
            twinkleOffset: Math.random() * Math.PI * 2,
            brightness: 0.5 + Math.random() * 0.5
        });
    }
    
    // Create nebula clouds
    for (let i = 0; i < NEBULA_COUNT; i++) {
        nebulaClouds.push({
            x: Math.random() * backgroundCanvas.width,
            y: Math.random() * backgroundCanvas.height,
            radius: 100 + Math.random() * 200,
            color: `hsla(${Math.random() * 360}, 70%, 50%, 0.1)`,
            drift: { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2 }
        });
    }
}

// Text popup class
class TextPopup {
    constructor(x, y, text, points) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.points = points;
        this.opacity = 1;
        this.life = 2; // 2 seconds lifetime
    }

    update(dt) {
        this.life -= dt;
        this.opacity = Math.max(0, this.life / 2);
        this.y -= 30 * dt; // Float upward
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        
        // Use red for negative points, green for stable orbits, white for others
        let color;
        if (this.points < 0) {
            color = 'red';
        } else if (this.text.includes('stable orbit')) {
            color = 'green'; // Bright green
        } else {
            color = 'white';
        }
        ctx.fillStyle = `rgba(${color === 'red' ? '255, 0, 0' : color === 'green' ? '0, 255, 0' : '255, 255, 255'}, ${this.opacity})`;
        
        // Add plus sign only for positive points
        const pointsText = this.points < 0 ? this.points : `+${this.points}`;
        ctx.fillText(`${this.text} ${pointsText}`, this.x, this.y);
        ctx.restore();
    }
}

// Draw background
function drawBackground(time) {
    backgroundCtx.fillStyle = '#000';
    backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    
    // Draw nebula clouds
    nebulaClouds.forEach(cloud => {
        const gradient = backgroundCtx.createRadialGradient(
            cloud.x, cloud.y, 0,
            cloud.x, cloud.y, cloud.radius
        );
        gradient.addColorStop(0, cloud.color);
        gradient.addColorStop(1, 'transparent');
        
        backgroundCtx.fillStyle = gradient;
        backgroundCtx.beginPath();
        backgroundCtx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        backgroundCtx.fill();
        
        // Move clouds slowly
        cloud.x += cloud.drift.x;
        cloud.y += cloud.drift.y;
        
        // Wrap around edges
        if (cloud.x < -cloud.radius) cloud.x = backgroundCanvas.width + cloud.radius;
        if (cloud.x > backgroundCanvas.width + cloud.radius) cloud.x = -cloud.radius;
        if (cloud.y < -cloud.radius) cloud.y = backgroundCanvas.height + cloud.radius;
        if (cloud.y > backgroundCanvas.height + cloud.radius) cloud.y = -cloud.radius;
    });
    
    // Draw stars with twinkling effect
    stars.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        backgroundCtx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
        backgroundCtx.beginPath();
        backgroundCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        backgroundCtx.fill();
    });
}

// Create asteroid
function createAsteroid() {
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y, vx, vy;
    
    switch(side) {
        case 0: // top
            x = Math.random() * canvas.width;
            y = -ASTEROID_SIZE.max;
            vx = (Math.random() - 0.5) * ASTEROID_SPEED;
            vy = Math.random() * ASTEROID_SPEED;
            break;
        case 1: // right
            x = canvas.width + ASTEROID_SIZE.max;
            y = Math.random() * canvas.height;
            vx = -Math.random() * ASTEROID_SPEED;
            vy = (Math.random() - 0.5) * ASTEROID_SPEED;
            break;
        case 2: // bottom
            x = Math.random() * canvas.width;
            y = canvas.height + ASTEROID_SIZE.max;
            vx = (Math.random() - 0.5) * ASTEROID_SPEED;
            vy = -Math.random() * ASTEROID_SPEED;
            break;
        case 3: // left
            x = -ASTEROID_SIZE.max;
            y = Math.random() * canvas.height;
            vx = Math.random() * ASTEROID_SPEED;
            vy = (Math.random() - 0.5) * ASTEROID_SPEED;
            break;
    }
    
    const radius = ASTEROID_SIZE.min + Math.random() * (ASTEROID_SIZE.max - ASTEROID_SIZE.min);
    const vertices = [];
    const vertexCount = Math.floor(Math.random() * 4) + 6; // 6-9 vertices
    
    // Generate irregular polygon vertices
    for (let i = 0; i < vertexCount; i++) {
        const angle = (i / vertexCount) * Math.PI * 2;
        const variance = 0.5 + Math.random() * 0.5; // 50-100% of radius
        vertices.push({
            x: Math.cos(angle) * radius * variance,
            y: Math.sin(angle) * radius * variance
        });
    }
    
    return {
        x,
        y,
        vx,
        vy,
        radius,
        vertices,
        mass: 50, // Fixed mass for asteroids
        color: '#808080',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02 // Random rotation speed
    };
}

// Initialize game
function init() {
    startGame();
}

function startGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = window.innerWidth - 40;
    canvas.height = window.innerHeight - 40;
    
    // Initialize background
    initBackground();
    
    // Create random star at center
    const starTypes = Object.keys(STAR_TYPES);
    const randomType = starTypes[Math.floor(Math.random() * starTypes.length)];
    const starProperties = STAR_TYPES[randomType];
    
    sun = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        mass: starProperties.mass,
        radius: starProperties.radius,
        color: starProperties.color,
        type: randomType,
        name: starProperties.name
    };
    
    // Event listeners — window move/up so drag works when pointer leaves the canvas
    canvas.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', (e) => {
        if (isDragging) endDrag(e);
    });
    canvas.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', drag, { passive: false });
    window.addEventListener('touchend', (e) => {
        if (isDragging) endDrag(e);
    });
    document.addEventListener('keydown', handleKeyPress);
    
    /*
    // Add leaderboard button
    const leaderboardButton = document.createElement('div');
    leaderboardButton.id = 'leaderboardButton';
    leaderboardButton.textContent = '🏆 Leaderboard';
    document.body.appendChild(leaderboardButton);
    
    // Create leaderboard overlay
    const leaderboardOverlay = document.createElement('div');
    leaderboardOverlay.id = 'leaderboardOverlay';
    leaderboardOverlay.className = 'overlay';
    leaderboardOverlay.innerHTML = `
        <div class="overlay-content">
            <h2>Leaderboard</h2>
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody id="leaderboardBody"></tbody>
            </table>
            <button class="close-button">Close</button>
        </div>
    `;
    document.body.appendChild(leaderboardOverlay);
    
    // Add leaderboard button click handler
    leaderboardButton.addEventListener('click', () => {
        updateLeaderboard();
        leaderboardOverlay.style.display = 'flex';
    });
    
    // Add close button handler
    leaderboardOverlay.querySelector('.close-button').addEventListener('click', () => {
        leaderboardOverlay.style.display = 'none';
    });
    */
    
    // Initialize asteroid belt
    for (let i = 0; i < ASTEROID_COUNT; i++) {
        asteroids.push(createAsteroid());
    }
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Event handlers
function startDrag(e) {
    if (e.cancelable && e.type === 'touchstart') e.preventDefault();
    isDragging = true;
    dragStart = getPointerPos(e);
    dragCurrent = { ...dragStart };
    initMusicOnFirstInteraction();
}

function drag(e) {
    if (!isDragging) return;
    if (e.cancelable && e.type === 'touchmove') e.preventDefault();
    dragCurrent = getPointerPos(e);
}

function endDrag(e) {
    if (e && e.cancelable && e.type === 'touchend') e.preventDefault();
    if (!isDragging) return;
    isDragging = false;

    const pos = getPointerPos(e);
    const dx = pos.x - dragStart.x;
    const dy = pos.y - dragStart.y;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 8) {
        launchRipples.push({
            x: dragStart.x,
            y: dragStart.y,
            r: 0,
            maxR: Math.min(120, 40 + dist * 0.35),
            opacity: 0.85,
            hue: 200 + Math.min(60, dist * 0.15)
        });
    }

    const initialAngle = Math.atan2(dragStart.y - sun.y, dragStart.x - sun.x);
    const planet = {
        x: dragStart.x,
        y: dragStart.y,
        vx: dx * 0.05,
        vy: dy * 0.05,
        initialAngle: initialAngle,
        lastAngle: initialAngle,
        totalRotation: 0,
        ...nextPlanetPreview
    };

    nextPlanetPreview = generatePlanetProperties();

    planets.push(planet);
}

function generatePlanetProperties() {
    const colors = ['#4169E1', '#8A2BE2', '#20B2AA', '#CD5C5C', '#DAA520', '#FF6347'];
    const minSize = 8;
    const maxSize = 15;
    
    const radius = minSize + Math.random() * (maxSize - minSize);
    const hasRings = Math.random() > 0.7;
    const surfacePattern = Math.floor(Math.random() * 3);
    
    // Calculate mass based on properties
    let mass = radius * 2; // Base mass from size
    if (hasRings) mass *= 1.5; // Ringed planets are heavier
    mass *= (1 + surfacePattern * 0.2); // Different patterns affect mass
    
    return {
        radius,
        color: colors[Math.floor(Math.random() * colors.length)],
        hasRings,
        ringColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`,
        surfacePattern,
        mass
    };
}

// Audio control
const bgMusic = document.getElementById('bgMusic');
let isMusicPlaying = true;
let currentTrackIndex = -1;

// List of all available music tracks
const musicTracks = [
    'public/audio/Andromeda Applefish.mp3',
    'public/audio/Astrosat Applefish.mp3',
    'public/audio/Earthrise Applefish.mp3',
    // 'public/audio/Event Horizon - Applefish.mp3',
    // 'public/audio/In Orbit - Applefish.mp3',
    'public/audio/Into the Aether - Applefish.mp3',
    'public/audio/Orbital Resonance - Applefish.mp3',
    'public/audio/Particles - Applefish.mp3',
    'public/audio/Primordial Soup - Applefish.mp3',
    'public/audio/Starsoaked - Applefish.mp3',
    'public/audio/The Ocean Held Me Close in Its Arms - Applefish.mp3'
];

// Function to get a random track index different from the current one
function getRandomTrackIndex() {
    if (musicTracks.length <= 1) return 0;
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * musicTracks.length);
    } while (newIndex === currentTrackIndex);
    return newIndex;
}

// Function to play the next random track
function playNextTrack() {
    currentTrackIndex = getRandomTrackIndex();
    bgMusic.src = musicTracks[currentTrackIndex];
    bgMusic.play().catch(error => {
        console.log('Autoplay prevented:', error);
        isMusicPlaying = false;
    });
}

function toggleMusic() {
    if (isMusicPlaying) {
        bgMusic.pause();
    } else {
        bgMusic.play();
    }
    isMusicPlaying = !isMusicPlaying;
}

// Add event listener for when a track ends
bgMusic.addEventListener('ended', playNextTrack);

// Initialize music system but don't autoplay
let hasUserInteracted = false;

function initMusicOnFirstInteraction() {
    if (!hasUserInteracted) {
        hasUserInteracted = true;
        playNextTrack();
    }
}

function handleKeyPress(e) {
    initMusicOnFirstInteraction();
    if (e.key.toLowerCase() === 'm') {
        toggleMusic();
    } else if (e.key.toLowerCase() === 'n') {
        playNextTrack();
    }
}

// Helper functions
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    let clientX;
    let clientY;
    if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function calculateGravity(body1, body2) {
    const dx = body2.x - body1.x;
    const dy = body2.y - body1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < MIN_DISTANCE) return { fx: 0, fy: 0 };
    
    // Using inverse square law for gravity
    const force = (G * body1.mass * body2.mass) / (distance * distance);
    const angle = Math.atan2(dy, dx);
    
    return {
        fx: force * Math.cos(angle),
        fy: force * Math.sin(angle)
    };
}

function updatePlanet(planet, dt) {
    // Calculate gravitational force from sun
    const gravity = calculateGravity(planet, sun);
    
    // Calculate gravitational forces from other planets
    planets.forEach(otherPlanet => {
        if (otherPlanet !== planet) {
            const planetGravity = calculateGravity(planet, otherPlanet);
            gravity.fx += planetGravity.fx;
            gravity.fy += planetGravity.fy;
        }
    });
    
    // Update velocity
    planet.vx += (gravity.fx / planet.mass) * dt;
    planet.vy += (gravity.fy / planet.mass) * dt;
    
    // Update position
    planet.x += planet.vx * dt;
    planet.y += planet.vy * dt;
    
    // Check if planet is in stable orbit
    const dx = planet.x - sun.x;
    const dy = planet.y - sun.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate current speed
    const speed = Math.sqrt(planet.vx * planet.vx + planet.vy * planet.vy);
    
    // Track min and max orbit radius
    if (!planet.maxOrbitRadius || distance > planet.maxOrbitRadius) {
        planet.maxOrbitRadius = distance;
    }
    if (!planet.minOrbitRadius || distance < planet.minOrbitRadius) {
        planet.minOrbitRadius = distance;
    }
    
    // Track top speed
    if (!planet.topSpeed || speed > planet.topSpeed) {
        planet.topSpeed = speed;
    }
    
    // Track minimum speed
    if (!planet.minSpeed || speed < planet.minSpeed) {
        planet.minSpeed = speed;
    }
    
    // Track orbit shape (store min and max radius)
    if (!planet.minOrbitRadius || distance < planet.minOrbitRadius) {
        planet.minOrbitRadius = distance;
    }
    
    if (distance < sun.radius + planet.radius) {
        // Collision with sun - apply penalty
        score -= 10000;
        document.getElementById('scoreValue').textContent = score;
        textPopups.push(new TextPopup(planet.x, planet.y - planet.radius - 20, "Sun Collision!", -10000));
        
        return false;
    }
    
    // Track angular position and complete orbits
    const currentAngle = Math.atan2(dy, dx);
    
    // Calculate angular change, handling the -π to π transition
    let deltaAngle = currentAngle - planet.lastAngle;
    if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
    
    planet.totalRotation += deltaAngle;
    planet.lastAngle = currentAngle;
    
    // Check for complete orbit (2π rotation from initial angle)
    if (Math.abs(planet.totalRotation) >= 2 * Math.PI) {
        // Calculate orbit radius score based on average orbit radius
        const avgOrbitRadius = (planet.maxOrbitRadius + planet.minOrbitRadius) / 2;
        const orbitRadiusScore = Math.floor(avgOrbitRadius ** 2 / 50);
        
        // Calculate orbit stability multiplier based on radius consistency
        const orbitRadiusRange = planet.maxOrbitRadius - planet.minOrbitRadius;
        // const radiusRangeThreshold = 100; // Threshold for maximum multiplier
        const stabilityRangeScore = Math.floor((2500 / (orbitRadiusRange + 100)) - 12);
        const stabilityMultiplier = Math.min(10, Math.max(1, stabilityRangeScore));
        
        // Base orbit completion bonus plus radius-based bonus, multiplied by stability factor
        let orbitBonus = (100 + orbitRadiusScore) * stabilityMultiplier;
        
        score += orbitBonus;
        document.getElementById('scoreValue').textContent = score;
        planet.totalRotation = 0;
        
        // Show orbit bonus popup with stability multiplier info
        const bonusText = stabilityMultiplier > 1 ? `Orbit Bonus (${stabilityMultiplier}x stable orbit)` : "Orbit Bonus";
        textPopups.push(new TextPopup(planet.x, planet.y - planet.radius - 20, bonusText, orbitBonus));
        
        // Reset orbit tracking for next orbit
        planet.minOrbitRadius = null;
        planet.maxOrbitRadius = null;
        planet.topSpeed = null;
        planet.minSpeed = null;
    }
    
    // Check for asteroid threading
    const THREADING_DISTANCE = 75; // Distance threshold for threading detection
    const MIN_SAFE_DISTANCE = 20; // Minimum safe distance to avoid collision
    const MIN_DISTANCE_FOR_NEW_BONUS = 150; // Minimum distance required from last bonus position
    
    // Initialize last threading position if not exists
    if (!planet.lastThreadingX) {
        planet.lastThreadingX = null;
        planet.lastThreadingY = null;
    }
    
    // Find pairs of nearby asteroids
    for (let i = 0; i < asteroids.length; i++) {
        for (let j = i + 1; j < asteroids.length; j++) {
            const ast1 = asteroids[i];
            const ast2 = asteroids[j];
            
            // Calculate distances between planet and both asteroids
            const d1 = Math.sqrt((planet.x - ast1.x) ** 2 + (planet.y - ast1.y) ** 2);
            const d2 = Math.sqrt((planet.x - ast2.x) ** 2 + (planet.y - ast2.y) ** 2);
            
            // Check if both asteroids are within threading distance
            if (d1 < THREADING_DISTANCE && d2 < THREADING_DISTANCE) {
                // Calculate if planet is between asteroids
                const astDist = Math.sqrt((ast1.x - ast2.x) ** 2 + (ast1.y - ast2.y) ** 2);
                
                // Use triangle perimeter comparison for between-ness check
                if (Math.abs((d1 + d2) - astDist) < 1) {
                    // Ensure safe distance from both asteroids
                    if (d1 > MIN_SAFE_DISTANCE && d2 > MIN_SAFE_DISTANCE) {
                        // Check distance from last threading bonus position
                        let canAwardBonus = true;
                        if (planet.lastThreadingX !== null) {
                            const distFromLastBonus = Math.sqrt(
                                (planet.x - planet.lastThreadingX) ** 2 + 
                                (planet.y - planet.lastThreadingY) ** 2
                            );
                            canAwardBonus = distFromLastBonus >= MIN_DISTANCE_FOR_NEW_BONUS;
                        }
                        
                        if (canAwardBonus) {
                            // Calculate bonus based on threading precision
                            // const precision = 1 - Math.min(d1, d2) / THREADING_DISTANCE;
                            const precision = 1 / (Math.log(Math.min(d1, d1) / THREADING_DISTANCE + 1));
                            const bonus = Math.floor(2500 * precision);
                            
                            score += bonus;
                            document.getElementById('scoreValue').textContent = score;
                            textPopups.push(new TextPopup(
                                planet.x,
                                planet.y - planet.radius - 20,
                                "Asteroid Threading!",
                                bonus
                            ));
                            
                            // Update last threading position
                            planet.lastThreadingX = planet.x;
                            planet.lastThreadingY = planet.y;
                        }
                    }
                }
            }
        }
    }
    
    return true;
}

// Sun animation state
let time = 0;
let flares = [];

// Max drag length used for color / label (matches typical strong launch)
const DRAG_FEEDBACK_MAX_LEN = 280;

function updateLaunchRipples(dt) {
    launchRipples = launchRipples.filter((ripple) => {
        ripple.r += (120 + ripple.maxR) * dt * 2.2;
        ripple.opacity -= dt * 2.8;
        return ripple.opacity > 0.02;
    });
}

function drawLaunchRipples() {
    launchRipples.forEach((ripple) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${ripple.hue}, 85%, 60%, ${ripple.opacity * 0.9})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, ripple.r * 0.65, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${ripple.hue}, 70%, 75%, ${ripple.opacity * 0.45})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    });
}

/**
 * Animated slingshot feedback: pull direction = launch velocity; longer pull = faster.
 */
function drawDragLaunchFeedback() {
    const dx = dragCurrent.x - dragStart.x;
    const dy = dragCurrent.y - dragStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dist > 0.001 ? dx / dist : 1;
    const ny = dist > 0.001 ? dy / dist : 0;
    const speedNorm = Math.min(1, dist / DRAG_FEEDBACK_MAX_LEN);
    const hue = 185 + speedNorm * 75;
    const lineAlpha = 0.45 + speedNorm * 0.45;
    const pulse = 0.92 + 0.08 * Math.sin(time * 8);

    const px = dragStart.x;
    const py = dragStart.y;
    const pr = nextPlanetPreview.radius * pulse;

    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.arc(px, py, pr + 6 + speedNorm * 4, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${hue}, 70%, 55%, ${0.35 + speedNorm * 0.35})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = nextPlanetPreview.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;

    if (dist < 6) {
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.lineWidth = 3;
        const hintY = py - pr - 14;
        ctx.strokeText('Drag to aim — direction & length = velocity', px, hintY);
        ctx.fillText('Drag to aim — direction & length = velocity', px, hintY);
        ctx.restore();
        return;
    }

    const grad = ctx.createLinearGradient(px, py, dragCurrent.x, dragCurrent.y);
    grad.addColorStop(0, `hsla(${hue}, 60%, 65%, ${lineAlpha * 0.5})`);
    grad.addColorStop(1, `hsla(${hue + 25}, 85%, 58%, ${lineAlpha})`);

    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(dragCurrent.x, dragCurrent.y);
    ctx.strokeStyle = `hsla(${hue}, 90%, 70%, ${0.2 + speedNorm * 0.25})`;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.setLineDash([14, 10]);
    ctx.lineDashOffset = -(time * 42) % 24;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(dragCurrent.x, dragCurrent.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    const tipX = dragCurrent.x;
    const tipY = dragCurrent.y;
    const ah = 14 + speedNorm * 8;
    const aw = 9 + speedNorm * 5;
    const bx = tipX - nx * ah;
    const by = tipY - ny * ah;
    const perpX = -ny * aw;
    const perpY = nx * aw;

    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(bx + perpX, by + perpY);
    ctx.lineTo(bx - perpX, by - perpY);
    ctx.closePath();
    ctx.fillStyle = `hsla(${hue + 15}, 90%, 62%, ${0.85 + speedNorm * 0.15})`;
    ctx.fill();

    const midX = (px + tipX) * 0.5 + ny * 14;
    const midY = (py + tipY) * 0.5 - nx * 14;
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85})`;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeText('Release to launch', midX, midY);
    ctx.fillText('Release to launch', midX, midY);

    const speedLabel = `Speed ${Math.round(speedNorm * 100)}%`;
    ctx.font = '12px Arial';
    ctx.strokeText(speedLabel, midX, midY + 16);
    ctx.fillText(speedLabel, midX, midY + 16);

    ctx.restore();
}

// Drawing functions
function drawGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update time
    time += 0.02;
    
    // Draw background
    drawBackground(time);

    // Draw fine orbital distance indicators (every 10 units)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5;
    for (let radius = 10; radius <= 500; radius += 10) {
        if (radius % 100 === 0) continue; // Skip multiples of 100 as they'll be drawn later
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw major orbital distance indicators
    const orbitDistances = [100, 200, 300, 400, 500];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.textAlign = 'left';
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    
    orbitDistances.forEach(radius => {
        ctx.beginPath();
        ctx.arc(sun.x, sun.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add distance label
        ctx.fillText(`${radius}`, sun.x + radius + 5, sun.y);
    });
    
    // Reset line dash for other drawings
    ctx.setLineDash([]);
    ctx.lineWidth = 1;

    // Draw star with animated surface
    const gradient = ctx.createRadialGradient(
        sun.x, sun.y, 0,
        sun.x, sun.y, sun.radius
    );
    
    // Use star-specific colors for the gradient
    const baseColor = sun.color;
    gradient.addColorStop(0, '#FFFFFF'); // Core is always white-hot
    gradient.addColorStop(0.3, baseColor); // Transition to star's characteristic color
    gradient.addColorStop(1, baseColor);
    
    ctx.beginPath();
    ctx.arc(sun.x, sun.y, sun.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw star name
    ctx.font = '14px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(sun.name, sun.x, sun.y + sun.radius + 20);
    
    // Draw animated surface curves
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
            const radius = sun.radius + Math.sin(angle * 3 + time + i) * 2;
            const x = sun.x + Math.cos(angle) * radius;
            const y = sun.y + Math.sin(angle) * radius;
            if (angle === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(255, ${200 + Math.sin(time + i) * 55}, 0, 0.3)`;
        ctx.stroke();
    }
    
    // Randomly create solar flares
    if (Math.random() < 0.005) {
        const angle = Math.random() * Math.PI * 2;
        flares.push({
            angle: angle,
            size: 0,
            maxSize: 20 + Math.random() * 30
        });
    }
    
    // Draw and update solar flares
    flares = flares.filter(flare => {
        flare.size += 2;
        if (flare.size > flare.maxSize) return false;
        
        const startRadius = sun.radius;
        const endRadius = startRadius + flare.size;
        const controlPoint1X = sun.x + Math.cos(flare.angle) * (startRadius + flare.size * 0.5) + Math.sin(flare.angle) * 20;
        const controlPoint1Y = sun.y + Math.sin(flare.angle) * (startRadius + flare.size * 0.5) - Math.cos(flare.angle) * 20;
        
        const gradient = ctx.createLinearGradient(
            sun.x + Math.cos(flare.angle) * startRadius,
            sun.y + Math.sin(flare.angle) * startRadius,
            sun.x + Math.cos(flare.angle) * endRadius,
            sun.y + Math.sin(flare.angle) * endRadius
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
        
        ctx.beginPath();
        ctx.moveTo(
            sun.x + Math.cos(flare.angle) * startRadius,
            sun.y + Math.sin(flare.angle) * startRadius
        );
        ctx.quadraticCurveTo(
            controlPoint1X,
            controlPoint1Y,
            sun.x + Math.cos(flare.angle) * endRadius,
            sun.y + Math.sin(flare.angle) * endRadius
        );
        ctx.lineWidth = 2;
        ctx.strokeStyle = gradient;
        ctx.stroke();
        
        return true;
    });
    
    // Draw next planet preview
    const previewX = 60;
    const previewY = canvas.height - 60;
    
    ctx.beginPath();
    ctx.arc(previewX, previewY, nextPlanetPreview.radius, 0, Math.PI * 2);
    ctx.fillStyle = nextPlanetPreview.color;
    ctx.fill();
    
    // Draw surface patterns for preview
    switch(nextPlanetPreview.surfacePattern) {
        case 0: // Stripes
            for(let i = -nextPlanetPreview.radius; i < nextPlanetPreview.radius; i += 4) {
                ctx.beginPath();
                ctx.moveTo(previewX - Math.sqrt(nextPlanetPreview.radius * nextPlanetPreview.radius - i * i), previewY + i);
                ctx.lineTo(previewX + Math.sqrt(nextPlanetPreview.radius * nextPlanetPreview.radius - i * i), previewY + i);
                ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
                ctx.stroke();
            }
            break;
        case 1: // Spots
            for(let i = 0; i < 5; i++) {
                const spotX = previewX + (Math.random() * 2 - 1) * nextPlanetPreview.radius * 0.7;
                const spotY = previewY + (Math.random() * 2 - 1) * nextPlanetPreview.radius * 0.7;
                ctx.beginPath();
                ctx.arc(spotX, spotY, nextPlanetPreview.radius * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
                ctx.fill();
            }
            break;
        case 2: // Swirl
            for(let i = 0; i < Math.PI * 2; i += 0.5) {
                const x = previewX + Math.cos(i) * (nextPlanetPreview.radius * 0.8);
                const y = previewY + Math.sin(i) * (nextPlanetPreview.radius * 0.8);
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
                ctx.fill();
            }
            break;
    }
    
    if(nextPlanetPreview.hasRings) {
        ctx.beginPath();
        ctx.ellipse(previewX, previewY, nextPlanetPreview.radius * 1.8, nextPlanetPreview.radius * 0.5, Math.PI / 4, 0, Math.PI * 2);
        ctx.strokeStyle = nextPlanetPreview.ringColor;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
    
    // Draw "Next Planet" text
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Next Planet', previewX, previewY + nextPlanetPreview.radius + 20);
    
    // Draw asteroids
    asteroids.forEach(asteroid => {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);
        
        ctx.beginPath();
        ctx.moveTo(asteroid.vertices[0].x, asteroid.vertices[0].y);
        for (let i = 1; i < asteroid.vertices.length; i++) {
            ctx.lineTo(asteroid.vertices[i].x, asteroid.vertices[i].y);
        }
        ctx.closePath();
        
        ctx.fillStyle = asteroid.color;
        ctx.fill();
        ctx.restore();
        
        // Update asteroid rotation
        asteroid.rotation += asteroid.rotationSpeed;
    });

    // Update and draw text popups
    textPopups = textPopups.filter(popup => {
        const alive = popup.update(0.016); // Assuming 60fps
        if (alive) {
            popup.draw(ctx);
        }
        return alive;
    });

    // Draw planets
    planets.forEach(planet => {
        // Draw planet body
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        ctx.fillStyle = planet.color;
        ctx.fill();
        
        // Draw surface patterns
        switch(planet.surfacePattern) {
            case 0: // Stripes
                for(let i = -planet.radius; i < planet.radius; i += 4) {
                    ctx.beginPath();
                    ctx.moveTo(planet.x - Math.sqrt(planet.radius * planet.radius - i * i), planet.y + i);
                    ctx.lineTo(planet.x + Math.sqrt(planet.radius * planet.radius - i * i), planet.y + i);
                    ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
                    ctx.stroke();
                }
                break;
            case 1: // Spots
                for(let i = 0; i < 5; i++) {
                    const spotX = planet.x + (Math.random() * 2 - 1) * planet.radius * 0.7;
                    const spotY = planet.y + (Math.random() * 2 - 1) * planet.radius * 0.7;
                    ctx.beginPath();
                    ctx.arc(spotX, spotY, planet.radius * 0.2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
                    ctx.fill();
                }
                break;
            case 2: // Swirl
                for(let i = 0; i < Math.PI * 2; i += 0.5) {
                    const x = planet.x + Math.cos(i) * (planet.radius * 0.8);
                    const y = planet.y + Math.sin(i) * (planet.radius * 0.8);
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
                    ctx.fill();
                }
                break;
        }
        
        // Draw rings if planet has them
        if(planet.hasRings) {
            ctx.beginPath();
            ctx.ellipse(planet.x, planet.y, planet.radius * 1.8, planet.radius * 0.5, Math.PI / 4, 0, Math.PI * 2);
            ctx.strokeStyle = planet.ringColor;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    });

    drawLaunchRipples();

    if (isDragging) {
        drawDragLaunchFeedback();
    }
}

// Check for collisions between planets
function updateAsteroids() {
    // Update asteroid positions with circular motion
    asteroids.forEach(asteroid => {
        // Calculate distance from center of screen
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const dx = asteroid.x - centerX;
        const dy = asteroid.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Fixed distance of 300 units from the sun
        const targetDistance = 300;
        
        // Adjust position to maintain circular path
        const angle = Math.atan2(dy, dx);
        asteroid.x = centerX + Math.cos(angle) * targetDistance;
        asteroid.y = centerY + Math.sin(angle) * targetDistance;
        
        // Update velocity for circular motion
        const speed = ASTEROID_SPEED;
        asteroid.vx = -Math.sin(angle) * speed;
        asteroid.vy = Math.cos(angle) * speed;
        
        // Move along the circular path
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
    });
    
    // Replace lost asteroids
    while (asteroids.length < ASTEROID_COUNT) {
        asteroids.push(createAsteroid());
    }
}

let fragments = [];

function createFragment(x, y, parentObject) {
    const fragmentSize = parentObject.radius * (0.2 + Math.random() * 0.3); // 20-50% of parent size
    const fragmentSpeed = 2 + Math.random() * 3; // Random speed
    const angle = Math.random() * Math.PI * 2; // Random direction
    
    return {
        x,
        y,
        vx: Math.cos(angle) * fragmentSpeed,
        vy: Math.sin(angle) * fragmentSpeed,
        radius: fragmentSize,
        mass: parentObject.mass * (fragmentSize / parentObject.radius),
        color: parentObject.color,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        lifetime: 2, // Seconds to live
        opacity: 1
    };
}

function updateFragments(dt) {
    fragments = fragments.filter(fragment => {
        // Update position
        fragment.x += fragment.vx * dt;
        fragment.y += fragment.vy * dt;
        
        // Update rotation
        fragment.rotation += fragment.rotationSpeed;
        
        // Update lifetime and opacity
        fragment.lifetime -= dt;
        fragment.opacity = fragment.lifetime / 2;
        
        return fragment.lifetime > 0;
    });
}

function drawFragments() {
    fragments.forEach(fragment => {
        ctx.save();
        ctx.globalAlpha = fragment.opacity;
        ctx.translate(fragment.x, fragment.y);
        ctx.rotate(fragment.rotation);
        
        ctx.beginPath();
        ctx.arc(0, 0, fragment.radius, 0, Math.PI * 2);
        ctx.fillStyle = fragment.color;
        ctx.fill();
        
        ctx.restore();
    });
}

function checkPlanetCollisions() {
    const collidedPlanets = new Set();
    
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i];
            const p2 = planets[j];
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < p1.radius + p2.radius) {
                collidedPlanets.add(i);
                collidedPlanets.add(j);
                
                // Create fragments at collision point
                const collisionX = (p1.x + p2.x) / 2;
                const collisionY = (p1.y + p2.y) / 2;
                
                // Generate fragments for both planets
                for (let k = 0; k < 5; k++) {
                    fragments.push(createFragment(collisionX, collisionY, p1));
                    fragments.push(createFragment(collisionX, collisionY, p2));
                }
                
                // Penalty for planet collision
                score -= 5000;
                document.getElementById('scoreValue').textContent = score;
                textPopups.push(new TextPopup((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 20, "Planet Collision!", -5000));
            }
        }
    }
    
    // Remove collided planets in reverse order to maintain correct indices
    const collidedIndices = Array.from(collidedPlanets).sort((a, b) => b - a);
    for (const index of collidedIndices) {
        planets.splice(index, 1);
    }
}

function gameLoop() {
    const dt = 0.1; // Time step

    updateLaunchRipples(dt);

    // Update planets
    planets = planets.filter(planet => updatePlanet(planet, dt));
    
    // Update and check asteroid collisions
    updateAsteroids();
    
    // Update fragments
    updateFragments(dt);
    
    // Check for collisions between planets and asteroids
    const collidedAsteroids = new Set();
    const collidedPlanets = new Set();
    
    for (let i = 0; i < planets.length; i++) {
        for (let j = 0; j < asteroids.length; j++) {
            const planet = planets[i];
            const asteroid = asteroids[j];
            
            const dx = asteroid.x - planet.x;
            const dy = asteroid.y - planet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < planet.radius + asteroid.radius) {
                collidedAsteroids.add(j);
                collidedPlanets.add(i);
                
                // Create fragments at collision point
                const collisionX = (planet.x + asteroid.x) / 2;
                const collisionY = (planet.y + asteroid.y) / 2;
                
                // Generate fragments
                for (let k = 0; k < 3; k++) {
                    fragments.push(createFragment(collisionX, collisionY, planet));
                    fragments.push(createFragment(collisionX, collisionY, asteroid));
                }
                
                score -= 2500; // Penalty for asteroid collision
                document.getElementById('scoreValue').textContent = score;
                textPopups.push(new TextPopup(planet.x, planet.y - planet.radius - 20, "Asteroid Hit!", -2500));
            }
        }
    }
    
    // Remove collided planets and asteroids
    const collidedPlanetIndices = Array.from(collidedPlanets).sort((a, b) => b - a);
    for (const index of collidedPlanetIndices) {
        planets.splice(index, 1);
    }
    
    const collidedAsteroidIndices = Array.from(collidedAsteroids).sort((a, b) => b - a);
    for (const index of collidedAsteroidIndices) {
        asteroids.splice(index, 1);
    }
    
    // Check for collisions between planets
    checkPlanetCollisions();
    
    // Draw game
    drawGame();
    drawFragments(); // Draw fragments after everything else
    
    requestAnimationFrame(gameLoop);
}

// Reset game
function resetGame() {
    // Reset game state
    planets = [];
    score = 0;
    orbitsCompleted = 0;
    
    // Update UI
    document.getElementById('scoreValue').textContent = score;
}

// Start game
window.onload = init;