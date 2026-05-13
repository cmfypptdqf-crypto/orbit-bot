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
    name: 'transferirglobal',
    aliases: ['transferirg', 'payglobal', 'enviarglobal'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `!transferirglobal @user <quantia>`');
        
        if (user.id === message.author.id) {
            return message.reply('❌ Você não pode transferir para si mesmo!');
        }
        
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) return message.reply('❌ Digite um valor válido!');
        
        const db = getDB();
        const userId = message.author.id;
        const targetId = user.id;
        
        // Calcular total global do remetente
        let senderTotalGlobal = 0;
        let senderCarteiras = [];
        
        for (const [key, value] of Object.entries(db)) {
            if (key.startsWith('carteira_') && key.includes(userId)) {
                const parts = key.split('_');
                const guildId = parts[2];
                const carteira = value || 0;
                senderTotalGlobal += carteira;
                senderCarteiras.push({ key, guildId, carteira });
            }
        }
        
        if (senderTotalGlobal < amount) {
            return message.reply(`❌ Você só tem ${senderTotalGlobal.toLocaleString()} moedas em todos os servidores!`);
        }
        
        // Escolher de qual servidor tirar as moedas (priorizar servidor com mais moedas)
        senderCarteiras.sort((a, b) => b.carteira - a.carteira);
        
        let restante = amount;
        for (const sender of senderCarteiras) {
            if (restante <= 0) break;
            
            const disponivel = sender.carteira;
            const tirar = Math.min(disponivel, restante);
            
            db[sender.key] = disponivel - tirar;
            restante -= tirar;
        }
        
        // Adicionar ao destino (adicionar no servidor atual do comando)
        const targetGuildId = message.guild.id;
        const targetWalletKey = `carteira_${targetId}_${targetGuildId}`;
        db[targetWalletKey] = (db[targetWalletKey] || 0) + amount;
        
        saveDB(db);
        
        // Calcular novo total do remetente
        let novoSenderTotal = 0;
        for (const sender of senderCarteiras) {
            novoSenderTotal += db[sender.key] || 0;
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🌍 Transferência Global realizada!')
            .setDescription(`${message.author} transferiu **${amount.toLocaleString()} moedas** globalmente para ${user}`)
            .addFields(
                { name: '💰 Seu novo patrimônio global', value: `${novoSenderTotal.toLocaleString()} moedas`, inline: true },
                { name: '🏦 Destino', value: `Adicionado ao servidor ${message.guild.name}`, inline: true }
            )
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};