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
    name: 'pagar',
    aliases: ['transferir', 'pay'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Mencione um usuário para pagar!');
        if (user.id === message.author.id) return message.reply('❌ Você não pode pagar a si mesmo!');
        
        const amount = parseInt(args[1]);
        if (!amount || isNaN(amount)) return message.reply('❌ Digite um valor válido!');
        if (amount <= 0) return message.reply('❌ Digite um valor positivo!');
        
        const db = getDB();
        const userId = message.author.id;
        const targetId = user.id;
        const guildId = message.guild.id;
        
        const walletKey = `carteira_${userId}_${guildId}`;
        let carteira = db[walletKey] || 0;
        
        if (amount > carteira) return message.reply(`❌ Você só tem ${carteira} moedas!`);
        
        // Transferir
        db[walletKey] = carteira - amount;
        db[`carteira_${targetId}_${guildId}`] = (db[`carteira_${targetId}_${guildId}`] || 0) + amount;
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('💸 Transferência realizada!')
            .setDescription(`Você pagou **${amount} moedas** para ${user.username}`)
            .setFooter({ text: `Novo saldo: ${db[walletKey]} moedas` });
        
        await message.reply({ embeds: [embed] });
    }
};