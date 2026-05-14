// commands/economia/bet.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
    name: 'bet',
    aliases: ['apostar', 'caraoucoroa', 'coinflip'],
    
    async executePrefix(message, args, client) {
        const amount = parseInt(args[0]);
        const escolha = args[1]?.toLowerCase();
        
        if (isNaN(amount) || amount <= 0) {
            return message.reply('❌ Aposte um valor válido! Ex: `bt!bet 100 cara`');
        }
        
        if (!escolha || (escolha !== 'cara' && escolha !== 'coroa')) {
            return message.reply('❌ Escolha "cara" ou "coroa"! Ex: `bt!bet 100 cara`');
        }
        
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        
        if (carteira < amount) {
            return message.reply(`❌ Você só tem ${carteira.toLocaleString()} Orbs na carteira!`);
        }
        
        const resultado = Math.random() < 0.5 ? 'cara' : 'coroa';
        const ganhou = escolha === resultado;
        
        if (ganhou) {
            db.usuarios[userId].carteira = carteira + amount;
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎉 Você ganhou!')
                .setDescription(`🪙 Deu **${resultado}**!`)
                .addFields(
                    { name: '💰 Ganho', value: `+${amount.toLocaleString()} Orbs`, inline: true },
                    { name: '💵 Novo saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                );
            await message.reply({ embeds: [embed] });
        } else {
            db.usuarios[userId].carteira = carteira - amount;
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('😞 Você perdeu!')
                .setDescription(`🪙 Deu **${resultado}**...`)
                .addFields(
                    { name: '💰 Perda', value: `-${amount.toLocaleString()} Orbs`, inline: true },
                    { name: '💵 Novo saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                );
            await message.reply({ embeds: [embed] });
        }
        
        saveDB(db);
    }
};