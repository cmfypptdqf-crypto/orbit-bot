// commands/fun/8ball.js
const { EmbedBuilder } = require('discord.js');

const respostas = [
    '🎱 Sim, com certeza!', '🎱 Definitivamente sim!', '🎱 Pode contar com isso!',
    '🎱 Sim, o universo conspira a seu favor!', '🎱 As estrelas dizem que sim!',
    '🎱 Não tenho certeza...', '🎱 Pergunte novamente mais tarde.',
    '🎱 Melhor não te contar agora.', '🎱 Não posso prever isso agora.',
    '🎱 Não, de jeito nenhum!', '🎱 As estrelas dizem que não!',
    '🎱 Muito duvidoso.', '🎱 Minha resposta é não.'
];

module.exports = {
    name: '8ball',
    aliases: ['pergunta', 'question'],
    
    async executePrefix(message, args, client) {
        const pergunta = args.join(' ');
        if (!pergunta) return message.reply('❌ Faça uma pergunta! Ex: `bt!8ball Vou ganhar na loteria?`');
        
        const resposta = respostas[Math.floor(Math.random() * respostas.length)];
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('🎱 Bola Mágica Cósmica')
            .setDescription(`📡 Pergunta: *${pergunta}*\n\n✨ Resposta: **${resposta}**`)
            .setFooter({ text: '🌌 Orbit • O universo te responde' });
        
        await message.reply({ embeds: [embed] });
    }
};