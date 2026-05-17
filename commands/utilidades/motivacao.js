// commands/fun/motivacaoOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

const frasesMotivacionais = [
    '🚀 Você é mais forte do que imagina! Continue explorando o universo!',
    '⭐ Cada pequeno passo é uma grande conquista orbital!',
    '🌌 O sucesso está logo além da sua zona de conforto!',
    '🛸 Acredite no seu potencial, você pode alcançar qualquer estrela!',
    '💫 Nunca desista! As melhores órbitas são as que mais desafiam!',
    '🌟 Você é uma estrela brilhante neste vasto universo!',
    '🌠 A jornada orbital é longa, mas a recompensa vale a pena!'
];

module.exports = {
    name: 'motivacao',
    aliases: ['motivation', 'motivacaoorbital'],
    
    async executePrefix(message, args, client) {
        const frase = frasesMotivacionais[Math.floor(Math.random() * frasesMotivacionais.length)];
        const xpGanho = 5;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'motivacao');
        
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle('✨ Motivação Orbital')
            .setDescription(`📡 ${frase}`)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true })
            .setFooter({ text: '🌌 Orbit • Acredite no seu potencial estelar!' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};