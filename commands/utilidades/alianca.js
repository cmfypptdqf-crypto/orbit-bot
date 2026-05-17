// commands/rpg/aliancaOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, aliancas: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const niveisAlianca = {
    1: { bonus: 1.02, maxMembros: 5, custo: 10000 },
    2: { bonus: 1.04, maxMembros: 10, custo: 20000 },
    3: { bonus: 1.06, maxMembros: 15, custo: 40000 },
    4: { bonus: 1.08, maxMembros: 20, custo: 80000 },
    5: { bonus: 1.10, maxMembros: 25, custo: 160000 }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'alianca',
    aliases: ['ally', 'alliance', 'aliancaorbital'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0 };
        }
        if (!db.aliancas) db.aliancas = {};
        
        const xpGanho = 10;
        const resultadoXP = adicionarXP(userId, xpGanho, 'alianca');
        
        if (subcmd === 'criar') {
            const nome = args.slice(1).join(' ');
            if (!nome) return message.reply('❌ Use: `bt!alianca criar <nome>`');
            if (db.usuarios[userId].alianca) return message.reply('❌ Você já está em uma aliança orbital!');
            if (Object.values(db.aliancas).find(a => a.nome === nome)) return message.reply('❌ Já existe uma aliança orbital com este nome!');
            
            const custo = 10000;
            if ((db.usuarios[userId].carteira || 0) < custo) return message.reply(`❌ Criar uma aliança orbital custa ${custo.toLocaleString()} Orbs!`);
            
            const aliancaId = Date.now().toString();
            db.aliancas[aliancaId] = {
                id: aliancaId,
                nome: nome,
                dono: userId,
                membros: