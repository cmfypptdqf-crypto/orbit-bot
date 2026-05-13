const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    aliases: ['latencia'],
    
    async executePrefix(message, args, client) {
        const latency = Date.now() - message.createdTimestamp;
        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '📡 Latência', value: `${latency}ms`, inline: true },
                { name: '💻 API', value: `${Math.round(client.ws.ping)}ms`, inline: true }
            )
            .setColor(0x00008B);
        
        await message.reply({ embeds: [embed] });
    }
};