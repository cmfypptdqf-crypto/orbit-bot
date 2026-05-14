// commands/fun/ship.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ship',
    aliases: ['amor', 'match'],
    
    async executePrefix(message, args, client) {
        const user1 = message.mentions.users.first();
        if (!user1) return message.reply('❌ Use: `bt!ship @usuario1 @usuario2`');
        
        const user2 = message.mentions.users.at(1);
        if (!user2) return message.reply('❌ Mencione duas pessoas!');
        
        const compatibilidade = Math.floor(Math.random() * 100) + 1;
        
        let cor = 0xFF0000;
        let mensagem = '';
        
        if (compatibilidade >= 80) {
            cor = 0xFFD700;
            mensagem = '💕 **ALMA GÊMEA!** Vocês nasceram um para o outro! 💕';
        } else if (compatibilidade >= 60) {
            cor = 0x00FF00;
            mensagem = '💚 **ÓTIMO PAR!** Tudo pode dar certo! 💚';
        } else if (compatibilidade >= 40) {
            cor = 0xFFFF00;
            mensagem = '💛 **PODE DAR CERTO!** Com esforço, quem sabe... 💛';
        } else {
            cor = 0xFF0000;
            mensagem = '💔 **TERRÍVEL!** Melhor cada um no seu canto! 💔';
        }
        
        const barra = gerarBarraCombinacao(compatibilidade, 20);
        
        const embed = new EmbedBuilder()
            .setColor(cor)
            .setTitle('💞 Calculadora de Amor Interestelar')
            .setDescription(`${user1} 💕 ${user2}`)
            .addFields(
                { name: '📊 Compatibilidade', value: `${barra} **${compatibilidade}%**`, inline: false },
                { name: '💬 Resultado', value: mensagem, inline: false }
            )
            .setFooter({ text: '🌌 Orbit • O amor está nas estrelas!' });
        
        await message.reply({ embeds: [embed] });
    }
};

function gerarBarraCombinacao(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    return `❤️`.repeat(preenchido) + `🖤`.repeat(tamanho - preenchido);
}