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
    name: 'diarioglobal',
    aliases: ['dailyglobal', 'diariog', 'dglobal'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const cooldownKey = `daily_global_${userId}`;
        const lastDaily = cooldowns.get(cooldownKey);
        
        // Cooldown global de 24 horas (um diário por dia em qualquer servidor)
        if (lastDaily && Date.now() - lastDaily < 86400000) {
            const remaining = Math.ceil((86400000 - (Date.now() - lastDaily)) / 3600000);
            return message.reply(`⏰ Você já pegou seu diário global hoje! Volte em **${remaining} horas**.`);
        }
        
        const bonus = 300; // Bônus maior por ser global
        
        // Sistema de streak global
        const streakKey = `daily_global_streak_${userId}`;
        let streak = cooldowns.get(streakKey) || 0;
        
        const lastDailyTime = cooldowns.get(cooldownKey);
        const now = Date.now();
        
        let novoStreak = 1;
        if (lastDailyTime) {
            const horasDesdeUltimo = (now - lastDailyTime) / 3600000;
            if (horasDesdeUltimo >= 20 && horasDesdeUltimo <= 28) {
                novoStreak = streak + 1;
            } else if (horasDesdeUltimo < 20) {
                return message.reply('⏰ Você já pegou seu diário global hoje!');
            } else {
                novoStreak = 1;
            }
        }
        
        const bonusStreak = Math.min(Math.floor(novoStreak / 5) * 100, 1000);
        const bonusSorte = Math.floor(Math.random() * 501);
        const totalGanho = bonus + bonusStreak + bonusSorte;
        
        // Adicionar ao servidor atual
        const db = getDB();
        const guildId = message.guild.id;
        const walletKey = `carteira_${userId}_${guildId}`;
        
        db[walletKey] = (db[walletKey] || 0) + totalGanho;
        saveDB(db);
        
        cooldowns.set(cooldownKey, Date.now());
        cooldowns.set(streakKey, novoStreak);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🌍 Bônus Diário Global!')
            .setDescription(`Você recebeu **${totalGanho} moedas** no servidor **${message.guild.name}**!`)
            .addFields(
                { name: '🎁 Base', value: `${bonus} moedas`, inline: true },
                { name: '🔥 Sequência Global', value: `${novoStreak} dias (bônus: ${bonusStreak})`, inline: true },
                { name: '🍀 Sorte', value: `+${bonusSorte} moedas`, inline: true },
                { name: '💰 Novo saldo local', value: `${db[walletKey]} moedas`, inline: true }
            )
            .setFooter({ text: 'Volte amanhã para mais!' });
        
        if (novoStreak >= 5) {
            embed.setDescription(`🎉🔥 **STREAK GLOBAL DE ${novoStreak} DIAS!** 🔥🎉\nVocê recebeu **${totalGanho} moedas** no servidor **${message.guild.name}**!`);
        }
        
        await message.reply({ embeds: [embed] });
    }
};