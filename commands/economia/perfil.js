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
    name: 'perfil',
    aliases: ['profile', 'me'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        const guildId = message.guild.id;
        
        const walletKey = `carteira_${userId}_${guildId}`;
        const bankKey = `banco_${userId}_${guildId}`;
        
        const carteira = db[walletKey] || 0;
        const banco = db[bankKey] || 0;
        
        const member = await message.guild.members.fetch(user.id);
        const joinedDate = member.joinedTimestamp;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`📋 Perfil de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '💵 Carteira', value: `${carteira} moedas`, inline: true },
                { name: '🏦 Banco', value: `${banco} moedas`, inline: true },
                { name: '📊 Patrimônio', value: `${carteira + banco} moedas`, inline: true },
                { name: '📅 Entrou no servidor', value: `<t:${Math.floor(joinedDate / 1000)}:D>`, inline: false }
            )
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};