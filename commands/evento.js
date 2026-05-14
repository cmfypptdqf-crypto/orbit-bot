// commands/evento.js
const { EmbedBuilder } = require('discord.js');
const { checkRandomEvent } = require('./utilidades/orbitAI.js');

module.exports = {
    name: 'evento',
    description: 'Verifica eventos cósmicos ativos',
    aliases: ['event', 'cosmico'],
    
    async executePrefix(message, args, client) {
        const evento = checkRandomEvent();
        
        if (evento) {
            const embed = new EmbedBuilder()
                .setColor(evento.efeito === 'positivo' ? 0x00FF00 : evento.efeito === 'negativo' ? 0xFF0000 : 0xFFD700)
                .setTitle('🎲 EVENTO CÓSMICO DETECTADO!')
                .setDescription(evento.frase)
                .addFields(
                    { name: '⚡ Tipo', value: evento.efeito === 'positivo' ? '✨ Positivo' : evento.efeito === 'negativo' ? '💀 Negativo' : '🌌 Neutro', inline: true },
                    { name: '📊 Raridade', value: `${(evento.chance * 100)}%`, inline: true }
                )
                .setFooter({ text: '🌠 Orbit • Sistema de Eventos' });
            
            await message.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('🌌 Calma Cósmica')
                .setDescription('Nenhum evento especial está acontecendo no momento.\nContinue explorando para encontrar anomalias!')
                .setFooter({ text: '🌠 Orbit • Eventos ocorrem aleatoriamente' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};