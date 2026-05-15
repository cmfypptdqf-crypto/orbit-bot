// commands/economia/mercadogalactico.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
    '2': { nome: '🚀 Nave Explorer', preco: 800, descricao: '+10% em Galactic Quests', raridade: 'Comum' },
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
        case 'Comum': return '⚪';
        case 'Raro': return '🔵';
        case 'Épico': return '🟣';
        case 'Lendário': return '🟠';
        case 'Especial': return '⭐';
        default: return '⬜';
    }
}

function createShopEmbed(itensArray, page, itemsPerPage, userData) {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = itensArray.slice(start, end);
    const totalPages = Math.ceil(itensArray.length / itemsPerPage);
    
    const embed = new EmbedBuilder()
        .setColor(0x00008B)
        .setTitle('🛒 Galaxy Store')
        .setDescription(`🌌 Bem-vindo à **Galaxy Store**, comandante!\n💰 Saldo: **${userData.carteira.toLocaleString()} Orbs** (🏦 Orbital Bank: ${userData.banco.toLocaleString()})`)
        .setThumbnail(userData.guildIcon)
        .setFooter({ text: `📄 Página ${page}/${totalPages} • ${itensArray.length} itens no total` });
    
    for (const [id, item] of pageItems) {
        const raridadeIcon = getRaridadeIcon(item.raridade);
        embed.addFields({
            name: `${raridadeIcon} \`${id}\` - ${item.nome}`,
            value: `💰 **${item.preco.toLocaleString()} Orbs**\n📝 ${item.descricao}\n🏷️ ${item.raridade}`,
            inline: false
        });
    }
    
    embed.addFields({
        name: '💡 COMANDOS',
        value: '`bt!comprar <id>` - Adquirir item\n`bt!mochila` - Ver seus itens',
        inline: false
    });
    
    return embed;
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
        
        const userData = {
            carteira: db.usuarios[userId].carteira || 0,
            banco: db.usuarios[userId].banco || 0,
            guildIcon: message.guild.iconURL()
        };
        
        const itensArray = Object.entries(itensLoja);
        const itemsPerPage = 5;
        let currentPage = 1;
        const totalPages = Math.ceil(itensArray.length / itemsPerPage);
        
        const embed = createShopEmbed(itensArray, currentPage, itemsPerPage, userData);
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('first_page')
                    .setLabel('⏮️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('◀️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('page_indicator')
                    .setLabel(`${currentPage}/${totalPages}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(totalPages === 1),
                new ButtonBuilder()
                    .setCustomId('last_page')
                    .setLabel('⏭️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(totalPages === 1)
            );
        
        const reply = await message.reply({ embeds: [embed], components: [row] });
        
        const collector = reply.createMessageComponentCollector({
            filter: (interaction) => interaction.user.id === message.author.id,
            time: 60000
        });
        
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'first_page') {
                currentPage = 1;
            } else if (interaction.customId === 'prev_page') {
                currentPage = Math.max(1, currentPage - 1);
            } else if (interaction.customId === 'next_page') {
                currentPage = Math.min(totalPages, currentPage + 1);
            } else if (interaction.customId === 'last_page') {
                currentPage = totalPages;
            }
            
            const newEmbed = createShopEmbed(itensArray, currentPage, itemsPerPage, userData);
            
            const newRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('first_page')
                        .setLabel('⏮️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 1),
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('◀️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(currentPage === 1),
                    new ButtonBuilder()
                        .setCustomId('page_indicator')
                        .setLabel(`${currentPage}/${totalPages}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === totalPages),
                    new ButtonBuilder()
                        .setCustomId('last_page')
                        .setLabel('⏭️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === totalPages)
                );
            
            await interaction.update({ embeds: [newEmbed], components: [newRow] });
        });
        
        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('first_page')
                        .setLabel('⏮️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('◀️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('page_indicator')
                        .setLabel('⌛ Expirado')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('▶️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('last_page')
                        .setLabel('⏭️')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true)
                );
            
            await reply.edit({ components: [disabledRow] }).catch(() => {});
        });
    }
};