// commands/economia/transferenciaOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getRandomFrase } = require('../utilidades/orbitAI.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

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
    name: 'transferencia',
    aliases: ['pay', 'pagar', 'transferir', 'dar', 'enviarorb'],
    
    async executePrefix(message, args, client) {
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!transferencia @usuario <quantia>`');
        if (user.id === message.author.id) return message.reply('❌ Você não pode transferir Orbs para si mesmo!');
        if (user.bot) return message.reply('❌ Não pode transferir Orbs para um drone!');
        
        const amount = parseInt(args[1]);
        if (isNaN(amount) || amount <= 0) return message.reply('❌ Digite um valor orbital válido!');
        
        const db = getDB();
        const senderId = message.author.id;
        const targetId = user.id;
        
        if (!db.usuarios[senderId]) db.usuarios[senderId] = { carteira: 0, banco: 0 };
        if (!db.usuarios[targetId]) db.usuarios[targetId] = { carteira: 0, banco: 0 };
        
        const senderBalance = db.usuarios[senderId].carteira || 0;
        if (senderBalance < amount) return message.reply(`❌ Você só tem ${senderBalance.toLocaleString()} Orbs em seu Núcleo Orbital!`);
        
        db.usuarios[senderId].carteira = senderBalance - amount;
        db.usuarios[targetId].carteira = (db.usuarios[targetId].carteira || 0) + amount;
        
        // Adicionar XP pela transação
        const xpGanho = Math.max(1, Math.floor(amount / 100));
        const resultadoXP = adicionarXP(senderId, xpGanho, 'transferencia');
        
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle(`💫 ${getRandomFrase('sucesso')}`)
            .setDescription(`📡 Transferência Orbital realizada com sucesso!`)
            .addFields(
                { name: '📤 Remetente', value: message.author.username, inline: true },
                { name: '📥 Destinatário', value: user.username, inline: true },
                { name: '💰 Orbs Transferidos', value: `${amount.toLocaleString()} Orbs`, inline: true },
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                { name: '💵 Saldo Orbital', value: `${db.usuarios[senderId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Transferência interestelar concluída' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};