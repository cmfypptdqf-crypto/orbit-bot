const { EmbedBuilder } = require('discord.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');

module.exports = {
    name: 'cd',
    aliases: ['cooldowns', 'tempo', 'wait', 'espera', 'restante', 'recarga'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // Buscar todos os cooldowns do usuário
        const todosCooldowns = cooldownsManager.getAll(userId);
        
        // Nomes amigáveis dos comandos
        const nomesComandos = {
            'missao': '🚀 Work',
            'search': '🔍 Busca',
            'pirataria': '☄️ Roubar',
            'daily': '📆 Daily',
            'weekly': '📅 Semanal',
            'beg': '🎭 Beg',
            'sortudo': '🍀 Luck'
        };
        
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⏰ Tempos de Recarga')
            .setDescription(`Aqui está quanto tempo falta para você usar cada comando novamente:`)
            .setThumbnail(message.author.displayAvatarURL())
            .setTimestamp();
        
        // Separar disponíveis e indisponíveis
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
        
        if (indisponiveis.length > 0) {
            embed.addFields({
                name: '⏳ Aguardando...',
                value: indisponiveis.join('\n'),
                inline: false
            });
        } else {
            embed.addFields({
                name: '⏳ Aguardando...',
                value: '✨ Nenhum comando em recarga!',
                inline: false
            });
        }
        
        if (disponiveis.length > 0) {
            embed.addFields({
                name: '✅ Prontos para usar',
                value: disponiveis.join('\n'),
                inline: false
            });
        }
        
        const totalIndisponiveis = indisponiveis.length;
        if (totalIndisponiveis > 0) {
            embed.setFooter({ text: `${totalIndisponiveis} comando(s) em recarga` });
        } else {
            embed.setFooter({ text: '✨ Todos os comandos estão disponíveis!' });
        }
        
        await message.reply({ embeds: [embed] });
    }
};