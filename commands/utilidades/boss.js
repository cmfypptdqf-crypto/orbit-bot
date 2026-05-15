// commands/rpg/boss.js
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

const bossesDiarios = {
    'alien': { nome: '👾 Alien Invasor', hp: 5000, recompensa: 500, nivelMin: 5, cooldown: 6 },
    'dragao': { nome: '🐉 Dragão Cósmico', hp: 10000, recompensa: 1000, nivelMin: 10, cooldown: 12 },
    'devorador': { nome: '💀 Devorador', hp: 25000, recompensa: 2500, nivelMin: 20, cooldown: 24 },
    'imperador': { nome: '👑 Imperador', hp: 50000, recompensa: 5000, nivelMin: 35, cooldown: 48 }
};

const bossCooldowns = new Map();

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}

module.exports = {
    name: 'boss',
    aliases: ['bossdiario', 'dailyboss'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, xpTotal: 0, bossAtivo: null, bossHP: 0 };
        }
        
        const nivel = calcularNivel(db.usuarios[userId].xpTotal || 0);
        
        if (subcmd === 'status') {
            const bossAtivo = db.usuarios[userId].bossAtivo;
            if (!bossAtivo) return message.reply('❌ Nenhum boss ativo! Use `bt!boss enfrentar <boss>`');
            
            const boss = bossesDiarios[bossAtivo];
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`👾 Boss Ativo: ${boss.nome}`)
                .addFields(
                    { name: '🩸 HP Restante', value: `${db.usuarios[userId].bossHP}/${boss.hp}`, inline: true },
                    { name: '💰 Recompensa', value: `${boss.recompensa} Orbs`, inline: true }
                );
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'enfrentar') {
            const bossId = args[1];
            if (!bossId || !bossesDiarios[bossId]) return message.reply('❌ Boss inválido! Use `bt!boss lista`');
            
            const boss = bossesDiarios[bossId];
            if (nivel < boss.nivelMin) return message.reply(`❌ Você precisa ser nível ${boss.nivelMin} para enfrentar este boss!`);
            
            const cooldownKey = `boss_${userId}_${bossId}`;
            const lastFight = bossCooldowns.get(cooldownKey);
            if (lastFight && Date.now() - lastFight < boss.cooldown * 3600000) {
                const restante = Math.ceil((boss.cooldown * 3600000 - (Date.now() - lastFight)) / 3600000);
                return message.reply(`⏰ Você já enfrentou este boss hoje! Volte em **${restante} horas**.`);
            }
            
            db.usuarios[userId].bossAtivo = bossId;
            db.usuarios[userId].bossHP = boss.hp;
            saveDB(db);
            
            await message.reply(`👾 **${boss.nome}** apareceu! Use \`bt!boss atacar\` para lutar!`);
        }
        
        else if (subcmd === 'atacar') {
            const bossAtivo = db.usuarios[userId].bossAtivo;
            if (!bossAtivo) return message.reply('❌ Nenhum boss ativo! Use `bt!boss enfrentar <boss>`');
            
            const boss = bossesDiarios[bossAtivo];
            const dano = Math.floor(Math.random() * (nivel * 10 + 50)) + 50;
            db.usuarios[userId].bossHP = Math.max(0, db.usuarios[userId].bossHP - dano);
            
            if (db.usuarios[userId].bossHP <= 0) {
                const xpGanho = Math.floor(boss.recompensa / 10);
                db.usuarios[userId].carteira += boss.recompensa;
                db.usuarios[userId].xpTotal += xpGanho;
                db.usuarios[userId].bossAtivo = null;
                saveDB(db);
                
                bossCooldowns.set(`boss_${userId}_${bossAtivo}`, Date.now());
                
                await message.reply(`🏆 **${boss.nome} derrotado!**\n💰 Você ganhou ${boss.recompensa.toLocaleString()} Orbs!\n⭐ +${xpGanho} XP!`);
            } else {
                saveDB(db);
                await message.reply(`⚔️ Você causou **${dano} de dano** ao ${boss.nome}!\n🩸 HP restante: **${db.usuarios[userId].bossHP}/${boss.hp}**`);
            }
        }
        
        else if (subcmd === 'lista') {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('👾 Bosses Diários')
                .setDescription('Use `bt!boss enfrentar <id>` para desafiar um boss!');
            
            for (const [id, boss] of Object.entries(bossesDiarios)) {
                embed.addFields({
                    name: `${id} - ${boss.nome}`,
                    value: `🩸 HP: ${boss.hp.toLocaleString()} | 💰 Recompensa: ${boss.recompensa} Orbs | 🎯 Nível ${boss.nivelMin}+ | ⏰ Cooldown: ${boss.cooldown}h`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else {
            await message.reply('👾 **Sistema de Boss Diário**\n`bt!boss lista` - Ver bosses\n`bt!boss enfrentar <id>` - Enfrentar boss\n`bt!boss atacar` - Atacar\n`bt!boss status` - Ver status');
        }
    }
};