const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    aliases: ['latencia'],
    
    slashData: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Verifica a latência do bot'),
    
    async executeSlash(interaction) {
        const latency = Date.now() - interaction.createdTimestamp;
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '📡 Latência', value: `${latency}ms`, inline: true },
                { name: '💻 API', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true }
            )
            .setColor(0x00008B);
        
        await interaction.reply({ embeds: [embed] });
    },
    
    async executePrefix(message) {
        const latency = Date.now() - message.createdTimestamp;
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '📡 Latência', value: `${latency}ms`, inline: true },
                { name: '💻 API', value: `${Math.round(message.client.ws.ping)}ms`, inline: true }
            )
            .setColor(0x00008B);
        
        await message.reply({ embeds: [embed] });
    }
};