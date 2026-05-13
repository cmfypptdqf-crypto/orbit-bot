const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'servidor',
    aliases: ['server', 'guild'],
    
    slashData: new SlashCommandBuilder()
        .setName('servidor')
        .setDescription('Mostra informações do servidor'),
    
    async executeSlash(interaction) {
        await this.showServerInfo(interaction, interaction.guild);
    },
    
    async executePrefix(message) {
        await this.showServerInfo(message, message.guild);
    },
    
    async showServerInfo(context, guild) {
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true },
                { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
                { name: '📅 Criado em', value: guild.createdAt.toLocaleDateString(), inline: true },
                { name: '💬 Canais', value: `${guild.channels.cache.size}`, inline: true },
                { name: '🤖 Cargos', value: `${guild.roles.cache.size}`, inline: true }
            )
            .setColor(0x00008B);
        
        if (context.reply) await context.reply({ embeds: [embed] });
        else await context.channel.send({ embeds: [embed] });
    }
};