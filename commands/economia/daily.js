const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Caminho do arquivo JSON
const dbPath = path.join(__dirname, '..', '..', 'database.json');

// Função para ler o banco
function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

// Função para salvar o banco
function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'daily',
    aliases: ['diario', 'bonus'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        const userId = message.author.id;
        const guildId = message.guild.id;
        const key = `daily_${userId}_${guildId}`;
        const now = Date.now();
        const cooldown = 86400000; // 24 horas
        
        if (db[key] && now - db[key] < cooldown) {
            const remaining = new Date(cooldown - (now - db[key]));
            const hours = remaining.getUTCHours();
            const minutes = remaining.getUTCMinutes();
            return message.reply(`⏰ Você já resgatou seu daily! Próximo em ${hours}h ${minutes}m.`);
        }
        
        const reward = 500;
        
        // Atualizar carteira
        const walletKey = `carteira_${userId}_${guildId}`;
        db[walletKey] = (db[walletKey] || 0) + reward;
        db[key] = now;
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🎉 Bônus Diário!')
            .setDescription(`Você recebeu **${reward} moedas**!`)
            .setFooter({ text: 'Volte amanhã para mais!' });
        
        await message.reply({ embeds: [embed] });
    }
};