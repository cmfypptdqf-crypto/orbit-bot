// commands/economia/marketplace.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, marketItems: [] }));
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
    name: 'marketplace',
    aliases: ['market'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        if (!db.marketItems) db.marketItems = [];
        
        if (subcmd === 'vender') {
            const itemId = args[1];
            const preco = parseInt(args[2]);
            if (!itemId || !preco) return message.reply('❌ Use: `bt!market vender <id> <preco>`');
            
            const userId = message.author.id;
            const inventario = db.usuarios[userId]?.inventario || {};
            if (!inventario[itemId]) return message.reply('❌ Você não possui este item!');
            
            db.marketItems.push({ id: Date.now(), itemId, seller: userId, preco });
            inventario[itemId]--;
            saveDB(db);
            await message.reply(`✅ Item ${nomesItens[itemId] || itemId} à venda por ${preco} Orbs!`);
        }
        
        else if (subcmd === 'listar') {
            if (db.marketItems.length === 0) return message.reply('📭 Nenhum item à venda!');
            const embed = new EmbedBuilder().setColor(0xFFD700).setTitle('🛒 Marketplace');
            for (const item of db.marketItems.slice(0, 10)) {