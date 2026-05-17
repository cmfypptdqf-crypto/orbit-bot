// commands/fun/medidorOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

module.exports = {
    name: 'medidor',
    aliases: ['gay', 'gaymeter', 'gaymetro', 'medidororbital'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const porcentagem = Math.floor(Math.random() * 100) + 1;
        const barra = gerarBarraMedidor(porcentagem, 20);
        
        let cor = porcentagem > 50 ? 0xFF69B4 : 0x00BFFF;
        
        // Adicionar XP por usar o comando
        const xpGanho = 3;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'medidor');
        
        const embed = new EmbedBuilder()
            .setColor(cor)
            .setTitle(`🏳️‍🌈 Medidor Orbital - ${user.username}`)
            .setDescription(`${barra} **${porcentagem}%**`)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true })
            .setFooter({ text: '🌌 Orbit • Medição orbital 100% científica (ou nem tanto)' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};

function gerarBarraMedidor(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    return `🌈`.repeat(preenchido) + `🖤`.repeat(tamanho - preenchido);
}