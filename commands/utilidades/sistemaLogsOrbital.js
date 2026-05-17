// utilidades/sistemaLogsOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.json');

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
    aliases: ['sistemalogs', 'logorbital', 'configlogs'],
    
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
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Canal de Log Configurado')
                .setDescription(`📡 Canal de logs **${tipo}** configurado para ${canal}!`)
                .addFields(
                    { name: '📝 Tipo', value: tipo, inline: true },
                    { name: '📡 Canal', value: `<#${canal.id}>`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Sistema de Logs Orbital' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // ========== VER CONFIGURAÇÃO ==========
        else if (subcmd === 'status') {
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('📊 Sistema de Logs Orbitais')
                .setDescription(`📡 Configuração atual do servidor **${message.guild.name}**`)
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
            
            const tiposMap = {
                'mensagens': 'canalMensagens',
                'entrada': 'canalEntradaSaida',
                'call': 'canalCall',
                'cargos': 'canalCargos',
                'punicoes': 'canalPunicoes',
                'moderacao': 'canalModeracao'
            };
            
            const canalKey = tiposMap[tipo];
            if (!canalKey) {
                return message.reply('❌ Tipo inválido! Use: mensagens, entrada, call, cargos, punicoes, moderacao');
            }
            
            const canalId = config[canalKey];
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
            
            const respostaEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Teste Enviado')
                .setDescription(`📡 Teste enviado para o canal de logs **${tipo}**!`)
                .addFields(
                    { name: '📡 Canal', value: `<#${canalId}>`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Sistema de Logs Orbital' });
            
            await message.reply({ embeds: [respostaEmbed] });
        }
        
        // ========== REMOVER CONFIGURAÇÃO ==========
        else if (subcmd === 'remover') {
            const tipo = args[1]?.toLowerCase();
            
            const tipos = {
                'mensagens': 'canalMensagens',
                'entrada': 'canalEntradaSaida',
                'call': 'canalCall',
                'cargos': 'canalCargos',
                'punicoes': 'canalPunicoes',
                'moderacao': 'canalModeracao',
                'todos': 'todos'
            };
            
            if (!tipos[tipo]) {
                return message.reply('❌ Tipo inválido! Use: mensagens, entrada, call, cargos, punicoes, moderacao, todos');
            }
            
            if (tipo === 'todos') {
                config.canalMensagens = null;
                config.canalEntradaSaida = null;
                config.canalCall = null;
                config.canalCargos = null;
                config.canalPunicoes = null;
                config.canalModeracao = null;
                saveDB(db);
                
                const embed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle('🗑️ Configurações Removidas')
                    .setDescription(`📡 Todas as configurações de logs foram removidas orbitalmente!`)
                    .setFooter({ text: '🌌 Orbit • Sistema de Logs Orbital' });
                
                await message.reply({ embeds: [embed] });
            } else {
                config[tipos[tipo]] = null;
                saveDB(db);
                
                const embed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle('🗑️ Configuração Removida')
                    .setDescription(`📡 Canal de logs **${tipo}** foi removido orbitalmente!`)
                    .setFooter({ text: '🌌 Orbit • Sistema de Logs Orbital' });
                
                await message.reply({ embeds: [embed] });
            }
        }
        
        // ========== AJUDA ==========
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('📋 Sistema de Logs Orbitais')
                .setDescription('Comandos disponíveis para configurar os logs do servidor:')
                .addFields(
                    { name: '⚙️ `bt!logs config <tipo> #canal`', value: 'Configura canal de logs\nTipos: mensagens, entrada, call, cargos, punicoes, moderacao', inline: false },
                    { name: '📊 `bt!logs status`', value: 'Mostra configuração atual', inline: false },
                    { name: '🧪 `bt!logs testar <tipo>`', value: 'Testa o canal de logs', inline: false },
                    { name: '🗑️ `bt!logs remover <tipo>`', value: 'Remove configuração de um tipo (ou "todos")', inline: false },
                    { name: '📝 O que é logado?', value: '• Mensagens deletadas/editadas\n• Entrada/saída de membros\n• Entrada/saída de calls\n• Cargos adicionados/removidos\n• Canais criados/deletados\n• Bans, kicks e mutes', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Sistema de Logs Orbital' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};