// commands/economia/mercadogalactico.js
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

const itensLoja = {
    '1': { nome: '🔭 Telescópio Avançado', preco: 500, descricao: '+5% em explorações', raridade: 'Comum' },
    '2': { nome: '🚀 Nave Explorer', preco: 800, descricao: '+10% em missões', raridade: 'Comum' },
    '3': { nome: '💍 Anel Cósmico', preco: 2000, descricao: '+15% em todas atividades', raridade: 'Raro' },
    '4': { nome: '🛡️ Escudo Energético', preco: 1500, descricao: 'Protege contra 1 roubo', raridade: 'Raro' },
    '5': { nome: '👻 Capa da Invisibilidade', preco: 3000, descricao: '+20% chance em ataques', raridade: 'Épico' },
    '6': { nome: '🚨 Alarme Anti-Roubo', preco: 1000, descricao: '-30% chance de ser roubado', raridade: 'Raro' },
    '7': { nome: '⭐ Orbit Prime Bronze', preco: 10000, descricao: 'Multiplicador x1.2 por 7 dias', raridade: 'Especial' },
    '8': { nome: '⭐ Orbit Prime Prata', preco: 25000, descricao: 'Multiplicador x1.5 por 15 dias', raridade: 'Especial' },
    '9': { nome: '⭐ Orbit Prime Ouro', preco: 50000, descricao: 'Multiplicador x2.0 por 30 dias', raridade: 'Especial' },
    '10': { nome: '⭐ Orbit Prime Diamante', preco: 100000, descricao: 'Multiplicador x3.0 por 60 dias', raridade: 'Especial' },
    '11': { nome: '🍀 Amuleto da Sorte', preco: 5000, descricao: 'Dobra chance de eventos positivos', raridade: 'Épico' },
    '12': { nome: '📈 Ação da Bolsa', preco: 3000, descricao: '+50% em próximos 5 ganhos', raridade: 'Raro' },
    '13': { nome: '📦 Nebula Crate', preco: 2000, descricao: 'Abra e descubra tesouros cósmicos', raridade: 'Comum' },
    '14': { nome: '🚀 Nave Hiperespacial', preco: 50000, descricao: 'Item raro de colecionador', raridade: 'Lendário' },
    '15': { nome: '💎 Cristal Cósmico', preco: 100000, descricao: 'Item lendário de poder infinito', raridade: 'Lendário' }
};

function getRaridadeIcon(raridade) {
    switch(raridade) {
        case 'Comum': return '⚪'; case 'Raro': return '🔵';
        case 'Épico': return '🟣'; case 'Lendário': return '🟠';
        case 'Especial': return '⭐'; default: return '⬜';
    }
}

module.exports = {
    name: 'mercadogalactico',
    aliases: ['loja', 'shop', 'galaxystore'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        const banco = db.usuarios[userId].banco || 0;
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🛒 Galaxy Store')
            .setDescription(`🌌 Bem-vindo à **Galaxy Store**, comandante!\n💰 Saldo: **${carteira.toLocaleString()} Orbs** (🏦 Orbital Bank: ${banco.toLocaleString()})`)
            .setThumbnail(message.guild.iconURL());
        
        for (const [id, item] of Object.entries(itensLoja)) {
            const raridadeIcon = getRaridadeIcon(item.raridade);
            embed.addFields({
                name: `${raridadeIcon} ${id} - ${item.nome}`,
                value: `💰 **${item.preco.toLocaleString()} Orbs**\n📝 ${item.descricao}\n🏷️ ${item.raridade}`,
                inline: false
            });
        }
        
        embed.addFields({
            name: '💡 COMANDOS',
            value: '`bt!comprar <id>` - Adquirir item\n`bt!mochila` - Ver seus itens',
            inline: false
        })
        .setFooter({ text: '🛒 Galaxy Store • O melhor shopping da galáxia' });
        
        await message.reply({ embeds: [embed] });
    }
};