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
    name: 'depositar',
    aliases: ['dep', 'guardar'],
    
    async executePrefix(message, args, client) {
        let amount = args[0];
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        let carteira = db.usuarios[userId].carteira || 0;
        
        if (!amount) return message.reply(`❌ Use: ${client.prefix}depositar <valor> ou ${client.prefix}depositar all`);
        
        if (amount.toLowerCase() === 'all') {
            amount = carteira;
        } else {
            amount = parseInt(amount);
            if (isNaN(amount)) return message.reply('❌ Digite um número válido!');
        }
        
        if (amount <= 0) return message.reply('❌ Digite um valor positivo!');
        if (amount > carteira) return message.reply(`❌ Você só tem ${carteira.toLocaleString()} orbs no baú!`);
        
        db.usuarios[userId].carteira = carteira - amount;
        db.usuarios[userId].banco = (db.usuarios[userId].banco || 0) + amount;
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('🏦 Orbs Guardada Com Sucesso!')
            .setDescription(`Você Guardou **${amount.toLocaleString()} orbs** no céu !`)
            .addFields(
                { name: '💵 Baú', value: `${db.usuarios[userId].carteira.toLocaleString()} orbs`, inline: true },
                { name: '🏦 Céu', value: `${db.usuarios[userId].banco.toLocaleString()} orbs`, inline: true }
            );
        
        await message.reply({ embeds: [embed] });
    }
};