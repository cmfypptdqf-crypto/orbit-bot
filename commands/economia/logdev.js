// commands/admin/logsDev.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DEVELOPERS_IDS = ['SEU_ID_DISCORD_AQUI'];

module.exports = {
    name: 'logs',
    aliases: ['log', 'logsdev'],
    
    async executePrefix(message, args, client) {
        if (!DEVELOPERS_IDS.includes(message.author.id)) {
            return message.reply('❌ Acesso orbital negado! Apenas desenvolvedores.');
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle('📋 Logs do Sistema Orbital')
            .setDescription('📡 Últimas atividades registradas:')
            .addFields(
                { name: '📊 Comandos', value: 'Sistema de logs ativo', inline: true },
                { name: '👥 Usuários', value: `${client.users.cache.size}`, inline: true },
                { name: '🌍 Servidores', value: `${client.guilds.cache.size}`, inline: true },
                { name: '📡 Status', value: '🟢 Online', inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Logs em desenvolvimento' });
        
        await message.reply({ embeds: [embed] });
    }
};