// index.js
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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

// ========== QUANDO O BOT É ADICIONADO EM UM SERVIDOR ==========
client.on('guildCreate', async (guild) => {
    console.log(`✅ Orbit™ adicionado no servidor: ${guild.name} (${guild.id})`);
    console.log(`👑 Dono: ${guild.ownerId}`);
    console.log(`👥 Membros: ${guild.memberCount}`);
    
    // Tentar enviar mensagem no canal geral do servidor
    const channels = guild.channels.cache;
    let generalChannel = channels.find(ch => ch.name === 'geral' || ch.name === 'general' || ch.name === 'chat');
    
    if (!generalChannel) {
        generalChannel = channels.find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));
    }
    
    if (generalChannel) {
        const embed = new EmbedBuilder()
            .setTitle('🎉 Obrigado por me adicionar!')
            .setDescription('Olá! Sou o **Orbit™** e estou aqui para ajudar!\n\nUse `bt!ajuda` para ver todos os meus comandos.')
            .setColor(0x00008B) // Azul escuro
            .addFields(
                { name: '📚 Site', value: 'https://nixbot.vip', inline: true },
                { name: '🆘 Suporte', value: 'https://discord.gg/nixbots', inline: true },
                { name: '📝 Prefixo', value: '`bt!`', inline: true }
            )
            .setFooter({ text: 'Orbit™ • Sistema de Logs' })
            .setTimestamp();
        
        await generalChannel.send({ embeds: [embed] });
    }
    
    // Log no seu servidor de suporte
    const logChannel = client.channels.cache.get('1503569620311740597'); // Coloque o ID do canal
    if (logChannel) {
        const embedLog = new EmbedBuilder()
            .setTitle('📥 Orbit™ Adicionado em Novo Servidor')
            .setColor(0x00008B) // Azul escuro
            .addFields(
                { name: '📌 Servidor', value: guild.name, inline: true },
                { name: '🆔 ID', value: guild.id, inline: true },
                { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
                { name: '👑 Dono', value: `<@${guild.ownerId}>`, inline: true },
                { name: '📅 Data', value: new Date().toLocaleString(), inline: true }
            )
            .setTimestamp();
        
        logChannel.send({ embeds: [embedLog] });
    }
});

// ========== QUANDO O BOT É REMOVIDO DE UM SERVIDOR ==========
client.on('guildDelete', (guild) => {
    console.log(`❌ Orbit™ removido do servidor: ${guild.name} (${guild.id})`);
    
    // Log no seu servidor de suporte
    const logChannel = client.channels.cache.get('SEU_CANAL_LOG_ID');
    if (logChannel) {
        const embedLog = new EmbedBuilder()
            .setTitle('📤 Orbit™ Removido de Servidor')
            .setColor(0x00008B) // Azul escuro
            .addFields(
                { name: '📌 Servidor', value: guild.name, inline: true },
                { name: '🆔 ID', value: guild.id, inline: true },
                { name: '👥 Membros', value: `${guild.memberCount}`, inline: true },
                { name: '📅 Data', value: new Date().toLocaleString(), inline: true }
            )
            .setTimestamp();
        
        logChannel.send({ embeds: [embedLog] });
    }
});

// ========== QUANDO O BOT FICA ONLINE ==========
client.once('ready', () => {
    console.log(`✅ Orbit™ online como ${client.user.tag}`);
    console.log(`📊 Está em ${client.guilds.cache.size} servidores`);
    
    // Status do bot
    client.user.setPresence({
        activities: [{ name: `${client.guilds.cache.size} servidores | bt!ajuda`, type: 0 }],
        status: 'online'
    });
});

// ========== ATUALIZAR STATUS AUTOMATICAMENTE ==========
setInterval(() => {
    if (client.isReady()) {
        client.user.setActivity(`${client.guilds.cache.size} servidores | to!ajuda`, { type: 0 });
    }
}, 60000); // Atualiza a cada 1 minuto

// ========== COMANDOS SIMPLES ==========
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('to!')) return;
    
    const args = message.content.slice(3).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    
    // Comando: ping
    if (command === 'ping') {
        const latency = Date.now() - message.createdTimestamp;
        await message.reply(`🏓 Pong! Latência: ${latency}ms`);
    }
    
    // Comando: ajuda
    else if (command === 'ajuda') {
        const embed = new EmbedBuilder()
            .setTitle('📚 Orbit™ - Comandos')
            .setDescription('Aqui estão meus comandos disponíveis:')
            .setColor(0x00008B) // Azul escuro
            .addFields(
                { name: '📌 `bt!ping`', value: 'Verifica a latência do bot', inline: false },
                { name: '📌 `bt!servidor`', value: 'Mostra informações do servidor', inline: false },
                { name: '📌 `bt!botinfo`', value: 'Mostra informações do bot', inline: false },
                { name: '🔗 Links', value: 'Em Breve | [Suporte](https://discord.gg/pPnSZEYGZ6)', inline: false }
            )
            .setFooter({ text: 'Orbit™ • Sistema de Logs' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
    
    // Comando: servidor
    else if (command === 'servidor') {
        const embed = new EmbedBuilder()
            .setTitle(`📊 ${message.guild.name}`)
            .setThumbnail(message.guild.iconURL())
            .addFields(
                { name: '👑 Dono', value: `<@${message.guild.ownerId}>`, inline: true },
                { name: '👥 Membros', value: `${message.guild.memberCount}`, inline: true },
                { name: '📅 Criado em', value: message.guild.createdAt.toLocaleDateString(), inline: true },
                { name: '💬 Canais', value: `${message.guild.channels.cache.size}`, inline: true },
                { name: '🤖 Cargos', value: `${message.guild.roles.cache.size}`, inline: true }
            )
            .setColor(0x00008B); // Azul escuro
        
        await message.reply({ embeds: [embed] });
    }
    
    // Comando: botinfo
    else if (command === 'botinfo') {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Informações do Orbit™')
            .setDescription('Bot multifuncional para Discord')
            .setColor(0x00008B) // Azul escuro
            .addFields(
                { name: '📊 Servidores', value: `${client.guilds.cache.size}`, inline: true },
                { name: '👥 Usuários vistos', value: `${client.users.cache.size}`, inline: true },
                { name: '📅 Criado em', value: client.user.createdAt.toLocaleDateString(), inline: true },
                { name: '🔗 Prefixo', value: '`bt!`', inline: true },
                { name: '🌐 Site', value: 'em breve', inline: true },
                { name: '🆘 Suporte', value: 'https://discord.gg/pPnSZEYGZ6', inline: true }
            )
            .setFooter({ text: 'Orbit™ • Sistema de Logs' });
        
        await message.reply({ embeds: [embed] });
    }
});

// ========== LOGAR O BOT ==========
client.login(config.token);