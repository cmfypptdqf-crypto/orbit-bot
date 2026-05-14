// commands/rpg/xp.js
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

module.exports = {
    name: 'xp',
    aliases: ['experience', 'exp'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { xpTotal: 0, level: 1 };
        }
        
        const xpTotal = db.usuarios[userId].xpTotal || 0;
        const level = calcularNivel(xpTotal);
        const xpNecessario = level * 1000;
        const xpAtual = xpTotal % xpNecessario;
        const progresso = Math.floor((xpAtual / xpNecessario) * 100);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`✨ Stellar XP de ${message.author.username}`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { name: '📊 Nível', value: `${level}`, inline: true },
                { name: '⭐ XP Total', value: `${xpTotal.toLocaleString()}`, inline: true },
                { name: '📈 XP no Nível', value: `${xpAtual.toLocaleString()} / ${xpNecessario.toLocaleString()} (${progresso}%)`, inline: false }
            )
            .setFooter({ text: '✨ Stellar XP • Evolua através das estrelas' });
        
        await message.reply({ embeds: [embed] });
    }
};

function calcularNivel(xpTotal) {
    if (xpTotal <= 0) return 1;
    return Math.min(100, Math.floor(Math.sqrt(xpTotal / 100)) + 1);
}