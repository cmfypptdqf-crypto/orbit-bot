const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.json');
const cooldowns = new Map();

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {}, vip_list: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
    name: 'search',
    aliases: ['procurar', 'buscar', 'explorar', 'sondar'],
    
    async executePrefix(message, args, client) {
        const userId = message.author.id;
        const cooldownKey = `search_${userId}`;
        const lastSearch = cooldowns.get(cooldownKey);
        
        if (lastSearch && Date.now() - lastSearch < 600000) {
            const remaining = Math.ceil((600000 - (Date.now() - lastSearch)) / 60000);
            return message.reply(`⏰ Seu scanner ainda está recarregando! Volte em **${remaining} minutos**.`);
        }
        
        const db = getDB();
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {}, total_exploracoes: 0 };
        }
        
        // Multiplicador VIP
        let multiplicador = 1.0;
        let vipTier = null;
        
        if (db.vip_list[userId] && db.vip_list[userId].expira > Date.now()) {
            multiplicador = db.vip_list[userId].multiplicador;
            vipTier = db.vip_list[userId].tier;
        }
        
        // Itens de boost
        const inventario = db.usuarios[userId].inventario || {};
        let boostItem = null;
        
        if (inventario['3'] > 0) { // Anel Cósmico
            multiplicador *= 1.15;
            boostItem = '💍 Anel Cósmico';
        }
        if (inventario['1'] > 0) { // Telescópio
            multiplicador *= 1.05;
            boostItem = boostItem ? `${boostItem} + 🔭 Telescópio` : '🔭 Telescópio';
        }
        
        // Local sorteado
        const locais = [
            { nome: '🗑️ Lixo Espacial', ganho: [100, 400], cor: 0x808080 },
            { nome: '🚀 Nave Abandonada', ganho: [500, 1800], cor: 0x9B59B6 },
            { nome: '🕳️ Crateras de Marte', ganho: [200, 600], cor: 0xE67E22 },
            { nome: '💥 Estação Destruída', ganho: [300, 1200], cor: 0xFF0000 },
            { nome: '🪐 Anéis de Saturno', ganho: [400, 1500], cor: 0xF1C40F },
            { nome: '🌑 Base Lunar', ganho: [250, 800], cor: 0x3498DB },
            { nome: '☄️ Asteroide Rico', ganho: [600, 2000], cor: 0x00FF00 },
            { nome: '🛸 Disco Voador', ganho: [800, 2500], cor: 0x8E44AD },
            { nome: '🏛️ Ruínas Alienígenas', ganho: [1000, 3000], cor: 0xFFD700 }
        ];
        
        const local = locais[Math.floor(Math.random() * locais.length)];
        const ganhoBase = Math.floor(Math.random() * (local.ganho[1] - local.ganho[0] + 1) + local.ganho[0]);
        const ganhoFinal = Math.floor(ganhoBase * multiplicador);
        
        db.usuarios[userId].carteira = (db.usuarios[userId].carteira || 0) + ganhoFinal;
        db.usuarios[userId].total_exploracoes = (db.usuarios[userId].total_exploracoes || 0) + 1;
        saveDB(db);
        
        cooldowns.set(cooldownKey, Date.now());
        
        const embed = new EmbedBuilder()
            .setColor(local.cor)
            .setTitle('🔍 Exploração Espacial')
            .setDescription(`📡 Sondando: **${local.nome}**`)
            .addFields(
                { name: '💰 Ganho Base', value: `${ganhoBase.toLocaleString()} Orbs`, inline: true },
                { name: '✨ Multiplicadores', value: `${multiplicador.toFixed(2)}x`, inline: true },
                { name: '🎉 Total Encontrado', value: `**+${ganhoFinal.toLocaleString()} Orbs**`, inline: false },
                { name: '💵 Seu Núcleo', value: `${db.usuarios[userId].carteira.toLocaleString()} Orbs`, inline: true }
            );
        
        if (vipTier) {
            embed.addFields({ name: '⭐ VIP Ativo', value: `${vipTier.toUpperCase()} (${multiplicador}x)`, inline: true });
        }
        if (boostItem) {
            embed.addFields({ name: '🎁 Item Ativo', value: boostItem, inline: true });
        }
        
        embed.setFooter({ text: 'Próxima exploração em 10 minutos' });
        
        await message.reply({ embeds: [embed] });
    }
};