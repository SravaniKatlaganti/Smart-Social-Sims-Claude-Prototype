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
