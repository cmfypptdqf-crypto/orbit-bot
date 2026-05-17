// commands/economia/orbitaSemanal.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../../utilidades/galaxiaBonus.js');
const { getRandomFrase } = require('../../utilidades/orbitAI.js');
const cooldownsManager = require('../../utilidades/cooldownsManager.js');
const { adicionarXP, calcularXPporGanho } = require('../../utilidades/xpSystem.js');

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
    name: 'orbitaSemanal',
    aliases: ['semanal', 'weekly', 'orbita'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        const cooldownCheck = cooldownsManager.check(userId, 'weekly');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ **Órbita Semanal em recarga!** Aguarde **${cooldownCheck.formatted}** para sua próxima órbita semanal!`);
        }
        
        const db = getDB();
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, xpTotal: 0 };
        }
        
        const bonusBase = 1500;
        const bonusInfo = calcularBonusTotal(userId, 'carteira');
        const bonusFinal = Math.floor(bonusBase * bonusInfo.bonus);
        const xpGanho = calcularXPporGanho(bonusFinal);
        
        db.usuarios[userId].banco = (db.usuarios[userId].banco || 0) + bonusFinal;
        db.usuarios[userId].xpTotal = (db.usuarios[userId].xpTotal || 0) + xpGanho;
        
        saveDB(db);
        cooldownsManager.set(userId, 'weekly');
        
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle(`🪐 ${getRandomFrase('sucesso')}`)
            .setDescription(`📡 Sua **Órbita Semanal** foi ativada! Os Orbs foram depositados no **Orbital Bank**.`)
            .addFields(
                { name: '🎁 Bônus Orbital', value: `${bonusBase.toLocaleString()} Orbs`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '💰 Recebido', value: `+${bonusFinal.toLocaleString()} Orbs`, inline: true },
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                { name: '🏦 Orbital Bank', value: `${db.usuarios[userId].banco.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '🪐 Orbit • Sua próxima órbita semanal estará disponível em 7 dias!' });
        
        if (resultadoXP?.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};