// commands/economia/daily.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent } = require('../utilidades/orbitAI.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');

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
    name: 'daily',
    aliases: ['diario', 'diário', 'bonus'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        const cooldownCheck = cooldownsManager.check(userId, 'daily');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde mais **${cooldownCheck.formatted}** para o próximo bônus diário!`);
        }
        
        const db = getDB();
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, xpTotal: 0 };
        }
        
        const bonusBase = 200;
        const bonusInfo = calcularBonusTotal(userId, 'carteira');
        const bonusFinal = Math.floor(bonusBase * bonusInfo.bonus);
        const xpGanho