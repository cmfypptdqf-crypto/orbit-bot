// commands/imagem/lixoOrbital.js
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

module.exports = {
    name: 'lixo',
    aliases: ['trash', 'lixoorbital'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first() || message.author;
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
        
        const template = await loadImage('https://i.imgur.com/7L7Bq0E.jpeg');
        const avatar = await loadImage(avatarURL);
        
        const canvas = createCanvas(500, 500);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, 500, 500);
        ctx.drawImage(avatar, 200, 200, 100, 100);
        ctx.fillStyle = '#000000';
        ctx.font = '20px Arial';
        ctx.fillText('LIXO ORBITAL', 180, 380);
        
        const buffer = canvas.toBuffer();
        const attachment = new AttachmentBuilder(buffer, { name: 'lixo.png' });
        
        const xpGanho = 10;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'lixo');
        
        const embed = new EmbedBuilder()
            .setColor(0x808080)
            .setTitle('🗑️ Lixo Orbital')
            .setDescription(`📡 ${user.username} foi para o lixo orbital!`)
            .setImage('attachment://lixo.png')
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed], files: [attachment] });
    }
};