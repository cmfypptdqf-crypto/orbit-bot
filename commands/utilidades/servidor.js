const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'servidor',
    aliases: ['server', 'guild'],
    
    async executePrefix(message, args, client) {
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${message.guild.name}`)
            .setThumbnail(message.guild.iconURL())
            .addFields(
                { name: '👑 Dono', value: `<@${message.guild.ownerId}>`, inline: true },
                { name: '👥 Membros', value: `${message.guild.memberCount}`, inline: true },
                { name: '📅 Criado em', value: message.guild.createdAt.toLocaleDateString(), inline: true },
                { name: '💬 Canais', value: `${message.guild.channels.cache.size}`, inline: true },
                { name: '🤖 Cargos', value: `${message.guild.roles.cache.size}`, inline: true }
            )
            .setColor(0x00008B);
        
        await message.reply({ embeds: [embed] });
    }
};