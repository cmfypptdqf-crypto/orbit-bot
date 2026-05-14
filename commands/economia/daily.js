// commands/economia/daily.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent } = require('../utilidades/orbitAI.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, streak: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'daily',
    aliases: ['diario', 'diário', 'bonus', 'dailybonus'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // ========== VERIFICAR COOLDOWN ==========
        const cooldownCheck = cooldownsManager.check(userId, 'daily');
        if (!cooldownCheck.available) {
            const fraseCooldown = getRandomFrase('cooldown');
            return message.reply(`${fraseCooldown}\n⏰ Aguarde mais **${cooldownCheck.formatted}** para o próximo bônus diário!`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        // ========== SISTEMA DE STREAK (SEQUÊNCIA) ==========
        if (!db.streak) db.streak = {};
        if (!db.streak[userId]) {
            db.streak[userId] = { daily: 0, lastDaily: 0 };
        }
        
        const now = Date.now();
        const lastDaily = db.streak[userId].lastDaily || 0;
        const horasDesdeUltimo = (now - lastDaily) / 3600000;
        
        let streak = db.streak[userId].daily || 0;
        
        // Verificar se manteve a sequência (entre 20-28 horas)
        if (lastDaily > 0 && horasDesdeUltimo >= 20 && horasDesdeUltimo <= 28) {
            streak++;
        } else if (lastDaily > 0 && horasDesdeUltimo > 28) {
            streak = 1; // Reset streak
        } else if (streak === 0) {
            streak = 1;
        }
        
        // ========== BÔNUS BASE ==========
        const bonusBase = 200;
        const bonusStreak = Math.min(Math.floor(streak / 5) * 50, 500); // Bônus a cada 5 dias consecutivos
        
        // ========== APLICAR BÔNUS VIP + CLÃ ==========
        const bonusInfo = calcularBonusTotal(userId, 'carteira');
        const bonusFinalComStreak = Math.floor((bonusBase + bonusStreak) * bonusInfo.bonus);
        
        // ========== VERIFICAR EVENTO ALEATÓRIO ==========
        const evento = checkRandomEvent();
        let eventoResultado = null;
        let bonusEvento = 0;
        
        if (evento && evento.efeito === 'positivo') {
            bonusEvento = Math.floor(Math.random() * 200) + 50;
            eventoResultado = { mensagem: evento.frase, efeito: `✨ +${bonusEvento} Orbs de bônus cósmico!` };
        } else if (evento && evento.efeito === 'negativo') {
            bonusEvento = -Math.floor(Math.random() * 100) - 20;
            eventoResultado = { mensagem: evento.frase, efeito: `💸 ${bonusEvento} Orbs (anomalia cósmica)` };
        } else if (evento) {
            eventoResultado = { mensagem: evento.frase, efeito: '🌌 Neutro' };
        }
        
        const bonusTotal = bonusFinalComStreak + bonusEvento;
        
        // ========== APLICAR GANHO ==========
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + bonusTotal;
        
        // Atualizar streak
        db.streak[userId].daily = streak;
        db.streak[userId].lastDaily = now;
        
        saveDB(db);
        
        // ========== REGISTRAR COOLDOWN ==========
        cooldownsManager.set(userId, 'daily');
        
        const fraseSucesso = getRandomFrase('sucesso');
        
        // Calcular próximo bônus do streak
        const proximoBonusStreak = Math.floor((streak + 1) / 5) * 50;
        const diasParaProximoBonus = 5 - (streak % 5);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`📆 ${fraseSucesso}`)
            .setDescription(`📡 Você recebeu seu bônus diário, comandante!`)
            .addFields(
                { name: '🎁 Bônus Base', value: `${bonusBase.toLocaleString()} Orbs`, inline: true },
                { name: '🔥 Bônus de Sequência', value: `+${bonusStreak.toLocaleString()} Orbs (${streak} dias consecutivos)`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '💰 Total Recebido', value: `**+${bonusTotal.toLocaleString()} Orbs**`, inline: false },
                { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: `🌌 Orbit • Volte amanhã! ${diasParaProximoBonus} dias para próximo bônus de sequência (+${proximoBonusStreak} Orbs)` })
            .setTimestamp();
        
        if (eventoResultado) {
            embed.addFields(
                { name: '🎲 EVENTO CÓSMICO!', value: eventoResultado.mensagem, inline: false },
                { name: '✨ Efeito', value: eventoResultado.efeito, inline: true }
            );
        }
        
        await message.reply({ embeds: [embed] });
    }
};