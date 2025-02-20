// Constants for star types and their properties
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

class Sun {
    constructor(x, y) {
        const starTypes = Object.keys(STAR_TYPES);
        const randomType = starTypes[Math.floor(Math.random() * starTypes.length)];
        const starProperties = STAR_TYPES[randomType];

        this.x = x;
        this.y = y;
        this.mass = starProperties.mass;
        this.radius = starProperties.radius;
        this.color = starProperties.color;
        this.type = randomType;
        this.name = starProperties.name;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

export { Sun, STAR_TYPES };