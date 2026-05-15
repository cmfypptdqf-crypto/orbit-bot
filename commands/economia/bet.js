// commands/economia/bet.js
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
    name: 'bet',
    aliases: ['apostar', 'caraoucoroa'],
    
    async executePrefix(message, args, client) {
        const amount = parseInt(args[0]);
        const escolha = args[1]?.toLowerCase();
        
        if (isNaN(amount) || amount <= 0) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!bet <valor> <cara/coroa>`');
        if (!['cara', 'coroa'].includes(escolha)) return message.reply('<:emoji_47:1504081397373997076> Escolha "cara" ou "coroa"');
        
        const userId = message.author.id;
        const db = getDB();
        if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0 };
        if ((db.usuarios[userId].carteira || 0) < amount) return message.reply('<:emoji_47:1504081397373997076> Saldo insuficiente!');
        
        const resultado = Math.random() < 0.5 ? 'cara' : 'coroa';
        const ganhou = escolha === resultado;
        
        if (ganhou) {
            db.usuarios[userId].carteira += amount;
            await message.reply(`🎉 Deu ${resultado}! Você ganhou ${amount.toLocaleString()} Orbs!`);
        } else {
            db.usuarios[userId].carteira -= amount;
            await message.reply(`😞 Deu ${resultado}! Você perdeu ${amount.toLocaleString()} Orbs!`);
        }
        saveDB(db);
    }
};