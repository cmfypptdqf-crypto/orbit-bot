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

// Lista completa de itens da loja
const itensLoja = {
    // Itens normais
    '1': { nome: '🔭 Telescópio Avançado', preco: 500, descricao: '+5% em explorações', tipo: 'search', bonus: 1.05, raridade: 'Comum' },
    '2': { nome: '🚀 Nave Explorer', preco: 800, descricao: '+10% em missões', tipo: 'missao', bonus: 1.10, raridade: 'Comum' },
    '3': { nome: '💍 Anel Cósmico', preco: 2000, descricao: '+15% em todas atividades', tipo: 'all', bonus: 1.15, raridade: 'Raro' },
    '4': { nome: '🛡️ Escudo Energético', preco: 1500, descricao: 'Protege contra 1 roubo', tipo: 'protecao', duracao: 1, raridade: 'Raro' },
    '5': { nome: '👻 Capa da Invisibilidade', preco: 3000, descricao: '+20% chance em ataques', tipo: 'pirataria', bonus: 1.20, raridade: 'Épico' },
    '6': { nome: '🚨 Alarme Anti-Roubo', preco: 1000, descricao: '-30% chance de ser roubado', tipo: 'alarme', bonus: 0.7, raridade: 'Raro' },
    
    // Itens VIP
    '7': { nome: '⭐ VIP Bronze', preco: 10000, descricao: 'Multiplicador x1.2 por 7 dias', tipo: 'vip', tier: 'bronze', mult: 1.2, dias: 7, raridade: 'Especial' },
    '8': { nome: '⭐ VIP Prata', preco: 25000, descricao: 'Multiplicador x1.5 por 15 dias', tipo: 'vip', tier: 'prata', mult: 1.5, dias: 15, raridade: 'Especial' },
    '9': { nome: '⭐ VIP Ouro', preco: 50000, descricao: 'Multiplicador x2.0 por 30 dias', tipo: 'vip', tier: 'ouro', mult: 2.0, dias: 30, raridade: 'Especial' },
    '10': { nome: '⭐ VIP Diamante', preco: 100000, descricao: 'Multiplicador x3.0 por 60 dias', tipo: 'vip', tier: 'diamante', mult: 3.0, dias: 60, raridade: 'Especial' },
    
    // Itens de evento
    '11': { nome: '🍀 Amuleto da Sorte', preco: 5000, descricao: 'Dobra chance de eventos positivos', tipo: 'sorte', bonus: 2, raridade: 'Épico' },
    '12': { nome: '📈 Ação da Bolsa', preco: 3000, descricao: '+50% em próximos 5 ganhos', tipo: 'boost', usos: 5, bonus: 1.5, raridade: 'Raro' },
    '13': { nome: '🎰 Caça-Níquel', preco: 2000, descricao: 'Gire para ganhar prêmios', tipo: 'slot', raridade: 'Comum' },
    '14': { nome: '🚀 Nave Hiperespacial', preco: 50000, descricao: 'Item raro de colecionador', tipo: 'colecionavel', raridade: 'Lendário' },
    '15': { nome: '💎 Cristal Cósmico', preco: 100000, descricao: 'Item lendário de poder infinito', tipo: 'colecionavel', raridade: 'Lendário' }
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

module.exports = {
    name: 'mercadogalactico',
    aliases: ['loja', 'shop', 'mercado', 'galactic', 'market'],
    
    async executePrefix(message, args, client) {
        const db = getDB();
        const userId = message.author.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const carteira = db.usuarios[userId].carteira || 0;
        const banco = db.usuarios[userId].banco || 0;
        const totalOrbs = carteira + banco;
        
        const pagina = parseInt(args[0]) || 1;
        const itensPorPagina = 5;
        const totalItens = Object.keys(itensLoja).length;
        const totalPaginas = Math.ceil(totalItens / itensPorPagina);
        
        if (pagina < 1 || pagina > totalPaginas) {
            return message.reply(`❌ Página inválida! Use 1 até ${totalPaginas}.`);
        }
        
        const inicio = (pagina - 1) * itensPorPagina;
        const itensPagina = Object.entries(itensLoja).slice(inicio, inicio + itensPorPagina);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🪐 Mercado Galáctico')
            .setDescription(`🌌 Bem-vindo ao mercado interestelar, comandante!\n💰 Seu saldo: **${carteira.toLocaleString()} Orbs** (🏦 Banco: ${banco.toLocaleString()})`)
            .setFooter({ text: `Página ${pagina}/${totalPaginas} • Use bt!comprar <id> para comprar • Total: ${totalItens} itens` });
        
        for (const [id, item] of itensPagina) {
            let precoText = `${item.preco.toLocaleString()} Orbs`;
            let tipoText = '';
            const raridadeIcon = getRaridadeIcon(item.raridade);
            
            if (item.tipo === 'vip') {
                tipoText = `⭐ ${item.tier} | ${item.mult}x | ${item.dias} dias`;
            } else if (item.tipo === 'boost') {
                tipoText = `📈 ${item.usos} usos | ${item.bonus}x`;
            } else if (item.bonus) {
                tipoText = `✨ +${Math.round((item.bonus - 1) * 100)}%`;
            }
            
            embed.addFields({
                name: `${raridadeIcon} ${id} - ${item.nome}`,
                value: `💰 **${precoText}**\n📝 ${item.descricao}\n${tipoText ? `🎯 ${tipoText}` : ''}\n🏷️ Raridade: ${item.raridade}`,
                inline: false
            });
        }
        
        // Adicionar informações do usuário
        const nivel = Math.floor(Math.log10(totalOrbs / 100 + 1) * 15) || 1;
        embed.addFields({
            name: '📊 SEUS DADOS',
            value: `💵 Carteira: ${carteira.toLocaleString()} Orbs\n🏦 Banco: ${banco.toLocaleString()} Orbs\n📊 Total: ${totalOrbs.toLocaleString()} Orbs\n🚀 Nível: ${nivel}`,
            inline: false
        });
        
        // Botões de paginação
        if (totalPaginas > 1) {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('◀ Anterior')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pagina === 1),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Próximo ▶')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pagina === totalPaginas)
                );
            
            const msg = await message.reply({ embeds: [embed], components: [row] });
            
            const filter = (interaction) => interaction.user.id === message.author.id;
            const collector = msg.createMessageComponentCollector({ filter, time: 60000 });
            
            collector.on('collect', async (interaction) => {
                let novaPagina = pagina;
                if (interaction.customId === 'prev_page' && pagina > 1) novaPagina = pagina - 1;
                if (interaction.customId === 'next_page' && pagina < totalPaginas) novaPagina = pagina + 1;
                
                const novoEmbed = new EmbedBuilder()
                    .setColor(0xFFD700)
                    .setTitle('🪐 Mercado Galáctico')
                    .setDescription(`🌌 Bem-vindo ao mercado interestelar, comandante!\n💰 Seu saldo: **${carteira.toLocaleString()} Orbs**`)
                    .setFooter({ text: `Página ${novaPagina}/${totalPaginas} • Use bt!comprar <id> para comprar` });
                
                const novoInicio = (novaPagina - 1) * itensPorPagina;
                const novosItens = Object.entries(itensLoja).slice(novoInicio, novoInicio + itensPorPagina);
                
                for (const [id, item] of novosItens) {
                    let precoText = `${item.preco.toLocaleString()} Orbs`;
                    const raridadeIcon = getRaridadeIcon(item.raridade);
                    novoEmbed.addFields({
                        name: `${raridadeIcon} ${id} - ${item.nome}`,
                        value: `💰 **${precoText}**\n📝 ${item.descricao}`,
                        inline: false
                    });
                }
                
                const newRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('prev_page')
                            .setLabel('◀ Anterior')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(novaPagina === 1),
                        new ButtonBuilder()
                            .setCustomId('next_page')
                            .setLabel('Próximo ▶')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(novaPagina === totalPaginas)
                    );
                
                await interaction.update({ embeds: [novoEmbed], components: [newRow] });
            });
        } else {
            await message.reply({ embeds: [embed] });
        }
    }
};