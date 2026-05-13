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
    name: 'sacar',
    aliases: ['saque', 'withdraw'],
    
    async executePrefix(message, args, client) {
        let amount = args[0];
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            saveDB(db);
        }
        
        let banco = db.usuarios[userId].banco || 0;
        
        if (!amount) return message.reply(`❌ Use: ${client.prefix}sacar <valor> ou ${client.prefix}sacar all`);
        
        if (amount.toLowerCase() === 'all') {
            amount = banco;
        } else {
            amount = parseInt(amount);
            if (isNaN(amount)) return message.reply('❌ Digite um número válido!');
        }
        
        if (amount <= 0) return message.reply('❌ Digite um valor positivo!');
        if (amount > banco) return message.reply(`❌ Você só tem ${banco.toLocaleString()} orbs no céu!`);
        
        db.usuarios[userId].banco = banco - amount;
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + amount;
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('💸 Saque Realizado!')
            .setDescription(`Você tirou **${amount.toLocaleString()} orbs** do céu !`)
            .addFields(
                { name: '💵 baú', value: `${db.usuarios[userId].carteira.toLocaleString()} orbs`, inline: true },
                { name: '🏦 céu', value: `${db.usuarios[userId].banco.toLocaleString()} orbs`, inline: true }
            );
        
        await message.reply({ embeds: [embed] });
    }
};