// commands/rpg/raidOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP, calcularXPporGanho } = require('../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, raids: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const bossesOrbitais = {
    '1': { nome: '👾 Alien Invasor', hp: 5000, recompensa: 500, nivelMin: 5 },
    '2': { nome: '🐉 Dragão Cósmico', hp: 10000, recompensa: 1000, nivelMin: 10 },
    '3': { nome: '💀 Devorador', hp: 25000, recompensa: 2500, nivelMin: 20 },
    '4': { nome: '👑 Imperador Orbital', hp: 50000, recompensa: 5000, nivelMin: 35 }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'raidorbital',
    aliases: ['raid', 'raide', 'bossraid'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { xpTotal: 0 };
        }
        
        if (!db.raids) db.raids = {};
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        // Adicionar XP por usar o comando
        const xpGanho = 15;
        const resultadoXP = adicionarXP(userId, xpGanho, 'raidorbital');
        
        if (subcmd === 'criar') {
            const bossId = args[1];
            if (!bossId || !bossesOrbitais[bossId]) return message.reply('❌ Boss orbital inválido! Use `bt!raidorbital bosses`');
            if (nivel < bossesOrbitais[bossId].nivelMin) return message.reply(`❌ Você precisa ser nível orbital ${bossesOrbitais[bossId].nivelMin} para enfrentar este boss!`);
            if (db.raids[userId]) return message.reply('❌ Você já tem uma raid orbital ativa!');
            
            db.raids[userId] = {
                dono: userId,
                boss: bossId,
                participantes: [userId],
                hpAtual: bossesOrbitais[bossId].hp,
                hpMax: bossesOrbitais[bossId].hp,
                danoTotal: 0,
                createdAt: Date.now()
            };
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('⚔️ Raid Orbital Criada!')
                .setDescription(`✅ Raid contra **${bossesOrbitais[bossId].nome}** criada! Use \`bt!raidorbital entrar\` para participar!`)
                .addFields(
                    { name: '👑 Criador', value: message.author.username, inline: true },
                    { name: '🩸 HP do Boss', value: `${bossesOrbitais[bossId].hp.toLocaleString()}`, inline: true },
                    { name: '💰 Recompensa', value: `${bossesOrbitais[bossId].recompensa} Orbs (dividido)`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Reúna até 10 exploradores orbitais!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'entrar') {
            const raidId = args[1] || userId;
            const raid = db.raids[raidId];
            if (!raid) return message.reply('❌ Raid orbital não encontrada!');
            if (raid.participantes.includes(userId)) return message.reply('❌ Você já está nesta raid orbital!');
            if (raid.participantes.length >= 10) return message.reply('❌ Raid orbital lotada! (máximo 10 participantes)');
            if (nivel < bossesOrbitais[raid.boss].nivelMin) return message.reply(`❌ Você precisa ser nível orbital ${bossesOrbitais[raid.boss].nivelMin} para participar!`);
            
            raid.participantes.push(userId);
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00BFFF)
                .setTitle('✅ Entrou na Raid Orbital!')
                .setDescription(`${message.author.username} entrou na raid contra **${bossesOrbitais[raid.boss].nome}**!`)
                .addFields(
                    { name: '👥 Participantes', value: `${raid.participantes.length}/10`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                );
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'atacar') {
            const raidId = args[1] || userId;
            const raid = db.raids[raidId];
            if (!raid) return message.reply('❌ Raid orbital não encontrada!');
            if (!raid.participantes.includes(userId)) return message.reply('❌ Você não está nesta raid orbital!');
            if (raid.hpAtual <= 0) return message.reply('❌ Este boss orbital já foi derrotado!');
            
            const dano = Math.floor(Math.random() * (nivel * 10 + 50)) + 50;
            raid.hpAtual = Math.max(0, raid.hpAtual - dano);
            raid.danoTotal += dano;
            
            saveDB(db);
            
            if (raid.hpAtual <= 0) {
                const recompensaTotal = bossesOrbitais[raid.boss].recompensa;
                const xpTotal = recompensaTotal * raid.participantes.length;
                
                for (const id of raid.participantes) {
                    const xpGanhoRaid = Math.floor(xpTotal / raid.participantes.length);
                    const orbsGanho = Math.floor(recompensaTotal / raid.participantes.length);
                    if (!db.usuarios[id]) db.usuarios[id] = { carteira: 0, xpTotal: 0 };
                    db.usuarios[id].carteira += orbsGanho;
                    db.usuarios[id].xpTotal += xpGanhoRaid;
                }
                
                delete db.raids[raidId];
                saveDB(db);
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🏆 BOSS ORBITAL DERROTADO!')
                    .setDescription(`🎉 ${raid.participantes.length} aventureiros derrotaram o boss!`)
                    .addFields(
                        { name: '💰 Recompensa', value: `${Math.floor(recompensaTotal / raid.participantes.length)} Orbs cada`, inline: true },
                        { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                    );
                
                if (resultadoXP.levelUp) {
                    embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
                }
                
                await message.reply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor(0xFF6347)
                    .setTitle('⚔️ Ataque Orbital!')
                    .setDescription(`${message.author.username} causou **${dano} de dano** ao boss!`)
                    .addFields(
                        { name: '🩸 HP Restante', value: `${raid.hpAtual.toLocaleString()}/${raid.hpMax.toLocaleString()}`, inline: true },
                        { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true }
                    );
                
                if (resultadoXP.levelUp) {
                    embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
                }
                
                await message.reply({ embeds: [embed] });
            }
        }
        
        else if (subcmd === 'info') {
            const raidId = args[1] || userId;
            const raid = db.raids[raidId];
            if (!raid) return message.reply('❌ Raid orbital não encontrada!');
            
            const boss = bossesOrbitais[raid.boss];
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`⚔️ Raid Orbital: ${boss.nome}`)
                .addFields(
                    { name: '👑 Criador', value: `<@${raid.dono}>`, inline: true },
                    { name: '👥 Participantes', value: `${raid.participantes.length}/10`, inline: true },
                    { name: '🩸 HP do Boss', value: `${raid.hpAtual.toLocaleString()}/${boss.hp.toLocaleString()}`, inline: true },
                    { name: '💥 Dano Total', value: `${raid.danoTotal.toLocaleString()}`, inline: true },
                    { name: '💰 Recompensa', value: `${boss.recompensa.toLocaleString()} Orbs (dividido)`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Use bt!raidorbital atacar para ajudar!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'bosses') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('👾 Bosses Orbitais Disponíveis')
                .setDescription('Use `bt!raidorbital criar <id>` para enfrentar um boss orbital!')
                .addFields({ name: '⭐ Stellar XP', value: `+${xpGanho} XP (consulta orbital)`, inline: true });
            
            for (const [id, boss] of Object.entries(bossesOrbitais)) {
                embed.addFields({
                    name: `${id} - ${boss.nome}`,
                    value: `🩸 HP: ${boss.hp.toLocaleString()} | 💰 Recompensa: ${boss.recompensa} Orbs | 🎯 Nível ${boss.nivelMin}+`,
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
                .setTitle('⚔️ Raid Orbital - Sistema de Batalha Cooperativa')
                .setDescription('Comandos orbitais disponíveis:')
                .addFields(
                    { name: '👾 `bt!raidorbital bosses`', value: 'Ver bosses orbitais disponíveis', inline: false },
                    { name: '📋 `bt!raidorbital criar <id>`', value: 'Criar uma nova raid orbital', inline: false },
                    { name: '👥 `bt!raidorbital entrar [id]`', value: 'Entrar em uma raid orbital', inline: false },
                    { name: '⚔️ `bt!raidorbital atacar [id]`', value: 'Atacar o boss orbital', inline: false },
                    { name: 'ℹ️ `bt!raidorbital info [id]`', value: 'Ver informações da raid', inline: false },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP (comando orbital)`, inline: true }
                )
                .setFooter({ text: '🌌 Orbit • Reúna sua equipe e derrote os bosses orbitais!' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            await message.reply({ embeds: [embed] });
        }
    }
};