// commands/admin/unbanOrbital.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'unban',
    aliases: ['desbanir', 'unbanorbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('BanMembers')) {
            return message.reply('❌ Você não tem permissão orbital para usar este comando!');
        }
        
        const userId = args[0];
        if (!userId) return message.reply('❌ Use: `bt!unban <user_id>`');
        
        try {
            await message.guild.members.unban(userId);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Unban Orbital')
                .setDescription(`Usuário com ID **${userId}** foi desbanido orbitalmente!`)
                .addFields(
                    { name: '👑 Moderador', value: message.author.tag, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Usuário desbanido' });
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            await message.reply('❌ Erro orbital ao desbanir usuário!');
        }
    }
};