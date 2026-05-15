// commands/economia/mochila.js
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

const nomesItens = {
    '1': '🔭 Telescópio', '2': '🚀 Nave Explorer', '3': '💍 Anel Cósmico',
    '4': '🛡️ Escudo', '5': '👻 Capa', '6': '🚨 Alarme',
    '7': '⭐ Orbit Prime Bronze', '8': '⭐ Orbit Prime Prata', '9': '⭐ Orbit Prime Ouro',
    '10': '⭐ Orbit Prime Diamante', '11': '🍀 Amuleto', '12': '📈 Ação',
    '13': '📦 Nebula Crate', '14': '🚀 Nave Hiperespacial', '15': '💎 Cristal Cósmico'
};

module.exports = {
    name: 'mochila',
    aliases: ['inv', 'inventario', 'itens', 'bag'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        if (args[0]) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const inventario = db.usuarios[userId].inventario || {};
        const itensLista = Object.entries(inventario);
        
        if (itensLista.length === 0) {
            return message.reply(`🎒 Mochila de ${user.username} está vazia! Visite a **Galaxy Store** para comprar itens!`);
        }
        
        let totalItens = 0;
        for (const [_, qtd] of itensLista) totalItens += qtd;
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle(`🎒 Mochila de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .setDescription(`📦 **${totalItens} itens** no total`);
        
        for (const [id, qtd] of itensLista.slice(0, 15)) {
            const nome = nomesItens[id] || `Item ${id}`;
            embed.addFields({ name: nome, value: `Quantidade: ${qtd}`, inline: true });
        }
        
        if (itensLista.length > 15) {
            embed.setFooter({ text: `+ ${itensLista.length - 15} outros itens` });
        }
        
        await message.reply({ embeds: [embed] });
    }
};