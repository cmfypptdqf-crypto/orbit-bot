// commands/admin/restoreOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'restore',
    aliases: ['restaurar', 'restoreorbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Apenas administradores orbitais podem usar este comando!');
        }
        
        const confirm = args[0]?.toLowerCase();
        if (confirm !== 'confirmar') {
            return message.reply('⚠️ **ATENÇÃO ORBITAL!** Isso irá RESTAURAR o servidor a partir de um backup!\nUse `bt!restore confirmar` e anexe o arquivo de backup.');
        }
        
        if (message.attachments.size === 0) {
            return message.reply('❌ Envie o arquivo de backup orbital junto com o comando!');
        }
        
        const attachment = message.attachments.first();
        const backupPath = path.join(__dirname, '..', '..', 'temp_backup.json');
        
        // Baixar backup
        const response = await fetch(attachment.url);
        const data = await response.text();
        fs.writeFileSync(backupPath, data);
        
        const backup = JSON.parse(data);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🔄 Restauração Orbital Iniciada')
            .setDescription(`📡 Restaurando backup do servidor **${backup.nome}**...`)
            .setFooter({ text: '🌌 Orbit • Processando restauração' });
        
        const msg = await message.reply({ embeds: [embed] });
        
        try {
            // Renomear servidor
            await message.guild.setName(backup.nome);
            
            // Recriar canais
            const channels = await message.guild.channels.fetch();
            for (const channel of channels.values()) {
                if (channel.name !== 'geral' && channel.type !== 4) {
                    await channel.delete().catch(() => {});
                }
            }
            
            for (const canal of backup.canais) {
                if (canal.tipo === 4) {
                    await message.guild.channels.create({ name: canal.nome, type: 4 });
                } else if (canal.tipo === 0) {
                    await message.guild.channels.create({ name: canal.nome, type: 0 });
                }
            }
            
            const embedFinal = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Restauração Orbital Concluída!')
                .setDescription(`📡 Backup do servidor **${backup.nome}** restaurado com sucesso!`)
                .addFields(
                    { name: '📊 Canais restaurados', value: `${backup.canais.length}`, inline: true },
                    { name: '👑 Solicitado por', value: message.author.tag, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Restauração orbital realizada' });
            
            await msg.edit({ embeds: [embedFinal] });
            
        } catch (error) {
            console.error(error);
            await message.reply('❌ Erro orbital ao restaurar backup!');
        }
        
        fs.unlinkSync(backupPath);
    }
};