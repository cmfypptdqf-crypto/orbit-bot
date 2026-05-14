// commands/economia/semanal.js
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
    name: 'semanal',
    aliases: ['weekly', 'bonus_semanal', 'week'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        // ========== VERIFICAR COOLDOWN ==========
        const cooldownCheck = cooldownsManager.check(userId, 'weekly');
        if (!cooldownCheck.available) {
            const fraseCooldown = getRandomFrase('cooldown');
            return message.reply(`${fraseCooldown}\n⏰ Aguarde mais **${cooldownCheck.formatted}** para o próximo bônus semanal!`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        // ========== SISTEMA DE STREAK SEMANAL ==========
        if (!db.streak) db.streak = {};
        if (!db.streak[userId]) {
            db.streak[userId] = { weekly: 0, lastWeekly: 0 };
        }
        
        const now = Date.now();
        const lastWeekly = db.streak[userId].lastWeekly || 0;
        const diasDesdeUltimo = (now - lastWeekly) / 86400000;
        
        let streak = db.streak[userId].weekly || 0;
        
        // Verificar se manteve a sequência (entre 5-9 dias)
        if (lastWeekly > 0 && diasDesdeUltimo >= 5 && diasDesdeUltimo <= 9) {
            streak++;
        } else if (lastWeekly > 0 && diasDesdeUltimo > 9) {
            streak = 1; // Reset streak
        } else if (streak === 0) {
            streak = 1;
        }
        
        // ========== BÔNUS BASE ==========
        const bonusBase = 1500;
        const bonusStreak = Math.min(streak * 100, 1000); // Bônus de 100 por semana, máximo 1000
        
        // ========== APLICAR BÔNUS VIP + CLÃ ==========
        const bonusInfo = calcularBonusTotal(userId, 'carteira');
        const bonusFinalComStreak = Math.floor((bonusBase + bonusStreak) * bonusInfo.bonus);
        
        // ========== VERIFICAR EVENTO ALEATÓRIO ==========
        const evento = checkRandomEvent();
        let eventoResultado = null;
        let bonusEvento = 0;
        
        if (evento && evento.efeito === 'positivo') {
            bonusEvento = Math.floor(Math.random() * 500) + 100;
            eventoResultado = { mensagem: evento.frase, efeito: `✨ +${bonusEvento} Orbs de bônus cósmico!` };
        } else if (evento && evento.efeito === 'negativo') {
            bonusEvento = -Math.floor(Math.random() * 200) - 50;
            eventoResultado = { mensagem: evento.frase, efeito: `💸 ${bonusEvento} Orbs (anomalia cósmica)` };
        } else if (evento) {
            eventoResultado = { mensagem: evento.frase, efeito: '🌌 Neutro' };
        }
        
        const bonusTotal = bonusFinalComStreak + bonusEvento;
        
        // ========== APLICAR GANHO (VAI PARA O BANCO) ==========
        db.usuarios[userId].banco = (db.usuarios[userId].banco || 0) + bonusTotal;
        
        // Atualizar streak
        db.streak[userId].weekly = streak;
        db.streak[userId].lastWeekly = now;
        
        saveDB(db);
        
        // ========== REGISTRAR COOLDOWN ==========
        cooldownsManager.set(userId, 'weekly');
        
        const fraseSucesso = getRandomFrase('sucesso');
        
        // Calcular próximo bônus do streak
        const proximoBonusStreak = (streak + 1) * 100;
        const semanasParaProximoBonus = 1;
        
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle(`📅 ${fraseSucesso}`)
            .setDescription(`🎉 Você recebeu seu bônus semanal, comandante! O dinheiro foi depositado na Estação Espacial.`)
            .addFields(
                { name: '🎁 Bônus Base', value: `${bonusBase.toLocaleString()} Orbs`, inline: true },
                { name: '🔥 Bônus de Sequência', value: `+${bonusStreak.toLocaleString()} Orbs (${streak} semanas consecutivas)`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '💰 Total Recebido', value: `**+${bonusTotal.toLocaleString()} Orbs**`, inline: false },
                { name: '🏦 Estação Espacial', value: `${db.usuarios[userId].banco.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: `🌌 Orbit • Volte semana que vem! Próximo bônus de sequência: +${proximoBonusStreak} Orbs` })
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