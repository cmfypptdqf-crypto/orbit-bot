// utilidades/eventosLogs.js
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ logsConfig: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = async (client) => {
    // ========== LOG DE MENSAGEM DELETADA ==========
    client.on('messageDelete', async (message) => {
        if (message.author?.bot) return;
        if (!message.guild) return;
        
        const db = getDB();
        const config = db.logsConfig[message.guild?.id];
        if (!config?.canalMensagens) return;
        
        const logChannel = message.guild.channels.cache.get(config.canalMensagens);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🗑️ Mensagem Deletada')
            .setDescription(`📡 Uma mensagem foi deletada orbitalmente!`)
            .addFields(
                { name: '👤 Autor', value: message.author?.tag || 'Desconhecido', inline: true },
                { name: '📝 Canal', value: `<#${message.channel.id}>`, inline: true },
                { name: '📄 Conteúdo', value: message.content?.slice(0, 1000) || '*(sem conteúdo de texto)*', inline: false },
                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: `ID: ${message.author?.id || 'Desconhecido'} • 🌌 Orbit Logs` });
        
        if (message.attachments.size > 0) {
            embed.addFields({ name: '📎 Anexos', value: message.attachments.map(a => `[${a.name}](${a.url})`).join('\n'), inline: false });
        }
        
        await logChannel.send({ embeds: [embed] });
    });
    
    // ========== LOG DE MENSAGEM EDITADA ==========
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (oldMessage.author?.bot) return;
        if (!oldMessage.guild) return;
        if (oldMessage.content === newMessage.content) return;
        
        const db = getDB();
        const config = db.logsConfig[oldMessage.guild?.id];
        if (!config?.canalMensagens) return;
        
        const logChannel = oldMessage.guild.channels.cache.get(config.canalMensagens);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('✏️ Mensagem Editada')
            .setDescription(`📡 Uma mensagem foi editada orbitalmente!`)
            .addFields(
                { name: '👤 Autor', value: oldMessage.author?.tag || 'Desconhecido', inline: true },
                { name: '📝 Canal', value: `<#${oldMessage.channel.id}>`, inline: true },
                { name: '📄 Antes', value: oldMessage.content?.slice(0, 1000) || '*(sem conteúdo)*', inline: false },
                { name: '📄 Depois', value: newMessage.content?.slice(0, 1000) || '*(sem conteúdo)*', inline: false },
                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: `ID: ${oldMessage.author?.id || 'Desconhecido'} • 🌌 Orbit Logs` });
        
        await logChannel.send({ embeds: [embed] });
    });
    
    // ========== LOG DE ENTRADA NO SERVIDOR ==========
    client.on('guildMemberAdd', async (member) => {
        const db = getDB();
        const config = db.logsConfig[member.guild.id];
        if (!config?.canalEntradaSaida) return;
        
        const logChannel = member.guild.channels.cache.get(config.canalEntradaSaida);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🟢 Membro Entrou')
            .setDescription(`📡 ${member.user.tag} entrou no servidor orbital!`)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '📅 Data de entrada', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '📅 Conta criada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '🆔 ID', value: member.id, inline: true }
            )
            .setFooter({ text: `Total de membros: ${member.guild.memberCount} • 🌌 Orbit Logs` });
        
        await logChannel.send({ embeds: [embed] });
    });
    
    // ========== LOG DE SAÍDA DO SERVIDOR ==========
    client.on('guildMemberRemove', async (member) => {
        const db = getDB();
        const config = db.logsConfig[member.guild.id];
        if (!config?.canalEntradaSaida) return;
        
        const logChannel = member.guild.channels.cache.get(config.canalEntradaSaida);
        if (!logChannel) return;
        
        let motivo = 'Saída voluntária';
        let punidor = null;
        
        try {
            const auditLogs = await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberKick });
            const kickLog = auditLogs.entries.find(entry => entry.target.id === member.id);
            if (kickLog) {
                motivo = `Expulso`;
                punidor = kickLog.executor.tag;
            }
        } catch (e) {}
        
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔴 Membro Saiu')
            .setDescription(`📡 ${member.user.tag} saiu do servidor orbital!`)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '📅 Data de saída', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '📝 Motivo', value: motivo, inline: true },
                { name: '🆔 ID', value: member.id, inline: true }
            )
            .setFooter({ text: `Total de membros: ${member.guild.memberCount} • 🌌 Orbit Logs` });
        
        if (punidor) {
            embed.addFields({ name: '👑 Expulso por', value: punidor, inline: true });
        }
        
        await logChannel.send({ embeds: [embed] });
    });
    
    // ========== LOG DE ENTRADA/SAÍDA DE CALL ==========
    client.on('voiceStateUpdate', async (oldState, newState) => {
        if (!oldState.guild) return;
        
        const db = getDB();
        const config = db.logsConfig[oldState.guild.id];
        if (!config?.canalCall) return;
        
        const logChannel = oldState.guild.channels.cache.get(config.canalCall);
        if (!logChannel) return;
        
        const member = oldState.member;
        if (!member) return;
        
        // Entrou em uma call
        if (!oldState.channelId && newState.channelId) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🎤 Membro Entrou na Call')
                .setDescription(`📡 ${member.user.tag} entrou no canal de voz!`)
                .addFields(
                    { name: '📡 Canal', value: `<#${newState.channelId}>`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `ID: ${member.id} • 🌌 Orbit Logs` });
            
            await logChannel.send({ embeds: [embed] });
        }
        
        // Saiu de uma call
        else if (oldState.channelId && !newState.channelId) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔇 Membro Saiu da Call')
                .setDescription(`📡 ${member.user.tag} saiu do canal de voz!`)
                .addFields(
                    { name: '📡 Canal', value: `<#${oldState.channelId}>`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `ID: ${member.id} • 🌌 Orbit Logs` });
            
            await logChannel.send({ embeds: [embed] });
        }
        
        // Trocou de canal
        else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🔄 Membro Trocou de Call')
                .setDescription(`📡 ${member.user.tag} trocou de canal de voz!`)
                .addFields(
                    { name: '➡️ De', value: `<#${oldState.channelId}>`, inline: true },
                    { name: '⬅️ Para', value: `<#${newState.channelId}>`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `ID: ${member.id} • 🌌 Orbit Logs` });
            
            await logChannel.send({ embeds: [embed] });
        }
    });
    
    // ========== LOG DE CARGO ADICIONADO ==========
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (!oldMember.guild) return;
        
        const db = getDB();
        const config = db.logsConfig[oldMember.guild.id];
        if (!config?.canalCargos) return;
        
        const logChannel = oldMember.guild.channels.cache.get(config.canalCargos);
        if (!logChannel) return;
        
        const oldRoles = oldMember.roles.cache.map(r => r.id);
        const newRoles = newMember.roles.cache.map(r => r.id);
        
        const addedRoles = newRoles.filter(r => !oldRoles.includes(r));
        const removedRoles = oldRoles.filter(r => !newRoles.includes(r));
        
        if (addedRoles.length > 0) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('➕ Cargo Adicionado')
                .setDescription(`📡 ${newMember.user.tag} recebeu um novo cargo orbital!`)
                .addFields(
                    { name: '🎖️ Cargo', value: addedRoles.map(r => `<@&${r}>`).join(', '), inline: true },
                    { name: '👤 Usuário', value: newMember.user.tag, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `ID: ${newMember.id} • 🌌 Orbit Logs` });
            
            await logChannel.send({ embeds: [embed] });
        }
        
        if (removedRoles.length > 0) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('➖ Cargo Removido')
                .setDescription(`📡 ${newMember.user.tag} perdeu um cargo orbital!`)
                .addFields(
                    { name: '🎖️ Cargo', value: removedRoles.map(r => `<@&${r}>`).join(', '), inline: true },
                    { name: '👤 Usuário', value: newMember.user.tag, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `ID: ${newMember.id} • 🌌 Orbit Logs` });
            
            await logChannel.send({ embeds: [embed] });
        }
    });
    
    // ========== LOG DE ALTERAÇÃO DE CARGO ==========
    client.on('roleUpdate', async (oldRole, newRole) => {
        if (!oldRole.guild) return;
        
        const db = getDB();
        const config = db.logsConfig[oldRole.guild.id];
        if (!config?.canalCargos) return;
        
        const logChannel = oldRole.guild.channels.cache.get(config.canalCargos);
        if (!logChannel) return;
        
        const changes = [];
        
        if (oldRole.name !== newRole.name) {
            changes.push(`📝 Nome: **${oldRole.name}** → **${newRole.name}**`);
        }
        if (oldRole.color !== newRole.color) {
            changes.push(`🎨 Cor: **${oldRole.hexColor}** → **${newRole.hexColor}**`);
        }
        if (oldRole.hoist !== newRole.hoist) {
            changes.push(`📌 Exibir separadamente: **${oldRole.hoist}** → **${newRole.hoist}**`);
        }
        if (oldRole.mentionable !== newRole.mentionable) {
            changes.push(`🔔 Mencionável: **${oldRole.mentionable}** → **${newRole.mentionable}**`);
        }
        
        if (changes.length > 0) {
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('⚙️ Cargo Atualizado')
                .setDescription(`📡 O cargo ${newRole} foi modificado orbitalmente!`)
                .addFields(
                    { name: '📝 Alterações', value: changes.join('\n'), inline: false },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `ID: ${newRole.id} • 🌌 Orbit Logs` });
            
            await logChannel.send({ embeds: [embed] });
        }
    });
    
    // ========== LOG DE CRIAÇÃO/EXCLUSÃO DE CANAL ==========
    client.on('channelCreate', async (channel) => {
        if (!channel.guild) return;
        
        const db = getDB();
        const config = db.logsConfig[channel.guild.id];
        if (!config?.canalModeracao) return;
        
        const logChannel = channel.guild.channels.cache.get(config.canalModeracao);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🆕 Canal Criado')
            .setDescription(`📡 Um novo canal foi criado orbitalmente!`)
            .addFields(
                { name: '📡 Canal', value: `<#${channel.id}>`, inline: true },
                { name: '📝 Nome', value: channel.name, inline: true },
                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: `ID: ${channel.id} • 🌌 Orbit Logs` });
        
        await logChannel.send({ embeds: [embed] });
    });
    
    client.on('channelDelete', async (channel) => {
        if (!channel.guild) return;
        
        const db = getDB();
        const config = db.logsConfig[channel.guild.id];
        if (!config?.canalModeracao) return;
        
        const logChannel = channel.guild.channels.cache.get(config.canalModeracao);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🗑️ Canal Deletado')
            .setDescription(`📡 Um canal foi deletado orbitalmente!`)
            .addFields(
                { name: '📝 Nome', value: channel.name, inline: true },
                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: `ID: ${channel.id} • 🌌 Orbit Logs` });
        
        await logChannel.send({ embeds: [embed] });
    });
    
    // ========== LOG DE BAN ==========
    client.on('guildBanAdd', async (ban) => {
        const db = getDB();
        const config = db.logsConfig[ban.guild.id];
        if (!config?.canalPunicoes) return;
        
        const logChannel = ban.guild.channels.cache.get(config.canalPunicoes);
        if (!logChannel) return;
        
        let motivo = 'Não especificado';
        let punidor = 'Desconhecido';
        
        try {
            const auditLogs = await ban.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
            const banLog = auditLogs.entries.first();
            if (banLog && banLog.target.id === ban.user.id) {
                punidor = banLog.executor.tag;
                motivo = banLog.reason || 'Não especificado';
            }
        } catch (e) {}
        
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔨 Usuário Banido')
            .setDescription(`📡 ${ban.user.tag} foi banido orbitalmente!`)
            .addFields(
                { name: '📝 Motivo', value: motivo, inline: true },
                { name: '👑 Banido por', value: punidor, inline: true },
                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: `ID: ${ban.user.id} • 🌌 Orbit Logs` });
        
        await logChannel.send({ embeds: [embed] });
    });
    
    // ========== LOG DE DESBAN ==========
    client.on('guildBanRemove', async (ban) => {
        const db = getDB();
        const config = db.logsConfig[ban.guild.id];
        if (!config?.canalPunicoes) return;
        
        const logChannel = ban.guild.channels.cache.get(config.canalPunicoes);
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Usuário Desbanido')
            .setDescription(`📡 ${ban.user.tag} foi desbanido orbitalmente!`)
            .addFields(
                { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: `ID: ${ban.user.id} • 🌌 Orbit Logs` });
        
        await logChannel.send({ embeds: [embed] });
    });
    
    // ========== LOG DE MUTE (TIMEOUT) ==========
    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (!oldMember.guild) return;
        
        const db = getDB();
        const config = db.logsConfig[oldMember.guild.id];
        if (!config?.canalPunicoes) return;
        
        const logChannel = oldMember.guild.channels.cache.get(config.canalPunicoes);
        if (!logChannel) return;
        
        // Usuário foi mutado (timeout)
        if (!oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
            const duracao = newMember.communicationDisabledUntil;
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🔇 Usuário Mutado')
                .setDescription(`📡 ${newMember.user.tag} foi mutado orbitalmente!`)
                .addFields(
                    { name: '⏰ Duração', value: `<t:${Math.floor(duracao / 1000)}:R>`, inline: true },
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `ID: ${newMember.id} • 🌌 Orbit Logs` });
            
            await logChannel.send({ embeds: [embed] });
        }
        
        // Usuário foi desmutado
        if (oldMember.communicationDisabledUntil && !newMember.communicationDisabledUntil) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔊 Usuário Desmutado')
                .setDescription(`📡 ${newMember.user.tag} foi desmutado orbitalmente!`)
                .addFields(
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setFooter({ text: `ID: ${newMember.id} • 🌌 Orbit Logs` });
            
            await logChannel.send({ embeds: [embed] });
        }
    });
    
    console.log('📡 Sistema de Logs Orbitais carregado com sucesso!');
};