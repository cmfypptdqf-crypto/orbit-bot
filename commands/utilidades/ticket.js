// commands/admin/ticketOrbital.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ tickets: {}, ticketConfig: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const ticketsAtivos = new Map();

module.exports = {
    name: 'ticket',
    aliases: ['ticketorbital', 'suporte'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        const guildId = message.guild.id;
        
        if (!db.ticketConfig[guildId]) {
            db.ticketConfig[guildId] = {
                canalLogs: null,
                cargoSuporte: null,
                embedTitulo: '🎫 Sistema de Tickets Orbitais',
                embedDescricao: '📡 Precisa de ajuda orbital? Clique no botão abaixo para abrir um ticket!',
                embedCor: '#00BFFF',
                cargoCriador: null
            };
            saveDB(db);
        }
        
        const config = db.ticketConfig[guildId];
        
        // ========== CONFIGURAR SISTEMA ==========
        if (subcmd === 'config') {
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌ Apenas administradores orbitais podem configurar o sistema de tickets!');
            }
            
            const tipo = args[1]?.toLowerCase();
            
            if (tipo === 'log') {
                const canal = message.mentions.channels.first();
                if (!canal) return message.reply('❌ Use: `bt!ticket config log #canal`');
                config.canalLogs = canal.id;
                saveDB(db);
                await message.reply(`✅ Canal de logs orbital definido para ${canal}!`);
            }
            
            else if (tipo === 'suporte') {
                const cargo = message.mentions.roles.first();
                if (!cargo) return message.reply('❌ Use: `bt!ticket config suporte @cargo`');
                config.cargoSuporte = cargo.id;
                saveDB(db);
                await message.reply(`✅ Cargo de suporte orbital definido para ${cargo}!`);
            }
            
            else if (tipo === 'embed') {
                const parte = args[2]?.toLowerCase();
                const texto = args.slice(3).join(' ');
                
                if (parte === 'titulo') {
                    config.embedTitulo = texto;
                    saveDB(db);
                    await message.reply(`✅ Título do embed orbital alterado para: "${texto}"`);
                }
                else if (parte === 'descricao') {
                    config.embedDescricao = texto;
                    saveDB(db);
                    await message.reply(`✅ Descrição do embed orbital alterada!`);
                }
                else if (parte === 'cor') {
                    const cor = texto.replace('#', '');
                    config.embedCor = `#${cor}`;
                    saveDB(db);
                    await message.reply(`✅ Cor do embed orbital alterada para ${config.embedCor}!`);
                }
                else {
                    await message.reply('📋 **Configurar Embed Orbital**\n`ticket config embed titulo <texto>`\n`ticket config embed descricao <texto>`\n`ticket config embed cor <hex>`');
                }
            }
            
            else if (tipo === 'cargo') {
                const cargo = message.mentions.roles.first();
                if (!cargo) return message.reply('❌ Use: `bt!ticket config cargo @cargo`');
                config.cargoCriador = cargo.id;
                saveDB(db);
                await message.reply(`✅ Cargo para criar ticket orbital definido para ${cargo}! Apenas membros com este cargo podem abrir tickets.`);
            }
            
            else if (tipo === 'status') {
                const embed = new EmbedBuilder()
                    .setColor(config.embedCor)
                    .setTitle('⚙️ Configuração do Sistema de Tickets Orbitais')
                    .addFields(
                        { name: '📝 Canal de Logs', value: config.canalLogs ? `<#${config.canalLogs}>` : '❌ Não configurado', inline: true },
                        { name: '🛡️ Cargo de Suporte', value: config.cargoSuporte ? `<@&${config.cargoSuporte}>` : '❌ Não configurado', inline: true },
                        { name: '🔒 Cargo para Criar', value: config.cargoCriador ? `<@&${config.cargoCriador}>` : '✅ Todos podem criar', inline: true },
                        { name: '📊 Título do Embed', value: config.embedTitulo, inline: false },
                        { name: '📝 Descrição', value: config.embedDescricao, inline: false },
                        { name: '🎨 Cor', value: config.embedCor, inline: true }
                    )
                    .setFooter({ text: '🌌 Orbit • Use bt!ticket config <opção> para alterar' });
                
                await message.reply({ embeds: [embed] });
            }
            
            else {
                await message.reply('📋 **Configuração do Sistema de Tickets Orbitais**\n`ticket config log #canal` - Canal de logs\n`ticket config suporte @cargo` - Cargo de suporte\n`ticket config cargo @cargo` - Cargo para criar ticket\n`ticket config embed titulo <texto>` - Título do embed\n`ticket config embed descricao <texto>` - Descrição\n`ticket config embed cor <hex>` - Cor\n`ticket config status` - Ver configurações');
            }
        }
        
        // ========== CRIAR SISTEMA ==========
        else if (subcmd === 'criar') {
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌ Apenas administradores orbitais podem criar o sistema de tickets!');
            }
            
            const embed = new EmbedBuilder()
                .setColor(config.embedCor)
                .setTitle(config.embedTitulo)
                .setDescription(config.embedDescricao)
                .addFields(
                    { name: '📋 Como funciona', value: '1. Clique no botão "Abrir Ticket"\n2. Um canal será criado para você\n3. Aguarde o suporte orbital responder', inline: false },
                    { name: '⏰ Atendimento', value: 'Nosso time orbital está disponível 24/7!', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Suporte orbital' });
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('abrir_ticket')
                        .setLabel('🎫 Abrir Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );
            
            await message.channel.send({ embeds: [embed], components: [row] });
            await message.reply('✅ Sistema de tickets orbital criado com sucesso!');
        }
        
        // ========== FECHAR TICKET ==========
        else if (subcmd === 'fechar') {
            const canalId = message.channel.id;
            const ticketInfo = ticketsAtivos.get(canalId);
            
            if (!ticketInfo) {
                return message.reply('❌ Este não é um canal de ticket orbital!');
            }
            
            if (ticketInfo.criador !== message.author.id && !message.member.permissions.has('Administrator') && !message.member.roles.cache.has(config.cargoSuporte)) {
                return message.reply('❌ Apenas o criador orbital do ticket, suporte ou administradores podem fechá-lo!');
            }
            
            // Registrar no log
            if (config.canalLogs) {
                const logChannel = message.guild.channels.cache.get(config.canalLogs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xFFA500)
                        .setTitle('📝 Ticket Fechado')
                        .setDescription(`📡 Ticket <#${canalId}> foi fechado!`)
                        .addFields(
                            { name: '👤 Criador', value: `<@${ticketInfo.criador}>`, inline: true },
                            { name: '🔒 Fechado por', value: message.author.tag, inline: true },
                            { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                        )
                        .setFooter({ text: '🌌 Orbit • Log do sistema de tickets' });
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('🎫 Ticket Orbital')
                .setDescription('📡 O ticket será fechado em 5 segundos...')
                .setFooter({ text: '🌌 Orbit • Obrigado por usar nosso suporte orbital!' });
            
            await message.channel.send({ embeds: [embed] });
            
            setTimeout(() => {
                message.channel.delete();
                ticketsAtivos.delete(canalId);
            }, 5000);
        }
        
        // ========== ADD (adicionar membro ao ticket) ==========
        else if (subcmd === 'add') {
            const canalId = message.channel.id;
            const ticketInfo = ticketsAtivos.get(canalId);
            
            if (!ticketInfo) {
                return message.reply('❌ Este não é um canal de ticket orbital!');
            }
            
            if (!message.member.permissions.has('Administrator') && !message.member.roles.cache.has(config.cargoSuporte)) {
                return message.reply('❌ Apenas suporte orbital e administradores podem adicionar membros!');
            }
            
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!ticket add @usuario`');
            
            await message.channel.permissionOverwrites.edit(user.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
            
            await message.reply(`✅ ${user} foi adicionado ao ticket orbital!`);
            
            // Registrar no log
            if (config.canalLogs) {
                const logChannel = message.guild.channels.cache.get(config.canalLogs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('👤 Membro Adicionado ao Ticket')
                        .setDescription(`📡 ${user} foi adicionado ao ticket <#${canalId}>`)
                        .addFields(
                            { name: '👑 Adicionado por', value: message.author.tag, inline: true }
                        )
                        .setFooter({ text: '🌌 Orbit • Log do sistema de tickets' });
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        }
        
        // ========== REMOVE (remover membro do ticket) ==========
        else if (subcmd === 'remove') {
            const canalId = message.channel.id;
            const ticketInfo = ticketsAtivos.get(canalId);
            
            if (!ticketInfo) {
                return message.reply('❌ Este não é um canal de ticket orbital!');
            }
            
            if (!message.member.permissions.has('Administrator') && !message.member.roles.cache.has(config.cargoSuporte)) {
                return message.reply('❌ Apenas suporte orbital e administradores podem remover membros!');
            }
            
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Use: `bt!ticket remove @usuario`');
            
            if (user.id === ticketInfo.criador) {
                return message.reply('❌ Não é possível remover o criador orbital do ticket!');
            }
            
            await message.channel.permissionOverwrites.edit(user.id, {
                ViewChannel: false,
                SendMessages: false,
                ReadMessageHistory: false
            });
            
            await message.reply(`✅ ${user} foi removido do ticket orbital!`);
            
            // Registrar no log
            if (config.canalLogs) {
                const logChannel = message.guild.channels.cache.get(config.canalLogs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xFFA500)
                        .setTitle('👤 Membro Removido do Ticket')
                        .setDescription(`📡 ${user} foi removido do ticket <#${canalId}>`)
                        .addFields(
                            { name: '👑 Removido por', value: message.author.tag, inline: true }
                        )
                        .setFooter({ text: '🌌 Orbit • Log do sistema de tickets' });
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
        }
        
        // ========== TRANSCREVER ==========
        else if (subcmd === 'transcrever') {
            const canalId = message.channel.id;
            const ticketInfo = ticketsAtivos.get(canalId);
            
            if (!ticketInfo) {
                return message.reply('❌ Este não é um canal de ticket orbital!');
            }
            
            if (!message.member.permissions.has('Administrator') && !message.member.roles.cache.has(config.cargoSuporte)) {
                return message.reply('❌ Apenas suporte orbital e administradores podem transcrever tickets!');
            }
            
            const messages = await message.channel.messages.fetch({ limit: 100 });
            const logs = messages.reverse().map(m => `${m.author.tag} (${m.createdAt.toLocaleString()}): ${m.content}`).join('\n');
            
            const transcriptPath = path.join(__dirname, '..', '..', `transcript_${canalId}.txt`);
            fs.writeFileSync(transcriptPath, logs);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📄 Transcrição Orbital')
                .setDescription(`✅ Transcrição do ticket <#${canalId}> salva!`)
                .addFields(
                    { name: '👑 Solicitado por', value: message.author.tag, inline: true },
                    { name: '📊 Mensagens', value: `${messages.size} mensagens`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Transcrição orbital salva' });
            
            await message.reply({ 
                embeds: [embed],
                files: [{ attachment: transcriptPath, name: `transcript_${canalId}.txt` }]
            });
            
            fs.unlinkSync(transcriptPath);
        }
        
        // ========== LISTAR ==========
        else if (subcmd === 'listar') {
            if (!message.member.permissions.has('Administrator') && !message.member.roles.cache.has(config.cargoSuporte)) {
                return message.reply('❌ Apenas suporte orbital e administradores podem listar tickets!');
            }
            
            const tickets = Array.from(ticketsAtivos.entries()).map(([id, t]) => {
                return `📌 <#${id}> - Criado por <@${t.criador}> - <t:${Math.floor(t.data / 1000)}:R>`;
            });
            
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('🎫 Tickets Orbitais Ativos')
                .setDescription(tickets.length > 0 ? tickets.join('\n') : '📭 Nenhum ticket orbital ativo no momento.')
                .setFooter({ text: `🌌 Orbit • Total: ${tickets.length} tickets ativos` });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🎫 Sistema de Tickets Orbitais')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '⚙️ `bt!ticket config`', value: 'Configura o sistema (admin)', inline: false },
                    { name: '📋 `bt!ticket criar`', value: 'Cria o sistema de tickets (admin)', inline: false },
                    { name: '🔒 `bt!ticket fechar`', value: 'Fecha o ticket atual', inline: false },
                    { name: '➕ `bt!ticket add @user`', value: 'Adiciona membro ao ticket (suporte)', inline: false },
                    { name: '➖ `bt!ticket remove @user`', value: 'Remove membro do ticket (suporte)', inline: false },
                    { name: '📄 `bt!ticket transcrever`', value: 'Salva transcrição (suporte)', inline: false },
                    { name: '📋 `bt!ticket listar`', value: 'Lista tickets ativos (suporte)', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Suporte orbital' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};

// Evento para interação com botão
module.exports.handleInteraction = async (interaction, client) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'abrir_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;
        const db = getDB();
        const guildId = guild.id;
        const config = db.ticketConfig[guildId] || {};
        
        // Verificar se tem cargo restrito
        if (config.cargoCriador) {
            if (!member.roles.cache.has(config.cargoCriador)) {
                return interaction.reply({ content: '❌ Você não tem permissão orbital para abrir tickets!', ephemeral: true });
            }
        }
        
        // Verificar se já tem ticket aberto
        for (const [id, ticket] of ticketsAtivos) {
            if (ticket.criador === member.id) {
                return interaction.reply({ content: '❌ Você já tem um ticket orbital aberto!', ephemeral: true });
            }
        }
        
        const ticketId = Date.now().toString();
        const channelName = `ticket-${member.user.username}`;
        
        try {
            const channel = await guild.channels.create({
                name: channelName,
                type: 0,
                parent: interaction.channel.parentId,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['ViewChannel'],
                    },
                    {
                        id: member.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'AddReactions', 'AttachFiles', 'EmbedLinks'],
                    },
                    {
                        id: client.user.id,
                        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
                    }
                ]
            });
            
            // Adicionar permissão para cargo de suporte
            if (config.cargoSuporte) {
                await channel.permissionOverwrites.edit(config.cargoSuporte, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
            }
            
            ticketsAtivos.set(channel.id, {
                criador: member.id,
                data: Date.now(),
                canalId: channel.id
            });
            
            const embed = new EmbedBuilder()
                .setColor(config.embedCor || '#00BFFF')
                .setTitle('🎫 Ticket Orbital Aberto!')
                .setDescription(`📡 Olá ${member.user.username}, seu ticket orbital foi aberto!\n\nDescreva seu problema orbital e aguarde o suporte.`)
                .addFields(
                    { name: '🔒 Para fechar', value: 'Use `bt!ticket fechar`', inline: true },
                    { name: '➕ Adicionar membro', value: '`bt!ticket add @user`', inline: true },
                    { name: '📄 Transcrição', value: '`bt!ticket transcrever`', inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Suporte orbital' });
            
            await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
            
            // Registrar no log
            if (config.canalLogs) {
                const logChannel = guild.channels.cache.get(config.canalLogs);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor(0x00FF00)
                        .setTitle('🎫 Novo Ticket Orbital')
                        .setDescription(`📡 Ticket <#${channel.id}> foi aberto!`)
                        .addFields(
                            { name: '👤 Criador', value: member.user.tag, inline: true },
                            { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                        )
                        .setFooter({ text: '🌌 Orbit • Log do sistema de tickets' });
                    
                    await logChannel.send({ embeds: [logEmbed] });
                }
            }
            
            await interaction.reply({ content: `✅ Ticket orbital criado! Acesse ${channel}`, ephemeral: true });
            
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Erro orbital ao criar ticket!', ephemeral: true });
        }
    }
};