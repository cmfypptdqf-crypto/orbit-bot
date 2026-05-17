// commands/fun/tapaOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'tapa',
    aliases: ['slap', 'tapaorbital'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Mencione alguém para dar um tapa orbital!');
        
        const gifs = [
            'https://media.tenor.com/1zJjHtqP7nAAAAAC/anime-slap.gif',
            'https://media.tenor.com/5oJwQq8VwY0AAAAi/anime-slap.gif',
            'https://media.tenor.com/1sHjHtqP7nAAAAAC/slap.gif'
        ];
        
        const gif = gifs[Math.floor(Math.random() * gifs.length)];
        const xpGanho = 5;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'tapa');
        
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('✋ Tapa Orbital!')
            .setDescription(`😠 ${message.author} deu um tapa orbital em ${user}!`)
            .setImage(gif)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};