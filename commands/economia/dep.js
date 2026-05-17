// commands/economia/depositoOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getRandomFrase } = require('../utilidades/orbitAI.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

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
    name: 'deposito',
    aliases: ['depositar', 'dep', 'guardar', 'depositoorbital'],
    
    async executePrefix(message, args, client) {
        let amount = args[0];
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        let carteira = db.usuarios[userId].carteira || 0;
        let banco = db.usuarios[userId].banco || 0;
        
        if (!amount) return message.reply('❌ Use: `bt!deposito <valor>` ou `bt!deposito all`');
        
        if (amount.toLowerCase() === 'all') {
            amount = carteira;
        } else {
            amount = parseInt(amount);
            if (isNaN(amount)) return message.reply('❌ Digite um valor orbital válido!');
        }
        
        if (amount <= 0) return message.reply('❌ Digite um valor orbital positivo!');
        if (amount > carteira) return message.reply(`❌ Você só tem ${carteira.toLocaleString()} Orbs em seu Núcleo Orbital!`);
        
        db.usuarios[userId].carteira = carteira - amount;
        db.usuarios[userId].banco = banco + amount;
        
        // Adicionar XP pelo depósito
        const xpGanho = Math.max(1, Math.floor(amount / 100));
        const resultadoXP = adicionarXP(userId, xpGanho, 'deposito');
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle(`🏦 ${getRandomFrase('sucesso')}`)
            .setDescription(`📡 Você transferiu **${amount.toLocaleString()} Orbs** para o **Orbital Bank**!`)
            .addFields(
                { name: '💵 Núcleo Orbital', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                { name: '🏦 Orbital Bank', value: `${db.usuarios[userId].banco.toLocaleString()} Orbs`, inline: true },
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
            )
            .setFooter({ text: '✨ Orbital Bank • Fundos garantidos pela Federação Estelar' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};