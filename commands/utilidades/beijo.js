// commands/fun/beijoOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'beijo',
    aliases: ['kiss', 'beijoorbital'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Mencione alguém para dar um beijo orbital!');
        if (user.id === message.author.id) return message.reply('❌ Você não pode se beijar orbitalmente!');
        
        const gifs = [
            'https://media.tenor.com/1zJjHtqP7nAAAAAC/anime-kiss.gif',
            'https://media.tenor.com/5oJwQq8VwY0AAAAi/anime-kiss.gif',
            'https://media.tenor.com/1sHjHtqP7nAAAAAC/kiss.gif'
        ];
        
        const gif = gifs[Math.floor(Math.random() * gifs.length)];
        const xpGanho = 5;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'beijo');
        
        const embed = new EmbedBuilder()
            .setColor(0xFF69B4)
            .setTitle('💋 Beijo Orbital!')
            .setDescription(`💕 ${message.author} deu um beijo orbital em ${user}! 💕`)
            .setImage(gif)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};