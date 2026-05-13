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

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'depositar',
    aliases: ['dep', 'guardar'],
    
    async executePrefix(message, args, client) {
        let amount = args[0];
        const db = getDB();
        const userId = message.author.id;
        const guildId = message.guild.id;
        
        const walletKey = `carteira_${userId}_${guildId}`;
        const bankKey = `banco_${userId}_${guildId}`;
        
        let carteira = db[walletKey] || 0;
        
        if (!amount) return message.reply(`❌ Use: ${client.prefix}depositar <valor> ou ${client.prefix}depositar all`);
        
        if (amount.toLowerCase() === 'all') {
            amount = carteira;
        } else {
            amount = parseInt(amount);
            if (isNaN(amount)) return message.reply('❌ Digite um número válido!');
        }
        
        if (amount <= 0) return message.reply('❌ Digite um valor positivo!');
        if (amount > carteira) return message.reply(`❌ Você só tem ${carteira} moedas na carteira!`);
        
        db[walletKey] = carteira - amount;
        db[bankKey] = (db[bankKey] || 0) + amount;
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🏦 Depósito Realizado!')
            .setDescription(`Você depositou **${amount} moedas** no banco!`)
            .addFields(
                { name: '💵 Carteira', value: `${db[walletKey]} moedas`, inline: true },
                { name: '🏦 Banco', value: `${db[bankKey]} moedas`, inline: true }
            );
        
        await message.reply({ embeds: [embed] });
    }
};