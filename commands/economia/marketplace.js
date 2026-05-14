// commands/economia/marketplace.js
const fs = require('fs');
const path = require('path');

let marketItems = [];

module.exports = {
    name: 'marketplace',
    description: 'Compre e venda itens com outros jogadores',
    aliases: ['market', 'mercado'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        
        if (subcmd === 'vender') {
            const itemId = args[1];
            const preco = parseInt(args[2]);
            
            if (!itemId || !preco) return message.reply('❌ Use: `!marketplace vender <item_id> <preco>`');
            
            const db = getDB();
            const userId = message.author.id;
            const inventario = db.usuarios[userId]?.inventario || {};
            
            if (!inventario[itemId] || inventario[itemId] <= 0) {
                return message.reply('❌ Você não possui este item!');
            }
            
            marketItems.push({
                id: Date.now(),
                itemId: itemId,
                seller: userId,
                preco: preco,
                createdAt: Date.now()
            });
            
            inventario[itemId]--;
            saveDB(db);
            
            await message.reply(`✅ Item ID ${itemId} colocado à venda por ${preco} Orbs!`);
        }
        
        if (subcmd === 'listar') {
            if (marketItems.length === 0) return message.reply('📭 Nenhum item à venda no momento!');
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🛒 Marketplace Interestelar');
            
            for (const item of marketItems.slice(0, 10)) {
                const seller = await client.users.fetch(item.seller);
                embed.addFields({
                    name: `ID: ${item.id}`,
                    value: `🎁 Item: ${item.itemId}\n💰 Preço: ${item.preco} Orbs\n👤 Vendedor: ${seller.username}`,
                    inline: false
                });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        if (subcmd === 'comprar') {
            const marketId = parseInt(args[1]);
            const item = marketItems.find(i => i.id === marketId);
            
            if (!item) return message.reply('❌ Item não encontrado!');
            
            const db = getDB();
            const userId = message.author.id;
            
            if ((db.usuarios[userId]?.carteira || 0) < item.preco) {
                return message.reply(`❌ Você precisa de ${item.preco} Orbs!`);
            }
            
            db.usuarios[userId].carteira -= item.preco;
            db.usuarios[item.seller].carteira += item.preco;
            
            if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
            db.usuarios[userId].inventario[item.itemId] = (db.usuarios[userId].inventario[item.itemId] || 0) + 1;
            
            const index = marketItems.findIndex(i => i.id === marketId);
            marketItems.splice(index, 1);
            
            saveDB(db);
            await message.reply(`✅ Compra realizada! Você recebeu o item ${item.itemId}.`);
        }
    }
};