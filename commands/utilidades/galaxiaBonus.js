// commands/utilidades/galaxiaBonus.js
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, clans: {}, vip_list: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

const cooldowns = new Map();
function checkCooldown(userId, comando) { /* implementado no cooldownsManager */ }
function setCooldown(userId, comando) { /* implementado no cooldownsManager */ }

const galaxias = {
    'via_lactea': { bonus: { carteira: 1.05, missoes: 1.05, ataque: 1.03 }, nome: '🌌 Via Láctea' },
    'andromeda': { bonus: { carteira: 1.10, missoes: 1.08, ataque: 1.05 }, nome: '🌀 Andrômeda' },
    'triangulo': { bonus: { carteira: 1.08, missoes: 1.10, ataque: 1.07 }, nome: '🔺 Triângulo' },
    'olho_negro': { bonus: { carteira: 1.12, missoes: 1.12, ataque: 1.10 }, nome: '👁️ Olho Negro' },
    'sombreiro': { bonus: { carteira: 1.15, missoes: 1.15, ataque: 1.12 }, nome: '🎩 Sombreiro' },
    'centaurus': { bonus: { carteira: 1.20, missoes: 1.18, ataque: 1.15 }, nome: '⚡ Centaurus A' },
    'rosquinha': { bonus: { carteira: 1.25, missoes: 1.22, ataque: 1.20 }, nome: '🍩 Galáxia do Anel' }
};

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

function getVIPBonus(userId) {
    const db = getDB();
    if (db.vip_list && db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
        return db.vip_list[userId].multiplicador || 1.5;
    }
    return 1.0;
}

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

module.exports = { getBonusDoUsuario, getVIPBonus, calcularBonusTotal, galaxias, checkCooldown, setCooldown };
