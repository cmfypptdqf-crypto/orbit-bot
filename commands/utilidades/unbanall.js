// commands/admin/unbanAllOrbital.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'unbanall',
    aliases: ['desbanirtodos', 'unbanallorbital'],
    
    async executePrefix(message, args, client) {
        // Verificar se é o dono do servidor
        if (message.author.id !== message.guild.ownerId) {
            return message.reply('❌ **ACESSO ORBITAL NEGADO!**\n📡 Apenas o **Comandante Orbital Supremo** (dono do servidor) pode usar este comando!');
        }
        
        const confirm = args[0]?.toLowerCase();
        if (confirm !== 'confirmar') {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('⚠️ ALERTA ORBITAL!')
                .setDescription('📡 Isso irá desbanir **TODOS** os usuários banidos do servidor!\nEsta ação é **IRREVERSÍVEL** e será registrada nos logs orbitais.')
                .addFields(
                    { name: '🔒 Para confirmar', value: 'Use `bt!unbanall confirmar`', inline: true },
                    { name: '👑 Apenas o dono', value: message.guild.owner.user.tag, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Ação restrita ao Comandante Orbital Supremo' });
            
            return message.reply({ embeds: [embed] });
        }
        
        try {
            const bans = await message.guild.bans.fetch();
            
            if (bans.size === 0) {
                return message.reply('📊 Nenhum usuário orbital está banido neste servidor!');
            }
            
            let count = 0;
            const usuariosBanidos = [];
            
            for (const ban of bans.values()) {
                await message.guild.members.unban(ban.user.id);
                count++;
                usuariosBanidos.push(`${ban.user.tag} (${ban.user.id})`);
            }
            
            // Registrar em um canal de logs (opcional)
            const logChannel = message.guild.channels.cache.find(c => c.name === 'logs' || c.name === 'admin-logs');
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Unban Orbital em Massa')
                .setDescription(`📡 **${count} usuários** foram desbanidos orbitalmente pelo Comandante Orbital Supremo!`)
                .addFields(
                    { name: '👑 Executado por', value: message.author.tag, inline: true },
                    { name: '📊 Total desbanidos', value: `${count}`, inline: true },
                    { name: '📋 Usuários desbanidos', value: usuariosBanidos.join('\n') || 'Lista extensa', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Ação registrada pelo Comandante Orbital Supremo' });
            
            await message.reply({ embeds: [embed] });
            
            if (logChannel) {
                await logChannel.send({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error(error);
            await message.reply('❌ Erro orbital ao desbanir usuários!');
        }
    }
};