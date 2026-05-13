const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ajuda',
    aliases: ['help', 'comandos'],
    
    slashData: new SlashCommandBuilder()
        .setName('ajuda')
        .setDescription('Mostra todos os comandos disponíveis'),
    
    async executeSlash(interaction) {
        await this.showHelp(interaction);
    },
    
    async executePrefix(message) {
        await this.showHelp(message);
    },
    
    async showHelp(context) {
        const embed = new EmbedBuilder()
            .setTitle('📚 Orbit™ - Comandos')
            .setDescription('Aqui estão meus comandos disponíveis:')
            .setColor(0x00008B)
            .addFields(
                { name: '📌 **Utilitários**', value: '`bt!ping`, `bt!servidor`, `bt!botinfo`', inline: false },
                { name: '💰 **Economia**', value: '`bt!balance`, `bt!daily`, `bt!work`, `bt!shop`, `bt!buy`, `bt!depositar`, `bt!sacar`, `bt!pagar`, `bt!roubar`, `bt!rank`', inline: false },
                { name: '🔗 **Links**', value: '[Site](https://orbitbot-theta.vercel.app/) | [Suporte](https://discord.gg/pPnSZEYGZ6)', inline: false }
            )
            .setFooter({ text: 'Orbit™ • Use bt! para comandos' })
            .setTimestamp();
        
        if (context.reply) await context.reply({ embeds: [embed] });
        else await context.channel.send({ embeds: [embed] });
    }
};