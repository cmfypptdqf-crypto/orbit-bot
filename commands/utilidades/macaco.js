// commands/fun/macacoOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'macaco',
    aliases: ['monkey', 'macacoorbital'],
    
    async executePrefix(message, args, client) {
        const api = 'https://random-d.uk/api/random';
        const response = await fetch(api);
        const data = await response.json();
        
        const xpGanho = 3;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'macaco');
        
        const embed = new EmbedBuilder()
            .setColor(0x8B4513)
            .setTitle('🐒 Macaco Orbital')
            .setDescription('📡 Um macaco apareceu na sua estação orbital!')
            .setImage(data.url)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};