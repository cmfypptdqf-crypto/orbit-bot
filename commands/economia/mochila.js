// commands/economia/mochila.js
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

// Nomes e informações dos itens
const itensInfo = {
    '1': { nome: '🔭 Telescópio Avançado', tipo: '📡 Ferramenta', raridade: 'Comum', descricao: '+5% em explorações' },
    '2': { nome: '🚀 Nave Explorer', tipo: '🚀 Veículo', raridade: 'Comum', descricao: '+10% em missões' },
    '3': { nome: '💍 Anel Cósmico', tipo: '✨ Acessório', raridade: 'Raro', descricao: '+15% em todas atividades' },
    '4': { nome: '🛡️ Escudo Energético', tipo: '🛡️ Proteção', raridade: 'Raro', descricao: 'Protege contra 1 roubo' },
    '5': { nome: '👻 Capa da Invisibilidade', tipo: '👻 Especial', raridade: 'Épico', descricao: '+20% chance em ataques' },
    '6': { nome: '🚨 Alarme Anti-Roubo', tipo: '🔒 Segurança', raridade: 'Raro', descricao: '-30% chance de ser roubado' },
    '7': { nome: '⭐ VIP Bronze', tipo: '⭐ VIP', raridade: 'Especial', descricao: 'Multiplicador x1.2 por 7 dias' },
    '8': { nome: '⭐ VIP Prata', tipo: '⭐ VIP', raridade: 'Especial', descricao: 'Multiplicador x1.5 por 15 dias' },
    '9': { nome: '⭐ VIP Ouro', tipo: '⭐ VIP', raridade: 'Especial', descricao: 'Multiplicador x2.0 por 30 dias' },
    '10': { nome: '⭐ VIP Diamante', tipo: '⭐ VIP', raridade: 'Especial', descricao: 'Multiplicador x3.0 por 60 dias' },
    '11': { nome: '🍀 Amuleto da Sorte', tipo: '🍀 Sorte', raridade: 'Épico', descricao: 'Dobra chance de eventos positivos' },
    '12': { nome: '📈 Ação da Bolsa', tipo: '💰 Financeiro', raridade: 'Raro', descricao: '+50% em próximos 5 ganhos' },
    '13': { nome: '🎰 Caça-Níquel', tipo: '🎲 Diversão', raridade: 'Comum', descricao: 'Gire para ganhar prêmios' },
    '14': { nome: '🚀 Nave Hiperespacial', tipo: '🚀 Veículo', raridade: 'Lendário', descricao: 'Item raro de colecionador' },
    '15': { nome: '💎 Cristal Cósmico', tipo: '💎 Recurso', raridade: 'Lendário', descricao: 'Item lendário de poder infinito' }
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
    name: 'mochila',
    aliases: ['inv', 'inventario', 'itens', 'bag', 'inventory'],
    
    async executePrefix(message, args, client) {
        let user = message.author;
        
        if (args[0] && !args[0].startsWith('detalhes')) {
            const mention = message.mentions.users.first();
            if (mention) user = mention;
        }
        
        const db = getDB();
        const userId = user.id;
        
        if (!db.usuarios[userId]) {
            db.usuarios[userId] = { carteira: 0, banco: 0, inventario: {} };
        }
        
        const inventario = db.usuarios[userId].inventario || {};
        const itensLista = Object.entries(inventario);
        
        // ========== ESTATÍSTICAS DO INVENTÁRIO ==========
        let totalItens = 0;
        let valorTotal = 0;
        const porTipo = {};
        const porRaridade = { Comum: 0, Raro: 0, Épico: 0, Lendário: 0, Especial: 0 };
        
        for (const [id, qtd] of itensLista) {
            const itemInfo = itensInfo[id];
            totalItens += qtd;
            
            if (itemInfo) {
                porTipo[itemInfo.tipo] = (porTipo[itemInfo.tipo] || 0) + qtd;
                porRaridade[itemInfo.raridade] = (porRaridade[itemInfo.raridade] || 0) + qtd;
            }
        }
        
        // ========== SE MOCHILA VAZIA ==========
        if (itensLista.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(0x808080)
                .setTitle(`🎒 Mochila de ${user.username}`)
                .setThumbnail(user.displayAvatarURL())
                .setDescription('📭 Sua mochila está vazia, comandante!')
                .addFields(
                    { name: '💡 Como conseguir itens?', value: '• Use `bt!mercadogalactico` para comprar itens\n• Complete missões para ganhar recompensas\n• Participe de eventos especiais', inline: false }
                )
                .setFooter({ text: '🌌 Orbit • Visite o Mercado Galáctico!' });
            
            return await message.reply({ embeds: [embed] });
        }
        
        // ========== COMANDO DETALHES (COM PAGINAÇÃO) ==========
        if (args[0] === 'detalhes') {
            const itensPorPagina = 8;
            const totalPaginas = Math.ceil(itensLista.length / itensPorPagina);
            let paginaAtual = parseInt(args[1]) || 1;
            
            if (paginaAtual < 1) paginaAtual = 1;
            if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
            
            const inicio = (paginaAtual - 1) * itensPorPagina;
            const itensPagina = itensLista.slice(inicio, inicio + itensPorPagina);
            
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle(`🎒 Inventário de ${user.username}`)
                .setThumbnail(user.displayAvatarURL())
                .setDescription(`📦 **${totalItens} itens** no total | ${itensLista.length} tipos diferentes`)
                .setFooter({ text: `Página ${paginaAtual}/${totalPaginas} • Use bt!mochila detalhes <página> para navegar` });
            
            for (const [id, qtd] of itensPagina) {
                const item = itensInfo[id];
                if (item) {
                    const raridadeIcon = getRaridadeIcon(item.raridade);
                    embed.addFields({
                        name: `${raridadeIcon} ${item.nome}`,
                        value: `📦 Quantidade: **${qtd}**\n📝 ${item.descricao}\n🏷️ ${item.tipo}`,
                        inline: true
                    });
                } else {
                    embed.addFields({
                        name: `❓ Item ID ${id}`,
                        value: `Quantidade: ${qtd}`,
                        inline: true
                    });
                }
            }
            
            return await message.reply({ embeds: [embed] });
        }
        
        // ========== VISUALIZAÇÃO RESUMIDA (PADRÃO) ==========
        const nivel = Math.floor(Math.log10((db.usuarios[userId].carteira || 0) + (db.usuarios[userId].banco || 0) / 100 + 1) * 15) || 1;
        
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`🎒 Mochila de ${user.username}`)
            .setThumbnail(user.displayAvatarURL())
            .setDescription(`📦 **${totalItens} itens** no total\n📋 ${itensLista.length} tipos diferentes`)
            .addFields(
                { 
                    name: '📊 RESUMO POR TIPO',
                    value: Object.entries(porTipo).map(([tipo, qtd]) => `${tipo}: ${qtd}`).join('\n') || 'Nenhum item',
                    inline: true 
                },
                { 
                    name: '🏆 POR RARIDADE',
                    value: Object.entries(porRaridade).filter(([_, qtd]) => qtd > 0).map(([rar, qtd]) => `${getRaridadeIcon(rar)} ${rar}: ${qtd}`).join('\n') || 'Nenhum',
                    inline: true 
                }
            )
            .setFooter({ text: '🌌 Orbit • Use bt!mochila detalhes para ver todos os itens' });
        
        // Adicionar itens mais valiosos (top 5)
        const itensOrdenados = itensLista.sort((a, b) => {
            const precoA = itensInfo[a[0]] ? (itensInfo[a[0]].preco || 0) : 0;
            const precoB = itensInfo[b[0]] ? (itensInfo[b[0]].preco || 0) : 0;
            return precoB - precoA;
        });
        
        const itensPrincipais = itensOrdenados.slice(0, 5);
        const itensTexto = itensPrincipais.map(([id, qtd]) => {
            const item = itensInfo[id];
            const nome = item ? item.nome : `Item ${id}`;
            const raridadeIcon = item ? getRaridadeIcon(item.raridade) : '⬜';
            return `${raridadeIcon} **${nome}** x${qtd}`;
        }).join('\n');
        
        embed.addFields({
            name: '🌟 ITENS EM DESTAQUE',
            value: itensTexto + (itensLista.length > 5 ? `\n... e ${itensLista.length - 5} outros itens` : ''),
            inline: false
        });
        
        embed.addFields({
            name: '💡 DICA',
            value: 'Use `bt!mochila detalhes` para ver a lista completa com paginação!',
            inline: false
        });
        
        await message.reply({ embeds: [embed] });
    }
};