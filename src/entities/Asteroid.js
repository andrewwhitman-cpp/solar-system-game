class Asteroid {
    constructor(canvasWidth, canvasHeight) {
        const ASTEROID_SIZE = { min: 5, max: 10 };
        const ASTEROID_SPEED = 1;

        // Determine spawn location (0: top, 1: right, 2: bottom, 3: left)
        const side = Math.floor(Math.random() * 4);
        
        switch(side) {
            case 0: // top
                this.x = Math.random() * canvasWidth;
                this.y = -ASTEROID_SIZE.max;
                this.vx = (Math.random() - 0.5) * ASTEROID_SPEED;
                this.vy = Math.random() * ASTEROID_SPEED;
                break;
            case 1: // right
                this.x = canvasWidth + ASTEROID_SIZE.max;
                this.y = Math.random() * canvasHeight;
                this.vx = -Math.random() * ASTEROID_SPEED;
                this.vy = (Math.random() - 0.5) * ASTEROID_SPEED;
                break;
            case 2: // bottom
                this.x = Math.random() * canvasWidth;
                this.y = canvasHeight + ASTEROID_SIZE.max;
                this.vx = (Math.random() - 0.5) * ASTEROID_SPEED;
                this.vy = -Math.random() * ASTEROID_SPEED;
                break;
            case 3: // left
                this.x = -ASTEROID_SIZE.max;
                this.y = Math.random() * canvasHeight;
                this.vx = Math.random() * ASTEROID_SPEED;
                this.vy = (Math.random() - 0.5) * ASTEROID_SPEED;
                break;
        }
        
        this.radius = ASTEROID_SIZE.min + Math.random() * (ASTEROID_SIZE.max - ASTEROID_SIZE.min);
        this.mass = 50; // Fixed mass for asteroids
        this.color = '#808080';
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        
        // Generate irregular polygon vertices
        this.vertices = [];
        const vertexCount = Math.floor(Math.random() * 4) + 6; // 6-9 vertices
        for (let i = 0; i < vertexCount; i++) {
            const angle = (i / vertexCount) * Math.PI * 2;
            const variance = 0.5 + Math.random() * 0.5; // 50-100% of radius
            this.vertices.push({
                x: Math.cos(angle) * this.radius * variance,
                y: Math.sin(angle) * this.radius * variance
            });
        }
    }

    update(centerX, centerY) {
        // Calculate distance from center of screen
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Fixed distance of 300 units from the sun
        const targetDistance = 300;
        
        // Adjust position to maintain circular path
        const angle = Math.atan2(dy, dx);
        this.x = centerX + Math.cos(angle) * targetDistance;
        this.y = centerY + Math.sin(angle) * targetDistance;
        
        // Update velocity for circular motion
        const speed = 1; // ASTEROID_SPEED
        this.vx = -Math.sin(angle) * speed;
        this.vy = Math.cos(angle) * speed;
        
        // Move along the circular path
        this.x += this.vx;
        this.y += this.vy;

        // Update rotation
        this.rotation += this.rotationSpeed;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

export default Asteroid;