// commands/admin/muteOrbital.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'mute',
    aliases: ['silenciar', 'mutear', 'muteorbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('ModerateMembers')) {
            return message.reply('❌ Você não tem permissão orbital para usar este comando!');
        }
        
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!mute @usuario <tempo> <motivo>`');
        
        const member = message.guild.members.cache.get(user.id);
        if (!member) return message.reply('❌ Usuário orbital não encontrado!');
        
        const tempo = args[1];
        const motivo = args.slice(2).join(' ') || 'Não especificado';
        
        let tempoMs = 0;
        let unidade = '';
        
        if (tempo?.endsWith('s')) {
            tempoMs = parseInt(tempo) * 1000;
            unidade = `${parseInt(tempo)} segundos`;
        } else if (tempo?.endsWith('m')) {
            tempoMs = parseInt(tempo) * 60 * 1000;
            unidade = `${parseInt(tempo)} minutos`;
        } else if (tempo?.endsWith('h')) {
            tempoMs = parseInt(tempo) * 60 * 60 * 1000;
            unidade = `${parseInt(tempo)} horas`;
        } else if (tempo?.endsWith('d')) {
            tempoMs = parseInt(tempo) * 24 * 60 * 60 * 1000;
            unidade = `${parseInt(tempo)} dias`;
        } else {
            return message.reply('❌ Formato orbital inválido! Use: `10s`, `5m`, `2h`, `1d`');
        }
        
        try {
            await member.timeout(tempoMs, motivo);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🔇 Mute Orbital')
                .setDescription(`**${user.username}** foi mutado orbitalmente!`)
                .addFields(
                    { name: '⏰ Duração', value: unidade, inline: true },
                    { name: '📝 Motivo', value: motivo, inline: true },
                    { name: '👑 Moderador', value: message.author.tag, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Usuário silenciado' });
            
            await message.reply({ embeds: [embed] });
            
            try {
                await user.send(`🔇 Você foi mutado em **${message.guild.name}**\n⏰ Duração: ${unidade}\n📝 Motivo: ${motivo}`);
            } catch (e) {}
            
        } catch (error) {
            await message.reply('❌ Erro orbital ao mutar usuário!');
        }
    }
};