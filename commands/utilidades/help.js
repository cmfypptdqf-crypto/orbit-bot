const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ajuda',
    aliases: ['help', 'comandos'],
    
    async executePrefix(message, args, client) {
        const embed = new EmbedBuilder()
            .setTitle('📚 Orbit™ - Comandos')
            .setDescription('Aqui estão meus comandos disponíveis:')
            .setColor(0x00008B)
            .addFields(
                { name: '📌 **Utilitários**', value: '`bt!ping`, `bt!servidor`, `bt!botinfo`', inline: false },
                { name: '💰 **Economia**', value: 'em breve', inline: false },
                { name: '🛠️ **Administração**', value: 'em breve', inline: false },
                { name: '🚨 **Ant-Raid**', value: 'em breve', inline: false },
                { name: '🔗 **Links**', value: '[Site](https://orbitbot-theta.vercel.app/) | [Suporte](https://discord.gg/pPnSZEYGZ6)', inline: false }
            )
            .setFooter({ text: 'Orbit™ • Use bt! para comandos' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};