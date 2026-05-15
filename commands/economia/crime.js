// commands/economia/pirataria.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent, getComandoFrase } = require('../utilidades/orbitAI.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');
const { recalcularPoderClan } = require('../utilidades/clanUtils.js');
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
function getBoostMultiplier(userId, db, tipo) {
    let multiplier = 1.0;
    if (db.usuarios[userId]?.boosts?.ataque && db.usuarios[userId].boosts.ataque.expira > Date.now()) {
        multiplier *= db.usuarios[userId].boosts.ataque.bonus;
    }
    return multiplier;
}

module.exports = {
    name: 'pirataria',
    aliases: ['roubar', 'crime', 'pirata'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!pirataria @usuario`');
        if (user.id === message.author.id) return message.reply('<:emoji_47:1504081397373997076> Não pode atacar a si mesmo!');
        if (user.bot) return message.reply('<:emoji_47:1504081397373997076> Não pode roubar um bot!');
        
        const userId = message.author.id;
        const targetId = user.id;
        
        const cooldownCheck = cooldownsManager.check(userId, 'pirataria');
        if (!cooldownCheck.available) {
            return message.reply(`⏰ Aguarde mais **${cooldownCheck.formatted}** para outro ataque!`);
        }
        
        const db = getDB();
        if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        if (!db.usuarios[targetId]) db.usuarios[targetId] = { carteira: 0, banco: 0, inventario: {} };
        
        // ========== VERIFICAR PROTEÇÕES DA VÍTIMA ==========
        // Alarme Anti-Roubo
        if (db.usuarios[targetId]?.alarme > 0) {
            db.usuarios[targetId].alarme--;
            saveDB(db);
            return message.reply(`🚨 **${user.username}** tinha um **Alarme Anti-Roubo** ativo! Seu ataque foi bloqueado e o alarme foi consumido.`);
        }
        
        // Escudo Energético
        if (db.usuarios[targetId]?.protecao > 0) {
            db.usuarios[targetId].protecao--;
            saveDB(db);
            return message.reply(`🛡️ **${user.username}** tinha um **Escudo Energético** ativo! Seu ataque foi bloqueado e o escudo foi consumido.`);
        }
        
        // ========== VERIFICAR GARANTIA DO ATACANTE ==========
        let ataqueGarantido = false;
        if (db.usuarios[userId]?.garantiaRoubo > 0) {
            db.usuarios[userId].garantiaRoubo--;
            ataqueGarantido = true;
            saveDB(db);
        }
        
        const vitimaOrbs = db.usuarios[targetId].carteira || 0;
        if (vitimaOrbs <= 0) return message.reply(`<:emoji_47:1504081397373997076> ${user.username} está sem Orbs!`);
        
        // ========== CALCULAR CHANCE ==========
        const bonusAtaque = calcularBonusTotal(userId, 'ataque');
        const boostMultiplier = getBoostMultiplier(userId, db, 'ataque');
        
        let chanceSucesso = ataqueGarantido ? 1.0 : Math.min(0.75, 0.4 * bonusAtaque.bonus * boostMultiplier);
        const sucesso = Math.random() < chanceSucesso;
        
        cooldownsManager.set(userId, 'pirataria');
        
        if (sucesso) {
            const percentual = Math.random() * 0.25 + 0.1;
            let valorRoubado = Math.min(10000, Math.max(50, Math.floor(vitimaOrbs * percentual)));
            
            // Aplicar boost de ganhos se ativo
            let multiplicadorGanho = 1.0;
            if (db.usuarios[userId]?.boosts?.ganhos && db.usuarios[userId].boosts.ganhos.expira > Date.now()) {
                multiplicadorGanho = db.usuarios[userId].boosts.ganhos.bonus;
            }
            
            const valorFinal = Math.floor(valorRoubado * multiplicadorGanho);
            
            db.usuarios[userId].carteira += valorFinal;
            db.usuarios[targetId].carteira -= valorRoubado;
            db.usuarios[userId].total_ataques = (db.usuarios[userId].total_ataques || 0) + 1;
            db.usuarios[userId].vitorias = (db.usuarios[userId].vitorias || 0) + 1;
            
            // ========== ADICIONAR XP ==========
            const xpGanho = calcularXPporGanho(valorFinal);
            const resultadoXP = adicionarXP(userId, xpGanho, 'pirataria');
            
            if (db.usuarios[userId].clan) recalcularPoderClan(db.usuarios[userId].clan, db);
            if (db.usuarios[targetId].clan) recalcularPoderClan(db.usuarios[targetId].clan, db);
            
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`☄️ ${getComandoFrase('pirataria')}`)
                .setDescription(`📡 Você saqueou **${valorFinal.toLocaleString()} Orbs** de ${user.username}!`)
                .addFields(
                    { name: '🎯 Chance', value: `${Math.round(chanceSucesso * 100)}%`, inline: true },
                    { name: '💰 Valor Roubado', value: `${valorFinal.toLocaleString()} Orbs`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                    { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '☄️ Ataque realizado com sucesso!' });
            
            // Verificar level up
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            // Mostrar se usou item garantido
            if (ataqueGarantido) {
                embed.addFields({ name: '👻 Capa da Invisibilidade', value: 'Seu ataque foi garantido pela capa!', inline: false });
            }
            
            // Mostrar boost ativo
            if (multiplicadorGanho > 1.0) {
                embed.addFields({ name: '📈 Boost Ativo', value: `+${Math.round((multiplicadorGanho - 1) * 100)}% nos ganhos!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        } else {
            const perda = Math.min(db.usuarios[userId].carteira || 0, Math.floor(Math.random() * 300) + 50);
            db.usuarios[userId].carteira -= perda;
            db.usuarios[userId].total_ataques = (db.usuarios[userId].total_ataques || 0) + 1;
            
            // Perde um pouco de XP quando falha
            const xpPerdido = Math.floor(perda / 20);
            if (xpPerdido > 0) {
                db.usuarios[userId].xpTotal = Math.max(0, (db.usuarios[userId].xpTotal || 0) - xpPerdido);
            }
            
            if (db.usuarios[userId].clan) recalcularPoderClan(db.usuarios[userId].clan, db);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`🚨 Ataque Falhou!`)
                .setDescription(`Você foi capturado ao tentar atacar ${user.username}!`)
                .addFields(
                    { name: '💰 Multa', value: `${perda.toLocaleString()} Orbs`, inline: true },
                    { name: '💀 XP Perdido', value: `${xpPerdido} XP`, inline: true },
                    { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '☄️ Tente novamente em 30 minutos' });
            await message.reply({ embeds: [embed] });
        }
    }
};