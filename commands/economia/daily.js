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
    name: 'diario',
    aliases: ['daily', 'diário', 'bonus'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, last_daily: 0, daily_streak: 0 };
        }
        
        const lastDaily = db.usuarios[userId].last_daily || 0;
        const now = Date.now();
        
        if (lastDaily && now - lastDaily < 86400000) {
            const remaining = Math.ceil((86400000 - (now - lastDaily)) / 3600000);
            return message.reply(`⏰ Você já pegou seu diário hoje! Volte em **${remaining} horas**.`);
        }
        
        const bonus = 200;
        let streak = db.usuarios[userId].daily_streak || 0;
        
        let novoStreak = 1;
        if (lastDaily) {
            const horasDesdeUltimo = (now - lastDaily) / 3600000;
            if (horasDesdeUltimo >= 20 && horasDesdeUltimo <= 28) {
                novoStreak = streak + 1;
            } else {
                novoStreak = 1;
            }
        }
        
        const bonusStreak = Math.min(Math.floor(novoStreak / 5) * 50, 500);
        const totalGanho = bonus + bonusStreak;
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + totalGanho;
        db.usuarios[userId].last_daily = now;
        db.usuarios[userId].daily_streak = novoStreak;
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('📆 Bônus Diário!')
            .setDescription(`Você recebeu **${totalGanho.toLocaleString()} orbs**!`)
            .addFields(
                { name: '🎁 Base', value: `${bonus} orbs`, inline: true },
                { name: '🔥 Sequência', value: `${novoStreak} dias (bônus: ${bonusStreak})`, inline: true },
                { name: '💰 Novo saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} moedas`, inline: true }
            )
            .setFooter({ text: 'Volte amanhã para mais!' });
        
        await message.reply({ embeds: [embed] });
    }
};