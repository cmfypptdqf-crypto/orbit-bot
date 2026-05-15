// commands/economia/semanal.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase } = require('../utilidades/orbitAI.js');
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
    name: 'semanal',
    aliases: ['weekly', 'bonus_semanal'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        const cooldownCheck = cooldownsManager.check(userId, 'weekly');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde mais **${cooldownCheck.formatted}** para o próximo bônus semanal!`);
        }
        
        const db = getDB();
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, xpTotal: 0 };
        }
        
        const bonusBase = 1500;
        const bonusInfo = calcularBonusTotal(userId, 'carteira');
        const bonusFinal = Math.floor(bonusBase * bonusInfo.bonus);
        const xpGanho = Math.floor(bonusFinal / 10);
        
        db.usuarios[userId].banco = (db.usuarios[userId].banco || 0) + bonusFinal;
        db.usuarios[userId].xpTotal = (db.usuarios[userId].xpTotal || 0) + xpGanho;
        
        saveDB(db);
        cooldownsManager.set(userId, 'weekly');
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle(`<:emoji_45:1504081355703586866> sucesso`)
            .setDescription(`<a:h_checkazul:1503775331163705614> Bônus semanal recebido!`)
            .addFields(
                { name: '💰 Bônus', value: `+${bonusFinal.toLocaleString()} Orbs`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '⭐ Stellar XP', value: `+${xpGanho.toLocaleString()} XP`, inline: true },
                { name: '🏦 Orbital Bank', value: `${db.usuarios[userId].banco.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '<:emoji_45:1504081355703586866> Volte semana que vem para mais Stellar XP!' });
        
        await message.reply({ embeds: [embed] });
    }
};