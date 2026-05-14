// commands/economia/cd.js
const { EmbedBuilder } = require('discord.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');

module.exports = {
    name: 'cd',
    aliases: ['cooldowns', 'tempo', 'wait', 'espera', 'restante', 'recarga', 'cooldown'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // ========== BUSCAR TODOS OS COOLDOWNS ==========
        const todosCooldowns = cooldownsManager.getAll(userId);
        
        // ========== NOMES AMIGÁVEIS DOS COMANDOS ==========
        const nomesComandos = {
            'missao': '🚀 Missão',
            'work': '🚀 Missão',
            'search': '🔍 Exploração',
            'procurar': '🔍 Exploração',
            'pirataria': '☄️ Pirataria',
            'roubar': '☄️ Pirataria',
            'crime': '☄️ Pirataria',
            'daily': '📆 Diário',
            'diario': '📆 Diário',
            'weekly': '📅 Semanal',
            'semanal': '📅 Semanal',
            'beg': '🎭 Esmola',
            'pedir': '🎭 Esmola',
            'sortudo': '🍀 Sorte',
            'luck': '🍀 Sorte'
        };
        
        // ========== CORES POR COMANDO ==========
        const coresComandos = {
            'missao': 0x00FF00,
            'search': 0x3498DB,
            'pirataria': 0xE74C3C,
            'daily': 0xFFD700,
            'weekly': 0x9B59B6,
            'beg': 0xE67E22,
            'sortudo': 0x1ABC9C
        };
        
        // ========== SEPARAR DISPONÍVEIS E INDISPONÍVEIS ==========
        const disponiveis = [];
        const indisponiveis = [];
        
        for (const cmd of todosCooldowns) {
            const nome = nomesComandos[cmd.comando] || cmd.comando;
            if (cmd.available) {
                disponiveis.push(`**${nome}** → ✅ Disponível`);
            } else {
                indisponiveis.push(`**${nome}** → ${cmd.formatted}`);
            }
        }
        
        // ========== CALCULAR PRÓXIMO COOLDOWN MAIS PRÓXIMO ==========
        let proximoCooldown = null;
        let menorTempo = Infinity;
        
        for (const cmd of todosCooldowns) {
            if (!cmd.available && cmd.remaining < menorTempo) {
                menorTempo = cmd.remaining;
                proximoCooldown = cmd;
            }
        }
        
        // ========== CRIAR EMBED ==========
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⏰ Sistema de Recarga Orbit')
            .setDescription(`📡 **${message.author.username}**, aqui está o status dos seus comandos:`)
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
        
        // ========== COMANDOS EM RECARGA ==========
        if (indisponiveis.length > 0) {
            embed.addFields({
                name: '⏳ COMANDOS EM RECARGA',
                value: indisponiveis.join('\n'),
                inline: false
            });
        } else {
            embed.addFields({
                name: '⏳ COMANDOS EM RECARGA',
                value: '✨ Nenhum comando em recarga! Todos estão prontos para uso.',
                inline: false
            });
        }
        
        // ========== COMANDOS DISPONÍVEIS ==========
        if (disponiveis.length > 0) {
            embed.addFields({
                name: '✅ COMANDOS DISPONÍVEIS',
                value: disponiveis.join('\n'),
                inline: false
            });
        }
        
        // ========== PRÓXIMO COOLDOWN ==========
        if (proximoCooldown) {
            const nomeProximo = nomesComandos[proximoCooldown.comando] || proximoCooldown.comando;
            const corProxima = coresComandos[proximoCooldown.comando] || 0x3498DB;
            
            embed.addFields({
                name: '⏰ PRÓXIMO COOLDOWN',
                value: `**${nomeProximo}** ficará disponível em **${proximoCooldown.formatted.replace('⏰ ', '')}**`,
                inline: false
            });
            embed.setColor(corProxima);
        }
        
        // ========== ESTATÍSTICAS ==========
        const totalIndisponiveis = indisponiveis.length;
        const totalComandos = todosCooldowns.length;
        
        let mensagemFooter = '';
        if (totalIndisponiveis === 0) {
            mensagemFooter = '✨ Todos os comandos estão disponíveis! Aproveite!';
        } else {
            mensagemFooter = `⏰ ${totalIndisponiveis}/${totalComandos} comandos em recarga`;
        }
        
        embed.setFooter({ text: mensagemFooter });
        
        // ========== DICA ADICIONAL ==========
        if (totalIndisponiveis > 0) {
            embed.addFields({
                name: '💡 DICA',
                value: 'Use `bt!daily` para bônus diário, `bt!semanal` para bônus semanal, e complete missões para ganhar Orbs!',
                inline: false
            });
        }
        
        await message.reply({ embeds: [embed] });
    }
};