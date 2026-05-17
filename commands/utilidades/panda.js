// commands/fun/pandaOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'panda',
    aliases: ['pandaorbital'],
    
    async executePrefix(message, args, client) {
        const api = 'https://some-random-api.com/animal/panda';
        const response = await fetch(api);
        const data = await response.json();
        
        const xpGanho = 3;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'panda');
        
        const embed = new EmbedBuilder()
            .setColor(0x000000)
            .setTitle('🐼 Panda Orbital')
            .setDescription('📡 Um panda fofo apareceu na estação!')
            .setImage(data.image)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};