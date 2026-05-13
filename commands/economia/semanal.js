const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
    name: 'semanal',
    aliases: ['weekly', 'bonus_semanal', 'semana'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, last_weekly: 0, weekly_streak: 0 };
        }
        
        const lastWeekly = db.usuarios[userId].last_weekly || 0;
        const now = Date.now();
        
        if (lastWeekly && now - lastWeekly < 604800000) {
            const remaining = Math.ceil((604800000 - (now - lastWeekly)) / 86400000);
            return message.reply(`⏰ Você já pegou seu bônus semanal! Volte em **${remaining} dia(s)**.`);
        }
        
        const bonusBase = 1500;
        let streak = db.usuarios[userId].weekly_streak || 0;
        
        let novoStreak = 1;
        if (lastWeekly) {
            const diasDesdeUltimo = (now - lastWeekly) / 86400000;
            if (diasDesdeUltimo >= 5 && diasDesdeUltimo <= 9) {
                novoStreak = streak + 1;
            } else {
                novoStreak = 1;
            }
        }
        
        const bonusStreak = Math.min(novoStreak * 50, 500);
        const bonusSorte = Math.floor(Math.random() * 301);
        const valorFinal = bonusBase + bonusStreak + bonusSorte;
        
        db.usuarios[userId].banco = (db.usuarios[userId].banco || 0) + valorFinal;
        db.usuarios[userId].last_weekly = now;
        db.usuarios[userId].weekly_streak = novoStreak;
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('📅 Bônus Semanal!')
            .setDescription(`🎉 Você recebeu **${valorFinal.toLocaleString()} orbs** no céu!`)
            .addFields(
                { name: '💰 Base', value: `${bonusBase} orbs`, inline: true },
                { name: '🔥 Sequência', value: `${novoStreak} semana(s) (+${bonusStreak})`, inline: true },
                { name: '🍀 Sorte', value: `+${bonusSorte} orbs`, inline: true },
                { name: '🏦 Novo saldo no céu', value: `${db.usuarios[userId].banco.toLocaleString()} orbs`, inline: true }
            )
            .setFooter({ text: 'Volte semana que vem para mais!' });
        
        if (novoStreak >= 5) {
            embed.setDescription(`🎉🔥 **STREAK DE ${novoStreak} SEMANAS!** 🔥🎉\nVocê recebeu **${valorFinal.toLocaleString()} orbs** no céu!`);
        }
        
        await message.reply({ embeds: [embed] });
    }
};