// commands/fun/cachorroOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'cachorro',
    aliases: ['dog', 'cachorroorbital'],
    
    async executePrefix(message, args, client) {
        const api = 'https://dog.ceo/api/breeds/image/random';
        const response = await fetch(api);
        const data = await response.json();
        
        const xpGanho = 3;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'cachorro');
        
        const embed = new EmbedBuilder()
            .setColor(0x8B4513)
            .setTitle('🐕 Cachorro Orbital')
            .setDescription('📡 Um companheiro canino apareceu!')
            .setImage(data.message)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};