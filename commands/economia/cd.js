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
            'daily': '<:emoji_45:1504081355703586866> Diário', 'weekly': '<:emoji_45:1504081355703586866> Semanal', 'beg': '🎭 Esmola', 'sortudo': '🍀 Sorte'
        };
        
        const disponiveis = [];
        const indisponiveis = [];
        
        for (const cmd of todosCooldowns) {
            const nome = nomesComandos[cmd.comando] || cmd.comando;
            if (cmd.available) {
                disponiveis.push(`**${nome}** → <:emoji_46:1504081377291927632> Disponível`);
            } else {
                indisponiveis.push(`**${nome}** → ${cmd.formatted}`);
            }
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('⏰ Tempos de Recarga')
            .setDescription(`📡 ${message.author.username}, aqui está o status:`)
            .setThumbnail(message.author.displayAvatarURL());
        
        if (indisponiveis.length > 0) {
            embed.addFields({ name: '⏳ Aguardando...', value: indisponiveis.join('\n'), inline: false });
        } else {
            embed.addFields({ name: '⏳ Aguardando...', value: '✨ Nenhum comando em recarga!', inline: false });
        }
        
        if (disponiveis.length > 0) {
            embed.addFields({ name: '<:emoji_46:1504081377291927632> Prontos', value: disponiveis.join('\n'), inline: false });
        }
        
        embed.setFooter({ text: `${indisponiveis.length}/${todosCooldowns.length} comandos em recarga` });
        await message.reply({ embeds: [embed] });
    }
};