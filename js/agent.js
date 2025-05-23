// agent.js - Player + NPC classes

import { AStar } from './pathfinding.js';
import { Memory } from './memory.js';

const TRAITS = ['Friendly', 'Shy', 'Outgoing', 'Creative', 'Logical', 'Athletic'];
const ACTIVITIES = ['Idle', 'Walking', 'Chatting', 'Working', 'Relaxing', 'Exercising'];

export class Agent {
    constructor(name, x, y, color, world) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.color = color;
        this.world = world;
        
        // Traits
        this.traits = this.generateTraits();
        
        // Needs (0-100)
        this.needs = {
            social: 70 + Math.random() * 30,
            energy: 70 + Math.random() * 30,
            fun: 70 + Math.random() * 30,
            hunger: 70 + Math.random() * 30
        };
        
        // Relationships
        this.relationships = {};
        
        // State
        this.currentActivity = 'Idle';
        this.path = [];
        this.targetLocation = null;
        this.interactionPartner = null;
        this.activityTimer = 0;
        
        // Memory
        this.memory = new Memory();
        
        // Pathfinding
        this.pathfinder = new AStar(world);
    }
    
    generateTraits() {
        const numTraits = 2 + Math.floor(Math.random() * 2);
        const traits = [];
        
        while (traits.length < numTraits) {
            const trait = TRAITS[Math.floor(Math.random() * TRAITS.length)];
            if (!traits.includes(trait)) {
                traits.push(trait);
            }
        }
        
        return traits;
    }
    
    update(deltaTime, allAgents) {
        // Update needs
        this.updateNeeds(deltaTime);
        
        // Update activity timer
        this.activityTimer -= deltaTime;
        
        // Make decisions
        if (this.activityTimer <= 0) {
            this.makeDecision(allAgents);
        }
        
        // Execute current activity
        this.executeActivity(deltaTime, allAgents);
        
        // Move along path
        this.moveAlongPath();
    }
    
    updateNeeds(deltaTime) {
        // Decay rates based on activity
        const decayRates = {
            social: 0.1,
            energy: 0.08,
            fun: 0.12,
            hunger: 0.15
        };
        
        // Modify decay based on activity
        if (this.currentActivity === 'Chatting') {
            decayRates.social *= 0.1; // Slower social decay when chatting
        } else if (this.currentActivity === 'Relaxing') {
            decayRates.energy *= 0.2; // Slower energy decay when relaxing
        }
        
        // Apply decay
        for (const [need, rate] of Object.entries(decayRates)) {
            this.needs[need] = Math.max(0, this.needs[need] - rate * deltaTime);
        }
    }
    
    makeDecision(allAgents) {
        // Find most pressing need
        let lowestNeed = null;
        let lowestValue = 100;
        
        for (const [need, value] of Object.entries(this.needs)) {
            if (value < lowestValue) {
                lowestNeed = need;
                lowestValue = value;
            }
        }
        
        // Make decision based on need and traits
        if (lowestValue < 30) {
            this.decideCriticalNeed(lowestNeed, allAgents);
        } else {
            this.decideNormalActivity(allAgents);
        }
    }
    
    decideCriticalNeed(need, allAgents) {
        switch (need) {
            case 'social':
                if (this.traits.includes('Shy')) {
                    this.goToLocation('Library');
                } else {
                    this.goToLocation('Café');
                    this.findInteractionPartner(allAgents);
                }
                break;
            case 'energy':
                this.goToLocation('Home');
                this.currentActivity = 'Relaxing';
                break;
            case 'fun':
                if (this.traits.includes('Athletic')) {
                    this.goToLocation('Gym');
                    this.currentActivity = 'Exercising';
                } else {
                    this.goToLocation('Park');
                    this.currentActivity = 'Relaxing';
                }
                break;
            case 'hunger':
                this.goToLocation('Café');
                break;
        }
        
        this.activityTimer = 5 + Math.random() * 5;
    }
    
    decideNormalActivity(allAgents) {
        // Trait-based decisions
        if (this.traits.includes('Outgoing') && Math.random() < 0.6) {
            this.findInteractionPartner(allAgents);
        } else if (this.traits.includes('Creative') && Math.random() < 0.4) {
            this.goToLocation('Park');
        } else if (this.traits.includes('Logical') && Math.random() < 0.4) {
            this.goToLocation('Library');
        } else {
            // Random activity
            const locations = ['Home', 'Park', 'Café', 'Work', 'Gym', 'Library'];
            this.goToLocation(locations[Math.floor(Math.random() * locations.length)]);
        }
        
        this.activityTimer = 3 + Math.random() * 7;
    }
    
    goToLocation(locationName) {
        const location = this.world.locations.get(locationName);
        if (location) {
            this.targetLocation = locationName;
            this.path = this.pathfinder.findPath(
                { x: this.x, y: this.y },
                { x: location.x, y: location.y }
            );
            this.currentActivity = 'Walking';
            
            // Remember intent
            this.memory.remember({
                type: 'intent',
                description: `Decided to go to ${locationName}`,
                location: locationName,
                time: Date.now()
            });
        }
    }
    
    findInteractionPartner(allAgents) {
        const nearbyAgents = allAgents.filter(agent => {
            if (agent === this) return false;
            const dist = Math.abs(agent.x - this.x) + Math.abs(agent.y - this.y);
            return dist < 10;
        });
        
        if (nearbyAgents.length > 0) {
            // Choose based on relationship
            nearbyAgents.sort((a, b) => {
                const relA = this.relationships[a.name] || 50;
                const relB = this.relationships[b.name] || 50;
                return relB - relA;
            });
            
            this.interactionPartner = nearbyAgents[0];
            this.currentActivity = 'Chatting';
            
            // Move towards partner
            this.path = this.pathfinder.findPath(
                { x: this.x, y: this.y },
                { x: this.interactionPartner.x, y: this.interactionPartner.y }
            );
        }
    }
    
    executeActivity(deltaTime, allAgents) {
        switch (this.currentActivity) {
            case 'Chatting':
                if (this.interactionPartner) {
                    const dist = Math.abs(this.interactionPartner.x - this.x) + 
                                Math.abs(this.interactionPartner.y - this.y);
                    
                    if (dist <= 2) {
                        // Chat and improve relationship
                        this.needs.social = Math.min(100, this.needs.social + 10 * deltaTime);
                        
                        // Update relationship
                        const currentRel = this.relationships[this.interactionPartner.name] || 50;
                        this.relationships[this.interactionPartner.name] = 
                            Math.min(100, currentRel + 2 * deltaTime);
                        
                        // Memory of interaction
                        if (Math.random() < 0.01) {
                            this.memory.remember({
                                type: 'interaction',
                                description: `Had a nice chat with ${this.interactionPartner.name}`,
                                person: this.interactionPartner.name,
                                time: Date.now()
                            });
                        }
                    } else {
                        // Partner moved away
                        this.interactionPartner = null;
                        this.currentActivity = 'Idle';
                    }
                }
                break;
                
            case 'Relaxing':
                this.needs.energy = Math.min(100, this.needs.energy + 15 * deltaTime);
                this.needs.fun = Math.min(100, this.needs.fun + 5 * deltaTime);
                break;
                
            case 'Exercising':
                this.needs.fun = Math.min(100, this.needs.fun + 20 * deltaTime);
                this.needs.energy = Math.max(0, this.needs.energy - 5 * deltaTime);
                break;
                
            case 'Working':
                this.needs.fun = Math.max(0, this.needs.fun - 10 * deltaTime);
                break;
        }
    }
    
    moveAlongPath() {
        if (this.path.length === 0) return;
        
        const next = this.path[0];
        
        // Check if position is occupied by another agent
        const occupied = false; // Simplified - in real implementation check other agents
        
        if (!occupied) {
            this.x = next.x;
            this.y = next.y;
            this.path.shift();
            
            // Check if reached destination
            if (this.path.length === 0) {
                const location = this.world.getLocationAt(this.x, this.y);
                if (location) {
                    this.memory.remember({
                        type: 'location',
                        description: `Arrived at ${location}`,
                        location: location,
                        time: Date.now()
                    });
                    
                    // Set appropriate activity for location
                    this.setActivityForLocation(location);
                }
            }
        }
    }
    
    setActivityForLocation(location) {
        switch (location) {
            case 'Home':
                this.currentActivity = 'Relaxing';
                break;
            case 'Work':
                this.currentActivity = 'Working';
                break;
            case 'Gym':
                this.currentActivity = 'Exercising';
                break;
            case 'Park':
            case 'Café':
            case 'Library':
                this.currentActivity = 'Relaxing';
                break;
            default:
                this.currentActivity = 'Idle';
        }
    }
    
    draw(ctx, tileSize) {
        // Draw agent circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(
            this.x * tileSize + tileSize / 2,
            this.y * tileSize + tileSize / 2,
            tileSize / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw name
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(
            this.name,
            this.x * tileSize + tileSize / 2,
            this.y * tileSize
        );
        
        // Draw activity indicator
        if (this.currentActivity !== 'Idle') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(
                this.currentActivity,
                this.x * tileSize + tileSize / 2,
                this.y * tileSize + tileSize + 2
            );
        }
    }
}
