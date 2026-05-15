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
    '5': '👻 Capa', '6': '🚨 Alarme', '11': '🍀 Amuleto', '12': '📈 Ação', '13': '📦 Nebula Crate'
};

module.exports = {
    name: 'marketplace',
    aliases: ['market', 'voidmarket'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        if (!db.marketItems) db.marketItems = [];
        
        if (subcmd === 'vender') {
            const itemId = args[1];
            const preco = parseInt(args[2]);
            if (!itemId || !preco) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!voidmarket vender <id> <preco>`');
            
            const userId = message.author.id;
            const inventario = db.usuarios[userId]?.inventario || {};
            if (!inventario[itemId]) return message.reply('<:emoji_47:1504081397373997076> Você não possui este item!');
            
            db.marketItems.push({ id: Date.now(), itemId, seller: userId, preco });
            inventario[itemId]--;
            saveDB(db);
            await message.reply(`✅ Item ${nomesItens[itemId] || itemId} listado no **Void Market** por ${preco} Orbs!`);
        }
        
        else if (subcmd === 'listar') {
            if (db.marketItems.length === 0) return message.reply('📭 Nenhum item no **Void Market**!');
            const embed = new EmbedBuilder()
                .setColor(0x00008B)
                .setTitle('🌑 Void Market')
                .setDescription('Onde as oportunidades se escondem...');
            for (const item of db.marketItems.slice(0, 10)) {
                const seller = await client.users.fetch(item.seller);
                embed.addFields({ name: `🎫 ID: ${item.id}`, value: `🎁 ${nomesItens[item.itemId]} - ${item.preco} Orbs\n👤 ${seller.username}`, inline: false });
            }
            embed.setFooter({ text: '🌑 Void Market • Use bt!voidmarket comprar <id>' });
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'comprar') {
            const marketId = parseInt(args[1]);
            const item = db.marketItems.find(i => i.id === marketId);
            if (!item) return message.reply('<:emoji_47:1504081397373997076> Item não encontrado no **Void Market**!');
            
            const userId = message.author.id;
            if ((db.usuarios[userId]?.carteira || 0) < item.preco) return message.reply('<:emoji_47:1504081397373997076> Saldo insuficiente!');
            if (userId === item.seller) return message.reply('<:emoji_47:1504081397373997076> Não pode comprar seus próprios itens!');
            
            db.usuarios[userId].carteira -= item.preco;
            db.usuarios[item.seller].carteira += item.preco;
            if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
            db.usuarios[userId].inventario[item.itemId] = (db.usuarios[userId].inventario[item.itemId] || 0) + 1;
            
            const index = db.marketItems.findIndex(i => i.id === marketId);
            db.marketItems.splice(index, 1);
            saveDB(db);
            await message.reply(`✅ Compra realizada no **Void Market**! Você recebeu ${nomesItens[item.itemId] || item.itemId}!`);
        }
        
        else {
            await message.reply('🌑 **Void Market**\n`bt!voidmarket vender <id> <preco>`\n`bt!voidmarket listar`\n`bt!voidmarket comprar <id>`');
        }
    }
};