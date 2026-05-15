
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function adicionarXP(userId, quantidade, source = 'desconhecido') {
    const db = getDB();
    
    if (!db.usuarios[userId]) {
        db.usuarios[userId] = { carteira: 0, banco: 0, xpTotal: 0 };
    }
    
    const xpAnterior = db.usuarios[userId].xpTotal || 0;
    const novoXP = xpAnterior + quantidade;
    db.usuarios[userId].xpTotal = novoXP;
    
    const nivelAntigo = calcularNivel(xpAnterior);
    const nivelNovo = calcularNivel(novoXP);
    
    saveDB(db);
    
    return {
        xpGanho: quantidade,
        nivelAntigo: nivelAntigo,
        nivelNovo: nivelNovo,
        levelUp: nivelNovo > nivelAntigo
    };
}

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    const nivel = Math.floor(Math.sqrt(xpTotal / 100)) + 1;
    return Math.min(100, Math.max(1, nivel));
}

function xpParaProximoNivel(nivelAtual) {
    return 100 * Math.pow(nivelAtual, 2);
}

function xpAtualNoNivel(xpTotal, nivelAtual) {
    const xpNecessarioAnterior = nivelAtual > 1 ? 100 * Math.pow(nivelAtual - 1, 2) : 0;
    return xpTotal - xpNecessarioAnterior;
}

function calcularXPporGanho(ganhoOrbs) {
    return Math.max(1, Math.floor(ganhoOrbs / 10));
}

function getTituloPorNivel(nivel) {
    if (nivel < 5) return '🌑 Viajante Espacial';
    if (nivel < 10) return '🌟 Explorador Estelar';
    if (nivel < 20) return '🚀 Comandante Galáctico';
    if (nivel < 35) return '⭐ Senhor das Estrelas';
    if (nivel < 50) return '👑 Imperador Cósmico';
    if (nivel < 70) return '🌀 Lenda Viva';
    if (nivel < 90) return '⚡ Ser Cósmico';
    return '🌌 Divindade Universal';
}

module.exports = { 
    adicionarXP, 
    calcularNivel, 
    xpParaProximoNivel, 
    xpAtualNoNivel,
    calcularXPporGanho,
    getTituloPorNivel
};
