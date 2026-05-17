// commands/admin/backupOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'backup',
    aliases: ['backupserver', 'backuporbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Apenas administradores orbitais podem usar este comando!');
        }
        
        const guild = message.guild;
        
        try {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('💾 Backup Orbital Iniciado')
                .setDescription('📡 Criando backup orbital do servidor...')
                .setFooter({ text: '🌌 Orbit • Processando dados' });
            
            const msg = await message.reply({ embeds: [embed] });
            
            // Coletar dados do servidor
            const backup = {
                nome: guild.name,
                id: guild.id,
                icone: guild.iconURL(),
                membros: guild.memberCount,
                data: new Date().toISOString(),
                canais: [],
                cargos: []
            };
            
            // Coletar canais
            const channels = await guild.channels.fetch();
            for (const channel of channels.values()) {
                backup.canais.push({
                    nome: channel.name,
                    tipo: channel.type,
                    id: channel.id
                });
            }
            
            // Coletar cargos
            const roles = await guild.roles.fetch();
            for (const role of roles.values()) {
                backup.cargos.push({
                    nome: role.name,
                    cor: role.color,
                    id: role.id
                });
            }
            
            // Salvar backup
            const backupPath = path.join(__dirname, '..', '..', `backup_${guild.id}_${Date.now()}.json`);
            fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
            
            const embedFinal = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('💾 Backup Orbital Concluído!')
                .setDescription(`📡 Backup do servidor **${guild.name}** criado com sucesso!`)
                .addFields(
                    { name: '📊 Canais salvos', value: `${backup.canais.length}`, inline: true },
                    { name: '📋 Cargos salvos', value: `${backup.cargos.length}`, inline: true },
                    { name: '👥 Membros', value: `${backup.membros}`, inline: true },
                    { name: '👑 Solicitado por', value: message.author.tag, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Backup orbital salvo' });
            
            await msg.edit({ 
                embeds: [embedFinal],
                files: [{ attachment: backupPath, name: `backup_${guild.id}.json` }]
            });
            
            // Deletar arquivo após 5 minutos
            setTimeout(() => {
                fs.unlinkSync(backupPath);
            }, 300000);
            
        } catch (error) {
            console.error(error);
            await message.reply('❌ Erro orbital ao criar backup!');
        }
    }
};