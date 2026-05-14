// commands/economia/missao.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal, checkCooldown, setCooldown, formatTime } = require('../../utilidades/galaxiaBonus.js');

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
    aliases: ['trabalhar', 'work', 'job'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // ========== VERIFICAR COOLDOWN ==========
        const cooldownCheck = checkCooldown(userId, 'missao');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ **Aguarde mais ${cooldownCheck.formatted}** para fazer outra missão!`);
        }
        
        const missoes = [
            { nome: '🚀 Explorar Andrômeda', ganho: [80, 200] },
            { nome: '🛸 Resgatar Alienígenas', ganho: [60, 150] },
            { nome: '💎 Minerar Cristais Cósmicos', ganho: [50, 120] },
            { nome: '🔭 Mapear Nebulosas', ganho: [70, 180] },
            { nome: '⚔️ Derrotar Invasores', ganho: [100, 250] },
            { nome: '📡 Consertar Satélite', ganho: [65, 160] }
        ];
        
        const missao = missoes[Math.floor(Math.random() * missoes.length)];
        let ganhoBase = Math.floor(Math.random() * (missao.ganho[1] - missao.ganho[0] + 1) + missao.ganho[0]);
        
        // Bônus do clã + galáxia
        const bonusInfo = calcularBonusTotal(userId, 'missoes');
        const ganhoFinal = Math.floor(ganhoBase * bonusInfo.bonus);
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganhoFinal;
        db.usuarios[userId].total_missoes = (db.usuarios[userId].total_missoes || 0) + 1;
        saveDB(db);
        
        // ========== REGISTRAR COOLDOWN ==========
        setCooldown(userId, 'missao');
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🚀 Missão Completa!')
            .setDescription(`Você completou: **${missao.nome}**`)
            .addFields(
                { name: '💰 Ganho Base', value: `${ganhoBase.toLocaleString()} Orbs`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '🎉 Total Recebido', value: `**+${ganhoFinal.toLocaleString()} Orbs**`, inline: false },
                { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '⏰ Próxima missão disponível em 1 hora!' });
        
        await message.reply({ embeds: [embed] });
    }
};