// commands/fun/piada.js
const { EmbedBuilder } = require('discord.js');

const piadas = [
    { pergunta: 'Por que o astronauta levou um lápis para o espaço?', resposta: 'Para desenhar estrelas!' },
    { pergunta: 'O que o sol disse para a lua?', resposta: 'Você é luz do meu caminho!' },
    { pergunta: 'Qual o planeta mais engraçado?', resposta: 'Urano (você riu né?)' }
];

module.exports = {
    name: 'piada',
    aliases: ['joke', 'humor'],
    
    async executePrefix(message, args, client) {
        const piada = piadas[Math.floor(Math.random() * piadas.length)];
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('😂 Piada Cósmica')
            .setDescription(`📡 ${piada.pergunta}\n\n✨ **${piada.resposta}**`)
            .setFooter({ text: '🌌 Orbit • Comédia interestelar' });
        
        await message.reply({ embeds: [embed] });
    }
};