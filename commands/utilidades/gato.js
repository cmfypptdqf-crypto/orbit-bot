// commands/fun/gatoOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'gato',
    aliases: ['cat', 'gatorbital'],
    
    async executePrefix(message, args, client) {
        const api = 'https://api.thecatapi.com/v1/images/search';
        const response = await fetch(api);
        const data = await response.json();
        
        const xpGanho = 3;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'gato');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('🐱 Gato Orbital')
            .setDescription('📡 Um felino estelar apareceu!')
            .setImage(data[0].url)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};