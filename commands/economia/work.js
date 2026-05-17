// commands/economia/missaoOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent, getComandoFrase } = require('../utilidades/orbitAI.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');
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
    name: 'missao',
    aliases: ['trabalhar', 'work', 'job', 'quest', 'missaoorbital'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        const cooldownCheck = cooldownsManager.check(userId, 'missao');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ **Missão Orbital em cooldown!** Aguarde **${cooldownCheck.formatted}** para sua próxima missão!`);
        }
        
        const missoes = [
            { nome: '🚀 Explorar Órbita de Andrômeda', ganho: [80, 200] },
            { nome: '🛸 Resgatar Alienígenas Orbitais', ganho: [60, 150] },
            { nome: '💎 Minerar Cristais Orbitais', ganho: [50, 120] },
            { nome: '🔭 Mapear Nebulosas Orbitais', ganho: [70, 180] },
            { nome: '⚔️ Defender a Estação Orbital', ganho: [100, 250] },
            { nome: '📡 Consertar Satélite Orbital', ganho: [65, 160] }
        ];
        
        const missao = missoes[Math.floor(Math.random() * missoes.length)];
        let ganhoBase = Math.floor(Math.random() * (missao.ganho[1] - missao.ganho[0] + 1) + missao.ganho[0]);
        
        const bonusInfo = calcularBonusTotal(userId, 'missoes');
        const boostMultiplier = getBoostMultiplier(userId, db);
        const ganhoFinal = Math.floor(ganhoBase * bonusInfo.bonus * boostMultiplier);
        const xpGanho = calcularXPporGanho(ganhoFinal);
        
        const db = getDB();
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, xpTotal: 0 };
        }
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganhoFinal;
        db.usuarios[userId].xpTotal = (db.usuarios[userId].xpTotal || 0) + xpGanho;
        db.usuarios[userId].total_missoes = (db.usuarios[userId].total_missoes || 0) + 1;
        
        const evento = checkRandomEvent();
        let eventoResultado = null;
        if (evento) eventoResultado = await processEvent(evento, userId, db, client);
        
        saveDB(db);
        cooldownsManager.set(userId, 'missao');
        
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle(`🚀 ${getComandoFrase('missao') || getRandomFrase('inicio')}`)
            .setDescription(`📡 **${missao.nome}**\n${getRandomFrase('sucesso')}`)
            .addFields(
                { name: '💰 Recompensa Orbital', value: `+${ganhoFinal.toLocaleString()} Orbs`, inline: true },
                { name: '✨ Multiplicadores Orbitais', value: bonusInfo.texto, inline: true },
                { name: '📈 Boost Orbital', value: boostMultiplier > 1 ? `+${Math.round((boostMultiplier - 1) * 100)}%` : 'Nenhum', inline: true },
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                { name: '💎 Saldo Orbital', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '🚀 Missão Orbital • Próxima missão em 1 hora' });
        
        if (eventoResultado) {
            embed.addFields({ name: '🎲 EVENTO ORBITAL!', value: eventoResultado.mensagem, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};