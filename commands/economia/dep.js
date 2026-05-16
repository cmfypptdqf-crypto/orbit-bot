// commands/economia/depositar.js
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
        let banco = db.usuarios[userId].banco || 0;
        
        if (!amount) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!depositar <valor>` ou `bt!depositar all`');
        
        if (amount.toLowerCase() === 'all') {
            amount = carteira;
        } else {
            amount = parseInt(amount);
            if (isNaN(amount)) return message.reply('<:emoji_47:1504081397373997076> Digite um número válido!');
        }
        
        if (amount <= 0) return message.reply('<:emoji_47:1504081397373997076> Digite um valor positivo!');
        if (amount > carteira) return message.reply(`<:emoji_47:1504081397373997076> Você só tem ${carteira.toLocaleString()} Orbs!`);
        
        db.usuarios[userId].carteira = carteira - amount;
        db.usuarios[userId].banco = banco + amount;
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle(`<a:h_checkazul:1503775331163705614> sucesso`)
            .setDescription(`📡 Você transferiu **${amount.toLocaleString()} Orbs** para o **Orbital Bank**!`)
            .addFields(
                { name: '<a:gcoin:1503617439202545757> Nucleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                { name: '<a:gcoin:1503617439202545757> Orbital Bank', value: `${db.usuarios[userId].banco.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '✨ Orbital Bank • Fundos garantidos pela Federação' });
        
        await message.reply({ embeds: [embed] });
    }
};