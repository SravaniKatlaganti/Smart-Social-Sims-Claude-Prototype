// world.js - Grid & drawing

export const TILE_TYPES = {
    GRASS: { id: 0, color: '#4CAF50' },
    PATH: { id: 1, color: '#8D6E63' },
    WATER: { id: 2, color: '#2196F3' },
    BUILDING: { id: 3, color: '#9E9E9E' }
};

export const LOCATIONS = {
    HOME: { name: 'Home', symbol: '🏠', type: TILE_TYPES.BUILDING },
    PARK: { name: 'Park', symbol: '🌳', type: TILE_TYPES.GRASS },
    CAFE: { name: 'Café', symbol: '☕', type: TILE_TYPES.BUILDING },
    WORK: { name: 'Work', symbol: '🏢', type: TILE_TYPES.BUILDING },
    GYM: { name: 'Gym', symbol: '💪', type: TILE_TYPES.BUILDING },
    LIBRARY: { name: 'Library', symbol: '📚', type: TILE_TYPES.BUILDING }
};

export class World {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.grid = [];
        this.locations = new Map();
        
        this.generateWorld();
    }
    
    generateWorld() {
        // Initialize grid with grass
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = TILE_TYPES.GRASS.id;
            }
        }
        
        // Add paths
        this.createPaths();
        
        // Add water features
        this.createWater();
        
        // Place buildings/locations
        this.placeLocations();
    }
    
    createPaths() {
        // Main horizontal path
        for (let x = 0; x < this.width; x++) {
            this.grid[15][x] = TILE_TYPES.PATH.id;
        }
        
        // Main vertical path
        for (let y = 0; y < this.height; y++) {
            this.grid[y][20] = TILE_TYPES.PATH.id;
        }
        
        // Secondary paths
        for (let x = 5; x < 35; x++) {
            this.grid[8][x] = TILE_TYPES.PATH.id;
            this.grid[22][x] = TILE_TYPES.PATH.id;
        }
        
        for (let y = 5; y < 25; y++) {
            this.grid[y][10] = TILE_TYPES.PATH.id;
            this.grid[y][30] = TILE_TYPES.PATH.id;
        }
    }
    
    createWater() {
        // Small pond
        for (let y = 3; y < 6; y++) {
            for (let x = 25; x < 30; x++) {
                this.grid[y][x] = TILE_TYPES.WATER.id;
            }
        }
        
        // River
        for (let y = 0; y < this.height; y++) {
            if (x = 35 + Math.sin(y * 0.3) * 2 | 0, x < this.width) {
                this.grid[y][x] = TILE_TYPES.WATER.id;
            }
        }
    }
    
    placeLocations() {
        const locationData = [
            { loc: LOCATIONS.HOME, x: 5, y: 5 },
            { loc: LOCATIONS.WORK, x: 15, y: 5 },
            { loc: LOCATIONS.PARK, x: 25, y: 10 },
            { loc: LOCATIONS.CAFE, x: 5, y: 20 },
            { loc: LOCATIONS.GYM, x: 15, y: 20 },
            { loc: LOCATIONS.LIBRARY, x: 25, y: 20 }
        ];
        
        locationData.forEach(({ loc, x, y }) => {
            // Place 3x3 building
            for (let dy = 0; dy < 3; dy++) {
                for (let dx = 0; dx < 3; dx++) {
                    if (y + dy < this.height && x + dx < this.width) {
                        this.grid[y + dy][x + dx] = loc.type.id;
                    }
                }
            }
            
            // Store location center
            this.locations.set(loc.name, { x: x + 1, y: y + 1, ...loc });
        });
    }
    
    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return null;
        }
        return this.grid[y][x];
    }
    
    isWalkable(x, y) {
        const tile = this.getTile(x, y);
        return tile !== null && tile !== TILE_TYPES.WATER.id;
    }
    
    getLocationAt(x, y) {
        for (const [name, loc] of this.locations) {
            if (Math.abs(loc.x - x) <= 1 && Math.abs(loc.y - y) <= 1) {
                return name;
            }
        }
        return null;
    }
    
    draw(ctx) {
        // Draw tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileId = this.grid[y][x];
                const tile = Object.values(TILE_TYPES).find(t => t.id === tileId);
                
                ctx.fillStyle = tile.color;
                ctx.fillRect(
                    x * this.tileSize,
                    y * this.tileSize,
                    this.tileSize,
                    this.tileSize
                );
            }
        }
        
        // Draw grid lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.tileSize, 0);
            ctx.lineTo(x * this.tileSize, this.height * this.tileSize);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.tileSize);
            ctx.lineTo(this.width * this.tileSize, y * this.tileSize);
            ctx.stroke();
        }
        
        // Draw location symbols
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (const [name, loc] of this.locations) {
            ctx.fillStyle = 'white';
            ctx.fillText(
                loc.symbol,
                loc.x * this.tileSize + this.tileSize / 2,
                loc.y * this.tileSize + this.tileSize / 2
            );
        }
    }
}
