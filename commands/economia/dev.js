// commands/admin/devOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// 🔧 CONFIGURE AQUI OS IDs DOS DESENVOLVEDORES
const DEVELOPERS_IDS = [
    'SEU_ID_DISCORD_AQUI',        // Seu ID
    '123456789012345678',         // ID do desenvolvedor 2
    '876543210987654321'          // ID do desenvolvedor 3
];

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'dev',
    aliases: ['developer', 'admin', 'devorbital'],
    
    async executePrefix(message, args, client) {
        // Verificar se é desenvolvedor
        if (!DEVELOPERS_IDS.includes(message.author.id)) {
            return message.reply('❌ Acesso orbital negado! Apenas desenvolvedores autorizados podem usar este comando.');
        }
        
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        
        // ========== STATUS DO BOT ==========
        if (subcmd === 'status') {
            const totalUsuarios = Object.keys(db.usuarios).length;
            const totalGuilds = client.guilds.cache.size;
            const uptime = formatUptime(client.uptime);
            const memoria = process.memoryUsage();
            
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('🛸 Orbit - Status do Desenvolvedor')
                .setDescription('📡 Informações orbitais do sistema:')
                .addFields(
                    { name: '👥 Usuários totais', value: `${totalUsuarios}`, inline: true },
                    { name: '🌍 Servidores', value: `${totalGuilds}`, inline: true },
                    { name: '⏰ Uptime', value: uptime, inline: true },
                    { name: '💾 Memória RAM', value: `${(memoria.heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                    { name: '📡 Versão do Bot', value: 'Orbit v2.0.0', inline: true },
                    { name: '⭐ Comandos Carregados', value: `${client.commands?.size || 0}`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Sistema de Desenvolvimento' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== EXECUTAR CÓDIGO ==========
        else if (subcmd === 'eval') {
            const code = args.slice(1).join(' ');
            if (!code) return message.reply('❌ Use: `bt!dev eval <código>`');
            
            try {
                const result = eval(code);
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('✅ Eval Orbital')
                    .setDescription(`📡 **Resultado:**\n\`\`\`js\n${result}\n\`\`\``)
                    .setFooter({ text: '🌌 Orbit • Executado pelo desenvolvedor' });
                
                await message.reply({ embeds: [embed] });
            } catch (error) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('❌ Erro no Eval')
                    .setDescription(`📡 **Erro:**\n\`\`\`js\n${error}\n\`\`\``);
                
                await message.reply({ embeds: [embed] });
            }
        }
        
        // ========== RELOAD COMANDO ==========
        else if (subcmd === 'reload') {
            const comando = args[1];
            if (!comando) return message.reply('❌ Use: `bt!dev reload <comando>`');
            
            try {
                delete require.cache[require.resolve(`../${comando}.js`)];
                const cmd = require(`../${comando}.js`);
                client.commands.set(cmd.name, cmd);
                
                await message.reply(`✅ Comando **${comando}** recarregado com sucesso!`);
            } catch (error) {
                await message.reply(`❌ Erro ao recarregar comando: ${error}`);
            }
        }
        
        // ========== DAR ORBS PARA TODOS ==========
        else if (subcmd === 'giveall') {
            const quantia = parseInt(args[1]);
            if (isNaN(quantia) || quantia <= 0) return message.reply('❌ Digite um valor orbital válido!');
            
            let count = 0;
            for (const [userId, data] of Object.entries(db.usuarios)) {
                if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0 };
                db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + quantia;
                count++;
            }
            saveDB(db);
            
            await message.reply(`✅ **${quantia.toLocaleString()} Orbs** adicionados para **${count}** usuários!`);
        }
        
        // ========== LIMPAR BANCO DE DADOS ==========
        else if (subcmd === 'cleardb') {
            const confirm = args[1]?.toLowerCase();
            if (confirm !== 'confirmar') {
                return message.reply('⚠️ Isso irá resetar TODOS os dados do banco! Use `bt!dev cleardb confirmar` para confirmar.');
            }
            
            fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
            await message.reply('✅ Banco de dados resetado com sucesso!');
        }
        
        // ========== SERVIDORES DO BOT ==========
        else if (subcmd === 'servidores') {
            const guilds = client.guilds.cache.map(g => `${g.name} - ${g.memberCount} membros`).join('\n');
            
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('🌍 Servidores Orbitais')
                .setDescription(`📡 ${guilds || 'Nenhum servidor'}`)
                .setFooter({ text: `Total: ${client.guilds.cache.size} servidores` });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== BROADCAST (mensagem para todos servidores) ==========
        else if (subcmd === 'broadcast') {
            const mensagem = args.slice(1).join(' ');
            if (!mensagem) return message.reply('❌ Use: `bt!dev broadcast <mensagem>`');
            
            let enviadas = 0;
            for (const guild of client.guilds.cache.values()) {
                const channel = guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages'));
                if (channel) {
                    await channel.send(`📢 **Mensagem Orbital do Desenvolvedor:**\n${mensagem}`).catch(() => {});
                    enviadas++;
                }
            }
            
            await message.reply(`✅ Mensagem enviada para **${enviadas}** servidores!`);
        }
        
        // ========== BACKUP ==========
        else if (subcmd === 'backup') {
            const timestamp = Date.now();
            const backupPath = path.join(__dirname, '..', '..', `backup_${timestamp}.json`);
            fs.writeFileSync(backupPath, JSON.stringify(db, null, 2));
            
            await message.reply(`✅ Backup criado: \`backup_${timestamp}.json\``);
        }
        
        // ========== AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('👑 Sistema de Desenvolvimento Orbital')
                .setDescription('Comandos exclusivos para desenvolvedores:')
                .addFields(
                    { name: '📊 `bt!dev status`', value: 'Mostra status do bot', inline: false },
                    { name: '💻 `bt!dev eval <código>`', value: 'Executa código JavaScript', inline: false },
                    { name: '🔄 `bt!dev reload <comando>`', value: 'Recarrega um comando', inline: false },
                    { name: '🎁 `bt!dev giveall <quantia>`', value: 'Dá Orbs para todos os usuários', inline: false },
                    { name: '🗑️ `bt!dev cleardb confirmar`', value: 'Reseta o banco de dados', inline: false },
                    { name: '🌍 `bt!dev servidores`', value: 'Lista todos os servidores', inline: false },
                    { name: '📢 `bt!dev broadcast <msg>`', value: 'Envia mensagem para todos servidores', inline: false },
                    { name: '💾 `bt!dev backup`', value: 'Cria backup do banco de dados', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Apenas desenvolvedores autorizados' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}