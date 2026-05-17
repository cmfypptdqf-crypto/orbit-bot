// commands/fun/conexaoOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

module.exports = {
    name: 'conexao',
    aliases: ['ship', 'amor', 'match', 'conexaoorbital'],
    
    async executePrefix(message, args, client) {
        const user1 = message.mentions.users.first();
        if (!user1) return message.reply('❌ Use: `bt!conexao @usuario1 @usuario2`');
        
        const user2 = message.mentions.users.at(1);
        if (!user2) return message.reply('❌ Mencione duas pessoas orbitais!');
        
        const compatibilidade = Math.floor(Math.random() * 100) + 1;
        
        let cor = 0xFF0000;
        let mensagem = '';
        
        if (compatibilidade >= 80) {
            cor = 0xFFD700;
            mensagem = '💕 **CONEXÃO ORBITAL PERFEITA!** Vocês nasceram um para o outro! 💕';
        } else if (compatibilidade >= 60) {
            cor = 0x00FF00;
            mensagem = '💚 **ÓTIMA CONEXÃO!** Tudo pode dar certo nas estrelas! 💚';
        } else if (compatibilidade >= 40) {
            cor = 0xFFFF00;
            mensagem = '💛 **CONEXÃO POSSÍVEL!** Com esforço orbital, quem sabe... 💛';
        } else {
            cor = 0xFF0000;
            mensagem = '💔 **CONEXÃO TERRÍVEL!** Melhor cada um na sua órbita! 💔';
        }
        
        const barra = gerarBarraConexao(compatibilidade, 20);
        
        // Adicionar XP por usar o comando
        const xpGanho = 5;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'conexao');
        
        const embed = new EmbedBuilder()
            .setColor(cor)
            .setTitle('💞 Calculadora de Conexão Orbital')
            .setDescription(`${user1} 💕 ${user2}`)
            .addFields(
                { name: '📊 Compatibilidade Orbital', value: `${barra} **${compatibilidade}%**`, inline: false },
                { name: '💬 Resultado Orbital', value: mensagem, inline: false },
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • O amor está nas estrelas!' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};

function gerarBarraConexao(percentual, tamanho = 20) {
    const preenchido = Math.round((percentual / 100) * tamanho);
    return `❤️`.repeat(preenchido) + `🖤`.repeat(tamanho - preenchido);
}