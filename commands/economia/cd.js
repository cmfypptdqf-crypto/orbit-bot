// commands/economia/cd.js
const { EmbedBuilder } = require('discord.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');

module.exports = {
    name: 'cd',
    aliases: ['cooldowns', 'tempo', 'wait', 'espera', 'restante', 'recarga'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const todosCooldowns = cooldownsManager.getAll(userId);
        
        const nomesComandos = {
            'missao': '🎯 Galactic Quest', 'search': '🔍 Exploração', 'pirataria': '☄️ Pirataria',
            'daily': '📆 Diário', 'weekly': '📅 Semanal', 'beg': '🎭 Esmola', 'sortudo': '🍀 Sorte'
        };
        
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
        
        const embed = new EmbedBuilder()
            .setColor(0x3498DB)
            .setTitle('⏰ Tempos de Recarga')
            .setDescription(`📡 ${message.author.username}, aqui está o status:`)
            .setThumbnail(message.author.displayAvatarURL());
        
        if (indisponiveis.length > 0) {
            embed.addFields({ name: '⏳ Aguardando...', value: indisponiveis.join('\n'), inline: false });
        } else {
            embed.addFields({ name: '⏳ Aguardando...', value: '✨ Nenhum comando em recarga!', inline: false });
        }
        
        if (disponiveis.length > 0) {
            embed.addFields({ name: '✅ Prontos', value: disponiveis.join('\n'), inline: false });
        }
        
        embed.setFooter({ text: `${indisponiveis.length}/${todosCooldowns.length} comandos em recarga` });
        await message.reply({ embeds: [embed] });
    }
};