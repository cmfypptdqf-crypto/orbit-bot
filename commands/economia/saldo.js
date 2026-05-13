const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

module.exports = {
    name: 'bal',
    aliases: ['atm', 'saldo', 'balance'k],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        let totalCarteira = 0;
        let totalBanco = 0;
        let servidoresEncontrados = [];
        
        // Percorrer todas as keys do database
        for (const [key, value] of Object.entries(db)) {
            if (key.startsWith('carteira_') && key.includes(user.id)) {
                const parts = key.split('_');
                const guildId = parts[2];
                const bankKey = `banco_${user.id}_${guildId}`;
                
                totalCarteira += value || 0;
                totalBanco += db[bankKey] || 0;
                servidoresEncontrados.push(guildId);
            }
        }
        
        const totalGlobal = totalCarteira + totalBanco;
        
        const embed = new EmbedBuilder()
            .setColor(0x000008B)
            .setTitle(`🌍 Saldo de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '💵 Baú', value: `${totalCarteira.toLocaleString()} Orbitas no baú`, inline: true },
                { name: '🏦 Espaçol', value: `${totalBanco.toLocaleString()} Orbitas no céu`, inline: true }
            )
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};