// commands/admin/sistemaLogsOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ logsConfig: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'logs',
    aliases: ['sistemalogs', 'logorbital'],
    
    async executePrefix(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Apenas administradores orbitais podem configurar os logs!');
        }
        
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        const guildId = message.guild.id;
        
        if (!db.logsConfig[guildId]) {
            db.logsConfig[guildId] = {
                canalMensagens: null,      // Mensagens deletadas/editadas
                canalEntradaSaida: null,   // Entrada/saída de membros
                canalCall: null,           // Entrada/saída de calls de voz
                canalCargos: null,         // Alterações de cargos
                canalPunicoes: null,       // Punições (kick, ban, mute, warn)
                canalModeracao: null,      // Ações de moderação
                webhookUrl: null
            };
            saveDB(db);
        }
        
        const config = db.logsConfig[guildId];
        
        // ========== CONFIGURAR CANAIS ==========
        if (subcmd === 'config') {
            const tipo = args[1]?.toLowerCase();
            const canal = message.mentions.channels.first();
            
            if (!canal) return message.reply('❌ Use: `bt!logs config <tipo> #canal`\nTipos: mensagens, entrada, call, cargos, punicoes, moderacao');
            
            const tipos = {
                'mensagens': 'canalMensagens',
                'entrada': 'canalEntradaSaida',
                'call': 'canalCall',
                'cargos': 'canalCargos',
                'punicoes': 'canalPunicoes',
                'moderacao': 'canalModeracao'
            };
            
            if (!tipos[tipo]) {
                return message.reply('❌ Tipo inválido! Use: mensagens, entrada, call, cargos, punicoes, moderacao');
            }
            
            config[tipos[tipo]] = canal.id;
            saveDB(db);
            
            await message.reply(`✅ Canal de logs **${tipo}** configurado para ${canal}!`);
        }
        
        // ========== VER CONFIGURAÇÃO ==========
        else if (subcmd === 'status') {
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('📊 Sistema de Logs Orbitais')
                .addFields(
                    { name: '📝 Logs de Mensagens', value: config.canalMensagens ? `<#${config.canalMensagens}>` : '❌ Não configurado', inline: true },
                    { name: '🚪 Logs de Entrada/Saída', value: config.canalEntradaSaida ? `<#${config.canalEntradaSaida}>` : '❌ Não configurado', inline: true },
                    { name: '🎙️ Logs de Call', value: config.canalCall ? `<#${config.canalCall}>` : '❌ Não configurado', inline: true },
                    { name: '🎖️ Logs de Cargos', value: config.canalCargos ? `<#${config.canalCargos}>` : '❌ Não configurado', inline: true },
                    { name: '🔨 Logs de Punições', value: config.canalPunicoes ? `<#${config.canalPunicoes}>` : '❌ Não configurado', inline: true },
                    { name: '⚙️ Logs de Moderação', value: config.canalModeracao ? `<#${config.canalModeracao}>` : '❌ Não configurado', inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Use bt!logs config <tipo> #canal para configurar' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== TESTAR ==========
        else if (subcmd === 'testar') {
            const tipo = args[1]?.toLowerCase();
            const canalId = config[`canal${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`];
            
            if (!canalId) {
                return message.reply(`❌ Canal de logs **${tipo}** não configurado!`);
            }
            
            const canalLog = message.guild.channels.cache.get(canalId);
            if (!canalLog) return message.reply('❌ Canal de logs não encontrado!');
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Teste de Log Orbital')
                .setDescription(`📡 Este é um teste do sistema de logs **${tipo}**!`)
                .addFields(
                    { name: '📅 Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                    { name: '👑 Testado por', value: message.author.tag, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Sistema de logs orbital ativo' });
            
            await canalLog.send({ embeds: [embed] });
            await message.reply(`✅ Teste enviado para o canal de logs **${tipo}**!`);
        }
        
        // ========== AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('📋 Sistema de Logs Orbitais')
                .setDescription('Comandos disponíveis:')
                .addFields(
                    { name: '⚙️ `bt!logs config <tipo> #canal`', value: 'Configura canal de logs\nTipos: mensagens, entrada, call, cargos, punicoes, moderacao', inline: false },
                    { name: '📊 `bt!logs status`', value: 'Mostra configuração atual', inline: false },
                    { name: '🧪 `bt!logs testar <tipo>`', value: 'Testa o canal de logs', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Sistema de logs orbital' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};