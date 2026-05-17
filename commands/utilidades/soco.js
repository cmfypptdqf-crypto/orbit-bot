// commands/fun/socoOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'soco',
    aliases: ['punch', 'socoorbital'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Mencione alguém para dar um soco orbital!');
        
        const gifs = [
            'https://media.tenor.com/1zJjHtqP7nAAAAAC/anime-punch.gif',
            'https://media.tenor.com/5oJwQq8VwY0AAAAi/anime-punch.gif',
            'https://media.tenor.com/1sHjHtqP7nAAAAAC/punch.gif'
        ];
        
        const gif = gifs[Math.floor(Math.random() * gifs.length)];
        const xpGanho = 5;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'soco');
        
        const embed = new EmbedBuilder()
            .setColor(0xFF4500)
            .setTitle('👊 Soco Orbital!')
            .setDescription(`💥 ${message.author} deu um soco orbital em ${user}!`)
            .setImage(gif)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};