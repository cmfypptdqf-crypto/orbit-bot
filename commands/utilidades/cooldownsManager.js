// commands/utilidades/cooldownsManager.js
const cooldowns = new Map();

module.exports = {
    cooldowns,
    
    check(userId, command) {
        const key = `${command}_${userId}`;
        const lastTime = cooldowns.get(key);
        if (!lastTime) return { available: true, remaining: 0 };
        
        const cooldownTime = this.getCooldownTime(command);
        const elapsed = Date.now() - lastTime;
        
        if (elapsed >= cooldownTime) {
            cooldowns.delete(key);
            return { available: true, remaining: 0 };
        }
        
        const remaining = cooldownTime - elapsed;
        return { 
            available: false, 
            remaining: remaining,
            formatted: this.formatTime(remaining, command)
        };
    },
    
    set(userId, command) {
        const key = `${command}_${userId}`;
        cooldowns.set(key, Date.now());
    },
    
    getCooldownTime(command) {
        const tempos = {
            'missao': 3600000, 'work': 3600000,
            'search': 600000, 'pirataria': 1800000, 'roubar': 1800000,
            'daily': 86400000, 'diario': 86400000,
            'weekly': 604800000, 'semanal': 604800000,
            'beg': 300000, 'sortudo': 3600000
        };
        return tempos[command] || 0;
    },
    
    formatTime(ms, command) {
        const minutos = Math.ceil(ms / 60000);
        const horas = Math.ceil(ms / 3600000);
        const dias = Math.ceil(ms / 86400000);
        
        if (command === 'daily' || command === 'diario') return `${horas} horas`;
        if (command === 'weekly' || command === 'semanal') return `${dias} dias`;
        if (minutos < 60) return `${minutos} minutos`;
        if (horas < 24) return `${horas} horas`;
        return `${dias} dias`;
    },
    
    getAll(userId) {
        const comandos = ['missao', 'search', 'pirataria', 'daily', 'weekly', 'beg', 'sortudo'];
        const resultados = [];
        for (const cmd of comandos) {
            const result = this.check(userId, cmd);
            resultados.push({
                comando: cmd,
                ...result,
                formatted: result.available ? '✅ Disponível' : `⏰ ${this.formatTime(result.remaining, cmd)}`
            });
        }
        return resultados;
    }
};