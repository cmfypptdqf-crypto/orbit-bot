// commands/economia/missao.js
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

// Função para verificar boosts ativos
function getBoostMultiplier(userId, db) {
    let multiplier = 1.0;
    if (db.usuarios[userId]?.boosts?.ganhos && db.usuarios[userId].boosts.ganhos.expira > Date.now()) {
        multiplier *= db.usuarios[userId].boosts.ganhos.bonus;
    }
    if (db.usuarios[userId]?.boosts?.xp && db.usuarios[userId].boosts.xp.expira > Date.now()) {
        multiplier *= db.usuarios[userId].boosts.xp.bonus;
    }
    return multiplier;
}

module.exports = {
    name: 'missao',
    aliases: ['trabalhar', 'work', 'job', 'quest'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        
        const cooldownCheck = cooldownsManager.check(userId, 'missao');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde mais **${cooldownCheck.formatted}** para outra **Galactic Quest**!`);
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
        
        // ========== SISTEMA DE STREAK DE MISSÕES ==========
        const db = getDB();
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, xpTotal: 0, missaoStreak: 0, ultimaMissao: 0 };
        }
        
        const now = Date.now();
        const ultimaMissao = db.usuarios[userId].ultimaMissao || 0;
        const horasDesdeUltima = (now - ultimaMissao) / 3600000;
        
        let missaoStreak = db.usuarios[userId].missaoStreak || 0;
        
        // Verificar se manteve a sequência (menos de 2 horas)
        if (ultimaMissao > 0 && horasDesdeUltima <= 2) {
            missaoStreak++;
        } else if (ultimaMissao > 0 && horasDesdeUltima > 2) {
            missaoStreak = 1;
        } else if (missaoStreak === 0) {
            missaoStreak = 1;
        }
        
        // Limitar streak máximo
        missaoStreak = Math.min(missaoStreak, 20);
        
        // Bônus por streak (5% por missão consecutiva, máximo 100%)
        const bonusStreak = 1 + (Math.min(missaoStreak, 20) * 0.05);
        
        // ========== APLICAR BOOSTS ==========
        const boostMultiplier = getBoostMultiplier(userId, db);
        const bonusInfo = calcularBonusTotal(userId, 'missoes');
        
        const ganhoComBonus = Math.floor(ganhoBase * bonusInfo.bonus * bonusStreak * boostMultiplier);
        
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
                eventoResultado = { mensagem: evento.frase, efeito: `✨ +${bonusEvento} Orbs de bônus cósmico!` };
            } else if (evento.efeito === 'negativo') {
                bonusEvento = -Math.floor(Math.random() * 100) - 20;
                eventoResultado = { mensagem: evento.frase, efeito: `💸 ${Math.abs(bonusEvento)} Orbs perdidos (anomalia)` };
            } else if (evento) {
                eventoResultado = { mensagem: evento.frase, efeito: '🌌 Neutro' };
            }
        } else if (evento) {
            eventoResultado = { mensagem: evento.frase, efeito: '🌌 Neutro' };
        }
        
        const ganhoFinal = Math.max(10, ganhoComBonus + bonusEvento);
        
        // ========== ADICIONAR XP ==========
        const xpGanho = calcularXPporGanho(ganhoFinal);
        const resultadoXP = adicionarXP(userId, xpGanho, 'missao');
        
        // ========== ATUALIZAR DADOS ==========
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganhoFinal;
        db.usuarios[userId].total_missoes = (db.usuarios[userId].total_missoes || 0) + 1;
        db.usuarios[userId].missaoStreak = missaoStreak;
        db.usuarios[userId].ultimaMissao = now;
        
        saveDB(db);
        cooldownsManager.set(userId, 'missao');
        
        // ========== CALCULAR BÔNUS DE STREAK EM PERCENTUAL ==========
        const bonusStreakPercentual = Math.round((bonusStreak - 1) * 100);
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle(`🎯 ${getComandoFrase('missao') || getRandomFrase('inicio')}`)
            .setDescription(`📡 **${missao.nome}**\nsucesso`)
            .addFields(
                { name: '💰 Ganho Base', value: `${ganhoBase.toLocaleString()} Orbs`, inline: true },
                { name: '🔥 Streak', value: `${missaoStreak} missões (+${bonusStreakPercentual}%)`, inline: true },
                { name: '✨ Multiplicadores', value: bonusInfo.texto, inline: true },
                { name: '📈 Boost Ativo', value: boostMultiplier > 1 ? `+${Math.round((boostMultiplier - 1) * 100)}%` : 'Nenhum', inline: true },
                { name: '🎉 Total Recebido', value: `**+${ganhoFinal.toLocaleString()} Orbs**`, inline: false },
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: `🎯 Galactic Quest • Próxima missão em 1 hora | Streak: ${missaoStreak} missões consecutivas` });
        
        if (eventoResultado) {
            embed.addFields({ name: '🎲 EVENTO!', value: eventoResultado.mensagem, inline: false });
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
        
        // Aviso sobre perda de streak
        if (missaoStreak === 1 && db.usuarios[userId].missaoStreak > 1) {
            embed.addFields({ name: '⚠️ ATENÇÃO', value: 'Sua sequência de missões foi resetada! Faça outra missão em menos de 2 horas para manter o streak.', inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};