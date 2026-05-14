// commands/economia/pay.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getRandomFrase } = require('../utilidades/orbitAI.js');

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
    name: 'pay',
    aliases: ['pagar', 'transferir', 'dar', 'enviar'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!pay @usuario <quantia>`');
        
        if (user.id === message.author.id) {
            return message.reply('❌ Você não pode pagar a si mesmo!');
        }
        
        if (user.bot) {
            return message.reply('❌ Você não pode transferir Orbs para um bot!');
        }
        
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) {
            return message.reply('❌ Digite um valor válido! Ex: `bt!pay @usuario 100`');
        }
        
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
            return message.reply(`❌ Você só tem ${senderBalance.toLocaleString()} Orbs na carteira!`);
        }
        
        // Realizar transferência
        db.usuarios[senderId].carteira = senderBalance - amount;
        db.usuarios[targetId].carteira = (db.usuarios[targetId].carteira || 0) + amount;
        saveDB(db);
        
        const fraseSucesso = getRandomFrase('sucesso');
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`💸 ${fraseSucesso}`)
            .setDescription(`📡 Transferência realizada com sucesso!`)
            .addFields(
                { name: '📤 Remetente', value: message.author.username, inline: true },
                { name: '📥 Destinatário', value: user.username, inline: true },
                { name: '💰 Valor', value: `${amount.toLocaleString()} Orbs`, inline: true },
                { name: '💵 Seu novo saldo', value: `${db.usuarios[senderId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Transferência interestelar' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};