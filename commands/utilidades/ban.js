// commands/admin/banOrbital.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ban',
    aliases: ['banir', 'banorbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('BanMembers')) {
            return message.reply('❌ Você não tem permissão orbital para usar este comando!');
        }
        
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!ban @usuario <motivo>`');
        
        const member = message.guild.members.cache.get(user.id);
        const motivo = args.slice(1).join(' ') || 'Não especificado';
        
        if (member && !member.bannable) {
            return message.reply('❌ Não posso banir este usuário orbitalmente!');
        }
        
        try {
            await message.guild.members.ban(user.id, { reason: motivo });
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔨 Ban Orbital')
                .setDescription(`**${user.username}** foi banido orbitalmente!`)
                .addFields(
                    { name: '📝 Motivo', value: motivo, inline: true },
                    { name: '👑 Moderador', value: message.author.tag, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Usuário banido' });
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            await message.reply('❌ Erro orbital ao banir usuário!');
        }
    }
};