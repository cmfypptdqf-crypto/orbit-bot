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
    name: 'pagar',
    aliases: ['pay', 'transferir', 'dar'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!pagar @user <quantia>`');
        
        if (user.id === message.author.id) {
            return message.reply('❌ Você não pode pagar a si mesmo!');
        }
        
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) return message.reply('❌ Digite um valor válido!');
        
        const db = getDB();
        const senderId = message.author.id;
        const targetId = user.id;
        
        if (!db.usuarios[senderId]) {
            db.usuarios[senderId] = { carteira: 0, banco: 0, inventario: {} };
        }
        if (!db.usuarios[targetId]) {
            db.usuarios[targetId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const senderBalance = db.usuarios[senderId].carteira || 0;
        
        if (senderBalance < amount) {
            return message.reply(`❌ Você só tem ${senderBalance.toLocaleString()} orbs no baú!`);
        }
        
        db.usuarios[senderId].carteira = senderBalance - amount;
        db.usuarios[targetId].carteira = (db.usuarios[targetId].carteira || 0) + amount;
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('💸 Transferência realizada!')
            .setDescription(`${message.author} pagou **${amount.toLocaleString()} orbs** para ${user}`)
            .addFields(
                { name: '💰 Seu novo saldo', value: `${db.usuarios[senderId].carteira.toLocaleString()} orbs`, inline: true }
            )
            .setFooter({ text: '🌍 Transferência global' });
        
        await message.reply({ embeds: [embed] });
    }
};