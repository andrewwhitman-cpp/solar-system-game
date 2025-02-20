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

export default TextPopup;