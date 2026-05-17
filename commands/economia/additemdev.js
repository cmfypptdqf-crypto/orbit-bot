// commands/admin/addItemDev.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const DEVELOPERS_IDS = ['SEU_ID_DISCORD_AQUI'];

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

const nomesItens = {
    '1': '🔭 Telescópio', '2': '🚀 Nave', '3': '💍 Anel', '4': '🛡️ Escudo',
    '5': '👻 Capa', '6': '🚨 Alarme', '11': '🍀 Amuleto', '12': '📈 Ação', '13': '🎰 Caça'
};

module.exports = {
    name: 'additemdev',
    aliases: ['giveitemdev', 'adicionaritemdev'],
    
    async executePrefix(message, args, client) {
        if (!DEVELOPERS_IDS.includes(message.author.id)) {
            return message.reply('❌ Acesso orbital negado! Apenas desenvolvedores.');
        }
        
        const user = message.mentions.users.first();
        if (!user) return message.reply('❌ Use: `bt!additemdev @usuario <item_id> <quantidade>`');
        
        const itemId = args[1];
        const quantidade = parseInt(args[2]) || 1;
        
        if (!itemId || !nomesItens[itemId]) {
            return message.reply(`❌ ID orbital inválido! IDs: ${Object.keys(nomesItens).join(', ')}`);
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
        db.usuarios[userId].inventario[itemId] = (db.usuarios[userId].inventario[itemId] || 0) + quantidade;
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('✅ Item Orbital Adicionado!')
            .setDescription(`**${quantidade}x ${nomesItens[itemId]}** adicionado à mochila de ${user.username}`)
            .addFields(
                { name: '👑 Desenvolvedor', value: message.author.tag, inline: true },
                { name: '🎁 Item', value: nomesItens[itemId], inline: true },
                { name: '🔢 Quantidade', value: `${quantidade}`, inline: true }
            )
            .setFooter({ text: '🌌 Orbit • Ação registrada pelo desenvolvedor' });
        
        await message.reply({ embeds: [embed] });
    }
};