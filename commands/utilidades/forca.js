// commands/minigames/forcaOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

const palavras = ['ORBIT', 'ESTRELA', 'PLANETA', 'GALAXIA', 'SATELITE', 'FOGUETE', 'ASTRONAUTA'];
const jogos = {};

module.exports = {
    name: 'forca',
    aliases: ['hangman', 'forcaorbital'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        if (!jogos[userId]) {
            const palavra = palavras[Math.floor(Math.random() * palavras.length)];
            jogos[userId] = {
                palavra: palavra,
                tentativas: 6,
                letrasErradas: [],
                acertos: Array(palavra.length).fill('_')
            };
        }
        
        const jogo = jogos[userId];
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🔤 Jogo da Forca Orbital')
            .setDescription(`📡 Palavra: ${jogo.acertos.join(' ')}`)
            .addFields(
                { name: '💀 Tentativas restantes', value: `${jogo.tentativas}`, inline: true },
                { name: '❌ Letras erradas', value: jogo.letrasErradas.join(', ') || 'Nenhuma', inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Use !forca letra <letra> para chutar!' });
        
        await message.reply({ embeds: [embed] });
    }
};