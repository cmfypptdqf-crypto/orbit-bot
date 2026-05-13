const { EmbedBuilder } = require('discord.js');
const db = require('quick.db');

module.exports = {
    name: 'balance',
    aliases: ['bal', 'saldo', 'carteira'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        let carteira = db.get(`carteira_${user.id}`) || 0;
        let banco = db.get(`banco_${user.id}`) || 0;
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
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