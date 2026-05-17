// commands/fun/raposaOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'raposa',
    aliases: ['fox', 'raposaorbital'],
    
    async executePrefix(message, args, client) {
        const api = 'https://randomfox.ca/floof/';
        const response = await fetch(api);
        const data = await response.json();
        
        const xpGanho = 3;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'raposa');
        
        const embed = new EmbedBuilder()
            .setColor(0xFF6600)
            .setTitle('🦊 Raposa Orbital')
            .setDescription('📡 Uma raposa espacial apareceu!')
            .setImage(data.image)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};