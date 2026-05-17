// commands/fun/risadaOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

const piadasOrbitais = [
    { pergunta: 'Por que o astronauta levou um lápis para o espaço?', resposta: 'Para desenhar estrelas!' },
    { pergunta: 'O que o sol disse para a lua?', resposta: 'Você é luz do meu caminho orbital!' },
    { pergunta: 'Qual o planeta mais engraçado?', resposta: 'Urano (você riu né?)' },
    { pergunta: 'O que é um pontinho preto no espaço?', resposta: 'Um astronauta sujo!' },
    { pergunta: 'Como o astronauta liga para casa?', resposta: 'Por via láctea!' }
];

module.exports = {
    name: 'risada',
    aliases: ['piada', 'joke', 'humor', 'risadaorbital'],
    
    async executePrefix(message, args, client) {
        const piada = piadasOrbitais[Math.floor(Math.random() * piadasOrbitais.length)];
        
        // Adicionar XP por usar o comando
        const xpGanho = 3;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'risada');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('😂 Risada Orbital')
            .setDescription(`📡 ${piada.pergunta}\n\n✨ **${piada.resposta}**`)
            .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true })
            .setFooter({ text: '🌌 Orbit • Comédia interestelar' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};