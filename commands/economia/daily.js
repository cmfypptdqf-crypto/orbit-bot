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
        const xpGanho = Math.floor(bonusFinal / 10);
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + bonusFinal;
        db.usuarios[userId].xpTotal = (db.usuarios[userId].xpTotal || 0) + xpGanho;
        
        const evento = checkRandomEvent();
        let eventoResultado = null;
        if (evento) eventoResultado = await processEvent(evento, userId, db, client);
        
        saveDB(db);
        cooldownsManager.set(userId, 'daily');
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle(`<:emoji_45:1504081355703586866> ${getRandomFrase('sucesso')}`)
            .setDescription(`📡 Bônus diário recebido!`)
            .addFields(
                { name: '<a:gcoin:1503617439202545757> Bônus Base', value: `${bonusBase.toLocaleString()} Orbs`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '🎁 Total', value: `+${bonusFinal.toLocaleString()} Orbs`, inline: true },
                { name: '⭐ Stellar XP', value: `+${xpGanho.toLocaleString()} XP`, inline: true }
            )
            .setFooter({ text: '<:emoji_45:1504081355703586866> Volte amanhã para mais Stellar XP!' });
        
        if (eventoResultado) {
            embed.addFields({ name: '🎲 EVENTO!', value: eventoResultado.mensagem, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};