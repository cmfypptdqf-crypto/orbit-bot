// commands/economia/trade.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, trades: {} }));
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
    name: 'trade',
    aliases: ['trocar'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        if (!db.trades) db.trades = {};
        
        if (subcmd === 'oferecer') {
            const user = message.mentions.users.first();
            const itemId = args[2];
            const quantidade = parseInt(args[3]) || 1;
            
            if (!user) return message.reply('❌ Use: `bt!trade oferecer @usuario <item_id> [qtd]`');
            if (user.id === message.author.id) return message.reply('❌ Não pode trocar consigo mesmo!');
            if (!itemId) return message.reply('❌ Especifique o item!');
            
            const userId = message.author.id;
            const inventario = db.usuarios[userId]?.inventario || {};
            if ((inventario[itemId] || 0) < quantidade) {
                return message.reply(`❌ Você não tem ${quantidade}x do item ${itemId}!`);
            }
            
            const tradeId = `${userId}_${user.id}`;
            if (!db.trades[tradeId]) {
                db.trades[tradeId] = { user1: userId, user2: user.id, items1: [], items2: [], status: 'pending' };
            }
            db.trades[tradeId].items1.push({ id: itemId, qtd: quantidade });
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🔄 Proposta de Troca')
                .setDescription(`${message.author} propôs troca com ${user}`)
                .addFields({ name: '📦 Oferecido', value: `${nomesItens[itemId] || itemId} x${quantidade}`, inline: true })
                .setFooter({ text: `${user.username}, use bt!trade aceitar ${tradeId}` });
            
            await message.reply({ embeds: [embed] });
        }
        
        else if (subcmd === 'aceitar') {
            const tradeId = args[1];
            const trade = db.trades[tradeId];
            if (!trade) return message.reply('❌ Troca não encontrada!');
            if (trade.user2 !== message.author.id) return message.reply('❌ Esta troca não é para você!');
            
            const userId = message.author.id;
            const otherId = trade.user1;
            
            for (const item of trade.items1) {
                if ((db.usuarios[otherId]?.inventario?.[item.id] || 0) < item.qtd) {
                    return message.reply(`❌ O outro usuário não tem mais ${item.qtd}x do item!`);
                }
            }
            for (const item of trade.items2) {
                if ((db.usuarios[userId]?.inventario?.[item.id] || 0) < item.qtd) {
                    return message.reply(`❌ Você não tem mais ${item.qtd}x do item!`);
                }
            }
            
            for (const item of trade.items1) {
                db.usuarios[otherId].inventario[item.id] -= item.qtd;
                if (db.usuarios[otherId].inventario[item.id] <= 0) delete db.usuarios[otherId].inventario[item.id];
                if (!db.usuarios[userId].inventario[item.id]) db.usuarios[userId].inventario[item.id] = 0;
                db.usuarios[userId].inventario[item.id] += item.qtd;
            }
            for (const item of trade.items2) {
                db.usuarios[userId].inventario[item.id] -= item.qtd;
                if (db.usuarios[userId].inventario[item.id] <= 0) delete db.usuarios[userId].inventario[item.id];
                if (!db.usuarios[otherId].inventario[item.id]) db.usuarios[otherId].inventario[item.id] = 0;
                db.usuarios[otherId].inventario[item.id] += item.qtd;
            }
            
            trade.status = 'completed';
            saveDB(db);
            
            await message.reply(`✅ Troca concluída com sucesso!`);
        }
        
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🔄 Sistema de Troca')
                .setDescription('Comandos: `oferecer @user <item_id> [qtd]`, `aceitar <id>`');
            await message.reply({ embeds: [embed] });
        }
    }
};