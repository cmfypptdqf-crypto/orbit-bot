const { EmbedBuilder, version } = require('discord.js');
const os = require('os');

module.exports = {
    name: 'botinfo',
    aliases: ['bi', 'infobot', 'about'],
    
    async executePrefix(message, args, client) {
        // Calcular tempo de atividade
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);
        
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        // Uso de memória
        const memoryUsage = process.memoryUsage();
        const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
        const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2);
        
        // Estatísticas do bot
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalGuilds = client.guilds.cache.size;
        const totalChannels = client.channels.cache.size;
        const totalCommands = client.commands.size;
        
        // Ping
        const ping = Math.round(client.ws.ping);
        
        // Informações do sistema (com tratamento de erro)
        const cpuCores = os.cpus().length;
        let cpuModel = 'Desconhecido';
        
        if (os.cpus() && os.cpus().length > 0 && os.cpus()[0] && os.cpus()[0].model) {
            cpuModel = os.cpus()[0].model.split('@')[0].trim();
            if (cpuModel.length > 30) cpuModel = cpuModel.substring(0, 30) + '...';
        }
        
        const osType = `${os.type()} ${os.release()}`;
        const nodeVersion = process.version;
        const discordVersion = version;
        
        // Criar embed
        const embed = new EmbedBuilder()
            .setTitle('🤖 Orbit™ - Informações do Bot')
            .setDescription('Bot multifuncional para Discord')
            .setColor(0x00008B)
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .addFields(
                { name: '📊 **Estatísticas**', value: 'ㅤ', inline: false },
                { name: '📁 Servidores', value: `\`${totalGuilds}\``, inline: true },
                { name: '👥 Usuários', value: `\`${totalUsers}\``, inline: true },
                { name: '💬 Canais', value: `\`${totalChannels}\``, inline: true },
                { name: '📦 Comandos', value: `\`${totalCommands}\``, inline: true },
                { name: '🏓 Ping', value: `\`${ping}ms\``, inline: true },
                { name: '⏰ Uptime', value: `\`${uptimeString}\``, inline: true },
                
                { name: '💻 **Sistema**', value: 'ㅤ', inline: false },
                { name: '🖥️ CPU', value: `\`${cpuModel}\`\n\`${cpuCores} núcleo(s)\``, inline: true },
                { name: '💾 Memória', value: `\`Heap: ${heapUsed}MB / ${heapTotal}MB\`\n\`RSS: ${rss}MB\``, inline: true },
                { name: '🔄 Node.js', value: `\`${nodeVersion}\``, inline: true },
                { name: '🤖 Discord.js', value: `\`v${discordVersion}\``, inline: true },
                { name: '💿 Sistema', value: `\`${osType}\``, inline: true },
                
                { name: '🔗 **Links**', value: '[WebSite](https://orbitbot-theta.vercel.app/) | [Suporte](https://discord.gg/pPnSZEYGZ6) | [Invite](https://discord.com/oauth2/authorize?client_id=1502920914730483844&scope=bot%20applications.commands&permissions=8)', ㅤinline: false },
                { name: '📝 Prefixo', value: `\`${client.prefix}\``, inline: true }
            )
            .setFooter({ text: `Orbit™ • ID: ${client.user.id}` })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};