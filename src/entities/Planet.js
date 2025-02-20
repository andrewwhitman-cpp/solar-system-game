class Planet {
    constructor(x, y, vx, vy, properties) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = properties.radius;
        this.color = properties.color;
        this.hasRings = properties.hasRings;
        this.ringColor = properties.ringColor;
        this.surfacePattern = properties.surfacePattern;
        this.mass = properties.mass;
        
        // Orbit tracking
        this.initialAngle = Math.atan2(y - window.innerHeight/2, x - window.innerWidth/2);
        this.lastAngle = this.initialAngle;
        this.totalRotation = 0;
        this.minOrbitRadius = null;
        this.maxOrbitRadius = null;
        this.topSpeed = null;
        this.minSpeed = null;
        this.lastThreadingX = null;
        this.lastThreadingY = null;
    }

    update(dt, sun, planets, asteroids) {
        // Calculate gravitational force from sun
        const gravity = this.calculateGravity(sun);
        
        // Calculate gravitational forces from other planets
        planets.forEach(otherPlanet => {
            if (otherPlanet !== this) {
                const planetGravity = this.calculateGravity(otherPlanet);
                gravity.fx += planetGravity.fx;
                gravity.fy += planetGravity.fy;
            }
        });
        
        // Update velocity
        this.vx += (gravity.fx / this.mass) * dt;
        this.vy += (gravity.fy / this.mass) * dt;
        
        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Check if planet is in stable orbit
        const dx = this.x - sun.x;
        const dy = this.y - sun.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate current speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        // Track min and max orbit radius
        if (!this.maxOrbitRadius || distance > this.maxOrbitRadius) {
            this.maxOrbitRadius = distance;
        }
        if (!this.minOrbitRadius || distance < this.minOrbitRadius) {
            this.minOrbitRadius = distance;
        }
        
        // Track speed extremes
        if (!this.topSpeed || speed > this.topSpeed) {
            this.topSpeed = speed;
        }
        if (!this.minSpeed || speed < this.minSpeed) {
            this.minSpeed = speed;
        }
        
        // Check for sun collision
        if (distance < sun.radius + this.radius) {
            return { collision: 'sun', score: -1000 };
        }
        
        // Track angular position and complete orbits
        const currentAngle = Math.atan2(dy, dx);
        let deltaAngle = currentAngle - this.lastAngle;
        if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
        if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;
        
        this.totalRotation += deltaAngle;
        this.lastAngle = currentAngle;
        
        // Check for complete orbit
        if (Math.abs(this.totalRotation) >= 2 * Math.PI) {
            const avgOrbitRadius = (this.maxOrbitRadius + this.minOrbitRadius) / 2;
            const orbitRadiusScore = Math.floor(avgOrbitRadius ** 2 / 50);
            const orbitRadiusRange = this.maxOrbitRadius - this.minOrbitRadius;
            const radiusRangeThreshold = 100;
            const stabilityMultiplier = Math.min(5, Math.max(1, Math.floor(radiusRangeThreshold / orbitRadiusRange)));
            const orbitBonus = (100 + orbitRadiusScore) * stabilityMultiplier;
            
            this.resetOrbitTracking();
            return { orbitComplete: true, bonus: orbitBonus, stabilityMultiplier };
        }
        
        // Check for asteroid threading
        const threadingResult = this.checkAsteroidThreading(asteroids);
        if (threadingResult) {
            return threadingResult;
        }
        
        return { collision: null };
    }

    calculateGravity(body) {
        const G = 0.2; // Gravitational constant
        const MIN_DISTANCE = 5;
        
        const dx = body.x - this.x;
        const dy = body.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const force = (G * this.mass * body.mass) / Math.max(distance * distance, MIN_DISTANCE);
        
        return {
            fx: force * dx / distance,
            fy: force * dy / distance
        };
    }

    checkAsteroidThreading(asteroids) {
        const THREADING_DISTANCE = 75;
        const MIN_SAFE_DISTANCE = 20;
        const MIN_DISTANCE_FOR_NEW_BONUS = 150;
        
        for (let i = 0; i < asteroids.length; i++) {
            for (let j = i + 1; j < asteroids.length; j++) {
                const ast1 = asteroids[i];
                const ast2 = asteroids[j];
                
                const d1 = Math.sqrt((this.x - ast1.x) ** 2 + (this.y - ast1.y) ** 2);
                const d2 = Math.sqrt((this.x - ast2.x) ** 2 + (this.y - ast2.y) ** 2);
                
                if (d1 < THREADING_DISTANCE && d2 < THREADING_DISTANCE) {
                    const astDist = Math.sqrt((ast1.x - ast2.x) ** 2 + (ast1.y - ast2.y) ** 2);
                    
                    if (Math.abs((d1 + d2) - astDist) < 1 && 
                        d1 > MIN_SAFE_DISTANCE && 
                        d2 > MIN_SAFE_DISTANCE) {
                        
                        let canAwardBonus = true;
                        if (this.lastThreadingX !== null) {
                            const distFromLastBonus = Math.sqrt(
                                (this.x - this.lastThreadingX) ** 2 + 
                                (this.y - this.lastThreadingY) ** 2
                            );
                            canAwardBonus = distFromLastBonus >= MIN_DISTANCE_FOR_NEW_BONUS;
                        }
                        
                        if (canAwardBonus) {
                            const precision = 1 / (Math.log(Math.min(d1, d2) / THREADING_DISTANCE + 1));
                            const bonus = Math.floor(2500 * precision);
                            
                            this.lastThreadingX = this.x;
                            this.lastThreadingY = this.y;
                            
                            return { threading: true, bonus };
                        }
                    }
                }
            }
        }
        return null;
    }

    resetOrbitTracking() {
        this.totalRotation = 0;
        this.minOrbitRadius = null;
        this.maxOrbitRadius = null;
        this.topSpeed = null;
        this.minSpeed = null;
    }

    draw(ctx) {
        // Draw planet body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        // Draw rings if planet has them
        if (this.hasRings) {
            ctx.beginPath();
            ctx.ellipse(
                this.x,
                this.y,
                this.radius * 1.8,
                this.radius * 0.5,
                Math.PI / 4,
                0,
                Math.PI * 2
            );
            ctx.strokeStyle = this.ringColor;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw surface patterns
        if (this.surfacePattern > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.clip();
            
            switch(this.surfacePattern) {
                case 1: // Stripes
                    for (let i = -this.radius; i < this.radius; i += 4) {
                        ctx.beginPath();
                        ctx.moveTo(this.x - this.radius, this.y + i);
                        ctx.lineTo(this.x + this.radius, this.y + i);
                        ctx.strokeStyle = `rgba(0,0,0,0.1)`;
                        ctx.stroke();
                    }
                    break;
                case 2: // Spots
                    for (let i = 0; i < 5; i++) {
                        const spotX = this.x + (Math.random() - 0.5) * this.radius;
                        const spotY = this.y + (Math.random() - 0.5) * this.radius;
                        ctx.beginPath();
                        ctx.arc(spotX, spotY, this.radius * 0.2, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(0,0,0,0.1)`;
                        ctx.fill();
                    }
                    break;
            }
            ctx.restore();
        }
    }
}

export default Planet;