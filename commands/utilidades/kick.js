// commands/admin/kickOrbital.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'kick',
    aliases: ['expulsar', 'kickorbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('KickMembers')) {
            return message.reply('❌ Você não tem permissão orbital para usar este comando!');
        }
        
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!kick @usuario <motivo>`');
        
        const member = message.guild.members.cache.get(user.id);
        if (!member) return message.reply('❌ Usuário orbital não encontrado!');
        
        const motivo = args.slice(1).join(' ') || 'Não especificado';
        
        if (!member.kickable) {
            return message.reply('❌ Não posso expulsar este usuário orbitalmente!');
        }
        
        try {
            await member.kick(motivo);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('👢 Kick Orbital')
                .setDescription(`**${user.username}** foi expulso orbitalmente!`)
                .addFields(
                    { name: '📝 Motivo', value: motivo, inline: true },
                    { name: '👑 Moderador', value: message.author.tag, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Usuário expulso' });
            
            await message.reply({ embeds: [embed] });
            
            try {
                await user.send(`👢 Você foi expulso de **${message.guild.name}**\n📝 Motivo: ${motivo}`);
            } catch (e) {}
            
        } catch (error) {
            await message.reply('❌ Erro orbital ao expulsar usuário!');
        }
    }
};