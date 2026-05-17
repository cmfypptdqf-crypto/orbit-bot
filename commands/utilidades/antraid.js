// commands/admin/antiRaidOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ antiRaid: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

// Cache de mensagens para detectar spam
const messageCache = new Map();
const joinCache = new Map();

module.exports = {
    name: 'antiraid',
    aliases: ['raid', 'protecao', 'antiraidorbital'],
    
    async executePrefix(message, args, client) {
        // Verificar permissão de administrador
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Apenas administradores orbitais podem usar este comando!');
        }
        
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        const guildId = message.guild.id;
        
        if (!db.antiRaid[guildId]) {
            db.antiRaid[guildId] = {
                ativo: false,
                limiteMensagens: 5,
                limiteJoins: 3,
                tempoJanela: 5000,
                acao: 'kick',
                canaisIgnorados: [],
                cargosIgnorados: []
            };
            saveDB(db);
        }
        
        const config = db.antiRaid[guildId];
        
        // ========== ATIVAR/DESATIVAR ==========
        if (subcmd === 'ativar') {
            config.ativo = true;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🛡️ Anti-Raid Orbital Ativado!')
                .setDescription('📡 O sistema de proteção orbital está ativo!')
                .addFields(
                    { name: '🛡️ Limite de Mensagens', value: `${config.limiteMensagens} mensagens em ${config.tempoJanela / 1000}s`, inline: true },
                    { name: '👥 Limite de Entradas', value: `${config.limiteJoins} membros em ${config.tempoJanela / 1000}s`, inline: true },
                    { name: '⚡ Ação', value: config.acao, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Proteção orbital ativada' });
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'desativar') {
            config.ativo = false;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🛡️ Anti-Raid Orbital Desativado!')
                .setDescription('📡 O sistema de proteção orbital foi desativado.')
                .setFooter({ text: '🌌 Orbit • Proteção orbital desativada' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== CONFIGURAR ==========
        else if (subcmd === 'config') {
            const tipo = args[1]?.toLowerCase();
            const valor = parseInt(args[2]);
            
            if (tipo === 'mensagens') {
                if (isNaN(valor) || valor < 1 || valor > 20) {
                    return message.reply('❌ Limite de mensagens deve ser entre 1 e 20!');
                }
                config.limiteMensagens = valor;
                saveDB(db);
                await message.reply(`✅ Limite de mensagens orbital alterado para **${valor}** mensagens!`);
            }
            
            else if (tipo === 'joins') {
                if (isNaN(valor) || valor < 1 || valor > 10) {
                    return message.reply('❌ Limite de entradas deve ser entre 1 e 10!');
                }
                config.limiteJoins = valor;
                saveDB(db);
                await message.reply(`✅ Limite de entradas orbital alterado para **${valor}** membros!`);
            }
            
            else if (tipo === 'tempo') {
                if (isNaN(valor) || valor < 1 || valor > 30) {
                    return message.reply('❌ Tempo da janela deve ser entre 1 e 30 segundos!');
                }
                config.tempoJanela = valor * 1000;
                saveDB(db);
                await message.reply(`✅ Janela de tempo orbital alterada para **${valor}** segundos!`);
            }
            
            else if (tipo === 'acao') {
                const acao = args[2]?.toLowerCase();
                if (!['kick', 'ban', 'mute', 'warn'].includes(acao)) {
                    return message.reply('❌ Ação inválida! Opções: kick, ban, mute, warn');
                }
                config.acao = acao;
                saveDB(db);
                await message.reply(`✅ Ação orbital alterada para **${acao}**!`);
            }
            
            else {
                const embed = new EmbedBuilder()
                    .setColor(0xFFD700)
                    .setTitle('⚙️ Configuração Anti-Raid Orbital')
                    .setDescription('Comandos disponíveis:')
                    .addFields(
                        { name: '📊 Status', value: config.ativo ? '🟢 ATIVO' : '🔴 DESATIVADO', inline: true },
                        { name: '📝 Limite Mensagens', value: `${config.limiteMensagens}`, inline: true },
                        { name: '👥 Limite Joins', value: `${config.limiteJoins}`, inline: true },
                        { name: '⏰ Janela de Tempo', value: `${config.tempoJanela / 1000}s`, inline: true },
                        { name: '⚡ Ação', value: config.acao, inline: true },
                        { name: '💡 Comandos', value: '`antiraid config mensagens <n>`\n`antiraid config joins <n>`\n`antiraid config tempo <s>`\n`antiraid config acao <kick/ban/mute/warn>`', inline: false }
                    );
                
                await message.reply({ embeds: [embed] });
            }
        }
        
        // ========== IGNORAR CANAL ==========
        else if (subcmd === 'ignorar') {
            const canal = message.mentions.channels.first() || message.channel;
            
            if (config.canaisIgnorados.includes(canal.id)) {
                config.canaisIgnorados = config.canaisIgnorados.filter(id => id !== canal.id);
                await message.reply(`✅ Canal ${canal} removido da lista de ignorados!`);
            } else {
                config.canaisIgnorados.push(canal.id);
                await message.reply(`✅ Canal ${canal} adicionado à lista de ignorados!`);
            }
            saveDB(db);
        }
        
        // ========== STATUS ==========
        else if (subcmd === 'status') {
            const embed = new EmbedBuilder()
                .setColor(config.ativo ? 0x00FF00 : 0xFF0000)
                .setTitle('🛡️ Status Anti-Raid Orbital')
                .addFields(
                    { name: '📊 Status', value: config.ativo ? '🟢 ATIVO' : '🔴 DESATIVADO', inline: true },
                    { name: '📝 Limite Mensagens', value: `${config.limiteMensagens}`, inline: true },
                    { name: '👥 Limite Joins', value: `${config.limiteJoins}`, inline: true },
                    { name: '⏰ Janela de Tempo', value: `${config.tempoJanela / 1000}s`, inline: true },
                    { name: '⚡ Ação', value: config.acao, inline: true },
                    { name: '🚫 Canais Ignorados', value: config.canaisIgnorados.length > 0 ? config.canaisIgnorados.map(id => `<#${id}>`).join(', ') : 'Nenhum', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Sistema de proteção orbital' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== LIMPAR CACHE ==========
        else if (subcmd === 'limpar') {
            messageCache.clear();
            joinCache.clear();
            await message.reply('✅ Cache anti-raid orbital limpo!');
        }
        
        // ========== AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🛡️ Anti-Raid Orbital')
                .setDescription('Comandos de proteção orbital:')
                .addFields(
                    { name: '🔛 `antiraid ativar`', value: 'Ativa o sistema anti-raid', inline: false },
                    { name: '🔚 `antiraid desativar`', value: 'Desativa o sistema anti-raid', inline: false },
                    { name: '⚙️ `antiraid config`', value: 'Configura o sistema', inline: false },
                    { name: '🚫 `antiraid ignorar`', value: 'Ignora um canal', inline: false },
                    { name: '📊 `antiraid status`', value: 'Mostra status do sistema', inline: false },
                    { name: '🗑️ `antiraid limpar`', value: 'Limpa o cache', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Proteja seu servidor orbital!' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};

// Evento para detectar spam de mensagens
module.exports.handleMessage = async (message, client) => {
    if (message.author.bot) return;
    
    const db = getDB();
    const guildId = message.guild.id;
    const config = db.antiRaid?.[guildId];
    
    if (!config || !config.ativo) return;
    if (config.canaisIgnorados?.includes(message.channel.id)) return;
    
    const key = `${guildId}_${message.author.id}`;
    const now = Date.now();
    
    if (!messageCache.has(key)) {
        messageCache.set(key, []);
    }
    
    const timestamps = messageCache.get(key);
    timestamps.push(now);
    
    // Remover timestamps antigos
    while (timestamps.length && timestamps[0] < now - config.tempoJanela) {
        timestamps.shift();
    }
    
    if (timestamps.length >= config.limiteMensagens) {
        // Aplicar ação
        const member = message.guild.members.cache.get(message.author.id);
        
        if (config.acao === 'kick') {
            await member.kick('Anti-Raid Orbital: Spam detectado').catch(() => {});
            message.channel.send(`🚨 **${member.user.username}** foi expulso por spam orbital!`);
        } else if (config.acao === 'ban') {
            await member.ban({ reason: 'Anti-Raid Orbital: Spam detectado' }).catch(() => {});
            message.channel.send(`🚨 **${member.user.username}** foi banido por spam orbital!`);
        } else if (config.acao === 'mute') {
            const mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted');
            if (mutedRole) {
                await member.roles.add(mutedRole).catch(() => {});
                message.channel.send(`🚨 **${member.user.username}** foi mutado por spam orbital!`);
            }
        }
        
        messageCache.delete(key);
    }
};

// Evento para detectar spam de entrada
module.exports.handleGuildMemberAdd = async (member, client) => {
    const db = getDB();
    const guildId = member.guild.id;
    const config = db.antiRaid?.[guildId];
    
    if (!config || !config.ativo) return;
    
    const key = `${guildId}_joins`;
    const now = Date.now();
    
    if (!joinCache.has(key)) {
        joinCache.set(key, []);
    }
    
    const timestamps = joinCache.get(key);
    timestamps.push(now);
    
    while (timestamps.length && timestamps[0] < now - config.tempoJanela) {
        timestamps.shift();
    }
    
    if (timestamps.length >= config.limiteJoins) {
        // Ativar modo de lockdown
        const channel = member.guild.systemChannel || member.guild.channels.cache.first();
        if (channel) {
            await channel.send('🚨 **ALERTA ORBITAL!** Possível raid detectada! Ativando modo de segurança...');
        }
        
        // Bloquear entrada de novos membros
        await member.guild.channels.cache.forEach(async channel => {
            await channel.permissionOverwrites.edit(member.guild.id, { CreateInstantInvite: false }).catch(() => {});
        });
        
        joinCache.delete(key);
    }
};