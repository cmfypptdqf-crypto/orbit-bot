// utilidades/galaxiaBonus.js
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, clans: {}, galaxias: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Lista de galáxias com bônus
const galaxias = {
    'via_lactea': { bonus: { carteira: 1.05, missoes: 1.05, ataque: 1.03 }, nome: '🌌 Via Láctea' },
    'andromeda': { bonus: { carteira: 1.10, missoes: 1.08, ataque: 1.05 }, nome: '🌀 Andrômeda' },
    'triangulo': { bonus: { carteira: 1.08, missoes: 1.10, ataque: 1.07 }, nome: '🔺 Galáxia do Triângulo' },
    'olho_negro': { bonus: { carteira: 1.12, missoes: 1.12, ataque: 1.10 }, nome: '👁️ Olho Negro' },
    'sombreiro': { bonus: { carteira: 1.15, missoes: 1.15, ataque: 1.12 }, nome: '🎩 Galáxia do Sombreiro' },
    'centaurus': { bonus: { carteira: 1.20, missoes: 1.18, ataque: 1.15 }, nome: '⚡ Centaurus A' },
    'rosquinha': { bonus: { carteira: 1.25, missoes: 1.22, ataque: 1.20 }, nome: '🍩 Galáxia do Anel' }
};

// Sistema de cooldown (em memória, reinicia quando o bot reinicia)
const cooldowns = new Map();

// Verificar cooldown
function checkCooldown(userId, comando) {
    const key = `${comando}_${userId}`;
    const lastUsed = cooldowns.get(key);
    if (!lastUsed) return { available: true, remaining: 0 };
    
    const cooldownTime = getCooldownTime(comando);
    const elapsed = Date.now() - lastUsed;
    
    if (elapsed >= cooldownTime) {
        cooldowns.delete(key);
        return { available: true, remaining: 0 };
    }
    
    const remaining = cooldownTime - elapsed;
    return { available: false, remaining, formatted: formatTime(remaining) };
}

// Registrar uso do comando
function setCooldown(userId, comando) {
    const key = `${comando}_${userId}`;
    cooldowns.set(key, Date.now());
}

// Tempo de cooldown por comando (em ms)
function getCooldownTime(comando) {
    const tempos = {
        'missao': 3600000,      // 1 hora
        'pirataria': 1800000,   // 30 minutos
        'roubar': 1800000,      // 30 minutos
        'daily': 86400000,      // 24 horas
        'semanal': 604800000,   // 7 dias
        'beg': 300000,          // 5 minutos
        'search': 600000,       // 10 minutos
        'sortudo': 3600000      // 1 hora
    };
    return tempos[comando] || 0;
}

// Formatar tempo restante
function formatTime(ms) {
    const minutos = Math.ceil(ms / 60000);
    const horas = Math.ceil(ms / 3600000);
    const dias = Math.ceil(ms / 86400000);
    
    if (dias > 1) return `${dias} dias`;
    if (horas > 1) return `${horas} horas`;
    return `${minutos} minutos`;
}

// Função principal: pegar bônus do usuário (clã + galáxia)
function getBonusDoUsuario(userId, tipo) {
    const db = getDB();
    let bonus = 1.0;
    let origem = null;
    
    const userData = db.usuarios[userId];
    if (userData && userData.clan) {
        const clan = db.clans[userData.clan];
        if (clan && clan.galaxiaAtual) {
            const galaxia = galaxias[clan.galaxiaAtual];
            if (galaxia) {
                if (tipo === 'carteira') bonus *= galaxia.bonus.carteira;
                else if (tipo === 'missoes') bonus *= galaxia.bonus.missoes;
                else if (tipo === 'ataque') bonus *= galaxia.bonus.ataque;
                origem = galaxia.nome;
            }
        }
    }
    
    return { bonus, origem, texto: origem ? ` (+${Math.round((bonus - 1) * 100)}% do clã ${origem})` : '' };
}

// Verificar se usuário tem VIP
function getVIPBonus(userId) {
    const db = getDB();
    if (db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
        return db.vip_list[userId].multiplicador || 1.5;
    }
    return 1.0;
}

// Calcular bônus total (VIP + Clã/Galáxia)
function calcularBonusTotal(userId, tipo) {
    const vipBonus = getVIPBonus(userId);
    const clanBonus = getBonusDoUsuario(userId, tipo);
    const bonusTotal = vipBonus * clanBonus.bonus;
    
    return {
        bonus: bonusTotal,
        vipBonus: vipBonus,
        clanBonus: clanBonus.bonus,
        texto: `VIP: ${vipBonus}x | Clã: ${clanBonus.texto || 'sem bônus'} | Total: ${bonusTotal.toFixed(2)}x`
    };
}

module.exports = { 
    getBonusDoUsuario, 
    getVIPBonus, 
    calcularBonusTotal, 
    galaxias,
    checkCooldown,
    setCooldown,
    formatTime
};