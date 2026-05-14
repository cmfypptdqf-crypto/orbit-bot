// commands/economia/missao.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent, getComandoFrase } = require('../utilidades/orbitAI.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');
const { recalcularPoderClan } = require('../utilidades/clanUtils.js');

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

module.exports = {
    name: 'missao',
    aliases: ['trabalhar', 'work', 'job', 'mission'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        const cooldownCheck = cooldownsManager.check(userId, 'missao');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde mais **${cooldownCheck.formatted}** para outra missão!`);
        }
        
        const missoes = [
            { nome: '🚀 Explorar Andrômeda', ganho: [80, 200] },
            { nome: '🛸 Resgatar Alienígenas', ganho: [60, 150] },
            { nome: '💎 Minerar Cristais', ganho: [50, 120] },
            { nome: '🔭 Mapear Nebulosas', ganho: [70, 180] },
            { nome: '⚔️ Derrotar Invasores', ganho: [100, 250] },
            { nome: '📡 Consertar Satélite', ganho: [65, 160] }
        ];
        
        const missao = missoes[Math.floor(Math.random() * missoes.length)];
        let ganhoBase = Math.floor(Math.random() * (missao.ganho[1] - missao.ganho[0] + 1) + missao.ganho[0]);
        
        const bonusInfo = calcularBonusTotal(userId, 'missoes');
        const ganhoFinal = Math.floor(ganhoBase * bonusInfo.bonus);
        const xpGanho = Math.floor(ganhoFinal / 10);
        
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
        
        // Atualizar poder do clã
        if (db.usuarios[userId].clan) {
            recalcularPoderClan(db.usuarios[userId].clan, db);
        }
        
        saveDB(db);
        cooldownsManager.set(userId, 'missao');
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`🤖 ${getComandoFrase('missao') || getRandomFrase('inicio')}`)
            .setDescription(`📡 **${missao.nome}**\n${getRandomFrase('sucesso')}`)
            .addFields(
                { name: '💰 Ganho', value: `+${ganhoFinal.toLocaleString()} Orbs`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '⭐ XP Ganho', value: `+${xpGanho.toLocaleString()} XP`, inline: true },
                { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            );
        
        if (eventoResultado) {
            embed.addFields({ name: '🎲 EVENTO!', value: eventoResultado.mensagem, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};