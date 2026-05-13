const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');
const cooldowns = new Map();

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'semanalglobal',
    aliases: ['weeklyglobal', 'semanalg', 'wglobal'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const cooldownKey = `weekly_global_${userId}`;
        const lastWeekly = cooldowns.get(cooldownKey);
        
        // 7 dias em milissegundos
        if (lastWeekly && Date.now() - lastWeekly < 604800000) {
            const remaining = Math.ceil((604800000 - (Date.now() - lastWeekly)) / 86400000);
            return message.reply(`⏰ Você já pegou seu bônus semanal global! Volte em **${remaining} dia(s)**.`);
        }
        
        const bonusBase = 2500; // Bônus maior por ser global
        
        const streakKey = `weekly_global_streak_${userId}`;
        let streak = cooldowns.get(streakKey) || 0;
        
        const lastWeeklyTime = cooldowns.get(cooldownKey);
        const now = Date.now();
        
        let novoStreak = 1;
        if (lastWeeklyTime) {
            const diasDesdeUltimo = (now - lastWeeklyTime) / 86400000;
            if (diasDesdeUltimo >= 5 && diasDesdeUltimo <= 9) {
                novoStreak = streak + 1;
            } else if (diasDesdeUltimo < 5) {
                return message.reply('⏰ Você já pegou seu bônus semanal global essa semana!');
            } else {
                novoStreak = 1;
            }
        }
        
        const bonusStreak = Math.min(novoStreak * 100, 1000);
        const bonusSorte = Math.floor(Math.random() * 501);
        const valorFinal = bonusBase + bonusStreak + bonusSorte;
        
        // Adicionar ao banco do servidor atual
        const db = getDB();
        const guildId = message.guild.id;
        const bankKey = `banco_${userId}_${guildId}`;
        
        db[bankKey] = (db[bankKey] || 0) + valorFinal;
        saveDB(db);
        
        cooldowns.set(cooldownKey, Date.now());
        cooldowns.set(streakKey, novoStreak);
        
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle('🌍 Bônus Semanal Global!')
            .setDescription(`🎉 Você recebeu **${valorFinal} moedas** no banco do servidor **${message.guild.name}**!`)
            .addFields(
                { name: '💰 Base', value: `${bonusBase} moedas`, inline: true },
                { name: '🔥 Sequência Global', value: `${novoStreak} semana(s) (+${bonusStreak})`, inline: true },
                { name: '🍀 Sorte', value: `+${bonusSorte} moedas`, inline: true },
                { name: '🏦 Novo saldo no banco', value: `${db[bankKey]} moedas`, inline: true }
            )
            .setFooter({ text: 'Volte semana que vem para mais!' });
        
        if (novoStreak >= 5) {
            embed.setDescription(`🎉🔥 **STREAK GLOBAL DE ${novoStreak} SEMANAS!** 🔥🎉\nVocê recebeu **${valorFinal} moedas** no banco do servidor **${message.guild.name}**!`);
        }
        
        await message.reply({ embeds: [embed] });
    }
};