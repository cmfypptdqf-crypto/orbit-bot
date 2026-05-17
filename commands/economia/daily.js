// commands/economia/orbitaDiaria.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent } = require('../../utilidades/orbitAI.js');
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
    name: 'orbita',
    aliases: ['daily', 'diario', 'diário', 'bonus', 'orbita'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        const cooldownCheck = cooldownsManager.check(userId, 'daily');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ **Órbita em recarga!** Aguarde mais **${cooldownCheck.formatted}** para sua próxima órbita diária!`);
        }
        
        const db = getDB();
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, xpTotal: 0 };
        }
        
        const bonusBase = 200;
        const bonusInfo = calcularBonusTotal(userId, 'carteira');
        const bonusFinal = Math.floor(bonusBase * bonusInfo.bonus);
        const xpGanho = calcularXPporGanho(bonusFinal);
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + bonusFinal;
        db.usuarios[userId].xpTotal = (db.usuarios[userId].xpTotal || 0) + xpGanho;
        
        const evento = checkRandomEvent();
        let eventoResultado = null;
        if (evento) eventoResultado = await processEvent(evento, userId, db, client);
        
        saveDB(db);
        cooldownsManager.set(userId, 'daily');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🌟 ${getRandomFrase('sucesso')}`)
            .setDescription(`📡 Sua **Órbita Diária** foi ativada, comandante!`)
            .addFields(
                { name: '🎁 Bônus Orbital', value: `${bonusBase.toLocaleString()} Orbs`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '💰 Recebido', value: `+${bonusFinal.toLocaleString()} Orbs`, inline: true },
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Sua próxima órbita estará disponível amanhã!' });
        
        if (eventoResultado) {
            embed.addFields({ name: '🎲 EVENTO ORBITAL!', value: eventoResultado.mensagem, inline: false });
        }
        
        if (resultadoXP?.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};