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
    '1': '🔭 Telescópio', '2': '🚀 Nave Explorer', '3': '💍 Anel Cósmico',
    '4': '🛡️ Escudo', '5': '👻 Capa', '6': '🚨 Alarme',
    '11': '🍀 Amuleto', '12': '📈 Ação', '13': '🎰 Caça-Níquel'
};

module.exports = {
    name: 'marketplace',
    aliases: ['market', 'mercado'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        
        if (!db.marketItems) db.marketItems = [];
        
        if (subcmd === 'vender') {
            const itemId = args[1];
            const preco = parseInt(args[2]);
            
            if (!itemId || !preco) return message.reply('❌ Use: `bt!marketplace vender <item_id> <preco>`');
            if (isNaN(preco) || preco <= 0) return message.reply('❌ Preço inválido!');
            
            const userId = message.author.id;
            if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            
            const inventario = db.usuarios[userId].inventario || {};
            if (!inventario[itemId] || inventario[itemId] <= 0) {
                return message.reply('❌ Você não possui este item!');
            }
            
            db.marketItems.push({
                id: Date.now(),
                itemId: itemId,
                seller: userId,
                preco: preco,
                createdAt: Date.now()
            });
            
            inventario[itemId]--;
            if (inventario[itemId] <= 0) delete inventario[itemId];
            db.usuarios[userId].inventario = inventario;
            saveDB(db);
            
            await message.reply(`✅ Item **${nomesItens[itemId] || itemId}** colocado à venda por ${preco.toLocaleString()} Orbs!`);
        }
        
        else if (subcmd === 'listar') {
            if (db.marketItems.length === 0) return message.reply('📭 Nenhum item à venda!');
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🛒 Marketplace Interestelar')
                .setDescription(`📦 ${db.marketItems.length} itens disponíveis!`);
            
            for (const item of db.marketItems.slice(0, 10)) {
                const seller = await client.users.fetch(item.seller);
                embed.addFields({
                    name: `🎫 ID: ${item.id}`,
                    value: `🎁 ${nomesItens[item.itemId] || item.itemId}\n💰 ${item.preco.toLocaleString()} Orbs\n👤 ${seller.username}`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'comprar') {
            const marketId = parseInt(args[1]);
            const item = db.marketItems.find(i => i.id === marketId);
            if (!item) return message.reply('❌ Item não encontrado!');
            
            const userId = message.author.id;
            if (!db.usuarios[userId]) db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            
            if ((db.usuarios[userId].carteira || 0) < item.preco) {
                return message.reply(`❌ Você precisa de ${item.preco.toLocaleString()} Orbs!`);
            }
            
            if (userId === item.seller) return message.reply('❌ Você não pode comprar seus próprios itens!');
            
            db.usuarios[userId].carteira -= item.preco;
            db.usuarios[item.seller].carteira += item.preco;
            if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
            db.usuarios[userId].inventario[item.itemId] = (db.usuarios[userId].inventario[item.itemId] || 0) + 1;
            
            const index = db.marketItems.findIndex(i => i.id === marketId);
            db.marketItems.splice(index, 1);
            saveDB(db);
            
            await message.reply(`✅ Compra realizada! Você recebeu **${nomesItens[item.itemId] || item.itemId}**!`);
        }
        
        else if (subcmd === 'meus') {
            const userId = message.author.id;
            const meusItens = db.marketItems.filter(i => i.seller === userId);
            if (meusItens.length === 0) return message.reply('📭 Você não tem nenhum item à venda!');
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`📦 Seus itens à venda`);
            for (const item of meusItens) {
                embed.addFields({
                    name: `ID: ${item.id}`,
                    value: `${nomesItens[item.itemId] || item.itemId} - ${item.preco.toLocaleString()} Orbs`,
                    inline: false
                });
            }
            await message.reply({ embeds: [embed] });
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🛒 Marketplace Interestelar')
                .setDescription('Comandos: `vender`, `listar`, `comprar`, `meus`');
            await message.reply({ embeds: [embed] });
        }
    }
};