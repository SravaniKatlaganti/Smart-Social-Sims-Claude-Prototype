// main.js - Bootstrap game and imports

import { World } from './world.js';
import { Agent } from './agent.js';
import { ActivityLogger } from './memory.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.world = null;
        this.agents = [];
        this.selectedAgent = null;
        this.running = false;
        this.speed = 1;
        this.lastUpdate = 0;
        this.logger = new ActivityLogger();
        
        this.init();
    }
    
    init() {
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize world
        this.world = new World(40, 30, 20); // 40x30 grid, 20px tile size
        
        // Create agents
        this.createAgents();
        
        // Setup controls
        this.setupControls();
        
        // Start game loop
        this.gameLoop();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    createAgents() {
        const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE'];
        
        names.forEach((name, i) => {
            const agent = new Agent(
                name,
                10 + i * 5,
                15,
                colors[i],
                this.world
            );
            this.agents.push(agent);
            this.logger.log(`${name} joined the world`);
        });
    }
    
    setupControls() {
        // Play/Pause button
        const playPauseBtn = document.getElementById('play-pause-btn');
        playPauseBtn.addEventListener('click', () => {
            this.running = !this.running;
            playPauseBtn.textContent = this.running ? 'Pause' : 'Play';
            this.logger.log(this.running ? 'Simulation started' : 'Simulation paused');
        });
        
        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.reset();
        });
        
        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        const speedDisplay = document.getElementById('speed-display');
        speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            speedDisplay.textContent = `${this.speed}x`;
        });
        
        // Canvas click
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.world.tileSize);
            const y = Math.floor((e.clientY - rect.top) / this.world.tileSize);
            this.handleClick(x, y);
        });
    }
    
    handleClick(x, y) {
        // Check if clicked on an agent
        for (const agent of this.agents) {
            if (agent.x === x && agent.y === y) {
                this.selectedAgent = agent;
                this.updateAgentInfo();
                return;
            }
        }
        this.selectedAgent = null;
        this.updateAgentInfo();
    }
    
    updateAgentInfo() {
        const detailsDiv = document.getElementById('agent-details');
        
        if (!this.selectedAgent) {
            detailsDiv.innerHTML = 'Click on an agent to see details';
            return;
        }
        
        const agent = this.selectedAgent;
        let html = `
            <h3 style="color: ${agent.color}">${agent.name}</h3>
            <p><strong>Location:</strong> (${agent.x}, ${agent.y})</p>
            <p><strong>Activity:</strong> ${agent.currentActivity}</p>
            <p><strong>Traits:</strong> ${agent.traits.map(t => `<span class="trait">${t}</span>`).join('')}</p>
            
            <h4>Needs</h4>
        `;
        
        // Add need bars
        for (const [need, value] of Object.entries(agent.needs)) {
            const level = value < 30 ? 'low' : value < 70 ? 'medium' : 'high';
            html += `
                <div class="need-bar">
                    <div class="need-label">
                        <span>${need.charAt(0).toUpperCase() + need.slice(1)}</span>
                        <span>${Math.round(value)}%</span>
                    </div>
                    <div class="need-bar-bg">
                        <div class="need-bar-fill ${level}" style="width: ${value}%"></div>
                    </div>
                </div>
            `;
        }
        
        // Add relationships
        html += '<h4>Relationships</h4>';
        for (const [name, value] of Object.entries(agent.relationships)) {
            html += `
                <div class="relationship">
                    <span>${name}</span>
                    <span>${Math.round(value)}/100</span>
                </div>
            `;
        }
        
        // Add recent memories
        html += '<h4>Recent Memories</h4>';
        const recentMemories = agent.memory.getRecent(3);
        recentMemories.forEach(mem => {
            html += `<div class="memory-item">${mem.description}</div>`;
        });
        
        detailsDiv.innerHTML = html;
    }
    
    update(deltaTime) {
        if (!this.running) return;
        
        const adjustedDelta = deltaTime * this.speed;
        
        // Update all agents
        this.agents.forEach(agent => {
            agent.update(adjustedDelta, this.agents);
        });
        
        // Update selected agent info
        if (this.selectedAgent) {
            this.updateAgentInfo();
        }
        
        // Update activity log
        this.updateActivityLog();
    }
    
    updateActivityLog() {
        const logDiv = document.getElementById('log-entries');
        const entries = this.logger.getRecent(10);
        
        logDiv.innerHTML = entries.map(entry => 
            `<div class="log-entry">[${entry.time}] ${entry.message}</div>`
        ).join('');
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw world
        this.world.draw(this.ctx);
        
        // Draw agents
        this.agents.forEach(agent => {
            agent.draw(this.ctx, this.world.tileSize);
        });
        
        // Highlight selected agent
        if (this.selectedAgent) {
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(
                this.selectedAgent.x * this.world.tileSize,
                this.selectedAgent.y * this.world.tileSize,
                this.world.tileSize,
                this.world.tileSize
            );
        }
    }
    
    gameLoop(timestamp = 0) {
        const deltaTime = timestamp - this.lastUpdate;
        this.lastUpdate = timestamp;
        
        this.update(deltaTime / 1000); // Convert to seconds
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    reset() {
        this.running = false;
        this.selectedAgent = null;
        this.agents = [];
        this.logger.clear();
        this.createAgents();
        document.getElementById('play-pause-btn').textContent = 'Play';
        this.updateAgentInfo();
        this.logger.log('World reset');
    }
}

// Start game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
