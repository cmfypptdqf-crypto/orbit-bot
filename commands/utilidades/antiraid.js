// commands/admin/antiRaidOrbital.js
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
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

// Caches para detectar ações suspeitas
const messageCache = new Map();
const joinCache = new Map();
const actionCache = new Map(); // Cache para ações de moderação (editar, criar, apagar canais)

module.exports = {
    name: 'antiraid',
    aliases: ['raid', 'protecao', 'antiraidorbital'],
    
    async executePrefix(message, args, client) {
        // ========== VERIFICAR SE É O DONO DO SERVIDOR ==========
        if (message.author.id !== message.guild.ownerId) {
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Acesso Orbital Negado!')
                .setDescription('📡 Apenas o **Comandante Orbital Supremo** (dono do servidor) pode configurar o sistema anti-raid!')
                .addFields(
                    { name: '👑 Dono do Servidor', value: `<@${message.guild.ownerId}>`, inline: true },
                    { name: '🛡️ Seu cargo', value: message.member.roles.highest.name, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Apenas o dono pode alterar configurações de segurança' });
            
            return message.reply({ embeds: [embed] });
        }
        
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        const guildId = message.guild.id;
        
        if (!db.antiRaid[guildId]) {
            db.antiRaid[guildId] = {
                ativo: false,
                limiteMensagens: 5,
                limiteJoins: 3,
                limiteAcoes: 3,           // NOVO: limite de ações de moderação
                tempoJanela: 5000,
                acao: 'kick',
                canaisIgnorados: [],
                cargosIgnorados: [],
                bloquearBots: true,
                botsPermitidos: [],
                cargoParaBots: null,
                bloquearAcoes: true,       // NOVO: bloquear ações de moderação
                acoesIgnoradas: []         // NOVO: cargos/usuários ignorados
            };
            saveDB(db);
        }
        
        const config = db.antiRaid[guildId];
        
        // ========== ATIVAR ==========
        if (subcmd === 'ativar') {
            config.ativo = true;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🛡️ Anti-Raid Orbital Ativado!')
                .setDescription('📡 O sistema de proteção orbital está ativo!')
                .addFields(
                    { name: '🛡️ Limite de Mensagens', value: `${config.limiteMensagens} mensagens em ${config.tempoJanela / 1000}s`, inline: true },
                    { name: '👥 Limite de Entradas', value: `${config.limiteJoins} membros em ${config.tempoJanela / 1000}s`, inline: true },
                    { name: '⚙️ Limite de Ações', value: `${config.limiteAcoes} ações em ${config.tempoJanela / 1000}s`, inline: true },
                    { name: '⚡ Ação', value: config.acao, inline: true },
                    { name: '🤖 Bloquear Bots', value: config.bloquearBots ? '✅ ATIVO' : '❌ DESATIVADO', inline: true },
                    { name: '🔒 Bloquear Ações', value: config.bloquearAcoes ? '✅ ATIVO' : '❌ DESATIVADO', inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Configurado pelo Comandante Orbital Supremo' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== DESATIVAR ==========
        else if (subcmd === 'desativar') {
            config.ativo = false;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🛡️ Anti-Raid Orbital Desativado!')
                .setDescription('📡 O sistema de proteção orbital foi desativado pelo Comandante.')
                .setFooter({ text: '🌌 Orbit • Proteção orbital desativada' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== CONFIGURAR ==========
        else if (subcmd === 'config') {
            const tipo = args[1]?.toLowerCase();
            const valor = args[2];
            
            if (tipo === 'mensagens') {
                const num = parseInt(valor);
                if (isNaN(num) || num < 1 || num > 20) {
                    return message.reply('❌ Limite de mensagens deve ser entre 1 e 20!');
                }
                config.limiteMensagens = num;
                saveDB(db);
                await message.reply(`✅ Limite de mensagens orbital alterado para **${num}** mensagens!`);
            }
            
            else if (tipo === 'joins') {
                const num = parseInt(valor);
                if (isNaN(num) || num < 1 || num > 10) {
                    return message.reply('❌ Limite de entradas deve ser entre 1 e 10!');
                }
                config.limiteJoins = num;
                saveDB(db);
                await message.reply(`✅ Limite de entradas orbital alterado para **${num}** membros!`);
            }
            
            else if (tipo === 'acoes') {
                const num = parseInt(valor);
                if (isNaN(num) || num < 1 || num > 10) {
                    return message.reply('❌ Limite de ações deve ser entre 1 e 10!');
                }
                config.limiteAcoes = num;
                saveDB(db);
                await message.reply(`✅ Limite de ações orbital alterado para **${num}** ações!`);
            }
            
            else if (tipo === 'tempo') {
                const num = parseInt(valor);
                if (isNaN(num) || num < 1 || num > 30) {
                    return message.reply('❌ Tempo da janela deve ser entre 1 e 30 segundos!');
                }
                config.tempoJanela = num * 1000;
                saveDB(db);
                await message.reply(`✅ Janela de tempo orbital alterada para **${num}** segundos!`);
            }
            
            else if (tipo === 'acao') {
                const acao = valor?.toLowerCase();
                if (!['kick', 'ban', 'mute', 'warn'].includes(acao)) {
                    return message.reply('❌ Ação inválida! Opções: kick, ban, mute, warn');
                }
                config.acao = acao;
                saveDB(db);
                await message.reply(`✅ Ação orbital alterada para **${acao}**!`);
            }
            
            else if (tipo === 'bloquear') {
                const sub = args[2]?.toLowerCase();
                if (sub === 'acoes') {
                    const estado = args[3]?.toLowerCase();
                    if (estado === 'ativar') {
                        config.bloquearAcoes = true;
                        saveDB(db);
                        await message.reply('✅ Bloqueio de ações orbital **ATIVADO**! Ações suspeitas serão bloqueadas.');
                    } else if (estado === 'desativar') {
                        config.bloquearAcoes = false;
                        saveDB(db);
                        await message.reply('❌ Bloqueio de ações orbital **DESATIVADO**! Ações não serão monitoradas.');
                    } else {
                        await message.reply('📋 Use: `antiraid config bloquear acoes ativar/desativar`');
                    }
                } else if (sub === 'cargo') {
                    const cargo = message.mentions.roles.first();
                    if (!cargo) return message.reply('❌ Use: `antiraid config bloquear cargo @cargo`');
                    
                    if (!config.acoesIgnoradas) config.acoesIgnoradas = [];
                    if (config.acoesIgnoradas.includes(cargo.id)) {
                        config.acoesIgnoradas = config.acoesIgnoradas.filter(id => id !== cargo.id);
                        await message.reply(`✅ Cargo ${cargo} removido da lista de ignorados!`);
                    } else {
                        config.acoesIgnoradas.push(cargo.id);
                        await message.reply(`✅ Cargo ${cargo} adicionado à lista de ignorados!`);
                    }
                    saveDB(db);
                } else if (sub === 'usuario') {
                    const user = message.mentions.users.first();
                    if (!user) return message.reply('❌ Use: `antiraid config bloquear usuario @user`');
                    
                    if (!config.acoesIgnoradas) config.acoesIgnoradas = [];
                    const key = `user_${user.id}`;
                    if (config.acoesIgnoradas.includes(key)) {
                        config.acoesIgnoradas = config.acoesIgnoradas.filter(id => id !== key);
                        await message.reply(`✅ Usuário ${user} removido da lista de ignorados!`);
                    } else {
                        config.acoesIgnoradas.push(key);
                        await message.reply(`✅ Usuário ${user} adicionado à lista de ignorados!`);
                    }
                    saveDB(db);
                } else {
                    await message.reply('📋 **Configuração de Bloqueio**\n`antiraid config bloquear acoes ativar/desativar`\n`antiraid config bloquear cargo @cargo`\n`antiraid config bloquear usuario @user`');
                }
            }
            
            // ========== CONFIGURAÇÃO DE BOTS ==========
            else if (tipo === 'bots') {
                const sub = args[2]?.toLowerCase();
                
                if (sub === 'ativar') {
                    config.bloquearBots = true;
                    saveDB(db);
                    await message.reply('✅ Bloqueio de bots orbital **ATIVADO**! Novos bots serão automaticamente expulsos.');
                }
                else if (sub === 'desativar') {
                    config.bloquearBots = false;
                    saveDB(db);
                    await message.reply('❌ Bloqueio de bots orbital **DESATIVADO**! Bots poderão entrar normalmente.');
                }
                else if (sub === 'permitir') {
                    const botId = args[3];
                    if (!botId) return message.reply('❌ Use: `bt!antiraid config bots permitir <id_do_bot>`');
                    
                    if (!config.botsPermitidos) config.botsPermitidos = [];
                    if (!config.botsPermitidos.includes(botId)) {
                        config.botsPermitidos.push(botId);
                        saveDB(db);
                        await message.reply(`✅ Bot ID **${botId}** adicionado à lista de bots permitidos orbitais!`);
                    } else {
                        await message.reply(`❌ Bot ID **${botId}** já está na lista de permitidos!`);
                    }
                }
                else if (sub === 'remover') {
                    const botId = args[3];
                    if (!botId) return message.reply('❌ Use: `bt!antiraid config bots remover <id_do_bot>`');
                    
                    if (config.botsPermitidos && config.botsPermitidos.includes(botId)) {
                        config.botsPermitidos = config.botsPermitidos.filter(id => id !== botId);
                        saveDB(db);
                        await message.reply(`✅ Bot ID **${botId}** removido da lista de bots permitidos orbitais!`);
                    } else {
                        await message.reply(`❌ Bot ID **${botId}** não está na lista de permitidos!`);
                    }
                }
                else if (sub === 'cargo') {
                    const cargo = message.mentions.roles.first();
                    if (!cargo) return message.reply('❌ Use: `bt!antiraid config bots cargo @cargo`');
                    
                    config.cargoParaBots = cargo.id;
                    saveDB(db);
                    await message.reply(`✅ Cargo **${cargo.name}** será automaticamente adicionado a bots permitidos!`);
                }
                else if (sub === 'lista') {
                    const embed = new EmbedBuilder()
                        .setColor(0x00008B)
                        .setTitle('🤖 Lista de Bots Permitidos Orbitais')
                        .setDescription(config.botsPermitidos?.length > 0 ? config.botsPermitidos.map(id => `<@${id}>`).join('\n') : 'Nenhum bot permitido')
                        .addFields(
                            { name: '📊 Status', value: config.bloquearBots ? '🟢 BLOQUEIO ATIVO' : '🔴 BLOQUEIO DESATIVADO', inline: true },
                            { name: '🎖️ Cargo automático', value: config.cargoParaBots ? `<@&${config.cargoParaBots}>` : '❌ Nenhum', inline: true }
                        )
                        .setFooter({ text: '🌌 Orbit • Bots permitidos podem entrar no servidor' });
                    
                    await message.reply({ embeds: [embed] });
                }
                else {
                    await message.reply('📋 **Configuração de Bots**\n`antiraid config bots ativar` - Ativar bloqueio\n`antiraid config bots desativar` - Desativar bloqueio\n`antiraid config bots permitir <id>` - Permitir bot específico\n`antiraid config bots remover <id>` - Remover permissão\n`antiraid config bots cargo @cargo` - Cargo automático\n`antiraid config bots lista` - Ver bots permitidos');
                }
            }
            
            else if (tipo === 'ignorar') {
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
            
            else {
                const embed = new EmbedBuilder()
                    .setColor(0x00008B)
                    .setTitle('⚙️ Configuração Anti-Raid Orbital')
                    .setDescription('Comandos disponíveis (apenas dono do servidor):')
                    .addFields(
                        { name: '📝 `antiraid config mensagens <n>`', value: 'Limite de mensagens', inline: false },
                        { name: '👥 `antiraid config joins <n>`', value: 'Limite de entradas', inline: false },
                        { name: '⚙️ `antiraid config acoes <n>`', value: 'Limite de ações (editar/criar/apagar canais)', inline: false },
                        { name: '⏰ `antiraid config tempo <s>`', value: 'Janela de tempo', inline: false },
                        { name: '⚡ `antiraid config acao <kick/ban/mute/warn>`', value: 'Ação padrão', inline: false },
                        { name: '🔒 `antiraid config bloquear acoes ativar/desativar`', value: 'Bloquear ações suspeitas', inline: false },
                        { name: '🎖️ `antiraid config bloquear cargo @cargo`', value: 'Ignorar cargo nas ações', inline: false },
                        { name: '👤 `antiraid config bloquear usuario @user`', value: 'Ignorar usuário nas ações', inline: false },
                        { name: '🤖 `antiraid config bots`', value: 'Configurar bloqueio de bots', inline: false },
                        { name: '🚫 `antiraid config ignorar`', value: 'Ignorar canal', inline: false }
                    )
                    .setFooter({ text: '🌌 Orbit • Configurações apenas para o dono do servidor' });
                
                await message.reply({ embeds: [embed] });
            }
        }
        
        // ========== STATUS ==========
        else if (subcmd === 'status') {
            const embed = new EmbedBuilder()
                .setColor(config.ativo ? 0x00FF00 : 0xFF0000)
                .setTitle('🛡️ Status Anti-Raid Orbital')
                .addFields(
                    { name: '📊 Status', value: config.ativo ? '🟢 ATIVO' : '🔴 DESATIVADO', inline: true },
                    { name: '👑 Configurado por', value: `<@${message.guild.ownerId}>`, inline: true },
                    { name: '📝 Limite Mensagens', value: `${config.limiteMensagens}`, inline: true },
                    { name: '👥 Limite Joins', value: `${config.limiteJoins}`, inline: true },
                    { name: '⚙️ Limite Ações', value: `${config.limiteAcoes}`, inline: true },
                    { name: '⏰ Janela de Tempo', value: `${config.tempoJanela / 1000}s`, inline: true },
                    { name: '⚡ Ação', value: config.acao, inline: true },
                    { name: '🤖 Bloquear Bots', value: config.bloquearBots ? '🟢 ATIVO' : '🔴 DESATIVADO', inline: true },
                    { name: '🔒 Bloquear Ações', value: config.bloquearAcoes ? '🟢 ATIVO' : '🔴 DESATIVADO', inline: true },
                    { name: '🚫 Canais Ignorados', value: config.canaisIgnorados.length > 0 ? config.canaisIgnorados.map(id => `<#${id}>`).join(', ') : 'Nenhum', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Sistema configurado pelo Comandante Orbital Supremo' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== LIMPAR CACHE ==========
        else if (subcmd === 'limpar') {
            messageCache.clear();
            joinCache.clear();
            actionCache.clear();
            await message.reply('✅ Cache anti-raid orbital limpo!');
        }
        
        // ========== AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🛡️ Anti-Raid Orbital')
                .setDescription('📡 Comandos de proteção orbital (apenas o **dono do servidor** pode configurar)')
                .addFields(
                    { name: '🔛 `antiraid ativar`', value: 'Ativa o sistema anti-raid', inline: false },
                    { name: '🔚 `antiraid desativar`', value: 'Desativa o sistema anti-raid', inline: false },
                    { name: '⚙️ `antiraid config`', value: 'Configura o sistema', inline: false },
                    { name: '🤖 `antiraid config bots`', value: 'Configura bloqueio de bots', inline: false },
                    { name: '🚫 `antiraid config ignorar`', value: 'Ignora um canal', inline: false },
                    { name: '📊 `antiraid status`', value: 'Mostra status do sistema', inline: false },
                    { name: '🗑️ `antiraid limpar`', value: 'Limpa o cache', inline: false },
                    { name: '🛡️ O que é bloqueado?', value: '• Spam de mensagens\n• Entrada em massa de membros\n• Criação/edição/exclusão de canais em massa\n• Entrada de bots não autorizados', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Apenas o dono do servidor pode alterar configurações' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};

// ========== EVENTO PARA DETECTAR AÇÕES DE MODERAÇÃO (CRIAR, EDITAR, APAGAR CANAIS) ==========
module.exports.handleChannelAction = async (action, guild, executorId, channel) => {
    const db = getDB();
    const guildId = guild.id;
    const config = db.antiRaid?.[guildId];
    
    if (!config || !config.ativo || !config.bloquearAcoes) return;
    
    // Verificar se o executor está ignorado
    if (config.acoesIgnoradas) {
        // Verificar cargo ignorado
        const member = guild.members.cache.get(executorId);
        if (member) {
            for (const roleId of config.acoesIgnoradas) {
                if (member.roles.cache.has(roleId)) return;
            }
        }
        // Verificar usuário ignorado
        if (config.acoesIgnoradas.includes(`user_${executorId}`)) return;
    }
    
    const key = `${guildId}_actions_${executorId}`;
    const now = Date.now();
    
    if (!actionCache.has(key)) {
        actionCache.set(key, []);
    }
    
    const timestamps = actionCache.get(key);
    timestamps.push(now);
    
    while (timestamps.length && timestamps[0] < now - config.tempoJanela) {
        timestamps.shift();
    }
    
    if (timestamps.length >= config.limiteAcoes) {
        // Aplicar ação contra o usuário
        const member = guild.members.cache.get(executorId);
        if (!member) return;
        
        const logChannel = guild.channels.cache.find(c => c.name === 'logs' || c.name === 'admin-logs');
        
        if (config.acao === 'kick') {
            await member.kick('Anti-Raid Orbital: Ações suspeitas detectadas').catch(() => {});
            if (logChannel) {
                logChannel.send(`🚨 **${member.user.tag}** foi expulso por realizar ${timestamps.length} ações suspeitas (criar/editar/apagar canais) em ${config.tempoJanela / 1000}s!`);
            }
        } else if (config.acao === 'ban') {
            await member.ban({ reason: 'Anti-Raid Orbital: Ações suspeitas detectadas' }).catch(() => {});
            if (logChannel) {
                logChannel.send(`🚨 **${member.user.tag}** foi banido por realizar ${timestamps.length} ações suspeitas (criar/editar/apagar canais) em ${config.tempoJanela / 1000}s!`);
            }
        } else if (config.acao === 'mute') {
            await member.timeout(30 * 60 * 1000, 'Anti-Raid Orbital: Ações suspeitas').catch(() => {});
            if (logChannel) {
                logChannel.send(`🚨 **${member.user.tag}** foi mutado por realizar ${timestamps.length} ações suspeitas (criar/editar/apagar canais) em ${config.tempoJanela / 1000}s!`);
            }
        }
        
        // Reverter última ação se possível
        if (action === 'delete' && channel) {
            // Tentar restaurar canal deletado (não é possível, apenas log)
            if (logChannel) {
                logChannel.send(`⚠️ Canal **${channel.name}** foi deletado durante a ação suspeita!`);
            }
        }
        
        actionCache.delete(key);
    }
};

// ========== EVENTO PARA DETECTAR SPAM DE MENSAGENS ==========
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
    
    while (timestamps.length && timestamps[0] < now - config.tempoJanela) {
        timestamps.shift();
    }
    
    if (timestamps.length >= config.limiteMensagens) {
        const member = message.guild.members.cache.get(message.author.id);
        if (!member) return;
        
        if (config.acao === 'kick') {
            await member.kick('Anti-Raid Orbital: Spam detectado').catch(() => {});
            message.channel.send(`🚨 **${member.user.username}** foi expulso por spam orbital (${timestamps.length} mensagens em ${config.tempoJanela / 1000}s)!`);
        } else if (config.acao === 'ban') {
            await member.ban({ reason: 'Anti-Raid Orbital: Spam detectado' }).catch(() => {});
            message.channel.send(`🚨 **${member.user.username}** foi banido por spam orbital!`);
        } else if (config.acao === 'mute') {
            await member.timeout(10 * 60 * 1000, 'Anti-Raid Orbital: Spam detectado').catch(() => {});
            message.channel.send(`🚨 **${member.user.username}** foi mutado por spam orbital!`);
        }
        
        messageCache.delete(key);
    }
};

// ========== EVENTO PARA DETECTAR ENTRADA DE MEMBROS ==========
module.exports.handleGuildMemberAdd = async (member, client) => {
    const db = getDB();
    const guildId = member.guild.id;
    const config = db.antiRaid?.[guildId];
    
    if (!config) return;
    
    // Bloquear bots
    if (config.bloquearBots && member.user.bot) {
        const isPermitted = config.botsPermitidos?.includes(member.user.id);
        
        if (!isPermitted) {
            try {
                await member.kick('Anti-Raid Orbital: Bloqueio de bots ativo');
                const channel = member.guild.systemChannel || member.guild.channels.cache.first();
                if (channel) {
                    channel.send(`🤖 **${member.user.tag}** foi bloqueado pelo sistema anti-raid orbital!`);
                }
            } catch (error) {
                console.error(`Erro ao bloquear bot ${member.user.tag}:`, error);
            }
            return;
        } else if (config.cargoParaBots) {
            try {
                await member.roles.add(config.cargoParaBots);
            } catch (error) {
                console.error(`Erro ao adicionar cargo ao bot ${member.user.tag}:`, error);
            }
        }
    }
    
    // Detectar spam de entrada
    if (!config.ativo) return;
    
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
        const channel = member.guild.systemChannel || member.guild.channels.cache.first();
        if (channel) {
            channel.send(`🚨 **ALERTA ORBITAL!** Possível raid detectada! ${timestamps.length} entradas em ${config.tempoJanela / 1000}s. Modo de segurança ativado!`);
        }
        
        // Bloquear entrada de novos membros
        await member.guild.channels.cache.forEach(async channel => {
            await channel.permissionOverwrites.edit(member.guild.id, { CreateInstantInvite: false }).catch(() => {});
        });
        
        joinCache.delete(key);
    }
};