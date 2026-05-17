// commands/economia/galaxyStore.js
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { adicionarXP } = require('../utilidades/xpSystem.js');

const dbPath = path.join(__dirname, '..', '..', 'database.json');

function getDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ usuarios: {} }));
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

const itensLoja = {
    '1': { nome: '🔭 Telescópio Orbital', preco: 500, descricao: '+5% em explorações', raridade: 'Comum' },
    '2': { nome: '🚀 Nave Explorer', preco: 800, descricao: '+10% em missões', raridade: 'Comum' },
    '3': { nome: '💍 Anel Cósmico', preco: 2000, descricao: '+15% em todas atividades', raridade: 'Raro' },
    '4': { nome: '🛡️ Escudo Orbital', preco: 1500, descricao: 'Protege contra 1 roubo', raridade: 'Raro' },
    '5': { nome: '👻 Capa Estelar', preco: 3000, descricao: '+20% chance em ataques', raridade: 'Épico' },
    '6': { nome: '🚨 Alarme Orbital', preco: 1000, descricao: '-30% chance de ser roubado', raridade: 'Raro' },
    '7': { nome: '⭐ Orbit Prime Bronze', preco: 10000, descricao: 'Multiplicador x1.2 por 7 dias', raridade: 'Especial' },
    '8': { nome: '⭐ Orbit Prime Prata', preco: 25000, descricao: 'Multiplicador x1.5 por 15 dias', raridade: 'Especial' },
    '9': { nome: '⭐ Orbit Prime Ouro', preco: 50000, descricao: 'Multiplicador x2.0 por 30 dias', raridade: 'Especial' },
    '10': { nome: '⭐ Orbit Prime Diamante', preco: 100000, descricao: 'Multiplicador x3.0 por 60 dias', raridade: 'Especial' }
};

function getRaridadeIcon(raridade) {
    switch(raridade) {
        case 'Comum': return '⚪'; case 'Raro': return '🔵';
        case 'Épico': return '🟣'; case 'Lendário': return '🟠';
        case 'Especial': return '⭐'; default: return '⬜';
    }
}

module.exports = {
    name: 'galaxystore',
    aliases: ['loja', 'shop', 'mercado', 'galactic', 'store'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        const banco = db.usuarios[userId].banco || 0;
        
        // Adicionar XP por visitar a loja
        const xpGanho = 3;
        const resultadoXP = adicionarXP(userId, xpGanho, 'galaxystore');
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🛒 Galaxy Store')
            .setDescription(`🌌 Bem-vindo à **Galaxy Store**, comandante orbital!\n💰 Saldo: **${carteira.toLocaleString()} Orbs** (🏦 Orbital Bank: ${banco.toLocaleString()})`)
            .setThumbnail(message.guild.iconURL())
            .addFields(
                { name: '⭐ Stellar XP', value: `+${xpGanho} XP (visita à Galaxy Store)`, inline: true }
            );
        
        for (const [id, item] of Object.entries(itensLoja)) {
            const raridadeIcon = getRaridadeIcon(item.raridade);
            embed.addFields({
                name: `${raridadeIcon} ${id} - ${item.nome}`,
                value: `💰 **${item.preco.toLocaleString()} Orbs**\n📝 ${item.descricao}\n🏷️ ${item.raridade}`,
                inline: false
            });
        }
        
        if (resultadoXP.levelUp) {
            embed.addFields({ name: '🎉 LEVEL UP ORBITAL!', value: `Parabéns! Você avançou para o nível ${resultadoXP.nivelNovo}!`, inline: false });
        }
        
        embed.addFields({
            name: '💡 COMANDOS ORBITAIS',
            value: '`bt!comprar <id>` - Adquirir item orbital\n`bt!mochila` - Ver seus itens estelares',
            inline: false
        })
        .setFooter({ text: '🛒 Galaxy Store • O melhor shopping da galáxia' });
        
        await message.reply({ embeds: [embed] });
    }
};