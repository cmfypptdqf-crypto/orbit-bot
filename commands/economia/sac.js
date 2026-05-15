// commands/economia/sacar.js
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
    aliases: ['saque', 'withdraw', 'retirar'],
    
    async executePrefix(message, args, client) {
        let amount = args[0];
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        let carteira = db.usuarios[userId].carteira || 0;
        let banco = db.usuarios[userId].banco || 0;
        
        if (!amount) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!sacar <valor>` ou `bt!sacar all`');
        
        if (amount.toLowerCase() === 'all') {
            amount = banco;
        } else {
            amount = parseInt(amount);
            if (isNaN(amount)) return message.reply('<:emoji_47:1504081397373997076> Digite um número válido!');
        }
        
        if (amount <= 0) return message.reply('<:emoji_47:1504081397373997076> Digite um valor positivo!');
        if (amount > banco) return message.reply(`<:emoji_47:1504081397373997076> Você só tem ${banco.toLocaleString()} Orbs no Orbital Bank!`);
        
        db.usuarios[userId].banco = banco - amount;
        db.usuarios[userId].carteira = carteira + amount;
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle(`<a:h_checkazul:1503775331163705614> sucesso`)
            .setDescription(`Você sacou **${amount.toLocaleString()} Orbs** do **Orbital Bank**!`)
            .addFields(
                { name: '<a:gcoin:1503617439202545757> Carteira', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                { name: '<a:gcoin:1503617439202545757> Orbital Bank', value: `${db.usuarios[userId].banco.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '✨ Orbital Bank • Fundos garantidos pela Federação' });
        
        await message.reply({ embeds: [embed] });
    }
};