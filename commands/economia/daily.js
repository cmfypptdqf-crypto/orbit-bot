// commands/economia/daily.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { checkCooldown, setCooldown } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent } = require('../utilidades/orbitAI.js');

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
        
        const fraseInicial = getRandomFrase('inicio');
        
        const cooldownCheck = checkCooldown(userId, 'daily');
        if (!cooldownCheck.available) {
            const fraseCooldown = getRandomFrase('cooldown');
            return message.reply(`${fraseCooldown}\n⏰ Aguarde mais **${cooldownCheck.formatted}** para o próximo bônus diário!`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const bonusBase = 200;
        let bonusFinal = bonusBase;
        
        const evento = checkRandomEvent();
        let eventoResultado = null;
        
        if (evento && evento.efeito === 'positivo') {
            const bonusEvento = Math.floor(Math.random() * 150) + 50;
            bonusFinal += bonusEvento;
            eventoResultado = { mensagem: evento.frase, efeito: `✨ +${bonusEvento} Orbs extra!` };
        } else if (evento && evento.efeito === 'negativo') {
            const perdaEvento = Math.floor(Math.random() * 100) + 20;
            bonusFinal = Math.max(50, bonusFinal - perdaEvento);
            eventoResultado = { mensagem: evento.frase, efeito: `💸 -${perdaEvento} Orbs (anomalia)` };
        } else if (evento) {
            eventoResultado = { mensagem: evento.frase, efeito: '🌌 Neutro' };
        }
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + bonusFinal;
        saveDB(db);
        setCooldown(userId, 'daily');
        
        const fraseSucesso = getRandomFrase('sucesso');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`📆 ${fraseInicial}`)
            .setDescription(`${fraseSucesso}\n📡 Você recebeu seu bônus diário!`)
            .addFields(
                { name: '🎁 Bônus Recebido', value: `**+${bonusFinal.toLocaleString()} Orbs**`, inline: true },
                { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Volte amanhã para mais!' })
            .setTimestamp();
        
        if (eventoResultado) {
            embed.addFields(
                { name: '🎲 EVENTO CÓSMICO!', value: eventoResultado.mensagem, inline: false },
                { name: '✨ Efeito', value: eventoResultado.efeito, inline: true }
            );
        }
        
        await message.reply({ embeds: [embed] });
    }
};