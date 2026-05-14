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
                const seller = await client.users.fetch(item.seller);
                embed.addFields({ name: `ID: ${item.id}`, value: `🎁 ${nomesItens[item.itemId]} - ${item.preco} Orbs\n👤 ${seller.username}`, inline: false });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'comprar') {
            const marketId = parseInt(args[1]);
            const item = db.marketItems.find(i => i.id === marketId);
            if (!item) return message.reply('❌ Item não encontrado!');
            
            const userId = message.author.id;
            if ((db.usuarios[userId]?.carteira || 0) < item.preco) return message.reply('❌ Saldo insuficiente!');
            if (userId === item.seller) return message.reply('❌ Não pode comprar seus próprios itens!');
            
            db.usuarios[userId].carteira -= item.preco;
            db.usuarios[item.seller].carteira += item.preco;
            if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
            db.usuarios[userId].inventario[item.itemId] = (db.usuarios[userId].inventario[item.itemId] || 0) + 1;
            
            const index = db.marketItems.findIndex(i => i.id === marketId);
            db.marketItems.splice(index, 1);
            saveDB(db);
            await message.reply(`✅ Comprado! Você recebeu ${nomesItens[item.itemId] || item.itemId}!`);
        }
        
        else {
            await message.reply('🛒 **Marketplace**\n`bt!market vender <id> <preco>`\n`bt!market listar`\n`bt!market comprar <id>`');
        }
    }
};