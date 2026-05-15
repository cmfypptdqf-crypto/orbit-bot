// commands/economia/comprar.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const itensLoja = {
    '1': { nome: '🔭 Telescópio Avançado', preco: 500, tipo: 'search' },
    '2': { nome: '🚀 Nave Explorer', preco: 800, tipo: 'missao' },
    '3': { nome: '💍 Anel Cósmico', preco: 2000, tipo: 'all' },
    '4': { nome: '🛡️ Escudo Energético', preco: 1500, tipo: 'protecao' },
    '5': { nome: '👻 Capa da Invisibilidade', preco: 3000, tipo: 'pirataria' },
    '6': { nome: '🚨 Alarme Anti-Roubo', preco: 1000, tipo: 'alarme' },
    '7': { nome: '⭐ Orbit Prime Bronze', preco: 10000, tipo: 'vip', tier: 'bronze', mult: 1.2, dias: 7 },
    '8': { nome: '⭐ Orbit Prime Prata', preco: 25000, tipo: 'vip', tier: 'prata', mult: 1.5, dias: 15 },
    '9': { nome: '⭐ Orbit Prime Ouro', preco: 50000, tipo: 'vip', tier: 'ouro', mult: 2.0, dias: 30 },
    '10': { nome: '⭐ Orbit Prime Diamante', preco: 100000, tipo: 'vip', tier: 'diamante', mult: 3.0, dias: 60 },
    '11': { nome: '🍀 Amuleto da Sorte', preco: 5000, tipo: 'sorte' },
    '12': { nome: '📈 Ação da Bolsa', preco: 3000, tipo: 'boost' },
    '13': { nome: '📦 Nebula Crate', preco: 2000, tipo: 'slot' },
    '14': { nome: '🚀 Nave Hiperespacial', preco: 50000, tipo: 'colecionavel' },
    '15': { nome: '💎 Cristal Cósmico', preco: 100000, tipo: 'colecionavel' }
};

module.exports = {
    name: 'comprar',
    aliases: ['buy'],
    
    async executePrefix(message, args, client) {
        const itemId = args[0];
        const quantidade = parseInt(args[1]) || 1;
        
        if (!itemId || !itensLoja[itemId]) {
            return message.reply('<:emoji_47:1504081397373997076> ID inválido! Use `bt!galaxystore` para ver os itens.');
        }
        
        if (quantidade < 1) return message.reply('<:emoji_47:1504081397373997076> Quantidade inválida!');
        
        const item = itensLoja[itemId];
        const precoTotal = item.preco * quantidade;
        
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        
        if (carteira < precoTotal) {
            return message.reply(`<:emoji_47:1504081397373997076> Você precisa de **${precoTotal.toLocaleString()} Orbs**!`);
        }
        
        db.usuarios[userId].carteira = carteira - precoTotal;
        
        if (item.tipo === 'vip') {
            const agora = Date.now();
            const expira = agora + (item.dias * 86400000);
            
            if (!db.vip_list) db.vip_list = {};
            db.vip_list[userId] = { tier: item.tier, expira: expira, multiplicador: item.mult };
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Orbit Prime Ativado!')
                .setDescription(`Parabéns! Agora você é **Orbit Prime ${item.tier.toUpperCase()}** por ${item.dias} dias!`)
                .addFields(
                    { name: '✨ Multiplicador', value: `${item.mult}x em todos ganhos`, inline: true },
                    { name: '💰 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '⭐ Orbit Prime • Benefícios exclusivos para exploradores' });
            saveDB(db);
            return await message.reply({ embeds: [embed] });
        }
        
        if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
        db.usuarios[userId].inventario[itemId] = (db.usuarios[userId].inventario[itemId] || 0) + quantidade;
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00008B)
            .setTitle('<:emoji_46:1504081377291927632> Compra realizada!')
            .setDescription(`Você adquiriu **${quantidade}x ${item.nome}** na **Galaxy Store**!`)
            .addFields(
                { name: '💰 Preço', value: `${precoTotal.toLocaleString()} Orbs`, inline: true },
                { name: '💵 Saldo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '🛒 Galaxy Store • Obrigado pela compra!' });
        
        await message.reply({ embeds: [embed] });
    }
};