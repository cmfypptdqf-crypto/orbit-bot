// commands/fun/gay.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'gay',
    aliases: ['gaymeter', 'gaymetro'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const porcentagem = Math.floor(Math.random() * 100) + 1;
        const barra = gerarBarraGay(porcentagem, 20);
        
        let cor = porcentagem > 50 ? 0xFF69B4 : 0x00BFFF;
        
        const embed = new EmbedBuilder()
            .setColor(cor)
            .setTitle(`🏳️‍🌈 Medidor Gay - ${user.username}`)
            .setDescription(`${barra} **${porcentagem}%**`)
            .setFooter({ text: '🌌 Orbit • Medição 100% científica (ou não)' });
        
        await message.reply({ embeds: [embed] });
    }
};

function gerarBarraGay(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    return `🌈`.repeat(preenchido) + `🖤`.repeat(tamanho - preenchido);
}