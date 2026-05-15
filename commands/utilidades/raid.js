// commands/rpg/raid.js
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

const bosses = {
    '1': { nome: '👾 Alien Invasor', hp: 5000, recompensa: 500, nivelMin: 5 },
    '2': { nome: '🐉 Dragão Cósmico', hp: 10000, recompensa: 1000, nivelMin: 10 },
    '3': { nome: '💀 Devorador', hp: 25000, recompensa: 2500, nivelMin: 20 },
    '4': { nome: '👑 Imperador', hp: 50000, recompensa: 5000, nivelMin: 35 }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'raid',
    aliases: ['raide', 'boss'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { xpTotal: 0 };
        }
        
        if (!db.raids) db.raids = {};
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        if (subcmd === 'criar') {
            const bossId = args[1];
            if (!bossId || !bosses[bossId]) return message.reply('❌ Boss inválido! Use `bt!raid bosses`');
            if (nivel < bosses[bossId].nivelMin) return message.reply(`❌ Você precisa ser nível ${bosses[bossId].nivelMin} para enfrentar este boss!`);
            if (db.raids[userId]) return message.reply('❌ Você já tem uma raid ativa!');
            
            db.raids[userId] = {
                dono: userId,
                boss: bossId,
                participantes: [userId],
                hpAtual: bosses[bossId].hp,
                hpMax: bosses[bossId].hp,
                danoTotal: 0,
                createdAt: Date.now()
            };
            saveDB(db);
            
            await message.reply(`✅ Raid contra **${bosses[bossId].nome}** criada! Use \`bt!raid entrar\` para participar!`);
        }
        
        else if (subcmd === 'entrar') {
            const raidId = args[1] || userId;
            const raid = db.raids[raidId];
            if (!raid) return message.reply('❌ Raid não encontrada!');
            if (raid.participantes.includes(userId)) return message.reply('❌ Você já está nesta raid!');
            if (raid.participantes.length >= 10) return message.reply('❌ Raid lotada! (máximo 10 participantes)');
            if (nivel < bosses[raid.boss].nivelMin) return message.reply(`❌ Você precisa ser nível ${bosses[raid.boss].nivelMin} para participar!`);
            
            raid.participantes.push(userId);
            saveDB(db);
            
            await message.reply(`✅ ${message.author.username} entrou na raid contra **${bosses[raid.boss].nome}**!`);
        }
        
        else if (subcmd === 'atacar') {
            const raidId = args[1] || userId;
            const raid = db.raids[raidId];
            if (!raid) return message.reply('❌ Raid não encontrada!');
            if (!raid.participantes.includes(userId)) return message.reply('❌ Você não está nesta raid!');
            if (raid.hpAtual <= 0) return message.reply('❌ Este boss já foi derrotado!');
            
            const dano = Math.floor(Math.random() * (nivel * 10 + 50)) + 50;
            raid.hpAtual = Math.max(0, raid.hpAtual - dano);
            raid.danoTotal += dano;
            
            saveDB(db);
            
            if (raid.hpAtual <= 0) {
                const recompensaTotal = bosses[raid.boss].recompensa;
                const xpTotal = recompensaTotal * raid.participantes.length;
                
                for (const id of raid.participantes) {
                    const xpGanho = Math.floor(xpTotal / raid.participantes.length);
                    const orbsGanho = Math.floor(recompensaTotal / raid.participantes.length);
                    if (!db.usuarios[id]) db.usuarios[id] = { carteira: 0, xpTotal: 0 };
                    db.usuarios[id].carteira += orbsGanho;
                    db.usuarios[id].xpTotal += xpGanho;
                }
                
                delete db.raids[raidId];
                saveDB(db);
                
                await message.reply(`🏆 **Boss derrotado!** ${raid.participantes.length} aventureiros receberam ${Math.floor(recompensaTotal / raid.participantes.length)} Orbs cada!`);
            } else {
                await message.reply(`⚔️ ${message.author.username} causou **${dano} de dano** ao boss!\n🩸 HP restante: **${raid.hpAtual}/${raid.hpMax}**`);
            }
        }
        
        else if (subcmd === 'info') {
            const raidId = args[1] || userId;
            const raid = db.raids[raidId];
            if (!raid) return message.reply('❌ Raid não encontrada!');
            
            const boss = bosses[raid.boss];
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`⚔️ Raid: ${boss.nome}`)
                .addFields(
                    { name: '👑 Criador', value: `<@${raid.dono}>`, inline: true },
                    { name: '👥 Participantes', value: `${raid.participantes.length}/10`, inline: true },
                    { name: '🩸 HP do Boss', value: `${raid.hpAtual}/${raid.hpMax}`, inline: true },
                    { name: '💥 Dano Total', value: `${raid.danoTotal}`, inline: true },
                    { name: '💰 Recompensa', value: `${boss.recompensa} Orbs (dividido)`, inline: true }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'bosses') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('👾 Bosses Disponíveis')
                .setDescription('Use `bt!raid criar <id>` para enfrentar um boss!');
            
            for (const [id, boss] of Object.entries(bosses)) {
                embed.addFields({
                    name: `${id} - ${boss.nome}`,
                    value: `🩸 HP: ${boss.hp.toLocaleString()} | 💰 Recompensa: ${boss.recompensa} Orbs | 🎯 Nível ${boss.nivelMin}+`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('⚔️ **Sistema de Raid**\n`bt!raid bosses` - Ver bosses\n`bt!raid criar <id>` - Criar raid\n`bt!raid entrar [id]` - Entrar na raid\n`bt!raid atacar [id]` - Atacar o boss\n`bt!raid info [id]` - Informações');
        }
    }
};