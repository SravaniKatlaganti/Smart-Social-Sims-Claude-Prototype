// pathfinding.js - A* pathfinding helper

export class AStar {
    constructor(world) {
        this.world = world;
    }
    
    findPath(start, goal) {
        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        const key = (pos) => `${pos.x},${pos.y}`;
        
        gScore.set(key(start), 0);
        fScore.set(key(start), this.heuristic(start, goal));
        
        while (openSet.length > 0) {
            // Get node with lowest fScore
            openSet.sort((a, b) => {
                const fA = fScore.get(key(a)) || Infinity;
                const fB = fScore.get(key(b)) || Infinity;
                return fA - fB;
            });
            
            const current = openSet.shift();
            
            // Check if we reached the goal
            if (current.x === goal.x && current.y === goal.y) {
                return this.reconstructPath(cameFrom, current);
            }
            
            // Check neighbors
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                const tentativeGScore = gScore.get(key(current)) + 1;
                
                if (tentativeGScore < (gScore.get(key(neighbor)) || Infinity)) {
                    // This path is better
                    cameFrom.set(key(neighbor), current);
                    gScore.set(key(neighbor), tentativeGScore);
                    fScore.set(key(neighbor), tentativeGScore + this.heuristic(neighbor, goal));
                    
                    // Add to open set if not already there
                    if (!openSet.some(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        
        // No path found
        return [];
    }
    
    getNeighbors(pos) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // up
            { x: 1, y: 0 },  // right
            { x: 0, y: 1 },  // down
            { x: -1, y: 0 }  // left
        ];
        
        for (const dir of directions) {
            const newX = pos.x + dir.x;
            const newY = pos.y + dir.y;
            
            if (this.world.isWalkable(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }
        
        return neighbors;
    }
    
    heuristic(pos1, pos2) {
        // Manhattan distance
        return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
    }
    
    reconstructPath(cameFrom, current) {
        const path = [current];
        const key = (pos) => `${pos.x},${pos.y}`;
        
        while (cameFrom.has(key(current))) {
            current = cameFrom.get(key(current));
            path.unshift(current);
        }
        
        // Remove starting position
        path.shift();
        
        return path;
    }
}

// Priority Queue implementation for more efficient pathfinding
export class PriorityQueue {
    constructor() {
        this.elements = [];
    }
    
    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }
    
    dequeue() {
        return this.elements.shift()?.element;
    }
    
    isEmpty() {
        return this.elements.length === 0;
    }
    
    contains(element, equalsFn) {
        return this.elements.some(item => equalsFn(item.element, element));
    }
}
