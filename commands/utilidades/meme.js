// commands/fun/humorOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

const memesOrbitais = [
    'https://i.imgur.com/7L7Bq0E.jpeg',
    'https://i.imgur.com/DKzFJcX.jpeg',
    'https://i.imgur.com/Q4K7bJX.jpeg',
    'https://i.imgur.com/8YQqXzM.jpeg'
];

module.exports = {
    name: 'humor',
    aliases: ['meme', 'memes', 'risada', 'humororbital'],
    
    async executePrefix(message, args, client) {
        const meme = memesOrbitais[Math.floor(Math.random() * memesOrbitais.length)];
        
        // Adicionar XP por usar o comando
        const xpGanho = 3;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'humor');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('😂 Humor Orbital')
            .setImage(meme)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true })
            .setFooter({ text: '🌌 Orbit • Rir é o melhor remédio interestelar!' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};