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

// 🔧 CONFIGURE AQUI O ID DO CARGO PERMITIDO
const CARGO_PERMITIDO_ID = '1504261562498814042'; // ← COLOQUE O ID DO CARGO AQUI

module.exports = {
    name: 'addorbs',
    aliases: ['adicionar'],
    
    async executePrefix(message, args, client) {
        // Verificar se o usuário tem o cargo específico
        const member = message.member;
        
        if (!member.roles.cache.has(CARGO_PERMITIDO_ID)) {
            return message.reply(`❌ Você não tem permissão para usar este comando!\n📌 Apenas membros com o cargo <@&${CARGO_PERMITIDO_ID}> podem adicionar orbs.`);
        }
        
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!addorbs @user <quantia>`');
        
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) return message.reply('❌ Digite um valor válido!');
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + amount;
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Orbs Adicionadas!')
            .setDescription(`${user} recebeu **${amount.toLocaleString()} orbs**!`)
            .addFields(
                { name: '💰 Novo saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} moedas`, inline: true },
                { name: '👮 Adicionado por', value: message.author.tag, inline: true },
                { name: '📌 Cargo necessário', value: `<@&${CARGO_PERMITIDO_ID}>`, inline: false }
            )
            .setFooter({ text: '🌍 Economia global' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
};