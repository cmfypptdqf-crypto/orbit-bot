// commands/imagem/memeFaceOrbital.js
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'memeface',
    aliases: ['memerosto', 'memefaceorbital'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first() || message.author;
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
        
        const template = await loadImage('https://i.imgflip.com/1bij.jpg');
        const avatar = await loadImage(avatarURL);
        
        const canvas = createCanvas(template.width, template.height);
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(template, 0, 0);
        ctx.drawImage(avatar, 50, 50, 100, 100);
        
        const buffer = canvas.toBuffer();
        const attachment = new AttachmentBuilder(buffer, { name: 'meme.png' });
        
        const xpGanho = 10;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'memeface');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎭 Meme Orbital')
            .setDescription(`📡 Rosto de ${user.username} no meme!`)
            .setImage('attachment://meme.png')
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed], files: [attachment] });
    }
};