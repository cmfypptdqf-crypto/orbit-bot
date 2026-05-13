const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'balance',
    aliases: ['bal', 'saldo', 'carteira'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        let user = message.author;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const carteira = db[`carteira_${user.id}_${message.guild.id}`] || 0;
        const banco = db[`banco_${user.id}_${message.guild.id}`] || 0;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`💰 Saldo de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '💵 Carteira', value: `${carteira} moedas`, inline: true },
                { name: '🏦 Banco', value: `${banco} moedas`, inline: true },
                { name: '📊 Total', value: `${carteira + banco} moedas`, inline: true }
            )
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};