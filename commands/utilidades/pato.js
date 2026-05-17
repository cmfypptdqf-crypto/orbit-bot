// commands/fun/patoOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'pato',
    aliases: ['duck', 'patorbital'],
    
    async executePrefix(message, args, client) {
        const api = 'https://random-d.uk/api/random';
        const response = await fetch(api);
        const data = await response.json();
        
        const xpGanho = 3;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'pato');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🦆 Pato Chuck Orbital')
            .setDescription('📡 O pato mais famoso do universo apareceu!')
            .setImage(data.url)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};