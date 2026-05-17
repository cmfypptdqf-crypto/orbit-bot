// commands/fun/chuteOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'chutar',
    aliases: ['kick', 'chuteorbital'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Mencione alguém para dar um chute orbital!');
        
        const gifs = [
            'https://media.tenor.com/1zJjHtqP7nAAAAAC/anime-kick.gif',
            'https://media.tenor.com/5oJwQq8VwY0AAAAi/anime-kick.gif',
            'https://media.tenor.com/1sHjHtqP7nAAAAAC/kick.gif'
        ];
        
        const gif = gifs[Math.floor(Math.random() * gifs.length)];
        const xpGanho = 5;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'chutar');
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🦵 Chute Orbital!')
            .setDescription(`⚡ ${message.author} deu um chute orbital em ${user}!`)
            .setImage(gif)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};