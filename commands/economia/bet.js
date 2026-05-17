// commands/economia/apostaOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { adicionarXP, calcularXPporGanho } = require('../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function getBoostMultiplier(userId, db) {
    let multiplier = 1.0;
    if (db.usuarios[userId]?.boosts?.ganhos && db.usuarios[userId].boosts.ganhos.expira > Date.now()) {
        multiplier *= db.usuarios[userId].boosts.ganhos.bonus;
    }
    return multiplier;
}

module.exports = {
    name: 'aposta',
    aliases: ['bet', 'apostar', 'caraoucoroa', 'apostaorbital'],
    
    async executePrefix(message, args, client) {
        const amount = parseInt(args[0]);
        const escolha = args[1]?.toLowerCase();
        
        if (isNaN(amount) || amount <= 0) return message.reply('❌ Use: `bt!aposta <valor> <cara/coroa>`');
        if (!['cara', 'coroa'].includes(escolha)) return message.reply('❌ Escolha "cara" ou "coroa" orbital');
        
        const userId = message.author.id;
        const db = getDB();
        if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0, xpTotal: 0 };
        if ((db.usuarios[userId].carteira || 0) < amount) return message.reply('❌ Saldo orbital insuficiente!');
        
        const resultado = Math.random() < 0.5 ? 'cara' : 'coroa';
        const ganhou = escolha === resultado;
        
        if (ganhou) {
            const bonusInfo = calcularBonusTotal(userId, 'carteira');
            const boostMultiplier = getBoostMultiplier(userId, db);
            const ganhoFinal = Math.floor(amount * bonusInfo.bonus * boostMultiplier);
            
            db.usuarios[userId].carteira += ganhoFinal;
            const xpGanho = calcularXPporGanho(ganhoFinal);
            const resultadoXP = adicionarXP(userId, xpGanho, 'aposta');
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('🌟 Aposta Orbital - VOCÊ GANHOU!')
                .setDescription(`🪙 A moeda orbital caiu em **${resultado}**!`)
                .addFields(
                    { name: '💰 Aposta Orbital', value: `${amount.toLocaleString()} Orbs`, inline: true },
                    { name: '✨ Multiplicadores Orbitais', value: bonusInfo.texto, inline: true },
                    { name: '📈 Boost Orbital', value: boostMultiplier > 1 ? `+${Math.round((boostMultiplier - 1) * 100)}%` : 'Nenhum', inline: true },
                    { name: '🎁 Ganho Orbital', value: `+${ganhoFinal.toLocaleString()} Orbs`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                    { name: '💎 Saldo Orbital', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '🌌 Aposta Orbital • A sorte está nas estrelas!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        } else {
            db.usuarios[userId].carteira -= amount;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🌙 Aposta Orbital - VOCÊ PERDEU!')
                .setDescription(`🪙 A moeda orbital caiu em **${resultado}**...`)
                .addFields(
                    { name: '💰 Perda Orbital', value: `-${amount.toLocaleString()} Orbs`, inline: true },
                    { name: '💎 Saldo Orbital', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '🌌 Aposta Orbital • A sorte nem sempre está ao seu favor' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};