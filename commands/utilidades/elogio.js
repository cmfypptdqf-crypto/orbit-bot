// commands/fun/elogioOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

const elogios = [
    '🌟 Você brilha como uma estrela cadente!',
    '🚀 Sua determinação é tão forte quanto um foguete!',
    '🌌 Você é tão vasto e maravilhoso quanto o universo!',
    '💫 Sua energia é contagiante como uma supernova!',
    '🛸 Você é uma pessoa incrível, digna de uma nave especial!',
    '⭐ Seu coração é tão radiante quanto o sol!',
    '🌠 Você ilumina a vida de quem está ao seu redor!'
];

module.exports = {
    name: 'elogio',
    aliases: ['compliment', 'elogioorbital'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const elogio = elogios[Math.floor(Math.random() * elogios.length)];
        const xpGanho = 5;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'elogio');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🌟 Elogio Orbital')
            .setDescription(`📡 ${user}, ${elogio}`)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true })
            .setFooter({ text: '🌌 Orbit • Você é especial!' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};