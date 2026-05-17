// commands/admin/purgeOrbital.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'purge',
    aliases: ['limpar', 'clear', 'purgeorbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ Você não tem permissão orbital para usar este comando!');
        }
        
        const quantidade = parseInt(args[0]);
        
        if (isNaN(quantidade) || quantidade < 1 || quantidade > 100) {
            return message.reply('❌ Quantidade orbital inválida! Use entre 1 e 100.');
        }
        
        const messages = await message.channel.bulkDelete(quantidade, true);
        
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle('🗑️ Purge Orbital')
            .setDescription(`📡 **${messages.size} mensagens** foram apagadas orbitalmente!`)
            .addFields(
                { name: '👑 Apagado por', value: message.author.tag, inline: true },
                { name: '📊 Quantidade', value: `${messages.size}`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Limpeza orbital realizada' });
        
        const reply = await message.channel.send({ embeds: [embed] });
        setTimeout(() => reply.delete(), 5000);
    }
};