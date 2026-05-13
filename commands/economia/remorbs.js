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

// 🔧 CONFIGURE AQUI O ID DO CARGO PERMITIDO (mesmo do addmoedas)
const CARGO_PERMITIDO_ID = 'ID_DO_CARGO_AQUI';

module.exports = {
    name: 'removermoedas',
    aliases: ['removemoney', 'retirarmoedas'],
    
    async executePrefix(message, args, client) {
        // Verificar se o usuário tem o cargo específico
        const member = message.member;
        
        if (!member.roles.cache.has(CARGO_PERMITIDO_ID)) {
            return message.reply(`❌ Você não tem permissão para usar este comando!\n📌 Apenas membros com o cargo <@&${CARGO_PERMITIDO_ID}> podem remover moedas.`);
        }
        
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `!removermoedas @user <quantia>`');
        
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) return message.reply('❌ Digite um valor válido!');
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const carteiraAtual = db.usuarios[userId].carteira || 0;
        
        if (carteiraAtual < amount) {
            return message.reply(`❌ ${user} só tem ${carteiraAtual.toLocaleString()} moedas na carteira!`);
        }
        
        db.usuarios[userId].carteira = carteiraAtual - amount;
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('✅ Orbs Removidas!')
            .setDescription(`${user} perdeu **${amount.toLocaleString()} orbs**!`)
            .addFields(
                { name: '💰 Novo saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} orbs`, inline: true },
                { name: '👮 Removido por', value: message.author.tag, inline: true },
                { name: '📌 Cargo necessário', value: `<@&${CARGO_PERMITIDO_ID}>`, inline: false }
            )
            .setFooter({ text: '🌍 Economia global' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};