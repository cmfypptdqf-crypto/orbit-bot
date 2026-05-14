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

module.exports = {
    name: 'marketplace',
    description: 'Compre e venda itens com outros jogadores',
    aliases: ['market', 'mercado'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        
        // Garantir que marketItems existe no banco
        if (!db.marketItems) db.marketItems = [];
        
        // Comando: vender
        if (subcmd === 'vender') {
            const itemId = args[1];
            const preco = parseInt(args[2]);
            
            if (!itemId || !preco) return message.reply('❌ Use: `bt!marketplace vender <item_id> <preco>`');
            if (isNaN(preco) || preco <= 0) return message.reply('❌ Preço inválido!');
            
            const userId = message.author.id;
            
            if (!db.usuarios[userId]) {
                db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            }
            
            const inventario = db.usuarios[userId].inventario || {};
            
            if (!inventario[itemId] || inventario[itemId] <= 0) {
                return message.reply('❌ Você não possui este item!');
            }
            
            // Adicionar ao mercado
            db.marketItems.push({
                id: Date.now(),
                itemId: itemId,
                seller: userId,
                preco: preco,
                createdAt: Date.now()
            });
            
            // Remover do inventário
            inventario[itemId]--;
            if (inventario[itemId] <= 0) delete inventario[itemId];
            
            db.usuarios[userId].inventario = inventario;
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('📦 Item listado!')
                .setDescription(`✅ Item ID **${itemId}** colocado à venda por **${preco.toLocaleString()} Orbs**!`)
                .setFooter({ text: 'Use bt!marketplace listar para ver todos os itens' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: listar
        else if (subcmd === 'listar') {
            if (db.marketItems.length === 0) {
                return message.reply('📭 Nenhum item à venda no momento! Use `bt!marketplace vender` para anunciar.');
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🛒 Marketplace Interestelar')
                .setDescription(`📦 ${db.marketItems.length} itens disponíveis para compra!`);
            
            for (const item of db.marketItems.slice(0, 10)) {
                try {
                    const seller = await client.users.fetch(item.seller);
                    const nomeItem = getItemNome(item.itemId);
                    
                    embed.addFields({
                        name: `🎫 ID: ${item.id}`,
                        value: `🎁 **${nomeItem}**\n💰 Preço: ${item.preco.toLocaleString()} Orbs\n👤 Vendedor: ${seller.username}\n🆔 Item ID: ${item.itemId}`,
                        inline: false
                    });
                } catch (e) {
                    embed.addFields({
                        name: `🎫 ID: ${item.id}`,
                        value: `🎁 Item: ${item.itemId}\n💰 Preço: ${item.preco.toLocaleString()} Orbs\n👤 Vendedor: Desconhecido`,
                        inline: false
                    });
                }
            }
            
            if (db.marketItems.length > 10) {
                embed.setFooter({ text: `Mostrando 10 de ${db.marketItems.length} itens. Use bt!marketplace comprar <id> para comprar.` });
            } else {
                embed.setFooter({ text: 'Use bt!marketplace comprar <id> para comprar um item' });
            }
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: comprar
        else if (subcmd === 'comprar') {
            const marketId = parseInt(args[1]);
            if (!marketId) return message.reply('❌ Use: `bt!marketplace comprar <id>`');
            
            const itemIndex = db.marketItems.findIndex(i => i.id === marketId);
            
            if (itemIndex === -1) return message.reply('❌ Item não encontrado! Use `bt!marketplace listar` para ver os itens disponíveis.');
            
            const item = db.marketItems[itemIndex];
            const userId = message.author.id;
            
            if (!db.usuarios[userId]) {
                db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            }
            
            if ((db.usuarios[userId].carteira || 0) < item.preco) {
                return message.reply(`❌ Você precisa de ${item.preco.toLocaleString()} Orbs para comprar este item! Você tem ${db.usuarios[userId].carteira.toLocaleString()} Orbs.`);
            }
            
            if (userId === item.seller) {
                return message.reply('❌ Você não pode comprar seus próprios itens!');
            }
            
            // Verificar se o vendedor ainda existe
            if (!db.usuarios[item.seller]) {
                db.usuarios[item.seller] = { carteira: 0, banco: 0, inventario: {} };
            }
            
            // Realizar a compra
            db.usuarios[userId].carteira -= item.preco;
            db.usuarios[item.seller].carteira += item.preco;
            
            // Adicionar item ao inventário do comprador
            if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
            db.usuarios[userId].inventario[item.itemId] = (db.usuarios[userId].inventario[item.itemId] || 0) + 1;
            
            // Remover do mercado
            db.marketItems.splice(itemIndex, 1);
            
            saveDB(db);
            
            const nomeItem = getItemNome(item.itemId);
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Compra realizada!')
                .setDescription(`Você comprou **${nomeItem}** por **${item.preco.toLocaleString()} Orbs**!`)
                .addFields(
                    { name: '💰 Seu saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true },
                    { name: '🎁 Item', value: nomeItem, inline: true }
                );
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: meus (ver meus itens à venda)
        else if (subcmd === 'meus') {
            const userId = message.author.id;
            const meusItens = db.marketItems.filter(item => item.seller === userId);
            
            if (meusItens.length === 0) {
                return message.reply('📭 Você não tem nenhum item à venda! Use `bt!marketplace vender` para anunciar.');
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle(`📦 Seus itens à venda`)
                .setDescription(`Você tem ${meusItens.length} item(ns) no mercado.`);
            
            for (const item of meusItens) {
                const nomeItem = getItemNome(item.itemId);
                embed.addFields({
                    name: `🎫 ID: ${item.id}`,
                    value: `🎁 ${nomeItem}\n💰 Preço: ${item.preco.toLocaleString()} Orbs`,
                    inline: false
                });
            }
            
            embed.setFooter({ text: 'Use bt!marketplace cancelar <id> para remover um item da venda' });
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: cancelar (remover item da venda)
        else if (subcmd === 'cancelar') {
            const marketId = parseInt(args[1]);
            if (!marketId) return message.reply('❌ Use: `bt!marketplace cancelar <id>`');
            
            const itemIndex = db.marketItems.findIndex(i => i.id === marketId);
            
            if (itemIndex === -1) return message.reply('❌ Item não encontrado!');
            
            const item = db.marketItems[itemIndex];
            
            if (item.seller !== message.author.id) {
                return message.reply('❌ Você só pode cancelar seus próprios itens!');
            }
            
            // Devolver item ao inventário
            if (!db.usuarios[item.seller]) {
                db.usuarios[item.seller] = { carteira: 0, banco: 0, inventario: {} };
            }
            
            if (!db.usuarios[item.seller].inventario) db.usuarios[item.seller].inventario = {};
            db.usuarios[item.seller].inventario[item.itemId] = (db.usuarios[item.seller].inventario[item.itemId] || 0) + 1;
            
            // Remover do mercado
            db.marketItems.splice(itemIndex, 1);
            saveDB(db);
            
            const nomeItem = getItemNome(item.itemId);
            await message.reply(`✅ Item **${nomeItem}** removido do mercado e devolvido ao seu inventário!`);
        }
        
        // Comando: ajuda (padrão)
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🛒 Marketplace Interestelar')
                .setDescription('Compre e venda itens com outros jogadores!')
                .addFields(
                    { name: '📦 `bt!marketplace vender <item_id> <preco>`', value: 'Coloca um item à venda', inline: false },
                    { name: '📋 `bt!marketplace listar`', value: 'Lista todos os itens à venda', inline: false },
                    { name: '💰 `bt!marketplace comprar <id>`', value: 'Compra um item pelo ID', inline: false },
                    { name: '👤 `bt!marketplace meus`', value: 'Mostra seus itens à venda', inline: false },
                    { name: '❌ `bt!marketplace cancelar <id>`', value: 'Cancela a venda de um item', inline: false }
                )
                .setFooter({ text: 'Os itens ficam no mercado até serem comprados ou cancelados' });
            
            await message.reply({ embeds: [embed] });
        }
    }
};

// Função auxiliar para pegar nome do item pelo ID
function getItemNome(itemId) {
    const itens = {
        '1': '🔭 Telescópio Avançado',
        '2': '🚀 Nave Explorer',
        '3': '💍 Anel Cósmico',
        '4': '🛡️ Escudo Energético',
        '5': '👻 Capa da Invisibilidade',
        '6': '🚨 Alarme Anti-Roubo',
        '7': '⭐ VIP Bronze',
        '8': '⭐ VIP Prata',
        '9': '⭐ VIP Ouro',
        '10': '⭐ VIP Diamante',
        '11': '🍀 Amuleto da Sorte',
        '12': '📈 Ação da Bolsa',
        '13': '🎰 Caça-Níquel',
        '14': '🚀 Nave Hiperespacial',
        '15': '💎 Cristal Cósmico'
    };
    return itens[itemId] || `Item ${itemId}`;
}