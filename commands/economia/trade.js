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

module.exports = {
    name: 'trade',
    description: 'Troque itens com outros jogadores',
    aliases: ['trocar'],
    
    async executePrefix(message, args, client) {
        const subcmd = args[0]?.toLowerCase();
        const db = getDB();
        
        // Garantir que trades existe no banco
        if (!db.trades) db.trades = {};
        
        // Comando: oferecer
        if (subcmd === 'oferecer' || (!subcmd && args[1])) {
            // Se não usou subcomando, tenta detectar
            let user, itemId, quantidade;
            
            if (subcmd === 'oferecer') {
                user = message.mentions.users.first();
                itemId = args[2];
                quantidade = parseInt(args[3]) || 1;
            } else {
                user = message.mentions.users.first();
                itemId = args[1];
                quantidade = parseInt(args[2]) || 1;
            }
            
            if (!user) return message.reply('❌ Use: `bt!trade oferecer @usuario <item_id> [quantidade]`');
            if (user.id === message.author.id) return message.reply('❌ Você não pode trocar consigo mesmo!');
            if (user.bot) return message.reply('❌ Não pode trocar com bots!');
            
            if (!itemId) return message.reply('❌ Use: `bt!trade oferecer @usuario <item_id> [quantidade]`');
            
            const userId = message.author.id;
            const targetId = user.id;
            
            // Verificar se o usuário tem o item
            if (!db.usuarios[userId]) {
                db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            }
            
            const inventario = db.usuarios[userId].inventario || {};
            
            if ((inventario[itemId] || 0) < quantidade) {
                return message.reply(`❌ Você não tem ${quantidade}x do item ID ${itemId}!`);
            }
            
            const tradeId = `${userId}_${targetId}`;
            
            // Criar ou atualizar proposta de troca
            if (!db.trades[tradeId]) {
                db.trades[tradeId] = {
                    id: tradeId,
                    user1: userId,
                    user2: targetId,
                    items1: [],
                    items2: [],
                    status: 'pending',
                    createdAt: Date.now()
                };
            }
            
            db.trades[tradeId].items1.push({ id: itemId, qtd: quantidade });
            saveDB(db);
            
            const nomeItem = getItemNome(itemId);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🔄 Proposta de Troca')
                .setDescription(`${message.author} propôs uma troca com ${user}`)
                .addFields(
                    { name: '📦 Itens oferecidos', value: `${nomeItem} x${quantidade}`, inline: true },
                    { name: '📌 Status', value: 'Aguardando resposta...', inline: true }
                )
                .setFooter({ text: `${user.username}, use bt!trade aceitar ${tradeId} para aceitar ou bt!trade recusar ${tradeId} para recusar` });
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: aceitar
        else if (subcmd === 'aceitar') {
            const tradeId = args[1];
            if (!tradeId) return message.reply('❌ Use: `bt!trade aceitar <id_da_troca>`');
            
            const trade = db.trades[tradeId];
            if (!trade) return message.reply('❌ Troca não encontrada!');
            
            if (trade.user2 !== message.author.id) {
                return message.reply('❌ Esta troca não é para você!');
            }
            
            if (trade.status !== 'pending') {
                return message.reply('❌ Esta troca já foi finalizada!');
            }
            
            const userId = message.author.id;
            const otherId = trade.user1;
            
            // Verificar inventários
            if (!db.usuarios[userId]) {
                db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
            }
            if (!db.usuarios[otherId]) {
                db.usuarios[otherId] = { carteira: 0, banco: 0, inventario: {} };
            }
            
            // Verificar se o outro usuário ainda tem os itens
            const inventarioOutro = db.usuarios[otherId].inventario || {};
            for (const item of trade.items1) {
                if ((inventarioOutro[item.id] || 0) < item.qtd) {
                    return message.reply(`❌ O usuário não tem mais ${item.qtd}x do item ${item.id} para trocar! Troca cancelada.`);
                }
            }
            
            // Verificar se o usuário atual ofereceu algo
            if (trade.items2.length === 0) {
                return message.reply('❌ Você precisa oferecer algo em troca! Use `bt!trade adicionar <id_da_troca> <item_id> <quantidade>`');
            }
            
            // Verificar se o usuário tem os itens que ofereceu
            const inventarioAtual = db.usuarios[userId].inventario || {};
            for (const item of trade.items2) {
                if ((inventarioAtual[item.id] || 0) < item.qtd) {
                    return message.reply(`❌ Você não tem mais ${item.qtd}x do item ${item.id} para trocar!`);
                }
            }
            
            // Realizar a troca
            // Remover itens do usuário 1
            for (const item of trade.items1) {
                db.usuarios[otherId].inventario[item.id] -= item.qtd;
                if (db.usuarios[otherId].inventario[item.id] <= 0) {
                    delete db.usuarios[otherId].inventario[item.id];
                }
            }
            
            // Remover itens do usuário 2
            for (const item of trade.items2) {
                db.usuarios[userId].inventario[item.id] -= item.qtd;
                if (db.usuarios[userId].inventario[item.id] <= 0) {
                    delete db.usuarios[userId].inventario[item.id];
                }
            }
            
            // Adicionar itens ao usuário 1
            for (const item of trade.items2) {
                if (!db.usuarios[otherId].inventario[item.id]) db.usuarios[otherId].inventario[item.id] = 0;
                db.usuarios[otherId].inventario[item.id] += item.qtd;
            }
            
            // Adicionar itens ao usuário 2
            for (const item of trade.items1) {
                if (!db.usuarios[userId].inventario[item.id]) db.usuarios[userId].inventario[item.id] = 0;
                db.usuarios[userId].inventario[item.id] += item.qtd;
            }
            
            trade.status = 'completed';
            saveDB(db);
            
            const user1 = await client.users.fetch(trade.user1);
            const user2 = await client.users.fetch(trade.user2);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Troca concluída!')
                .setDescription(`A troca entre ${user1.username} e ${user2.username} foi realizada com sucesso!`)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: recusar
        else if (subcmd === 'recusar') {
            const tradeId = args[1];
            if (!tradeId) return message.reply('❌ Use: `bt!trade recusar <id_da_troca>`');
            
            const trade = db.trades[tradeId];
            if (!trade) return message.reply('❌ Troca não encontrada!');
            
            if (trade.user2 !== message.author.id) {
                return message.reply('❌ Esta troca não é para você!');
            }
            
            trade.status = 'cancelled';
            saveDB(db);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ Troca recusada')
                .setDescription(`A proposta de troca foi recusada.`);
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: adicionar (adicionar itens à troca)
        else if (subcmd === 'adicionar') {
            const tradeId = args[1];
            const itemId = args[2];
            const quantidade = parseInt(args[3]) || 1;
            
            if (!tradeId || !itemId) return message.reply('❌ Use: `bt!trade adicionar <id_da_troca> <item_id> [quantidade]`');
            
            const trade = db.trades[tradeId];
            if (!trade) return message.reply('❌ Troca não encontrada!');
            
            if (trade.user2 !== message.author.id) {
                return message.reply('❌ Apenas a pessoa que recebeu o convite pode adicionar itens!');
            }
            
            if (trade.status !== 'pending') {
                return message.reply('❌ Esta troca já foi finalizada!');
            }
            
            const userId = message.author.id;
            const inventario = db.usuarios[userId].inventario || {};
            
            if ((inventario[itemId] || 0) < quantidade) {
                return message.reply(`❌ Você não tem ${quantidade}x do item ID ${itemId}!`);
            }
            
            trade.items2.push({ id: itemId, qtd: quantidade });
            saveDB(db);
            
            const nomeItem = getItemNome(itemId);
            
            await message.reply(`✅ Você adicionou ${quantidade}x **${nomeItem}** à troca!`);
        }
        
        // Comando: ver (ver detalhes da troca)
        else if (subcmd === 'ver') {
            const tradeId = args[1];
            if (!tradeId) return message.reply('❌ Use: `bt!trade ver <id_da_troca>`');
            
            const trade = db.trades[tradeId];
            if (!trade) return message.reply('❌ Troca não encontrada!');
            
            const user1 = await client.users.fetch(trade.user1);
            const user2 = await client.users.fetch(trade.user2);
            
            const items1 = trade.items1.map(i => `${getItemNome(i.id)} x${i.qtd}`).join(', ') || 'Nenhum item';
            const items2 = trade.items2.map(i => `${getItemNome(i.id)} x${i.qtd}`).join(', ') || 'Nenhum item';
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🔄 Detalhes da Troca')
                .addFields(
                    { name: `📦 ${user1.username} oferece:`, value: items1, inline: false },
                    { name: `📦 ${user2.username} oferece:`, value: items2, inline: false },
                    { name: '📌 Status', value: trade.status === 'pending' ? '⏳ Pendente' : trade.status === 'completed' ? '✅ Concluída' : '❌ Cancelada', inline: true }
                )
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        }
        
        // Comando: cancelar (cancelar própria proposta)
        else if (subcmd === 'cancelar') {
            const tradeId = args[1];
            if (!tradeId) return message.reply('❌ Use: `bt!trade cancelar <id_da_troca>`');
            
            const trade = db.trades[tradeId];
            if (!trade) return message.reply('❌ Troca não encontrada!');
            
            if (trade.user1 !== message.author.id) {
                return message.reply('❌ Você só pode cancelar suas próprias propostas de troca!');
            }
            
            if (trade.status !== 'pending') {
                return message.reply('❌ Esta troca já foi finalizada!');
            }
            
            trade.status = 'cancelled';
            saveDB(db);
            
            await message.reply(`✅ Proposta de troca cancelada!`);
        }
        
        // Comando: ajuda (padrão)
        else {
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🔄 Sistema de Troca de Itens')
                .setDescription('Troque itens com outros jogadores!')
                .addFields(
                    { name: '📤 `bt!trade oferecer @user <item_id> [qtd]`', value: 'Oferece um item para troca', inline: false },
                    { name: '✅ `bt!trade aceitar <id>`', value: 'Aceita uma proposta de troca', inline: false },
                    { name: '❌ `bt!trade recusar <id>`', value: 'Recusa uma proposta de troca', inline: false },
                    { name: '➕ `bt!trade adicionar <id> <item_id> [qtd]`', value: 'Adiciona itens à troca', inline: false },
                    { name: '👁️ `bt!trade ver <id>`', value: 'Ver detalhes da troca', inline: false },
                    { name: '🚫 `bt!trade cancelar <id>`', value: 'Cancela sua proposta de troca', inline: false }
                )
                .setFooter({ text: 'As trocas expiram após 24 horas' });
            
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