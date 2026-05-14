// utilidades/cooldownsManager.js
const cooldowns = new Map();

module.exports = {
    cooldowns,
    
    check(userId, command) {
        const key = `${command}_${userId}`;
        const lastTime = cooldowns.get(key);
        if (!lastTime) return { available: true, remaining: 0 };
        
        const elapsed = Date.now() - lastTime;
        const cooldownTime = this.getCooldownTime(command);
        
        if (elapsed >= cooldownTime) {
            cooldowns.delete(key);
            return { available: true, remaining: 0 };
        }
        
        return { 
            available: false, 
            remaining: cooldownTime - elapsed,
            formatted: this.formatTime(cooldownTime - elapsed, command)
        };
    },
    
    set(userId, command) {
        const key = `${command}_${userId}`;
        cooldowns.set(key, Date.now());
    },
    
    getCooldownTime(command) {
        const tempos = {
            'missao': 3600000,
            'work': 3600000,
            'search': 600000,
            'procurar': 600000,
            'pirataria': 1800000,
            'roubar': 1800000,
            'daily': 86400000,
            'diario': 86400000,
            'weekly': 604800000,
            'semanal': 604800000,
            'beg': 300000,
            'pedir': 300000,
            'sortudo': 3600000,
            'luck': 3600000,
            'sorte': 3600000
        };
        return tempos[command] || 0;
    },
    
    formatTime(ms, command) {
        const commandConfig = {
            'missao': { divisor: 60000, unidade: 'minuto' },
            'work': { divisor: 60000, unidade: 'minuto' },
            'search': { divisor: 60000, unidade: 'minuto' },
            'procurar': { divisor: 60000, unidade: 'minuto' },
            'pirataria': { divisor: 60000, unidade: 'minuto' },
            'roubar': { divisor: 60000, unidade: 'minuto' },
            'daily': { divisor: 3600000, unidade: 'hora' },
            'diario': { divisor: 3600000, unidade: 'hora' },
            'weekly': { divisor: 86400000, unidade: 'dia' },
            'semanal': { divisor: 86400000, unidade: 'dia' },
            'beg': { divisor: 60000, unidade: 'minuto' },
            'pedir': { divisor: 60000, unidade: 'minuto' },
            'sortudo': { divisor: 60000, unidade: 'minuto' },
            'luck': { divisor: 60000, unidade: 'minuto' },
            'sorte': { divisor: 60000, unidade: 'minuto' }
        };
        
        const config = commandConfig[command] || { divisor: 60000, unidade: 'minuto' };
        const valor = Math.ceil(ms / config.divisor);
        const unidade = valor === 1 ? config.unidade : `${config.unidade}s`;
        
        return `${valor} ${unidade}`;
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