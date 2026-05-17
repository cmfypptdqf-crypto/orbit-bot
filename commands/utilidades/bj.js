// commands/minigames/blackjackOrbital.js
const { EmbedBuilder } = require('discord.js');
const { adicionarXP } = require('../../utilidades/xpSystem.js');

const jogosBlackjack = {};

function criarBaralho() {
    const naipes = ['♥', '♦', '♣', '♠'];
    const valores = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const baralho = [];
    for (const naipe of naipes) {
        for (const valor of valores) {
            baralho.push({ valor, naipe });
        }
    }
    return baralho;
}

function valorCarta(carta) {
    if (carta.valor === 'A') return 11;
    if (['K', 'Q', 'J'].includes(carta.valor)) return 10;
    return parseInt(carta.valor);
}

function calcularMao(mao) {
    let valor = 0;
    let ases = 0;
    for (const carta of mao) {
        valor += valorCarta(carta);
        if (carta.valor === 'A') ases++;
    }
    while (valor > 21 && ases > 0) {
        valor -= 10;
        ases--;
    }
    return valor;
}

module.exports = {
    name: 'blackjack',
    aliases: ['bj', '21', 'blackjackorbital'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const aposta = parseInt(args[0]);
        
        if (isNaN(aposta) || aposta <= 0) return message.reply('❌ Aposte um valor orbital válido!');
        
        const db = getDB();
        if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0 };
        if ((db.usuarios[userId].carteira || 0) < aposta) return message.reply('❌ Saldo orbital insuficiente!');
        
        const baralho = criarBaralho();
        const jogador = [baralho.pop(), baralho.pop()];
        const dealer = [baralho.pop(), baralho.pop()];
        
        jogosBlackjack[userId] = { baralho, jogador, dealer, aposta };
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🃏 Blackjack Orbital')
            .setDescription(`📡 Sua mão: ${jogador.map(c => `${c.valor}${c.naipe}`).join(' ')} (${calcularMao(jogador)})\n🎰 Dealer: ${dealer[0].valor}${dealer[0].naipe} ❓`)
            .addFields(
                { name: '💰 Aposta', value: `${aposta.toLocaleString()} Orbs`, inline: true },
                { name: '🎮 Comandos', value: '`!blackjack hit` - Pedir carta\n`!blackjack stand` - Parar', inline: false }
            )
            .setFooter({ text: '🌌 Orbit • Tente chegar o mais perto de 21!' });
        
        await message.reply({ embeds: [embed] });
    }
};