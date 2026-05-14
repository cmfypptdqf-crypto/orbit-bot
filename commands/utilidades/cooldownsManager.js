// utils/cooldownsManager.js
const cooldowns = new Map();

module.exports = {
    cooldowns,
    
    // Verificar se está em cooldown
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
    
    // Registrar uso do comando
    set(userId, command) {
        const key = `${command}_${userId}`;
        cooldowns.set(key, Date.now());
    },
    
    // Tempo de cooldown de cada comando (em ms)
    getCooldownTime(command) {
        const tempos = {
            'missao': 3600000,      // 1 hora
            'work': 3600000,        // 1 hora
            'search': 600000,       // 10 minutos
            'procurar': 600000,     // 10 minutos
            'pirataria': 1800000,   // 30 minutos
            'roubar': 1800000,      // 30 minutos
            'daily': 86400000,      // 24 horas
            'diario': 86400000,     // 24 horas
            'weekly': 604800000,    // 7 dias
            'semanal': 604800000,   // 7 dias
            'beg': 300000,          // 5 minutos
            'pedir': 300000,        // 5 minutos
            'sortudo': 3600000,     // 1 hora
            'luck': 3600000,        // 1 hora
            'sorte': 3600000        // 1 hora
        };
        return tempos[command] || 0;
    },
    
    // Formatar tempo restante
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
    
    // Obter todos os cooldowns de um usuário
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