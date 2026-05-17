// commands/economia/saqueOrbital.js
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
    name: 'saque',
    aliases: ['sacar', 'withdraw', 'retirar', 'saqueorbital'],
    
    async executePrefix(message, args, client) {
        let amount = args[0];
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        let carteira = db.usuarios[userId].carteira || 0;
        let banco = db.usuarios[userId].banco || 0;
        
        if (!amount) return message.reply('❌ Use: `bt!saque <valor>` ou `bt!saque all`');
        
        if (amount.toLowerCase() === 'all') {
            amount = banco;
        } else {
            amount = parseInt(amount);
            if (isNaN(amount)) return message.reply('❌ Digite um valor orbital válido!');
        }
        
        if (amount <= 0) return message.reply('❌ Digite um valor orbital positivo!');
        if (amount > banco) return message.reply(`❌ Você só tem ${banco.toLocaleString()} Orbs no **Orbital Bank**!`);
        
        db.usuarios[userId].banco = banco - amount;
        db.usuarios[userId].carteira = carteira + amount;
        
        // Adicionar XP pelo saque
        const xpGanho = Math.max(1, Math.floor(amount / 100));
        const resultadoXP = adicionarXP(userId, xpGanho, 'saque');
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle(`💸 ${getRandomFrase('sucesso')}`)
            .setDescription(`📡 Você sacou **${amount.toLocaleString()} Orbs** do **Orbital Bank**!`)
            .addFields(
                { name: '💵 Núcleo Orbital', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                { name: '🏦 Orbital Bank', value: `${db.usuarios[userId].banco.toLocaleString()} Orbs`, inline: true },
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
            )
            .setFooter({ text: '✨ Orbital Bank • Seus Orbs estão seguros nas estrelas' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};