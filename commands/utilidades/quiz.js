// commands/minigames/triviaOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

const perguntas = [
    { pergunta: 'Qual é o planeta mais próximo do Sol?', respostas: ['Mercúrio', 'Vênus', 'Terra', 'Marte'], correta: 0 },
    { pergunta: 'Qual é a galáxia onde vivemos?', respostas: ['Andrômeda', 'Via Láctea', 'Triângulo', 'Olho Negro'], correta: 1 },
    { pergunta: 'Qual é a estrela mais próxima da Terra?', respostas: ['Próxima Centauri', 'Sol', 'Sirius', 'Alpha Centauri'], correta: 1 },
    { pergunta: 'Qual planeta é conhecido como o "Planeta Vermelho"?', respostas: ['Júpiter', 'Saturno', 'Marte', 'Vênus'], correta: 2 }
];

const usuariosTrivia = {};

module.exports = {
    name: 'trivia',
    aliases: ['quiz', 'triviaorbital'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        if (!usuariosTrivia[userId]) {
            usuariosTrivia[userId] = { pontuacao: 0, respondidas: 0 };
        }
        
        const pergunta = perguntas[Math.floor(Math.random() * perguntas.length)];
        
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle('📚 Trivia Orbital')
            .setDescription(`📡 **${pergunta.pergunta}**`)
            .addFields(
                { name: '🎯 Opções', value: pergunta.respostas.map((r, i) => `${i + 1}. ${r}`).join('\n'), inline: false },
                { name: '📊 Pontuação', value: `${usuariosTrivia[userId].pontuacao}`, inline: true },
                { name: '📈 Respondidas', value: `${usuariosTrivia[userId].respondidas}`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Responda com !trivia resposta <número>' });
        
        await message.reply({ embeds: [embed] });
        
        // Aguardar resposta
        const filter = m => m.author.id === userId && m.content.startsWith('!trivia resposta');
        const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });
        
        collector.on('collect', async (m) => {
            const respostaNum = parseInt(m.content.split(' ')[2]);
            if (respostaNum === pergunta.correta + 1) {
                usuariosTrivia[userId].pontuacao += 10;
                usuariosTrivia[userId].respondidas++;
                const xpGanho = 10;
                const resultadoXP = adicionarXP(userId, xpGanho, 'trivia');
                
                await message.reply(`✅ Resposta correta! +10 pontos! ⭐ +${xpGanho} XP`);
            } else {
                await message.reply(`❌ Resposta errada! A correta era: **${pergunta.respostas[pergunta.correta]}**`);
            }
        });
    }
};