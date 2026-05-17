// commands/economia/comprarOrbital.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getRandomFrase } = require('../utilidades/orbitAI.js');
const { adicionarXP } = require('../utilidades/xpSystem.js');

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
    '1': { nome: '🔭 Telescópio Orbital', preco: 500, tipo: 'search' },
    '2': { nome: '🚀 Nave Explorer', preco: 800, tipo: 'missao' },
    '3': { nome: '💍 Anel Cósmico', preco: 2000, tipo: 'all' },
    '4': { nome: '🛡️ Escudo Orbital', preco: 1500, tipo: 'protecao' },
    '5': { nome: '👻 Capa Estelar', preco: 3000, tipo: 'pirataria' },
    '6': { nome: '🚨 Alarme Orbital', preco: 1000, tipo: 'alarme' },
    '7': { nome: '⭐ Orbit Prime Bronze', preco: 10000, tipo: 'vip', tier: 'bronze', mult: 1.2, dias: 7 },
    '8': { nome: '⭐ Orbit Prime Prata', preco: 25000, tipo: 'vip', tier: 'prata', mult: 1.5, dias: 15 },
    '9': { nome: '⭐ Orbit Prime Ouro', preco: 50000, tipo: 'vip', tier: 'ouro', mult: 2.0, dias: 30 },
    '10': { nome: '⭐ Orbit Prime Diamante', preco: 100000, tipo: 'vip', tier: 'diamante', mult: 3.0, dias: 60 },
    '11': { nome: '🍀 Amuleto Orbital', preco: 5000, tipo: 'sorte' },
    '12': { nome: '📈 Ação Orbital', preco: 3000, tipo: 'boost' },
    '13': { nome: '🎰 Nebula Crate', preco: 2000, tipo: 'slot' },
    '14': { nome: '🚀 Nave Hiperespacial', preco: 50000, tipo: 'colecionavel' },
    '15': { nome: '💎 Cristal Orbital', preco: 100000, tipo: 'colecionavel' }
};

module.exports = {
    name: 'comprar',
    aliases: ['buy', 'adquirir', 'comprarorbital'],
    
    async executePrefix(message, args, client) {
        const itemId = args[0];
        const quantidade = parseInt(args[1]) || 1;
        
        if (!itemId || !itensLoja[itemId]) {
            return message.reply('❌ ID orbital inválido! Use `bt!galaxystore` para ver os itens disponíveis.');
        }
        
        if (quantidade < 1) return message.reply('❌ Quantidade orbital inválida!');
        
        const item = itensLoja[itemId];
        const precoTotal = item.preco * quantidade;
        
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        
        if (carteira < precoTotal) {
            return message.reply(`❌ Você precisa de **${precoTotal.toLocaleString()} Orbs** para adquirir este item orbital!`);
        }
        
        db.usuarios[userId].carteira = carteira - precoTotal;
        
        // Adicionar XP pela compra
        const xpGanho = Math.max(1, Math.floor(precoTotal / 100));
        const resultadoXP = adicionarXP(userId, xpGanho, 'comprar');
        
        if (item.tipo === 'vip') {
            const agora = Date.now();
            const expira = agora + (item.dias * 86400000);
            
            if (!db.vip_list) db.vip_list = {};
            db.vip_list[userId] = { tier: item.tier, expira: expira, multiplicador: item.mult };
            
            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('⭐ Orbit Prime Ativado!')
                .setDescription(`Parabéns! Agora você é **Orbit Prime ${item.tier.toUpperCase()}** por ${item.dias} dias orbitais!`)
                .addFields(
                    { name: '✨ Multiplicador Orbital', value: `${item.mult}x`, inline: true },
                    { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                    { name: '💰 Saldo Orbital', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
                )
                .setFooter({ text: '⭐ Orbit Prime • Benefícios exclusivos para exploradores' });
            
            if (resultadoXP.levelUp) {
                embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
            }
            
            saveDB(db);
            return await message.reply({ embeds: [embed] });
        }
        
        if (!db.usuarios[userId].inventario) db.usuarios[userId].inventario = {};
        db.usuarios[userId].inventario[itemId] = (db.usuarios[userId].inventario[itemId] || 0) + quantidade;
        saveDB(db);
        
        const embed = new EmbedBuilder()
            .setColor(0x00BFFF)
            .setTitle(`✅ ${getRandomFrase('sucesso')}`)
            .setDescription(`📡 Você adquiriu **${quantidade}x ${item.nome}** na **Galaxy Store**!`)
            .addFields(
                { name: '💰 Preço Orbital', value: `${precoTotal.toLocaleString()} Orbs`, inline: true },
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP`, inline: true },
                { name: '💵 Saldo Orbital', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            )
            .setFooter({ text: '🛒 Galaxy Store • Obrigado pela compra orbital!' });
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        await message.reply({ embeds: [embed] });
    }
};