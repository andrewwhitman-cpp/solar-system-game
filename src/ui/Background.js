class Background {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.stars = [];
        this.nebulaClouds = [];
        this.STAR_COUNT = 200;
        this.NEBULA_COUNT = 5;
        
        this.initializeBackground();
    }

    initializeBackground() {
        // Create stars
        for (let i = 0; i < this.STAR_COUNT; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 1.5,
                twinkleSpeed: 0.02 + Math.random() * 0.05,
                twinkleOffset: Math.random() * Math.PI * 2,
                brightness: 0.5 + Math.random() * 0.5
            });
        }
        
        // Create nebula clouds
        for (let i = 0; i < this.NEBULA_COUNT; i++) {
            this.nebulaClouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: 100 + Math.random() * 200,
                color: `hsla(${Math.random() * 360}, 70%, 50%, 0.1)`,
                drift: { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.2 }
            });
        }
    }

    draw(time) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw nebula clouds
        this.nebulaClouds.forEach(cloud => {
            const gradient = this.ctx.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, cloud.radius
            );
            gradient.addColorStop(0, cloud.color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Move clouds slowly
            cloud.x += cloud.drift.x;
            cloud.y += cloud.drift.y;
            
            // Wrap around edges
            if (cloud.x < -cloud.radius) cloud.x = this.canvas.width + cloud.radius;
            if (cloud.x > this.canvas.width + cloud.radius) cloud.x = -cloud.radius;
            if (cloud.y < -cloud.radius) cloud.y = this.canvas.height + cloud.radius;
            if (cloud.y > this.canvas.height + cloud.radius) cloud.y = -cloud.radius;
        });
        
        // Draw stars with twinkling effect
        this.stars.forEach(star => {
            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.initializeBackground();
    }
}

export default Background;