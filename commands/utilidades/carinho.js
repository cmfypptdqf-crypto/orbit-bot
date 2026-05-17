// commands/fun/carinhoOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'carinho',
    aliases: ['pet', 'cuddle', 'carinhoorbital'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Mencione alguém para fazer carinho orbital!');
        
        const gifs = [
            'https://media.tenor.com/1zJjHtqP7nAAAAAC/anime-cuddle.gif',
            'https://media.tenor.com/5oJwQq8VwY0AAAAi/anime-pat.gif',
            'https://media.tenor.com/1sHjHtqP7nAAAAAC/headpat.gif'
        ];
        
        const gif = gifs[Math.floor(Math.random() * gifs.length)];
        const xpGanho = 5;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'carinho');
        
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle('🤗 Carinho Orbital!')
            .setDescription(`💖 ${message.author} fez carinho orbital em ${user}! 💖`)
            .setImage(gif)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};