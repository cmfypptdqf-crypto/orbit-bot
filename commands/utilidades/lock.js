// commands/admin/lockdownOrbital.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'lockdown',
    aliases: ['lock', 'bloquear', 'lockdownorbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Apenas administradores orbitais podem usar este comando!');
        }
        
        const subcmd = args[0]?.toLowerCase();
        const cargo = message.guild.roles.everyone;
        
        if (subcmd === 'on' || subcmd === 'ativar') {
            await message.channel.permissionOverwrites.edit(cargo, {
                SendMessages: false
            });
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔒 Lockdown Orbital Ativado!')
                .setDescription(`📡 O canal ${message.channel} está em lockdown orbital!`)
                .addFields(
                    { name: '👑 Ativado por', value: message.author.tag, inline: true },
                    { name: '🔒 Status', value: 'BLOQUEADO', inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Canal bloqueado para mensagens' });
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'off' || subcmd === 'desativar') {
            await message.channel.permissionOverwrites.edit(cargo, {
                SendMessages: null
            });
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔓 Lockdown Orbital Desativado!')
                .setDescription(`📡 O canal ${message.channel} está liberado orbitalmente!`)
                .addFields(
                    { name: '👑 Desativado por', value: message.author.tag, inline: true },
                    { name: '🔓 Status', value: 'LIBERADO', inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Canal liberado para mensagens' });
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('📋 **Lockdown Orbital**\n`lockdown on` - Bloquear canal\n`lockdown off` - Liberar canal');
        }
    }
};