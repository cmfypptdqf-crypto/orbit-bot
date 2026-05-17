// commands/fun/oraculoOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

const respostasOrbitais = [
    '🔮 Sim, as estrelas confirmam!',
    '🔮 Definitivamente sim, comandante!',
    '🔮 A órbita está alinhada a seu favor!',
    '🔮 Sim, o universo conspira a seu favor!',
    '🔮 As nebulosas dizem que sim!',
    '🔮 Não tenho certeza... os planetas estão confusos.',
    '🔮 Pergunte novamente quando a órbita se alinhar.',
    '🔮 Melhor não te contar agora... os sensores estão instáveis.',
    '🔮 Não posso prever isso no momento.',
    '🔮 Não, a gravidade está contra você.',
    '🔮 As estrelas dizem que não!',
    '🔮 Muito duvidoso, comandante.',
    '🔮 Minha resposta orbital é não.'
];

module.exports = {
    name: 'oraculo',
    aliases: ['8ball', 'pergunta', 'oraculoorbital', 'question'],
    
    async executePrefix(message, args, client) {
        const pergunta = args.join(' ');
        if (!pergunta) return message.reply('❌ Faça uma pergunta orbital! Ex: `bt!oraculo Vou ganhar na loteria?`');
        
        const resposta = respostasOrbitais[Math.floor(Math.random() * respostasOrbitais.length)];
        
        // Adicionar XP por usar o comando
        const xpGanho = 5;
        const resultadoXP = adicionarXP(message.author.id, xpGanho, 'oraculo');
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('🔮 Oráculo Orbital')
            .setDescription(`📡 Pergunta: *${pergunta}*\n\n✨ Resposta: **${resposta}**`)
            .addFields(
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • O universo te responde através das estrelas' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};