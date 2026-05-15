// commands/economia/daily.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent } = require('../utilidades/orbitAI.js');
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

// Função para verificar boosts ativos
function getBoostMultiplier(userId, db) {
    let multiplier = 1.0;
    if (db.usuarios[userId]?.boosts?.ganhos && db.usuarios[userId].boosts.ganhos.expira > Date.now()) {
        multiplier *= db.usuarios[userId].boosts.ganhos.bonus;
    }
    return multiplier;
}

module.exports = {
    name: 'daily',
    aliases: ['diario', 'diário', 'bonus'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        const cooldownCheck = cooldownsManager.check(userId, 'daily');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde mais **${cooldownCheck.formatted}** para o próximo bônus diário!`);
        }
        
        const db = getDB();
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, xpTotal: 0, dailyStreak: 0, lastDaily: 0 };
        }
        
        // ========== SISTEMA DE STREAK (SEQUÊNCIA) ==========
        const now = Date.now();
        const lastDaily = db.usuarios[userId].lastDaily || 0;
        const horasDesdeUltimo = (now - lastDaily) / 3600000;
        
        let streak = db.usuarios[userId].dailyStreak || 0;
        
        // Verificar se manteve a sequência (entre 20-28 horas)
        if (lastDaily > 0 && horasDesdeUltimo >= 20 && horasDesdeUltimo <= 28) {
            streak++;
        } else if (lastDaily > 0 && horasDesdeUltimo > 28) {
            streak = 1; // Reset streak
        } else if (streak === 0) {
            streak = 1;
        }
        
        // Limitar streak máximo
        streak = Math.min(streak, 30);
        
        // ========== BÔNUS BASE E STREAK ==========
        const bonusBase = 200;
        const bonusStreak = Math.floor(streak / 5) * 50; // Bônus a cada 5 dias consecutivos
        
        // ========== APLICAR BOOSTS ==========
        const boostMultiplier = getBoostMultiplier(userId, db);
        const bonusInfo = calcularBonusTotal(userId, 'carteira');
        
        let bonusFinal = Math.floor((bonusBase + bonusStreak) * bonusInfo.bonus * boostMultiplier);
        
        // ========== EVENTO ALEATÓRIO ==========
        const evento = checkRandomEvent();
        let eventoResultado = null;
        let bonusEvento = 0;
        
        // Verificar boost de sorte (Amuleto da Sorte)
        const hasSorteBoost = db.usuarios[userId]?.boosts?.sorte && db.usuarios[userId].boosts.sorte.expira > Date.now();
        const chanceEvento = hasSorteBoost ? 0.2 : 0.1;
        
        if (evento && Math.random() < chanceEvento) {
            if (evento.efeito === 'positivo') {
                bonusEvento = Math.floor(Math.random() * 200) + 50;
                bonusFinal += bonusEvento;
                eventoResultado = { mensagem: evento.frase, efeito: `✨ +${bonusEvento} Orbs de bônus cósmico!` };
            } else if (evento.efeito === 'negativo') {
                bonusEvento = -Math.floor(Math.random() * 100) - 20;
                bonusFinal = Math.max(50, bonusFinal + bonusEvento);
                eventoResultado = { mensagem: evento.frase, efeito: `💸 ${bonusEvento} Orbs (anomalia cósmica)` };
            } else if (evento) {
                eventoResultado = { mensagem: evento.frase, efeito: '🌌 Neutro' };
            }
        } else if (evento) {
            eventoResultado = { mensagem: evento.frase, efeito: '🌌 Neutro' };
        }
        
        // ========== APLICAR GANHO ==========
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + bonusFinal;
        
        // ========== ADICIONAR XP ==========
        const xpGanho = calcularXPporGanho(bonusFinal);
        const resultadoXP = adicionarXP(userId, xpGanho, 'daily');
        
        // Atualizar streak
        db.usuarios[userId].dailyStreak = streak;
        db.usuarios[userId].lastDaily = now;
        
        saveDB(db);
        cooldownsManager.set(userId, 'daily');
        
        // Calcular próximo bônus do streak
        const diasProximoBonus = 5 - (streak % 5);
        const proximoBonusStreak = Math.floor((streak + 1) / 5) * 50;
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle(`📆 sucesso`)
            .setDescription(`📡 Bônus diário recebido, comandante!`)
            .addFields(
                { name: '🎁 Bônus Base', value: `${bonusBase.toLocaleString()} Orbs`, inline: true },
                { name: '🔥 Sequência', value: `+${bonusStreak} Orbs (${streak} dias consecutivos)`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '📈 Boost Ativo', value: boostMultiplier > 1 ? `+${Math.round((boostMultiplier - 1) * 100)}%` : 'Nenhum', inline: true },
                { name: '🎉 Total Recebido', value: `**+${bonusFinal.toLocaleString()} Orbs**`, inline: false },
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: `📅 Volte amanhã! ${diasProximoBonus} dias para próximo bônus de sequência (+${proximoBonusStreak} Orbs)` });
        
        if (eventoResultado) {
            embed.addFields({ name: '🎲 EVENTO CÓSMICO!', value: eventoResultado.mensagem, inline: false });
            if (eventoResultado.efeito) {
                embed.addFields({ name: '✨ Efeito', value: eventoResultado.efeito, inline: true });
            }
        }
        
        // Verificar level up
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        // Mostrar boost de sorte ativo
        if (hasSorteBoost) {
            embed.addFields({ name: '🍀 Amuleto da Sorte', value: 'Ativo! Dobrando suas chances de eventos positivos!', inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};