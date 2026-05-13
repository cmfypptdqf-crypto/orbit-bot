const { Client, GatewayIntentBits, EmbedBuilder, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

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
    const commandFolders = fs.readdirSync(commandsPath);
    
    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            
            if (command.name) {
                client.commands.set(command.name, command);
                console.log(`✅ Comando carregado: ${command.name} (${folder})`);
            }
        }
    }
}

// ========== REGISTRAR SLASH COMMANDS ==========
async function registerSlashCommands() {
    const commands = [];
    
    client.commands.forEach(cmd => {
        if (cmd.slashData) {
            commands.push(cmd.slashData.toJSON());
        }
    });
    
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
client.once('ready', async () => {
    console.log(`✅ Orbit™ online como ${client.user.tag}`);
    console.log(`📊 Está em ${client.guilds.cache.size} servidores`);
    
    // Carregar comandos
    loadCommands();
    
    // Registrar slash commands
    await registerSlashCommands();
    
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
    if (!command) return;
    
    try {
        await command.executeSlash(interaction, client);
    } catch (error) {
        console.error(`❌ Erro no slash command ${interaction.commandName}:`, error);
        await interaction.reply({ content: '❌ Ocorreu um erro ao executar este comando!', ephemeral: true });
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
    console.log(`✅ Orbit™ adicionado no servidor: ${guild.name} (${guild.id})`);
    console.log(`👑 Dono: ${guild.ownerId}`);
    console.log(`👥 Membros: ${guild.memberCount}`);
    
    // Tentar enviar mensagem no canal geral
    const channels = guild.channels.cache;
    let generalChannel = channels.find(ch => ch.name === 'geral' || ch.name === 'general' || ch.name === 'chat');
    
    if (!generalChannel) {
        generalChannel = channels.find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));
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
        
        await generalChannel.send({ embeds: [embed] });
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
        
        logChannel.send({ embeds: [embedLog] });
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
        
        logChannel.send({ embeds: [embedLog] });
    }
});

// ========== LOGAR ==========
client.login(config.token);