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

const nomesItens = { '1': '🔭 Telescópio', '2': '🚀 Nave', '3': '💍 Anel', '4': '🛡️ Escudo', '5': '👻 Capa', '13': '📦 Nebula Crate' };

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
            const qtd = parseInt(args[3]) || 1;
            if (!user || !itemId) return message.reply('<:emoji_47:1504081397373997076> Use: `bt!trade oferecer @user <id> [qtd]`');
            
            const userId = message.author.id;
            if ((db.usuarios[userId]?.inventario?.[itemId] || 0) < qtd) return message.reply('<:emoji_47:1504081397373997076> Você não tem este item!');
            
            const tradeId = `${userId}_${user.id}`;
            if (!db.trades[tradeId]) db.trades[tradeId] = { user1: userId, user2: user.id, items1: [], items2: [] };
            db.trades[tradeId].items1.push({ id: itemId, qtd });
            saveDB(db);
            
            await message.reply(`🔄 Proposta de troca criada! Use \`bt!trade aceitar ${tradeId}\` para aceitar.`);
        }
        
        else if (subcmd === 'aceitar') {
            const tradeId = args[1];
            const trade = db.trades[tradeId];
            if (!trade) return message.reply('<:emoji_47:1504081397373997076> Troca não encontrada!');
            if (trade.user2 !== message.author.id) return message.reply('<:emoji_47:1504081397373997076> Esta troca não é para você!');
            
            const userId = message.author.id;
            const otherId = trade.user1;
            
            for (const item of trade.items1) {
                if ((db.usuarios[otherId]?.inventario?.[item.id] || 0) < item.qtd) return message.reply('<:emoji_47:1504081397373997076> Ofertas expiraram!');
            }
            for (const item of trade.items2) {
                if ((db.usuarios[userId]?.inventario?.[item.id] || 0) < item.qtd) return message.reply('<:emoji_47:1504081397373997076> Você não tem os itens oferecidos!');
            }
            
            for (const item of trade.items1) {
                db.usuarios[otherId].inventario[item.id] -= item.qtd;
                if (!db.usuarios[userId].inventario[item.id]) db.usuarios[userId].inventario[item.id] = 0;
                db.usuarios[userId].inventario[item.id] += item.qtd;
            }
            for (const item of trade.items2) {
                db.usuarios[userId].inventario[item.id] -= item.qtd;
                if (!db.usuarios[otherId].inventario[item.id]) db.usuarios[otherId].inventario[item.id] = 0;
                db.usuarios[otherId].inventario[item.id] += item.qtd;
            }
            
            delete db.trades[tradeId];
            saveDB(db);
            await message.reply(`<:emoji_46:1504081377291927632> Troca concluída com sucesso!`);
        }
        
        else {
            await message.reply('🔄 **Sistema de Troca**\n`bt!trade oferecer @user <id> [qtd]`\n`bt!trade aceitar <id>`');
        }
    }
};