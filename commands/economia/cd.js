// commands/economia/orbitalCD.js
const { EmbedBuilder } = require('discord.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

module.exports = {
    name: 'orbitcd',
    aliases: ['cd', 'cooldowns', 'tempo', 'wait', 'espera', 'restante', 'recarga', 'orbitalcd'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const todosCooldowns = cooldownsManager.getAll(userId);
        
        // Adicionar XP por consultar cooldowns
        const xpGanho = 1;
        const resultadoXP = adicionarXP(userId, xpGanho, 'orbitcd');
        
        const nomesComandos = {
            'missao': '🚀 Missão Orbital',
            'search': '🔍 Exploração Estelar',
            'pirataria': '☄️ Pirataria Orbital',
            'daily': '🌟 Órbita Diária',
            'weekly': '🪐 Órbita Semanal',
            'beg': '🎭 Esmola Estelar',
            'sortudo': '🍀 Sorte Orbital'
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
            .setTitle('⏰ Orbit CD - Tempos de Recarga Orbital')
            .setDescription(`📡 ${message.author.username}, aqui está o status dos seus comandos orbitais:`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
            );
        
        if (indisponiveis.length > 0) {
            embed.addFields({ name: '⏳ EM RECARGA ORBITAL', value: indisponiveis.join('\n'), inline: false });
        } else {
            embed.addFields({ name: '⏳ EM RECARGA ORBITAL', value: '✨ Nenhum comando orbital em recarga!', inline: false });
        }
        
        if (disponiveis.length > 0) {
            embed.addFields({ name: '✅ PRONTOS PARA USAR', value: disponiveis.join('\n'), inline: false });
        }
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        embed.setFooter({ text: `${indisponiveis.length}/${todosCooldowns.length} comandos orbitais em recarga` });
        await message.reply({ embeds: [embed] });
    }
};