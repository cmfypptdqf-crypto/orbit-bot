// commands/rpg/bossOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
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

const bossesDiariosOrbitais = {
    'alien': { nome: '👾 Alien Invasor', hp: 5000, recompensa: 500, nivelMin: 5, cooldown: 6 },
    'dragao': { nome: '🐉 Dragão Cósmico', hp: 10000, recompensa: 1000, nivelMin: 10, cooldown: 12 },
    'devorador': { nome: '💀 Devorador', hp: 25000, recompensa: 2500, nivelMin: 20, cooldown: 24 },
    'imperador': { nome: '👑 Imperador Orbital', hp: 50000, recompensa: 5000, nivelMin: 35, cooldown: 48 }
};

const bossCooldowns = new Map();

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'bossorbital',
    aliases: ['boss', 'bossdiario', 'dailyboss'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, xpTotal: 0, bossAtivo: null, bossHP: 0 };
        }
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        // Adicionar XP por usar o comando
        const xpGanho = 15;
        const resultadoXP = adicionarXP(userId, xpGanho, 'bossorbital');
        
        if (subcmd === 'status') {
            const bossAtivo = db.usuarios[userId].bossAtivo;
            if (!bossAtivo) return message.reply('❌ Nenhum boss orbital ativo! Use `bt!bossorbital enfrentar <boss>`');
            
            const boss = bossesDiariosOrbitais[bossAtivo];
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`👾 Boss Orbital Ativo: ${boss.nome}`)
                .addFields(
                    { name: '🩸 HP Restante', value: `${db.usuarios[userId].bossHP}/${boss.hp}`, inline: true },
                    { name: '💰 Recompensa', value: `${boss.recompensa} Orbs`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Use bt!bossorbital atacar para lutar!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'enfrentar') {
            const bossId = args[1];
            if (!bossId || !bossesDiariosOrbitais[bossId]) return message.reply('❌ Boss orbital inválido! Use `bt!bossorbital lista`');
            
            const boss = bossesDiariosOrbitais[bossId];
            if (nivel < boss.nivelMin) return message.reply(`❌ Você precisa ser nível orbital ${boss.nivelMin} para enfrentar este boss!`);
            
            const cooldownKey = `boss_${userId}_${bossId}`;
            const lastFight = bossCooldowns.get(cooldownKey);
            if (lastFight && Date.now() - lastFight < boss.cooldown * 3600000) {
                const restante = Math.ceil((boss.cooldown * 3600000 - (Date.now() - lastFight)) / 3600000);
                return message.reply(`⏰ Você já enfrentou este boss orbital hoje! Volte em **${restante} horas**.`);
            }
            
            db.usuarios[userId].bossAtivo = bossId;
            db.usuarios[userId].bossHP = boss.hp;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`👾 ${boss.nome} apareceu!`)
                .setDescription(`📡 Um boss orbital surgiu no seu radar! Use \`bt!bossorbital atacar\` para lutar!`)
                .addFields(
                    { name: '🩸 HP', value: `${boss.hp.toLocaleString()}`, inline: true },
                    { name: '💰 Recompensa', value: `${boss.recompensa} Orbs`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Derrote o boss para ganhar recompensas orbitais!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'atacar') {
            const bossAtivo = db.usuarios[userId].bossAtivo;
            if (!bossAtivo) return message.reply('❌ Nenhum boss orbital ativo! Use `bt!bossorbital enfrentar <boss>`');
            
            const boss = bossesDiariosOrbitais[bossAtivo];
            const dano = Math.floor(Math.random() * (nivel * 10 + 50)) + 50;
            db.usuarios[userId].bossHP = Math.max(0, db.usuarios[userId].bossHP - dano);
            
            if (db.usuarios[userId].bossHP <= 0) {
                const xpGanhoBoss = Math.floor(boss.recompensa / 10);
                db.usuarios[userId].carteira += boss.recompensa;
                db.usuarios[userId].xpTotal += xpGanhoBoss;
                db.usuarios[userId].bossAtivo = null;
                saveDB(db);
                
                bossCooldowns.set(`boss_${userId}_${bossAtivo}`, Date.now());
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🏆 BOSS ORBITAL DERROTADO!')
                    .setDescription(`✅ **${boss.nome}** foi derrotado!`)
                    .addFields(
                        { name: '💰 Recompensa', value: `${boss.recompensa.toLocaleString()} Orbs`, inline: true },
                        { name: '⭐ Stellar XP', value: `+${xpGanhoBoss} XP`, inline: true },
                        { name: '🌟 XP do Comando', value: `+${xpGanho} XP`, inline: true }
                    )
                    .setFooter({ text: '🌌 Orbit • Volte amanhã para enfrentar outro boss orbital!' });
                
                if (resultadoXP.levelUp) {
                    embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
                }
                
                await message.reply({ embeds: [embed] });
            } else {
                saveDB(db);
                
                const embed = new EmbedBuilder()
                    .setColor(0xFF6347)
                    .setTitle('⚔️ Ataque Orbital!')
                    .setDescription(`📡 Você causou **${dano} de dano** ao ${boss.nome}!`)
                    .addFields(
                        { name: '🩸 HP Restante', value: `${db.usuarios[userId].bossHP.toLocaleString()}/${boss.hp.toLocaleString()}`, inline: true },
                        { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                    )
                    .setFooter({ text: '🌌 Orbit • Continue atacando para derrotar o boss!' });
                
                if (resultadoXP.levelUp) {
                    embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
                }
                
                await message.reply({ embeds: [embed] });
            }
        }
        
        else if (subcmd === 'lista') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('👾 Bosses Orbitais Diários')
                .setDescription('Use `bt!bossorbital enfrentar <id>` para desafiar um boss orbital!')
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true });
            
            for (const [id, boss] of Object.entries(bossesDiariosOrbitais)) {
                embed.addFields({
                    name: `${id} - ${boss.nome}`,
                    value: `🩸 HP: ${boss.hp.toLocaleString()} | 💰 Recompensa: ${boss.recompensa} Orbs | 🎯 Nível ${boss.nivelMin}+ | ⏰ Cooldown: ${boss.cooldown}h`,
                    inline: false
                });
            }
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('👾 Boss Orbital - Sistema de Batalha Diária')
                .setDescription('Comandos orbitais disponíveis:')
                .addFields(
                    { name: '📋 `bt!bossorbital lista`', value: 'Ver bosses orbitais disponíveis', inline: false },
                    { name: '🎯 `bt!bossorbital enfrentar <id>`', value: 'Enfrentar um boss orbital', inline: false },
                    { name: '⚔️ `bt!bossorbital atacar`', value: 'Atacar o boss atual', inline: false },
                    { name: '📊 `bt!bossorbital status`', value: 'Ver status do boss atual', inline: false },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (comando orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Derrote bosses orbitais diariamente para ganhar recompensas!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
    }
};