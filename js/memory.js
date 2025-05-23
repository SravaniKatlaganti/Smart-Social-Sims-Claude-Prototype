// memory.js - Simple memory store

export class Memory {
    constructor(maxSize = 50) {
        this.memories = [];
        this.maxSize = maxSize;
    }
    
    remember(memory) {
        this.memories.unshift(memory);
        
        // Limit memory size
        if (this.memories.length > this.maxSize) {
            this.memories.pop();
        }
    }
    
    getRecent(count) {
        return this.memories.slice(0, count);
    }
    
    findMemories(type) {
        return this.memories.filter(m => m.type === type);
    }
    
    findMemoriesAbout(subject) {
        return this.memories.filter(m => 
            m.person === subject || 
            m.location === subject ||
            m.description.includes(subject)
        );
    }
    
    forget(olderThan) {
        const cutoff = Date.now() - olderThan;
        this.memories = this.memories.filter(m => m.time > cutoff);
    }
    
    clear() {
        this.memories = [];
    }
}

export class ActivityLogger {
    constructor() {
        this.logs = [];
    }
    
    log(message) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        this.logs.unshift({
            time: timeStr,
            message: message,
            timestamp: now.getTime()
        });
        
        // Keep only last 100 logs
        if (this.logs.length > 100) {
            this.logs.pop();
        }
    }
    
    getRecent(count) {
        return this.logs.slice(0, count);
    }
    
    clear() {
        this.logs = [];
    }
}
