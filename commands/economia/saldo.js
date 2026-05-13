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
        
        // ✅ Corrigido: fetch() ao invés de get()
        let carteira = await db.fetch(`carteira_${user.id}`) || 0;
        let banco = await db.fetch(`banco_${user.id}`) || 0;
        
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