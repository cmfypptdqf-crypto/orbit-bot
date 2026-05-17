const { Client, GatewayIntentBits, EmbedBuilder, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
// No seu index.js, adicione o handler para o ticket:
const eventosLogs = require('./commands/utilidades/eventosLogs.js');
const ticketCommand = require('./commands/utilidades/ticket.js');
const sistemaLogsOrbital = require('./commands/utilidades/sistemaLogsOrbital.js');
// No seu index.js, adicione os handlers:

// No seu index.js, adicione os handlers:

const antiRaid = require('./commands/admin/antiRaidOrbital.js');

// Evento de entrada de membro
client.on('guildMemberAdd', async (member) => {
    if (antiRaid.handleGuildMemberAdd) {
        await antiRaid.handleGuildMemberAdd(member, client);
    }
});

// Evento de mensagem
client.on('messageCreate', async (message) => {
    if (antiRaid.handleMessage) {
        await antiRaid.handleMessage(message, client);
    }
});

// Evento de criação de canal
client.on('channelCreate', async (channel) => {
    if (!channel.guild) return;
    const auditLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
    const log = auditLogs.entries.first();
    if (log) {
        await antiRaid.handleChannelAction('create', channel.guild, log.executor.id, channel);
    }
});

// Evento de deleção de canal
client.on('channelDelete', async (channel) => {
    if (!channel.guild) return;
    const auditLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
    const log = auditLogs.entries.first();
    if (log) {
        await antiRaid.handleChannelAction('delete', channel.guild, log.executor.id, channel);
    }
});

// Evento de edição de canal
client.on('channelUpdate', async (oldChannel, newChannel) => {
    if (!newChannel.guild) return;
    const auditLogs = await newChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate });
    const log = auditLogs.entries.first();
    if (log) {
        await antiRaid.handleChannelAction('update', newChannel.guild, log.executor.id, newChannel);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (ticketCommand.handleInteraction) {
        await ticketCommand.handleInteraction(interaction, client);
    }
});

// Criar cliente do bot
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
client.prefix = 'bt!';

// ========== CARREGAR COMANDOS DA PASTA ==========
function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    
    // Verificar se a pasta commands existe
    if (!fs.existsSync(commandsPath)) {
        console.log('❌ Pasta "commands" não encontrada!');
        return;
    }
    
    const commandFolders = fs.readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        
        // Verificar se é uma pasta
        if (!fs.statSync(folderPath).isDirectory()) continue;
        
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            
            // Limpar cache para hot reload (opcional)
            delete require.cache[require.resolve(filePath)];
            
            const command = require(filePath);
            
            if (command.name) {
                client.commands.set(command.name, command);
                console.log(`✅ Comando carregado: ${command.name} (${folder}/${file})`);
                
                // Carregar aliases se existirem
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => {
                        client.commands.set(alias, command);
                        console.log(`   ↳ Alias: ${alias}`);
                    });
                }
            } else {
                console.log(`⚠️ Arquivo ${file} não tem propriedade "name"`);
            }
        }
    }
    
    console.log(`📦 Total de comandos carregados: ${client.commands.size}`);
}

// ========== REGISTRAR SLASH COMMANDS ==========
async function registerSlashCommands() {
    const commands = [];
    
    client.commands.forEach(cmd => {
        if (cmd.slashData) {
            commands.push(cmd.slashData.toJSON());
        }
    });
    
    if (commands.length === 0) {
        console.log('⚠️ Nenhum slash command para registrar');
        return;
    }
    
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    try {
        console.log('🔄 Registrando slash commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log(`✅ ${commands.length} slash commands registrados!`);
    } catch (error) {
        console.error('❌ Erro ao registrar slash commands:', error);
    }
}

// ========== QUANDO O BOT FICA ONLINE ==========
client.once('clientReady', async () => {
    console.log(`✅ Orbit™ online como ${client.user.tag}`);
    console.log(`📊 Está em ${client.guilds.cache.size} servidores`);
    
    // 
    loadCommands();
    
    // Status do bot
    client.user.setPresence({
        activities: [{ name: `${client.guilds.cache.size} servidores | bt!ajuda`, type: 0 }],
        status: 'online'
    });
});

// ========== ATUALIZAR STATUS ==========
setInterval(() => {
    if (client.isReady()) {
        client.user.setActivity(`${client.guilds.cache.size} servidores | bt!ajuda`, { type: 0 });
    }
}, 60000);

// ========== HANDLER DE SLASH COMMANDS ==========
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.log(`⚠️ Comando não encontrado: ${interaction.commandName}`);
        return;
    }
    
    try {
        await command.executeSlash(interaction, client);
    } catch (error) {
        console.error(`❌ Erro no slash command ${interaction.commandName}:`, error);
        const errorMsg = '❌ Ocorreu um erro ao executar este comando!';
        
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: errorMsg, ephemeral: true });
        } else {
            await interaction.reply({ content: errorMsg, ephemeral: true });
        }
    }
});

// ========== HANDLER DE COMANDOS POR PREFIXO ==========
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(client.prefix)) return;
    
    const args = message.content.slice(client.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if (!command) return;
    
    try {
        await command.executePrefix(message, args, client);
    } catch (error) {
        console.error(`❌ Erro no comando prefixo ${commandName}:`, error);
        await message.reply('❌ Ocorreu um erro ao executar este comando!');
    }
});

// ========== QUANDO O BOT É ADICIONADO EM UM SERVIDOR ==========
client.on('guildCreate', async (guild) => {
    console.log(`✅ Orbit™ adicionado no servidor: ${guild.name} (${guild.id}`);
    console.log(`👑 Dono: ${guild.ownerId}`);
    console.log(`👥 Membros: ${guild.memberCount}`);
    
    // Tentar enviar mensagem no canal geral
    const channels = guild.channels.cache;
    let generalChannel = channels.find(ch => 
        ch.type === 0 && // GUILD_TEXT
        (ch.name === 'geral' || ch.name === 'general' || ch.name === 'chat' || ch.name === '💬-chat')
    );
    
    if (!generalChannel) {
        generalChannel = channels.find(ch => 
            ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages')
        );
    }
    
    if (generalChannel) {
        const embed = new EmbedBuilder()
            .setTitle('🎉 Obrigado por me adicionar!')
            .setDescription('Olá! Sou o **Orbit™** e estou aqui para ajudar!\n\nUse `bt!ajuda` para ver todos os meus comandos.')
            .setColor(0x00008B)
            .addFields(
                { name: '📚 Site', value: 'https://orbitbot-theta.vercel.app/', inline: true },
                { name: '🆘 Suporte', value: 'https://discord.gg/pPnSZEYGZ6', inline: true },
                { name: '📝 Prefixo', value: '`bt!`', inline: true }
            )
            .setFooter({ text: 'Orbit™ •' })
            .setTimestamp();
        
        await generalChannel.send({ embeds: [embed] }).catch(console.error);
    }
    
    // Log no servidor de suporte
    const logChannel = client.channels.cache.get('1503569620311740597');
    if (logChannel) {
        const embedLog = new EmbedBuilder()
            .setTitle('📥 Orbit™ Adicionado em Novo Servidor')
            .setColor(0x00008B)
            .addFields(
                { name: '📌 Servidor', value: guild.name, inline: true },
                { name: '🆔 ID', value: guild.id, inline: true },
                { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
                { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true }
            )
            .setTimestamp();
        
        logChannel.send({ embeds: [embedLog] }).catch(console.error);
    }
});

// ========== QUANDO O BOT É REMOVIDO ==========
client.on('guildDelete', (guild) => {
    console.log(`❌ Orbit™ removido do servidor: ${guild.name} (${guild.id})`);
    
    const logChannel = client.channels.cache.get('1503569620311740597');
    if (logChannel) {
        const embedLog = new EmbedBuilder()
            .setTitle('📤 Orbit™ Removido de Servidor')
            .setColor(0x00008B)
            .addFields(
                { name: '📌 Servidor', value: guild.name, inline: true },
                { name: '🆔 ID', value: guild.id, inline: true },
                { name: '👥 Membros', value: `${guild.memberCount}`, inline: true }
            )
            .setTimestamp();
        
        logChannel.send({ embeds: [embedLog] }).catch(console.error);
    }
});

// ========== TRATAMENTO DE ERROS GLOBAIS ==========
process.on('unhandledRejection', (error) => {
    console.error('❌ Erro não tratado (Promise):', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Erro não tratado (Exception):', error);
});

// ========== LOGAR ==========
client.login(config.token);