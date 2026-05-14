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

module.exports = {
    name: 'perfil',
    aliases: ['profile', 'me'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_missoes: 0 };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        const banco = db.usuarios[userId].banco || 0;
        const total = carteira + banco;
        const missoes = db.usuarios[userId].total_missoes || 0;
        const level = Math.floor(Math.log10(total / 100 + 1) * 15) || 1;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`📋 Perfil de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '💰 Carteira', value: `${carteira.toLocaleString()} Orbs`, inline: true },
                { name: '🏦 Banco', value: `${banco.toLocaleString()} Orbs`, inline: true },
                { name: '📊 Total', value: `${total.toLocaleString()} Orbs`, inline: true },
                { name: '🚀 Missões', value: `${missoes}`, inline: true },
                { name: '🏆 Nível', value: `${level}`, inline: true }
            )
            .setFooter({ text: '🌌 Economia Intergaláctica' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};