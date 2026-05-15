// commands/economia/search.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cooldownsManager = require('../utilidades/cooldownsManager.js');
// Em outros comandos (ex: daily, missao, etc)
const { aplicarBonusEvento } = require('./evento.js');

// Aplicar bônus automático
const recompensaBase = 1000;
const recompensaFinal = aplicarBonusEvento(recompensaBase);
// Se tiver evento ativo com 1.5x, retorna 1500
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

module.exports = {
    name: 'search',
    aliases: ['procurar', 'buscar', 'explorar', 'sondar'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // VERIFICAR COOLDOWN
        const cooldownCheck = cooldownsManager.check(userId, 'search');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde **${cooldownCheck.formatted}** para explorar novamente!`);
        }
        
        const locais = [
            { nome: '🗑️ Lixo Espacial', ganho: [100, 400], cor: 0x808080 },
            { nome: '🚀 Nave Abandonada', ganho: [500, 1800], cor: 0x9B59B6 },
            { nome: '🕳️ Crateras de Marte', ganho: [200, 600], cor: 0xE67E22 },
            { nome: '💥 Estação Destruída', ganho: [300, 1200], cor: 0xFF0000 },
            { nome: '🪐 Anéis de Saturno', ganho: [400, 1500], cor: 0xF1C40F },
            { nome: '🌑 Base Lunar', ganho: [250, 800], cor: 0x3498DB },
            { nome: '☄️ Asteroide Rico', ganho: [600, 2000], cor: 0x00FF00 },
            { nome: '🛸 Disco Voador', ganho: [800, 2500], cor: 0x8E44AD },
            { nome: '🏛️ Ruínas Alienígenas', ganho: [1000, 3000], cor: 0xFFD700 }
        ];
        
        const local = locais[Math.floor(Math.random() * locais.length)];
        const ganho = Math.floor(Math.random() * (local.ganho[1] - local.ganho[0] + 1) + local.ganho[0]);
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganho;
        saveDB(db);
        
        // REGISTRAR COOLDOWN
        cooldownsManager.set(userId, 'search');
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('🔍 Exploração Espacial')
            .setDescription(`📡 Sondando: **${local.nome}**`)
            .addFields(
                { name: '💎 Você encontrou', value: `**+${ganho.toLocaleString()} Orbs**`, inline: true },
                { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: 'Use bt!cooldowns para ver todos os tempos' });
        
        await message.reply({ embeds: [embed] });
    }
};