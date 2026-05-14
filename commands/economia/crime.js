// commands/economia/pirataria.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { calcularBonusTotal } = require('../utilidades/galaxiaBonus.js');
const { getRandomFrase, checkRandomEvent, processEvent, getComandoFrase } = require('../utilidades/orbitAI.js');
const cooldownsManager = require('../utilidades/cooldownsManager.js');

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
    name: 'pirataria',
    aliases: ['roubar', 'crime', 'pirata', 'assaltar', 'atacar'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!pirataria @usuario`');
        if (user.id === message.author.id) return message.reply('❌ Você não pode atacar sua própria nave!');
        if (user.bot) return message.reply('❌ Não pode roubar um drone!');
        
        const userId = message.author.id;
        const targetId = user.id;
        
        // ========== VERIFICAR COOLDOWN ==========
        const cooldownCheck = cooldownsManager.check(userId, 'pirataria');
        if (!cooldownCheck.available) {
            const fraseCooldown = getRandomFrase('cooldown');
            return message.reply(`${fraseCooldown}\n⏰ Aguarde mais **${cooldownCheck.formatted}** para outro ataque!`);
        }
        
        // Frase inicial do Orbit
        const fraseInicial = getComandoFrase('pirataria') || getRandomFrase('inicio');
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_ataques: 0, vitorias: 0 };
        }
        if (!db.usuarios[targetId]) {
            db.usuarios[targetId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const vitimaOrbs = db.usuarios[targetId].carteira || 0;
        
        if (vitimaOrbs <= 0) {
            return message.reply(`❌ ${user.username} está sem Orbs para serem saqueados!`);
        }
        
        // ========== CALCULAR CHANCE COM BÔNUS ==========
        const bonusAtaque = calcularBonusTotal(userId, 'ataque');
        let chanceSucesso = 0.4 * bonusAtaque.bonus;
        chanceSucesso = Math.min(0.75, chanceSucesso); // Máximo 75%
        
        const sucesso = Math.random() < chanceSucesso;
        
        // ========== REGISTRAR COOLDOWN ==========
        cooldownsManager.set(userId, 'pirataria');
        
        // ========== VERIFICAR EVENTO ALEATÓRIO ==========
        const evento = checkRandomEvent();
        let eventoResultado = null;
        
        if (sucesso) {
            // Roubo bem sucedido - entre 10% e 35% do dinheiro da vítima
            const percentual = Math.random() * (0.35 - 0.10) + 0.10;
            let valorRoubado = Math.floor(vitimaOrbs * percentual);
            valorRoubado = Math.max(50, Math.min(valorRoubado, 10000));
            valorRoubado = Math.min(valorRoubado, vitimaOrbs);
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + valorRoubado;
            db.usuarios[targetId].carteira = vitimaOrbs - valorRoubado;
            db.usuarios[userId].total_ataques = (db.usuarios[userId].total_ataques || 0) + 1;
            db.usuarios[userId].vitorias = (db.usuarios[userId].vitorias || 0) + 1;
            
            if (evento) {
                eventoResultado = await processEvent(evento, userId, db, client);
            }
            
            saveDB(db);
            
            const fraseSucesso = getRandomFrase('sucesso');
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`☄️ ${fraseInicial}`)
                .setDescription(`${fraseSucesso}\n📡 Você saqueou **${valorRoubado.toLocaleString()} Orbs** da nave de ${user.username}`)
                .addFields(
                    { name: '🎯 Chance de Sucesso', value: `${Math.round(chanceSucesso * 100)}%`, inline: true },
                    { name: '💰 Percentual Roubado', value: `${Math.round(percentual * 100)}%`, inline: true },
                    { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                    { name: '⚔️ Ataques Totais', value: `${db.usuarios[userId].total_ataques}`, inline: true },
                    { name: '🏆 Vitórias', value: `${db.usuarios[userId].vitorias}`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Próximo ataque em 30 minutos' })
                .setTimestamp();
            
            if (eventoResultado) {
                embed.addFields(
                    { name: '🎲 EVENTO CÓSMICO!', value: eventoResultado.mensagem, inline: false },
                    { name: '✨ Efeito', value: eventoResultado.efeito || 'Neutro', inline: true }
                );
            }
            
            await message.reply({ embeds: [embed] });
        } else {
            // Roubo falhou - perde entre 50 e 250 Orbs
            const perda = Math.floor(Math.random() * 200) + 50;
            const perdaReal = Math.min(perda, db.usuarios[userId].carteira || 0);
            
            db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) - perdaReal;
            db.usuarios[userId].total_ataques = (db.usuarios[userId].total_ataques || 0) + 1;
            
            if (evento) {
                eventoResultado = await processEvent(evento, userId, db, client);
            }
            
            saveDB(db);
            
            const fraseErro = getRandomFrase('erro');
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`🚨 ${fraseErro}`)
                .setDescription(`Você foi capturado pela Patrulha Galáctica ao tentar atacar ${user.username}`)
                .addFields(
                    { name: '🎯 Chance de Sucesso', value: `${Math.round(chanceSucesso * 100)}%`, inline: true },
                    { name: '💰 Multa paga', value: `${perdaReal.toLocaleString()} Orbs`, inline: true },
                    { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                    { name: '⚔️ Ataques Totais', value: `${db.usuarios[userId].total_ataques}`, inline: true },
                    { name: '📉 Taxa de Sucesso', value: `${Math.round((db.usuarios[userId].vitorias || 0) / db.usuarios[userId].total_ataques * 100)}%`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Próximo ataque em 30 minutos' })
                .setTimestamp();
            
            if (eventoResultado) {
                embed.addFields(
                    { name: '🎲 EVENTO CÓSMICO!', value: eventoResultado.mensagem, inline: false },
                    { name: '✨ Efeito', value: eventoResultado.efeito || 'Neutro', inline: true }
                );
            }
            
            await message.reply({ embeds: [embed] });
        }
    }
};