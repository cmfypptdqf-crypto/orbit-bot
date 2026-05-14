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
    name: 'nucleo',
    aliases: ['carteira', 'saldo', 'bal', 'nuclear'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        let userId = message.author.id;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) userId = mention.id;
        }
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            saveDB(db);
        }
        
        const nucleo = db.usuarios[userId].carteira || 0;
        const estacao = db.usuarios[userId].banco || 0;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`💵 Núcleo de ${message.author.username}`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { name: '💵 Núcleo', value: `${nucleo.toLocaleString()} Orbs`, inline: true },
                { name: '🏦 Estação', value: `${estacao.toLocaleString()} Orbs`, inline: true },
                { name: '📊 Patrimônio Total', value: `${(nucleo + estacao).toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '🌌 Economia Intergaláctica' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};