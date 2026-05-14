const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const itensLoja = {
    '1': { nome: '🔭 Telescópio Avançado', preco: 500, tipo: 'search', bonus: 1.05 },
    '2': { nome: '🚀 Nave Explorer', preco: 800, tipo: 'missao', bonus: 1.10 },
    '3': { nome: '💍 Anel Cósmico', preco: 2000, tipo: 'all', bonus: 1.15 },
    '4': { nome: '🛡️ Escudo Energético', preco: 1500, tipo: 'protecao', duracao: 1 },
    '5': { nome: '👻 Capa da Invisibilidade', preco: 3000, tipo: 'pirataria', bonus: 1.20 },
    '6': { nome: '🚨 Alarme Anti-Roubo', preco: 1000, tipo: 'alarme', bonus: 0.7 },
    '7': { nome: '⭐ VIP Bronze', preco: 10000, tipo: 'vip', tier: 'bronze', mult: 1.2, dias: 7 },
    '8': { nome: '⭐ VIP Prata', preco: 25000, tipo: 'vip', tier: 'prata', mult: 1.5, dias: 15 },
    '9': { nome: '⭐ VIP Ouro', preco: 50000, tipo: 'vip', tier: 'ouro', mult: 2.0, dias: 30 },
    '10': { nome: '⭐ VIP Diamante', preco: 100000, tipo: 'vip', tier: 'diamante', mult: 3.0, dias: 60 }
};

module.exports = {
    name: 'comprar',
    aliases: ['buy'],
    
    async executePrefix(message, args, client) {
        const itemId = args[0];
        if (!itemId || !itensLoja[itemId]) {
            return message.reply('❌ ID inválido! Use `!mercadogalactico` para ver os itens.');
        }
        
        const item = itensLoja[itemId];
        const quantidade = parseInt(args[1]) || 1;
        
        if (quantidade < 1) return message.reply('❌ Quantidade inválida!');
        
        const precoTotal = item.preco * quantidade;
        
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        
        if (carteira < precoTotal) {
            return message.reply(`❌ Você precisa de **${precoTotal.toLocaleString()} Orbs** para comprar ${quantidade}x ${item.nome}!`);
        }
        
        db.usuarios[userId].carteira = carteira - precoTotal;
        
        // Processar item
        if (item.tipo === 'vip') {
            // Ativar VIP
            const agora = Date.now();
            const expira = agora + (item.dias * 86400000);
            
            if (!db.vip_list[userId]) {
                db.vip_list[userId] = {};
            }
            
            db.vip_list[userId] = {
                tier: item.tier,
                expira: expira,
                multiplicador: item.mult
            };
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ VIP Ativado!')
                .setDescription(`Parabéns! Agora você é **VIP ${item.tier.toUpperCase()}** por ${item.dias} dias!`)
                .addFields(
                    { name: '✨ Multiplicador', value: `${item.mult}x em todos ganhos`, inline: true },
                    { name: '⏰ Expira em', value: `<t:${Math.floor(expira / 1000)}:R>`, inline: true }
                );
            
            await message.reply({ embeds: [embed] });
        } else {
            // Adicionar ao inventário
            if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
            db.usuarios[userId].inventario[itemId] = (db.usuarios[userId].inventario[itemId] || 0) + quantidade;
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Compra realizada!')
                .setDescription(`Você comprou **${quantidade}x ${item.nome}** por **${precoTotal.toLocaleString()} Orbs**!`);
            
            await message.reply({ embeds: [embed] });
        }
        
        saveDB(db);
    }
};