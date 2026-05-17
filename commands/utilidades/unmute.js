// commands/admin/unmuteOrbital.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'unmute',
    aliases: ['desmutear', 'unmuteorbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('ModerateMembers')) {
            return message.reply('❌ Você não tem permissão orbital para usar este comando!');
        }
        
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!unmute @usuario`');
        
        const member = message.guild.members.cache.get(user.id);
        if (!member) return message.reply('❌ Usuário orbital não encontrado!');
        
        try {
            await member.timeout(null);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔊 Unmute Orbital')
                .setDescription(`**${user.username}** foi desmutado orbitalmente!`)
                .addFields(
                    { name: '👑 Moderador', value: message.author.tag, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Usuário liberado' });
            
            await message.reply({ embeds: [embed] });
            
            try {
                await user.send(`🔊 Você foi desmutado em **${message.guild.name}**!`);
            } catch (e) {}
            
        } catch (error) {
            await message.reply('❌ Erro orbital ao desmutar usuário!');
        }
    }
};